// --- State Management ---
let products = [];
let cart = [];
let sales = [];
let clients = [];

function isPosActive() {
    const posSection = document.getElementById('pos');
    return !!posSection && posSection.classList.contains('active-section');
}

function focusBarcodeInput() {
    const barcodeInput = document.getElementById('barcode-input');
    if (barcodeInput) barcodeInput.focus();
}

function setupGlobalBarcodeCapture() {
    let buffer = '';
    let lastKeyTime = 0;
    const maxInterKeyDelayMs = 120;

    document.addEventListener('keydown', (e) => {
        if (!isPosActive()) return;

        const activeEl = document.activeElement;
        const activeTag = activeEl && activeEl.tagName ? activeEl.tagName.toLowerCase() : '';
        const activeId = activeEl && activeEl.id ? activeEl.id : '';
        const isTypingInOtherField = (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') && activeId !== 'barcode-input';
        if (isTypingInOtherField) return;

        if (e.key === 'Enter') {
            const barcode = buffer.trim();
            buffer = '';
            lastKeyTime = 0;
            if (!barcode) return;

            const barcodeInput = document.getElementById('barcode-input');
            if (barcodeInput) {
                barcodeInput.value = barcode;
                handleBarcodeInput({ key: 'Enter', preventDefault: () => { }, target: barcodeInput });
            }
            return;
        }

        if (e.key.length !== 1) return;
        const now = Date.now();

        if (lastKeyTime && (now - lastKeyTime) > maxInterKeyDelayMs) {
            buffer = '';
        }

        lastKeyTime = now;
        buffer += e.key;
    });
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    renderProducts('all');
    renderInventory();
    renderSalesHistory();
    renderClients();
    renderClientSelect();
    updateStats();
    startClock();

    setupGlobalBarcodeCapture();
    focusBarcodeInput();
});

// Load data from LocalStorage or Initialize defaults
function loadData() {
    const savedProducts = localStorage.getItem('kiosco_products');
    const savedSales = localStorage.getItem('kiosco_sales');
    const savedClients = localStorage.getItem('kiosco_clients');

    if (savedProducts) {
        products = JSON.parse(savedProducts);
    } else {
        // Initial Seed Data
        products = [
            { id: 1, name: 'Coca Cola 500ml', category: 'Bebidas', price: 15.00, stock: 50, emoji: '🥤', barcode: '7790895001017' },
            { id: 2, name: 'Agua Mineral', category: 'Bebidas', price: 10.00, stock: 40, emoji: '💧', barcode: '7790315001011' },
            { id: 3, name: 'Papas Fritas Lays', category: 'Snacks', price: 25.00, stock: 20, emoji: '🥔', barcode: '7790310001012' },
            { id: 4, name: 'Chocolate Milka', category: 'Golosinas', price: 30.00, stock: 30, emoji: '🍫', barcode: '7622300001018' },
            { id: 5, name: 'Galletas Oreo', category: 'Snacks', price: 20.00, stock: 25, emoji: '🍪', barcode: '7622210001019' },
            { id: 6, name: 'Chicle Beldent', category: 'Golosinas', price: 5.00, stock: 100, emoji: '🍬', barcode: '7790310001234' },
            { id: 7, name: 'Detergente', category: 'Limpieza', price: 45.00, stock: 10, emoji: '�', barcode: '7791234001015' },
            { id: 8, name: 'Cerveza Lata', category: 'Bebidas', price: 35.00, stock: 48, emoji: '🍺', barcode: '7790742001016' },
        ];
        saveProducts();
    }

    if (savedSales) {
        sales = JSON.parse(savedSales);
    }

    if (savedClients) {
        clients = JSON.parse(savedClients);
    }
}

function saveProducts() {
    localStorage.setItem('kiosco_products', JSON.stringify(products));
}

function saveSales() {
    localStorage.setItem('kiosco_sales', JSON.stringify(sales));
}

function saveClients() {
    localStorage.setItem('kiosco_clients', JSON.stringify(clients));
}

// --- Navigation ---
// --- Navigation ---
function showSection(sectionId, element) {
    // Nav active state
    document.querySelectorAll('.nav-links li').forEach(li => li.classList.remove('active'));
    // If element is passed, use it; otherwise try to find it (fallback)
    if (element) {
        element.classList.add('active');
    } else {
        // Fallback if called without element (e.g. from code)
        // This is less critical but good for robustness
    }

    // Section visibility
    document.querySelectorAll('section').forEach(sec => {
        sec.classList.remove('active-section');
        sec.classList.add('hidden-section'); // Ensure hidden is added back
    });

    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active-section');
        targetSection.classList.remove('hidden-section');
    }

    // Refresh views
    if (sectionId === 'inventory') renderInventory();
    if (sectionId === 'sales') renderSalesHistory();
    if (sectionId === 'clients') renderClients();

    if (sectionId === 'pos') {
        focusBarcodeInput();
    }
}

// --- POS Logic ---
function filterCategory(category) {
    // Update active tab logic
    const tabs = document.querySelectorAll('.category-tabs .tab');
    tabs.forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');

    renderProducts(category);
}

function filterProducts() {
    const term = document.getElementById('pos-search').value.toLowerCase();
    const filtered = products.filter(p => p.name.toLowerCase().includes(term));
    renderGrid(filtered);
}

// --- Barcode Scanner Logic ---
function handleBarcodeInput(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        const barcode = event.target.value.trim();

        if (!barcode) return;

        // Find product by barcode
        const product = products.find(p => p.barcode && p.barcode === barcode);

        if (product) {
            addToCart(product.id);
            // Clear the input
            event.target.value = '';
            // Show visual feedback
            event.target.style.borderColor = '#10b981';
            setTimeout(() => {
                event.target.style.borderColor = '';
            }, 500);
        } else {
            // Product not found
            alert(`Producto no encontrado con código: ${barcode}`);
            event.target.value = '';
            event.target.style.borderColor = '#ef4444';
            setTimeout(() => {
                event.target.style.borderColor = '';
            }, 500);
        }
    }
}

function renderProducts(category) {
    let filtered = products;
    if (category !== 'all') {
        filtered = products.filter(p => p.category === category);
    }
    renderGrid(filtered);
}

function renderGrid(list) {
    const container = document.getElementById('products-container');
    container.innerHTML = '';

    list.forEach(p => {
        const div = document.createElement('div');
        div.className = 'product-card';
        div.onclick = () => addToCart(p.id);
        div.innerHTML = `
            <div class="product-emoji">${p.emoji || '📦'}</div>
            <div class="product-info">
                <div class="product-name" title="${p.name}">${p.name}</div>
                <div class="product-price">$${p.price.toFixed(2)}</div>
                <div class="product-stock">Stock: ${p.stock}</div>
            </div>
        `;
        container.appendChild(div);
    });
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId);

    if (product.stock <= 0) {
        alert('¡Sin stock!');
        return;
    }

    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        if (existingItem.qty < product.stock) {
            existingItem.qty++;
        } else {
            alert('No hay más stock disponible');
        }
    } else {
        cart.push({ ...product, qty: 1 });
    }
    renderCart();
}

function updateCartQty(productId, delta) {
    const cartItem = cart.find(item => item.id === productId);
    const product = products.find(p => p.id === productId);

    if (cartItem) {
        const newQty = cartItem.qty + delta;
        if (newQty > 0 && newQty <= product.stock) {
            cartItem.qty = newQty;
        } else if (newQty > product.stock) {
            alert('Stock máximo alcanzado');
        }
    }
    renderCart();
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    renderCart();
}

function renderCart() {
    const container = document.getElementById('cart-items');
    const subtotalEl = document.getElementById('subtotal-display');
    const totalEl = document.getElementById('total-display');

    container.innerHTML = '';

    if (cart.length === 0) {
        container.innerHTML = `
            <div class="empty-cart-msg">
                <i class="fa-solid fa-basket-shopping"></i>
                <p>El carrito está vacío</p>
            </div>`;
        subtotalEl.innerText = '$0.00';
        totalEl.innerText = '$0.00';
        return;
    }

    let total = 0;

    cart.forEach(item => {
        const itemTotal = item.price * item.qty;
        total += itemTotal;

        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <div class="cart-item-info">
                <span class="cart-item-name">${item.name}</span>
                <span class="cart-item-price">$${item.price.toFixed(2)} x ${item.qty} = $${itemTotal.toFixed(2)}</span>
            </div>
            <div class="cart-item-controls">
                <button class="btn-qty" onclick="updateCartQty(${item.id}, -1)">-</button>
                <span>${item.qty}</span>
                <button class="btn-qty" onclick="updateCartQty(${item.id}, 1)">+</button>
                <button class="btn-qty btn-remove" onclick="removeFromCart(${item.id})"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;
        container.appendChild(div);
    });

    subtotalEl.innerText = `$${total.toFixed(2)}`;
    totalEl.innerText = `$${total.toFixed(2)}`;
}

function processSale(paymentMethod = 'cash') {
    if (cart.length === 0) {
        alert('Agrega productos al carrito primero.');
        return;
    }

    const clientId = document.getElementById('pos-client-select').value;
    if (paymentMethod === 'credit' && !clientId) {
        alert('Para fiar (Cuenta Corriente) debes seleccionar un cliente.');
        return;
    }

    const confirmMsg = paymentMethod === 'credit'
        ? '¿Confirmar venta como FIADO a Cuenta Corriente?'
        : (paymentMethod === 'transfer' ? '¿Confirmar venta por TRANSFERENCIA?' : '¿Confirmar venta en EFECTIVO?');

    if (!confirm('¿' + confirmMsg + '?')) return;

    let totalSale = 0;
    const saleItems = [];

    // Deduct stock and commit sale
    cart.forEach(cartItem => {
        const productIndex = products.findIndex(p => p.id === cartItem.id);
        if (productIndex !== -1) {
            products[productIndex].stock -= cartItem.qty;
            totalSale += cartItem.price * cartItem.qty;
            saleItems.push({
                name: cartItem.name,
                qty: cartItem.qty,
                price: cartItem.price
            });
        }
    });

    // Handle Debt
    let clientName = 'Consumidor Final';
    if (clientId) {
        const clientIndex = clients.findIndex(c => c.id == clientId);
        if (clientIndex !== -1) {
            clientName = clients[clientIndex].name;
            if (paymentMethod === 'credit') {
                clients[clientIndex].debt = (clients[clientIndex].debt || 0) + totalSale;
                saveClients(); // Persist debt
            }
        }
    }

    const newSale = {
        id: Date.now(),
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        items: saleItems,
        total: totalSale,
        clientId: clientId || null,
        clientName: clientName,
        paymentMethod: paymentMethod // 'cash' or 'credit'
    };

    sales.unshift(newSale); // Add to beginning
    saveProducts();
    saveSales();

    // Reset
    cart = [];
    renderCart();
    renderProducts('all'); // Refresh stock display
    updateStats();

    // Reset Client Select
    renderClientSelect(); // Update debt display
    document.getElementById('pos-client-select').value = '';

    if (confirm('¡Venta exitosa! ¿Imprimir ticket?')) {
        printTicket(newSale.id);
    }
}

function renderClientSelect() {
    const select = document.getElementById('pos-client-select');
    const currentVal = select.value;

    select.innerHTML = '<option value="">Cliente: Consumidor Final</option>';

    clients.forEach(c => {
        const option = document.createElement('option');
        option.value = c.id;
        option.text = `${c.name} (Deuda: $${(c.debt || 0).toFixed(2)})`;
        select.appendChild(option);
    });

    select.value = currentVal;
}

// --- Inventory Logic ---
function renderInventory() {
    const tbody = document.getElementById('inventory-list');
    tbody.innerHTML = '';

    products.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${p.emoji || ''} ${p.name}</td>
            <td>${p.category}</td>
            <td>$${p.price.toFixed(2)}</td>
            <td>${p.stock}</td>
            <td>
                <button class="btn-edit" onclick="openEditModal(${p.id})">
                    <i class="fa-solid fa-pencil"></i>
                </button>
                <button class="btn-danger" onclick="deleteProduct(${p.id})">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}


function handleProductForm(e) {
    e.preventDefault();
    const id = document.getElementById('prod-id').value;
    const name = document.getElementById('new-prod-name').value;
    const cat = document.getElementById('new-prod-cat').value;
    const price = parseFloat(document.getElementById('new-prod-price').value);
    const stock = parseInt(document.getElementById('new-prod-stock').value);
    const barcode = document.getElementById('new-prod-barcode').value.trim();
    const emoji = document.getElementById('new-prod-emoji').value;

    if (id) {
        // Edit existing
        const index = products.findIndex(p => p.id == id);
        if (index !== -1) {
            products[index] = { ...products[index], name, category: cat, price, stock, barcode, emoji };
        }
    } else {
        // Create new
        const newProduct = {
            id: Date.now(),
            name,
            category: cat,
            price,
            stock,
            barcode,
            emoji
        };
        products.push(newProduct);
    }

    saveProducts();
    closeModal('add-product-modal');
    e.target.reset(); // Reset form logic needs to be cleaner, see below
    document.getElementById('prod-id').value = ''; // Reset ID

    renderInventory();
    renderProducts('all');
}

function openEditModal(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;

    document.getElementById('prod-id').value = product.id;
    document.getElementById('new-prod-name').value = product.name;
    document.getElementById('new-prod-cat').value = product.category;
    document.getElementById('new-prod-price').value = product.price;
    document.getElementById('new-prod-stock').value = product.stock;
    document.getElementById('new-prod-barcode').value = product.barcode || '';
    document.getElementById('new-prod-emoji').value = product.emoji || '';

    document.getElementById('modal-title').innerText = 'Editar Producto';
    document.getElementById('btn-save-prod').innerText = 'Guardar Cambios';

    openModal('add-product-modal');
}


function deleteProduct(id) {
    if (confirm('¿Eliminar este producto?')) {
        products = products.filter(p => p.id !== id);
        saveProducts();
        renderInventory();
        renderProducts('all');
    }
}

// --- Clients Logic ---
function renderClients() {
    const tbody = document.getElementById('clients-list');
    tbody.innerHTML = '';

    if (clients.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px; color: #94a3b8;">No hay clientes registrados</td></tr>';
        return;
    }

    clients.forEach(c => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${c.name}</td>
            <td>${c.phone || '-'}</td>
            <td style="color: ${c.debt > 0 ? '#ff4d4d' : 'white'}; font-weight: bold;">$${(c.debt || 0).toFixed(2)}</td>
            <td>
                <div style="display: flex; gap: 5px;">
                    <button class="btn-small" onclick="openPayDebtModal(${c.id})" title="Pagar Deuda" style="background: rgba(16, 185, 129, 0.2); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3);">
                        <i class="fa-solid fa-hand-holding-dollar"></i>
                    </button>
                    <button class="btn-edit" onclick="openEditModalClient(${c.id})" title="Editar">
                        <i class="fa-solid fa-pencil"></i>
                    </button>
                    <button class="btn-danger" onclick="deleteClient(${c.id})" title="Eliminar definitivamente" style="background: red; color: white; border: none; font-weight: bold; padding: 5px 10px;">
                        BORRAR
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function handleClientForm(e) {
    e.preventDefault();
    const id = document.getElementById('client-id').value;
    const name = document.getElementById('client-name').value;
    const phone = document.getElementById('client-phone').value;

    if (id) {
        const index = clients.findIndex(c => c.id == id);
        if (index !== -1) {
            clients[index] = { ...clients[index], name, phone };
        }
    } else {
        clients.push({
            id: Date.now(),
            name,
            phone,
            debt: 0
        });
    }

    saveClients();
    closeModal('add-client-modal');
    e.target.reset();
    document.getElementById('client-id').value = '';
    renderClients();
    renderClientSelect(); // Update select in POS
}

function prepareNewClient() {
    document.getElementById('client-id').value = '';
    document.getElementById('add-client-form').reset();
    document.getElementById('client-modal-title').innerText = 'Agregar Nuevo Cliente';
    openModal('add-client-modal');
}

function openEditModalClient(id) {
    const client = clients.find(c => c.id === id);
    if (!client) return;

    document.getElementById('client-id').value = client.id;
    document.getElementById('client-name').value = client.name;
    document.getElementById('client-phone').value = client.phone || '';

    document.getElementById('client-modal-title').innerText = 'Editar Cliente';
    openModal('add-client-modal');
}

function deleteClient(id) {
    if (confirm('¿Eliminar cliente? Se perderá el registro de su deuda.')) {
        clients = clients.filter(c => c.id !== id);
        saveClients();
        renderClients();
        renderClientSelect();
    }
}

function openPayDebtModal(id) {
    const client = clients.find(c => c.id === id);
    if (!client) return;

    document.getElementById('debt-client-id').value = client.id;
    document.getElementById('debt-client-name').innerText = 'Cliente: ' + client.name;
    document.getElementById('current-debt-display').innerText = '$' + (client.debt || 0).toFixed(2);
    document.getElementById('debt-amount').value = '';

    openModal('pay-debt-modal');
}

function handleDebtPayment(e) {
    e.preventDefault();
    const id = document.getElementById('debt-client-id').value;
    const amount = parseFloat(document.getElementById('debt-amount').value);

    const index = clients.findIndex(c => c.id == id);
    if (index !== -1) {
        clients[index].debt -= amount;
        if (clients[index].debt < 0) clients[index].debt = 0; // Prevent negative debt? Or allow credit balance? Let's stop at 0 for now.

        saveClients();

        // Log "Payment" as a sale or just debt reduction? 
        // Ideally we should log it. Let's create a "Payment" record in Sales for tracking income.
        const paymentRecord = {
            id: Date.now(),
            date: new Date().toLocaleDateString(),
            time: new Date().toLocaleTimeString(),
            items: [{ qty: 1, name: 'Pago de Deuda', price: amount }],
            total: amount,
            clientId: clients[index].id,
            clientName: clients[index].name,
            paymentMethod: 'debt_payment'
        };
        sales.unshift(paymentRecord);
        saveSales();
        updateStats(); // Update income
        renderSalesHistory();

        closeModal('pay-debt-modal');
        renderClients();
        renderClientSelect();
        alert('Pago registrado correctamente.');
    }
}

function checkAndPayDebt() {
    const clientId = document.getElementById('pos-client-select').value;
    if (!clientId) {
        alert('Por favor, selecciona un cliente primero.');
        return;
    }
    openPayDebtModal(parseInt(clientId));
}

function checkAndDeleteClient() {
    const clientId = document.getElementById('pos-client-select').value;
    if (!clientId) {
        alert('Por favor, selecciona un cliente primero para eliminar.');
        return;
    }
    deleteClient(parseInt(clientId));
}

// --- Sales Logic ---
function renderSalesHistory() {
    const tbody = document.getElementById('sales-list');
    tbody.innerHTML = '';

    sales.forEach(s => {
        const badgeClass = s.paymentMethod === 'credit' ? 'badge-credit' : (s.paymentMethod === 'transfer' ? 'badge-transfer' : 'badge-cash');
        const badgeText = s.paymentMethod === 'credit'
            ? 'CREDITO'
            : (s.paymentMethod === 'transfer' ? 'TRANSFERENCIA' : (s.paymentMethod === 'debt_payment' ? 'PAGO DEUDA' : 'EFECTIVO'));
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>#${s.id}</td>
            <td>${s.date}</td>
            <td>${s.time}</td>
            <td>$${s.total.toFixed(2)}</td>
            <td>${s.clientName || 'Consumidor Final'}</td>
            <td><span class="badge ${badgeClass}">${badgeText}</span></td>
            <td>
                <div style="display:flex; justify-content:space-between; align-items:center">
                    <small>${s.items.map(i => `${i.qty}x ${i.name}`).join(', ')}</small>
                    <button class="btn-small" onclick="printTicket(${s.id})" title="Imprimir Ticket">
                        <i class="fa-solid fa-print"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
    updateStats();
}

function updateStats() {
    // Filter sales for today
    const today = new Date().toLocaleDateString();
    const todaysSales = sales.filter(s => s.date === today);

    const count = todaysSales.length;
    const income = todaysSales.reduce((sum, s) => sum + s.total, 0);

    const countEl = document.getElementById('sales-today-count');
    const incomeEl = document.getElementById('income-today-display');

    if (countEl) countEl.innerText = count;
    if (incomeEl) incomeEl.innerText = `$${income.toFixed(2)}`;
}

// --- Utils ---
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Close modal when clicking outside
window.onclick = function (event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}

function prepareNewProduct() {
    document.getElementById('prod-id').value = '';
    document.getElementById('add-product-form').reset();
    document.getElementById('modal-title').innerText = 'Agregar Nuevo Producto';
    document.getElementById('btn-save-prod').innerText = 'Guardar Producto';
    openModal('add-product-modal');
}

function startClock() {
    const clockEl = document.getElementById('clock');
    setInterval(() => {
        const now = new Date();
        clockEl.innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }, 1000);
}

// --- Import / Export Logic ---
function exportData(type) {
    if (sales.length === 0) {
        alert('No hay ventas para exportar');
        return;
    }

    const dataCopy = sales.map(s => ({
        ID: s.id,
        Fecha: s.date,
        Hora: s.time,
        Items: s.items.map(i => `${i.qty}x ${i.name}`).join(', '),
        Total: s.total
    }));

    if (type === 'json') {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(sales, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "ventas_kioscoflow.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    } else if (type === 'excel') {
        if (typeof XLSX === 'undefined') { alert('Librería Excel no cargada'); return; }
        const ws = XLSX.utils.json_to_sheet(dataCopy);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Ventas");
        XLSX.writeFile(wb, "ventas_kioscoflow.xlsx");
    }
}

function importData(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();

    if (file.name.endsWith('.json')) {
        reader.onload = function (e) {
            try {
                const importedSales = JSON.parse(e.target.result);
                mergeSales(importedSales);
            } catch (err) {
                alert('Error al leer JSON');
                console.error(err);
            }
        };
        reader.readAsText(file);
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        reader.onload = function (e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet);

                // Map Excel columns back to App structure
                const mappedSales = jsonData.map(row => {
                    // Reconstruct items from string "1x A, 2x B"
                    let parsedItems = [];
                    if (row.Items && typeof row.Items === 'string') {
                        parsedItems = row.Items.split(', ').map(itemStr => {
                            const parts = itemStr.split('x '); // Try splitting by 'x '
                            if (parts.length >= 2) {
                                // parts[0] is qty, parts[1] (and others if name has x) is name
                                return {
                                    qty: parseInt(parts[0]) || 1,
                                    name: parts.slice(1).join('x '), // Join back if name had 'x '
                                    price: 0 // Price per item is lost in this simple format, setting 0
                                };
                            }
                            return { qty: 1, name: itemStr, price: 0 };
                        });
                    }

                    return {
                        id: row.ID || Date.now(),
                        date: row.Fecha || new Date().toLocaleDateString(),
                        time: row.Hora || '00:00:00',
                        total: row.Total || 0,
                        items: parsedItems
                    };
                });

                mergeSales(mappedSales);
            } catch (err) {
                alert('Error al leer Excel');
                console.error(err);
            }
        };
        reader.readAsArrayBuffer(file);
    }

    input.value = '';
}

function mergeSales(importedSales) {
    let count = 0;
    if (!Array.isArray(importedSales)) { alert('Formato inválido'); return; }

    importedSales.forEach(impSale => {
        if (!sales.find(s => s.id === impSale.id)) {
            sales.push(impSale);
            count++;
        }
    });

    // Sort descending
    sales.sort((a, b) => b.id - a.id);
    saveSales();
    renderSalesHistory();
    alert(`Se importaron ${count} ventas nuevas.`);
}

// --- Ticket Printing ---
function printTicket(saleId) {
    const sale = sales.find(s => s.id === saleId);
    if (!sale) return;

    const printWindow = window.open('', '', 'height=600,width=400');
    printWindow.document.write('<html><head><title>Ticket de Venta</title>');
    printWindow.document.write('<style>');
    printWindow.document.write('body { font-family: "Courier New", monospace; width: 280px; margin: 0 auto; padding: 10px; color: black; background: white; }');
    printWindow.document.write('.header { text-align: center; margin-bottom: 20px; border-bottom: 1px dashed #000; padding-bottom: 10px; }');
    printWindow.document.write('.item { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 0.9em; }');
    printWindow.document.write('.total { border-top: 1px dashed #000; padding-top: 10px; margin-top: 10px; font-weight: bold; text-align: right; }');
    printWindow.document.write('.footer { text-align: center; margin-top: 20px; font-size: 0.8em; }');
    printWindow.document.write('</style>');
    printWindow.document.write('</head><body>');

    printWindow.document.write('<div class="header">');
    printWindow.document.write('<h3>Star Market</h3>');
    printWindow.document.write(`<p>${sale.date} - ${sale.time}</p>`);
    printWindow.document.write(`<p>Ticket #${sale.id}</p>`);
    printWindow.document.write(`<p>Cliente: ${sale.clientName || 'Consumidor Final'}</p>`);
    if (sale.paymentMethod === 'transfer') printWindow.document.write('<p><strong>TRANSFERENCIA</strong></p>');
    if (sale.paymentMethod === 'credit') printWindow.document.write('<p><strong>** A CUENTA / FIADO **</strong></p>');
    printWindow.document.write('</div>');

    sale.items.forEach(item => {
        printWindow.document.write('<div class="item">');
        printWindow.document.write(`<span>${item.qty} ${item.name}</span>`);
        printWindow.document.write(`<span>$${(item.price * item.qty).toFixed(2)}</span>`);
        printWindow.document.write('</div>');
    });

    printWindow.document.write(`<div class="total">TOTAL: $${sale.total.toFixed(2)}</div>`);
    printWindow.document.write('<div class="footer">¡Gracias por su compra!</div>');

    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 500);
}

// --- Mobile Cart Logic ---
function toggleCartMobile() {
    const cartPanel = document.getElementById('cart-panel');
    cartPanel.classList.toggle('open');
}

// Enhance renderCart to update mobile button
// We hook into the existing renderCart or just call this updater inside it.
// Simpler: let's Override it carefully since we are in global scope
const originalRenderCart = renderCart;
renderCart = function () {
    originalRenderCart();

    // Update Mobile Button
    if (document.getElementById('mobile-cart-count')) {
        const totalCount = cart.reduce((sum, item) => sum + item.qty, 0);
        const totalVal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

        document.getElementById('mobile-cart-count').innerText = `${totalCount} items`;
        document.getElementById('mobile-cart-total').innerText = `$${totalVal.toFixed(2)}`;
    }
};
