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
    const filterCategorySelect = document.getElementById('filterCategory');

    // Category Elements
    const categoryForm = document.getElementById('categoryForm');
    const categoryListContainer = document.getElementById('categoryListContainer');
    const totalCategoriesCount = document.getElementById('totalCategoriesCount');
    const parentCategorySelect = document.getElementById('parentCategorySelect');

    // Announcement Elements
    const announcementForm = document.getElementById('announcementForm');
    const announcementListContainer = document.getElementById('announcementListContainer');

    // --- State Initialization & Migration ---
    const rawCats = JSON.parse(localStorage.getItem('categories'));

    // Migration: Convert old string array to object array if needed
    if (!rawCats) {
        // Initial Seed
        const defaultCats = [
            { id: 1, name: 'Kırtasiye', parentId: null },
            { id: 2, name: 'Defter', parentId: 1 },
            { id: 3, name: 'Kalem', parentId: 1 },
            { id: 4, name: 'Çanta', parentId: null },
            { id: 5, name: 'Ofis', parentId: null }
        ];
        localStorage.setItem('categories', JSON.stringify(defaultCats));
    } else if (rawCats.length > 0 && typeof rawCats[0] === 'string') {
        // Migrate ['A', 'B'] -> [{id, name, parentId: null}]
        const newCats = rawCats.map((name, index) => ({
            id: Date.now() + index,
            name: name,
            parentId: null
        }));
        localStorage.setItem('categories', JSON.stringify(newCats));
        alert('Sistem Güncellemesi: Kategoriler yeni yapıya dönüştürüldü.');
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
        loadCategories();
        loadProducts();
        loadAnnouncements();
    }

    // --- Tab Logic ---
    window.switchTab = (tabName) => {
        // Toggle Buttons
        document.querySelectorAll('.admin-tab-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.innerText.toLowerCase().includes(tabName === 'products' ? 'ürünler' : (tabName === 'categories' ? 'kategoriler' : 'duyurular'))) {
                btn.classList.add('active');
            }
        });

        // Toggle Content
        document.getElementById('productsTab').classList.add('hidden');
        document.getElementById('categoriesTab').classList.add('hidden');
        document.getElementById('announcementsTab').classList.add('hidden');

        if (tabName === 'products') document.getElementById('productsTab').classList.remove('hidden');
        else if (tabName === 'categories') document.getElementById('categoriesTab').classList.remove('hidden');
        else if (tabName === 'announcements') document.getElementById('announcementsTab').classList.remove('hidden');
    }

    // --- Product Logic ---
    function loadProducts() {
        let products = JSON.parse(localStorage.getItem('products')) || [];
        const filterVal = filterCategorySelect ? filterCategorySelect.value : 'all';

        // Filter if active
        if (filterVal !== 'all') {
            products = products.filter(p => p.category === filterVal);
        }

        totalProductsCount.innerText = `${products.length} Ürün`;
        productTableBody.innerHTML = '';

        if (products.length === 0) {
            productTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 2rem;">Ürün bulunamadı.</td></tr>';
            return;
        }

        products.forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><img src="${p.image}" onerror="this.src='https://placehold.co/50x50?text=Yok'"></td>
                <td style="font-weight: 500;">${p.name}</td>
                <td><span class="badge badge-primary" style="background:#e3f2fd; color: #1976d2; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem;">${p.category}</span></td>
                <td style="font-weight: bold; color: var(--dark);">${parseFloat(p.price).toFixed(2)} TL</td>
                <td>
                     <button class="btn btn-small" onclick="toggleShowcase(${p.id})" style="margin-right:5px; background: ${p.isShowcase ? '#ffd700' : '#eee'}; color: ${p.isShowcase ? '#000' : '#999'};" title="Vitrin Durumu">
                        <i class="fa-solid fa-star"></i>
                    </button>
                    <button class="btn btn-small btn-danger" onclick="deleteProduct(${p.id})" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; background: #ffebee; color: #c62828;">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            `;
            productTableBody.appendChild(tr);
        });
    }

    // Filter Listener
    if (filterCategorySelect) {
        filterCategorySelect.addEventListener('change', loadProducts);
    }

    productForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newProduct = {
            id: Date.now(),
            name: document.getElementById('pName').value,
            price: parseFloat(document.getElementById('pPrice').value),
            category: document.getElementById('pCategory').value,
            image: document.getElementById('pImage').value,
            isShowcase: document.getElementById('pShowcase').checked
        };

        const products = JSON.parse(localStorage.getItem('products')) || [];
        products.push(newProduct);
        localStorage.setItem('products', JSON.stringify(products));

        loadProducts();
        productForm.reset();
        alert('Ürün başarıyla eklendi!');
    });

    window.toggleShowcase = (id) => {
        let products = JSON.parse(localStorage.getItem('products')) || [];
        const index = products.findIndex(p => p.id === id);
        if (index > -1) {
            products[index].isShowcase = !products[index].isShowcase;
            localStorage.setItem('products', JSON.stringify(products));
            loadProducts();
            // Optional: Alert or toast
        }
    }

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

        // Separate Parents and Children
        const parents = categories.filter(c => !c.parentId);

        // Populate Select Boxes (Product & Parent Cat Select & Filter)
        pCategorySelect.innerHTML = '';
        parentCategorySelect.innerHTML = '<option value="">Yok (Ana Kategori)</option>';
        if (filterCategorySelect) filterCategorySelect.innerHTML = '<option value="all">Tüm Kategoriler</option>';

        parents.forEach(parent => {
            // Add Parent to selects
            const pOpt1 = new Option(parent.name, parent.name);
            pOpt1.style.fontWeight = 'bold';
            pCategorySelect.add(pOpt1);

            if (filterCategorySelect) {
                const fOpt1 = new Option(parent.name, parent.name);
                fOpt1.style.fontWeight = 'bold';
                filterCategorySelect.add(fOpt1);
            }

            const pOpt2 = new Option(parent.name, parent.id); // Value is ID for parent selector
            parentCategorySelect.add(pOpt2);

            // Find children
            const children = categories.filter(c => c.parentId == parent.id);
            children.forEach(child => {
                const cOpt = new Option(`- ${child.name}`, child.name);
                pCategorySelect.add(cOpt);
                if (filterCategorySelect) {
                    const fOpt2 = new Option(`- ${child.name}`, child.name);
                    filterCategorySelect.add(fOpt2);
                }
            });
        });

        // List Setup
        categoryListContainer.innerHTML = '';
        if (categories.length === 0) {
            categoryListContainer.innerHTML = '<p style="padding:1rem;">Kategori yok.</p>';
            return;
        }

        parents.forEach(parent => {
            // Render Parent
            const div = document.createElement('div');
            div.className = 'cat-list-item';
            div.innerHTML = `
                <span style="font-weight: 600;">${parent.name}</span>
                <button onclick="deleteCategory(${parent.id})" class="btn btn-small" style="color: #ff6b6b; border: 1px solid #ff6b6b; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem;">Sil</button>
            `;
            categoryListContainer.appendChild(div);

            // Render Children
            const children = categories.filter(c => c.parentId == parent.id);
            children.forEach(child => {
                const childDiv = document.createElement('div');
                childDiv.className = 'cat-list-item sub-cat-item';
                childDiv.innerHTML = `
                    <span>${child.name}</span>
                    <button onclick="deleteCategory(${child.id})" class="btn btn-small" style="color: #ff6b6b; border: 1px solid #ff6b6b; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem;">Sil</button>
                `;
                categoryListContainer.appendChild(childDiv);
            });
        });
    }

    categoryForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const catName = document.getElementById('catName').value.trim();
        const parentId = document.getElementById('parentCategorySelect').value;
        if (!catName) return;

        let categories = JSON.parse(localStorage.getItem('categories')) || [];

        // Check duplicate name
        if (categories.some(c => c.name.toLowerCase() === catName.toLowerCase())) {
            alert('Bu isimde bir kategori zaten mevcut!');
            return;
        }

        const newCat = {
            id: Date.now(),
            name: catName,
            parentId: parentId ? parseInt(parentId) : null
        };

        categories.push(newCat);
        localStorage.setItem('categories', JSON.stringify(categories));

        loadCategories();
        categoryForm.reset();
    });

    window.deleteCategory = (id) => {
        if (!confirm('Kategoriyi silmek istediğinize emin misiniz? Alt kategorileri varsa onlar da silinebilir veya boşa düşebilir.')) return;

        let categories = JSON.parse(localStorage.getItem('categories')) || [];

        // Remove cat and its children (simple cascade delete)
        categories = categories.filter(c => c.id !== id && c.parentId !== id);

        localStorage.setItem('categories', JSON.stringify(categories));
        loadCategories();
    }

    // --- Announcement Logic ---
    function loadAnnouncements() {
        const announcements = JSON.parse(localStorage.getItem('announcements')) || [];
        announcementListContainer.innerHTML = '';

        if (announcements.length === 0) {
            announcementListContainer.innerHTML = '<p style="padding:1rem;">Duyuru yok.</p>';
            return;
        }

        announcements.forEach(ann => {
            const div = document.createElement('div');
            div.className = 'cat-list-item'; // repurpose style
            div.innerHTML = `
                <div style="flex:1;">
                    <strong style="display:block;">${ann.title}</strong>
                    <small style="color:#666;">${new Date(ann.date).toLocaleDateString('tr-TR')}</small>
                </div>
                <button onclick="deleteAnnouncement(${ann.id})" class="btn btn-small" style="color: #ff6b6b; border: 1px solid #ff6b6b; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem;">Sil</button>
            `;
            announcementListContainer.appendChild(div);
        });
    }

    announcementForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('annTitle').value;
        const content = document.getElementById('annContent').value;

        const newAnn = {
            id: Date.now(),
            title: title,
            content: content,
            date: new Date().toISOString()
        };

        let announcements = JSON.parse(localStorage.getItem('announcements')) || [];
        announcements.push(newAnn);
        localStorage.setItem('announcements', JSON.stringify(announcements));

        loadAnnouncements();
        announcementForm.reset();
        alert('Duyuru yayınlandı!');
    });

    window.deleteAnnouncement = (id) => {
        if (!confirm('Duyuruyu silmek istediğinize emin misiniz?')) return;
        let announcements = JSON.parse(localStorage.getItem('announcements')) || [];
        announcements = announcements.filter(a => a.id !== id);
        localStorage.setItem('announcements', JSON.stringify(announcements));
        loadAnnouncements();
    }

    // --- SLIDER LOGIC ---
    const sliderForm = document.getElementById('sliderForm');
    const sliderListContainer = document.getElementById('sliderListContainer');

    function loadSliderImages() {
        const images = JSON.parse(localStorage.getItem('sliderImages')) || [];
        sliderListContainer.innerHTML = '';

        if (images.length === 0) {
            sliderListContainer.innerHTML = '<p style="padding:1rem;">Slider görseli yok. Varsayılanlar gösteriliyor.</p>';
            return;
        }

        images.forEach((img, index) => {
            const div = document.createElement('div');
            div.className = 'cat-list-item';
            div.innerHTML = `
                <img src="${img}" style="width: 100px; height: 60px; object-fit: cover; border-radius: 4px; margin-right: 1rem;">
                <div style="flex:1; word-break: break-all;">${img}</div>
                <button onclick="deleteSliderImage(${index})" class="btn btn-small" style="color: #ff6b6b; border: 1px solid #ff6b6b; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem;">Sil</button>
            `;
            sliderListContainer.appendChild(div);
        });
    }

    if (sliderForm) {
        sliderForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const url = document.getElementById('sliderUrl').value;

            let images = JSON.parse(localStorage.getItem('sliderImages')) || [];
            images.push(url);
            localStorage.setItem('sliderImages', JSON.stringify(images));

            loadSliderImages();
            sliderForm.reset();
            alert('Görsel eklendi!');
        });
    }

    window.deleteSliderImage = (index) => {
        if (!confirm('Görseli silmek istediğinize emin misiniz?')) return;
        let images = JSON.parse(localStorage.getItem('sliderImages')) || [];
        images.splice(index, 1);
        localStorage.setItem('sliderImages', JSON.stringify(images));
        loadSliderImages();
    }

    // Initial Load for Slider Tab
    loadSliderImages();

    // Extend Switch Tab
    const oldSwitchTab = window.switchTab;
    window.switchTab = (tabName) => {
        // Toggle Buttons
        document.querySelectorAll('.admin-tab-btn').forEach(btn => {
            btn.classList.remove('active');
            const btnText = btn.innerText.toLowerCase();
            if (tabName === 'products' && btnText.includes('ürünler')) btn.classList.add('active');
            else if (tabName === 'categories' && btnText.includes('kategoriler')) btn.classList.add('active');
            else if (tabName === 'announcements' && btnText.includes('duyurular')) btn.classList.add('active');
            else if (tabName === 'slider' && btnText.includes('slider')) btn.classList.add('active');
        });

        // Toggle Content
        document.getElementById('productsTab').classList.add('hidden');
        document.getElementById('categoriesTab').classList.add('hidden');
        document.getElementById('announcementsTab').classList.add('hidden');
        document.getElementById('sliderTab').classList.add('hidden');

        if (tabName === 'products') document.getElementById('productsTab').classList.remove('hidden');
        else if (tabName === 'categories') document.getElementById('categoriesTab').classList.remove('hidden');
        else if (tabName === 'announcements') document.getElementById('announcementsTab').classList.remove('hidden');
        else if (tabName === 'slider') {
            document.getElementById('sliderTab').classList.remove('hidden');
            loadSliderImages();
        }
    }
});
