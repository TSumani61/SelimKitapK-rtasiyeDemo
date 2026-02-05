document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const loginSection = document.getElementById('loginSection');
    const adminPanel = document.getElementById('adminPanel');
    const loginForm = document.getElementById('loginForm');
    const logoutBtn = document.getElementById('logoutBtn');

    // Product Elements
    const productForm = document.getElementById('productForm');
    const productTableBody = document.getElementById('productTableBody');
    const totalProductsCount = document.getElementById('totalProductsCount');
    const pCategorySelect = document.getElementById('pCategory');

    // Category Elements
    const categoryForm = document.getElementById('categoryForm');
    const categoryListContainer = document.getElementById('categoryListContainer');
    const totalCategoriesCount = document.getElementById('totalCategoriesCount');

    // --- State Initialization ---
    // Initialize default categories if empty
    if (!localStorage.getItem('categories')) {
        const defaultCategories = ['Defter', 'Kalem', 'Çanta', 'Ofis', 'Sanat'];
        localStorage.setItem('categories', JSON.stringify(defaultCategories));
    }

    // --- Auth Logic ---
    if (localStorage.getItem('adminLoggedIn') === 'true') {
        showAdminPanel();
    }

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const u = document.getElementById('username').value;
        const p = document.getElementById('password').value;

        if (u === 'admin' && p === 'admin') {
            localStorage.setItem('adminLoggedIn', 'true');
            showAdminPanel();
            loginForm.reset();
        } else {
            alert('Hatalı kullanıcı adı veya şifre!');
        }
    });

    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('adminLoggedIn');
        loginSection.classList.remove('hidden');
        adminPanel.classList.add('hidden');
    });

    function showAdminPanel() {
        loginSection.classList.add('hidden');
        adminPanel.classList.remove('hidden');
        loadCategories(); // First load categories to populate select
        loadProducts();
    }

    // --- Tab Logic ---
    window.switchTab = (tabName) => {
        // Toggle Buttons
        document.querySelectorAll('.admin-tab-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.innerText.toLowerCase().includes(tabName === 'products' ? 'ürünler' : 'kategoriler')) {
                btn.classList.add('active');
            }
        });

        // Toggle Content
        if (tabName === 'products') {
            document.getElementById('productsTab').classList.remove('hidden');
            document.getElementById('categoriesTab').classList.add('hidden');
        } else {
            document.getElementById('productsTab').classList.add('hidden');
            document.getElementById('categoriesTab').classList.remove('hidden');
        }
    }

    // --- Product Logic ---
    function loadProducts() {
        const products = JSON.parse(localStorage.getItem('products')) || [];
        totalProductsCount.innerText = `${products.length} Ürün`;
        productTableBody.innerHTML = '';

        if (products.length === 0) {
            productTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 2rem;">Henüz ürün bulunmuyor.</td></tr>';
            return;
        }

        products.forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><img src="${p.image}" onerror="this.src='https://placehold.co/50x50?text=Yok'"></td>
                <td style="font-weight: 500;">${p.name}</td>
                <td><span class="badge badge-primary">${p.category}</span></td>
                <td style="font-weight: bold; color: var(--dark);">${parseFloat(p.price).toFixed(2)} TL</td>
                <td>
                    <div class="action-btns">
                        <button class="btn btn-small btn-danger" onclick="deleteProduct(${p.id})" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            productTableBody.appendChild(tr);
        });
    }

    productForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newProduct = {
            id: Date.now(),
            name: document.getElementById('pName').value,
            price: parseFloat(document.getElementById('pPrice').value),
            category: document.getElementById('pCategory').value,
            image: document.getElementById('pImage').value
        };

        const products = JSON.parse(localStorage.getItem('products')) || [];
        products.push(newProduct);
        localStorage.setItem('products', JSON.stringify(products));

        loadProducts();
        productForm.reset();
        alert('Ürün başarıyla eklendi!');
    });

    window.deleteProduct = (id) => {
        if (!confirm('Silmek istediğinize emin misiniz?')) return;
        let products = JSON.parse(localStorage.getItem('products')) || [];
        products = products.filter(p => p.id !== id);
        localStorage.setItem('products', JSON.stringify(products));
        loadProducts();
    }

    // --- Category Logic ---
    function loadCategories() {
        const categories = JSON.parse(localStorage.getItem('categories')) || [];
        totalCategoriesCount.innerText = `${categories.length} Kategori`;

        // Populate Select Box
        pCategorySelect.innerHTML = '';
        categories.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat;
            opt.innerText = cat;
            pCategorySelect.appendChild(opt);
        });

        // Populate List
        categoryListContainer.innerHTML = '';
        if (categories.length === 0) {
            categoryListContainer.innerHTML = '<p style="padding:1rem;">Kategori yok.</p>';
            return;
        }

        categories.forEach(cat => {
            const div = document.createElement('div');
            div.className = 'cat-list-item';
            div.innerHTML = `
                <span style="font-weight: 500;">${cat}</span>
                <button onclick="deleteCategory('${cat}')" class="btn btn-small btn-outline" style="border-color: #ff6b6b; color: #ff6b6b; padding: 0.3rem 0.8rem; font-size: 0.8rem;">
                     Sil
                </button>
            `;
            categoryListContainer.appendChild(div);
        });
    }

    categoryForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const catName = document.getElementById('catName').value.trim();
        if (!catName) return;

        let categories = JSON.parse(localStorage.getItem('categories')) || [];

        // Check duplicate
        if (categories.includes(catName)) {
            alert('Bu kategori zaten mevcut!');
            return;
        }

        categories.push(catName);
        localStorage.setItem('categories', JSON.stringify(categories));

        loadCategories(); // Refresh both list and select
        categoryForm.reset();
    });

    window.deleteCategory = (catName) => {
        if (!confirm(`"${catName}" kategorisini silmek istediğinize emin misiniz?`)) return;

        let categories = JSON.parse(localStorage.getItem('categories')) || [];
        categories = categories.filter(c => c !== catName);
        localStorage.setItem('categories', JSON.stringify(categories));

        loadCategories();
    }
});
