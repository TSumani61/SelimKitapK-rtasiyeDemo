/**
 * ADMIN JS - Firebase Version
 * Migrated from LocalStorage to Firestore.
 */

// Initialize DB Reference
const db = firebase.firestore();

// Crypto Helper
async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Init Auth
async function initAdminCredentials() {
    try {
        const doc = await db.collection('settings').doc('admin').get();
        if (!doc.exists) {
            console.log("Initializing admin credentials...");
            const defaultHash = await sha256('GoropogluKS6134');
            await db.collection('settings').doc('admin').set({
                username: 'SelimKübra6134',
                passwordHash: defaultHash
            });
        }
    } catch (e) {
        console.error("Auth Init Error:", e);
    }
}

// ================= GLOBAL HELPERS & LOADERS =================

// --- Tab Logic ---
window.switchTab = (tabName) => {
    const mapping = {
        'products': 'ürünler',
        'categories': 'kategoriler',
        'announcements': 'duyurular',
        'slider': 'slider',
        'settings': 'ayarlar'
    };
    const text = mapping[tabName];

    // Toggle Buttons
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (text && btn.innerText.toLowerCase().includes(text)) {
            btn.classList.add('active');
        }
    });

    // Toggle Content
    ['productsTab', 'categoriesTab', 'announcementsTab', 'sliderTab', 'settingsTab'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });

    const target = document.getElementById(tabName + 'Tab');
    if (target) target.classList.remove('hidden');

    if (tabName === 'slider') {
        loadSliderImages();
    }

    if (tabName === 'settings') {
        loadSiteSettings();
    }
}

// --- Component Loaders ---
window.loadProducts = async function () {
    const productTableBody = document.getElementById('productTableBody');
    const totalProductsCount = document.getElementById('totalProductsCount');
    const filterCategorySelect = document.getElementById('filterCategory');

    if (!productTableBody || !totalProductsCount) return;

    productTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Yükleniyor...</td></tr>';

    try {
        const snapshot = await db.collection('products').get();
        let products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const filterVal = filterCategorySelect ? filterCategorySelect.value : 'all';

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
                    <div style="display: flex; gap: 5px;">
                        <button class="admin-action-btn ${p.isShowcase ? 'warning' : 'neutral'}" onclick="toggleShowcase('${p.id}')" title="Vitrin">
                            <i class="fa-solid fa-star"></i>
                        </button>
                        <button class="admin-action-btn info" onclick="editProduct('${p.id}')" title="Düzenle">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button class="admin-action-btn danger" onclick="deleteProduct('${p.id}')" title="Sil">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            productTableBody.appendChild(tr);
        });
    } catch (error) {
        console.error("Error loading products:", error);
        productTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:red;">Hata oluştu.</td></tr>';
    }
}

window.loadCategories = async function () {
    const totalCategoriesCount = document.getElementById('totalCategoriesCount');
    const pCategorySelect = document.getElementById('pCategory');
    const parentCategorySelect = document.getElementById('parentCategorySelect');
    const filterCategorySelect = document.getElementById('filterCategory');
    const categoryListContainer = document.getElementById('categoryListContainer');

    if (!totalCategoriesCount || !categoryListContainer) return;

    try {
        const snapshot = await db.collection('categories').get();
        const categories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        totalCategoriesCount.innerText = `${categories.length} Kategori`;

        // Separate Parents and Children
        const parents = categories.filter(c => !c.parentId);

        // Populate Select Boxes
        if (pCategorySelect) pCategorySelect.innerHTML = '';
        if (parentCategorySelect) parentCategorySelect.innerHTML = '<option value="">Yok (Ana Kategori)</option>';
        if (filterCategorySelect) filterCategorySelect.innerHTML = '<option value="all">Tüm Kategoriler</option>';

        parents.forEach(parent => {
            if (pCategorySelect) {
                const pOpt1 = new Option(parent.name, parent.name);
                pOpt1.style.fontWeight = 'bold';
                pCategorySelect.add(pOpt1);
            }
            if (filterCategorySelect) {
                const fOpt1 = new Option(parent.name, parent.name);
                fOpt1.style.fontWeight = 'bold';
                filterCategorySelect.add(fOpt1);
            }
            if (parentCategorySelect) {
                const pOpt2 = new Option(parent.name, parent.id);
                parentCategorySelect.add(pOpt2);
            }

            const children = categories.filter(c => c.parentId == parent.id);
            children.forEach(child => {
                if (pCategorySelect) {
                    const cOpt = new Option(`- ${child.name}`, child.name);
                    pCategorySelect.add(cOpt);
                }
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
            const div = document.createElement('div');
            div.className = 'cat-list-item';
            div.innerHTML = `
                <span style="font-weight: 600;">${parent.name}</span>
                <button onclick="deleteCategory('${parent.id}')" class="btn btn-small" style="background: #fff; color: #ff6b6b; border: 1px solid #ff6b6b; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem;">Sil</button>
            `;
            categoryListContainer.appendChild(div);

            const children = categories.filter(c => c.parentId == parent.id);
            children.forEach(child => {
                const childDiv = document.createElement('div');
                childDiv.className = 'cat-list-item sub-cat-item';
                childDiv.innerHTML = `
                    <span>${child.name}</span>
                    <button onclick="deleteCategory('${child.id}')" class="btn btn-small" style="background: #fff; color: #ff6b6b; border: 1px solid #ff6b6b; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem;">Sil</button>
                `;
                categoryListContainer.appendChild(childDiv);
            });
        });
    } catch (error) {
        console.error("Error loading categories:", error);
    }
}

window.loadAnnouncements = async function () {
    const announcementListContainer = document.getElementById('announcementListContainer');
    if (!announcementListContainer) return;

    try {
        const snapshot = await db.collection('announcements').get();
        const announcements = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        announcementListContainer.innerHTML = '';

        if (announcements.length === 0) {
            announcementListContainer.innerHTML = '<p style="padding:1rem;">Duyuru yok.</p>';
            return;
        }

        announcements.forEach(ann => {
            const div = document.createElement('div');
            div.className = 'cat-list-item';
            div.innerHTML = `
                <div style="flex:1;">
                    <p style="margin:0; font-size: 0.95rem;">${ann.content}</p>
                    <small style="color:#666;">${new Date(ann.date).toLocaleDateString('tr-TR')}</small>
                </div>
                <button onclick="deleteAnnouncement('${ann.id}')" class="admin-action-btn danger" style="margin-left: 10px;" title="Sil">
                    <i class="fa-solid fa-trash"></i>
                </button>
            `;
            announcementListContainer.appendChild(div);
        });
    } catch (error) {
        console.error(error);
    }
}

// --- Slider Reordering Logic ---
let dragSrcEl = null;

function handleDragStart(e) {
    dragSrcEl = this;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
    this.classList.add('dragging');
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleDragEnter(e) {
    this.classList.add('over');
}

function handleDragLeave(e) {
    this.classList.remove('over');
}

function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }

    if (dragSrcEl !== this) {
        // Swap DOM elements
        // Simple swap of innerHTML is not enough because of event listeners and ID references
        // Better to swap the elements themselves in the DOM

        // This is a robust swap
        const container = document.getElementById('sliderListContainer');
        const items = [...container.children];
        const srcIndex = items.indexOf(dragSrcEl);
        const targetIndex = items.indexOf(this);

        if (srcIndex < targetIndex) {
            container.insertBefore(dragSrcEl, this.nextSibling);
        } else {
            container.insertBefore(dragSrcEl, this);
        }

        // Show Save Button
        document.getElementById('saveSliderOrderBtn').classList.remove('hidden');
    }

    return false;
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
    let items = document.querySelectorAll('#sliderListContainer .cat-list-item');
    items.forEach(function (item) {
        item.classList.remove('over');
    });
}


window.loadSliderImages = async function () {
    const sliderListContainer = document.getElementById('sliderListContainer');
    if (!sliderListContainer) return;

    try {
        const snapshot = await db.collection('sliderImages').get();
        let imagesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Sort by 'order' field, default to 0 if not present
        imagesData.sort((a, b) => (a.order || 0) - (b.order || 0));

        sliderListContainer.innerHTML = '';
        document.getElementById('saveSliderOrderBtn').classList.add('hidden');

        if (imagesData.length === 0) {
            sliderListContainer.innerHTML = '<p style="padding:1rem;">Slider görseli yok.</p>';
            return;
        }

        imagesData.forEach((item) => {
            const div = document.createElement('div');
            div.className = 'cat-list-item';
            div.draggable = true; // Make draggable
            div.setAttribute('data-id', item.id);
            div.style.cursor = 'move'; // Visual cue

            div.innerHTML = `
                <div style="display:flex; align-items:center; gap:10px; width:100%;">
                    <i class="fa-solid fa-grip-lines" style="color:#ccc;"></i>
                    <img src="${item.url}" style="width: 100px; height: 60px; object-fit: cover; border-radius: 4px;">
                    <div style="flex:1; word-break: break-all; font-size:0.9rem;">${item.url.substring(0, 50)}...</div>
                    <button onclick="deleteSliderImage('${item.id}')" class="btn btn-small" style="background: #fff; color: #ff6b6b; border: 1px solid #ff6b6b; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem;">Sil</button>
                </div>
            `;

            // Attach Drag Events
            div.addEventListener('dragstart', handleDragStart, false);
            div.addEventListener('dragenter', handleDragEnter, false);
            div.addEventListener('dragover', handleDragOver, false);
            div.addEventListener('dragleave', handleDragLeave, false);
            div.addEventListener('drop', handleDrop, false);
            div.addEventListener('dragend', handleDragEnd, false);

            sliderListContainer.appendChild(div);
        });
    } catch (error) {
        console.error(error);
    }
}

window.saveSliderOrder = async () => {
    const container = document.getElementById('sliderListContainer');
    const items = container.querySelectorAll('.cat-list-item');
    const btn = document.getElementById('saveSliderOrderBtn');

    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Kaydediliyor...';

    const batch = db.batch();

    items.forEach((item, index) => {
        const id = item.getAttribute('data-id');
        const ref = db.collection('sliderImages').doc(id);
        batch.update(ref, { order: index });
    });

    try {
        await batch.commit();
        alert('Sıralama güncellendi!');
        btn.classList.add('hidden');
    } catch (error) {
        console.error("Error saving order:", error);
        alert('Sıralama kaydedilemedi: ' + error.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-save"></i> Sıralamayı Kaydet';
    }
}

window.loadSiteSettings = async function () {
    try {
        const doc = await db.collection('settings').doc('general').get();
        if (doc.exists) {
            const data = doc.data();
            if (document.getElementById('themeColor'))
                document.getElementById('themeColor').value = data.themeColor || '#d63031';

            if (document.getElementById('footerColor'))
                document.getElementById('footerColor').value = data.footerColor || '#292f36';

            if (document.getElementById('topAnnouncement'))
                document.getElementById('topAnnouncement').value = data.announcementText || '';

            if (document.getElementById('showAnnouncement'))
                document.getElementById('showAnnouncement').checked = data.showAnnouncement || false;
        }
    } catch (e) {
        console.error("Error loading settings:", e);
    }
}

// --- Action Functions ---
window.toggleShowcase = async (id) => {
    try {
        const docRef = db.collection('products').doc(id);
        const doc = await docRef.get();
        if (doc.exists) {
            await docRef.update({
                isShowcase: !doc.data().isShowcase
            });
            loadProducts();
        }
    } catch (error) {
        alert('Hata: ' + error.message);
    }
}

window.deleteProduct = async (id) => {
    if (!confirm('Silmek istediğinize emin misiniz?')) return;
    try {
        await db.collection('products').doc(id).delete();
        loadProducts();
    } catch (error) {
        alert('Silinemedi: ' + error.message);
    }
}

window.editProduct = async (id) => {
    try {
        const doc = await db.collection('products').doc(id).get();
        if (!doc.exists) return;

        const p = { id: doc.id, ...doc.data() };

        document.getElementById('pId').value = p.id;
        document.getElementById('pName').value = p.name;
        document.getElementById('pPrice').value = p.price;
        document.getElementById('pCategory').value = p.category;
        document.getElementById('pImage').value = p.image;
        if (document.getElementById('pDesc')) document.getElementById('pDesc').value = p.description || '';
        document.getElementById('pShowcase').checked = p.isShowcase || false;
        document.getElementById('pShowcase').checked = p.isShowcase || false;
        document.getElementById('pStock').checked = (p.inStock !== undefined) ? p.inStock : true;

        // Show Preview
        window.updatePreviewFromUrl(p.image, 'pPreview');

        const saveProductBtn = document.getElementById('saveProductBtn');
        const cancelEditBtn = document.getElementById('cancelEditBtn');
        if (saveProductBtn) saveProductBtn.innerText = 'Güncelle';
        if (cancelEditBtn) cancelEditBtn.style.display = 'block';

        const productForm = document.getElementById('productForm');
        if (productForm) productForm.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error(error);
    }
}

window.deleteCategory = async (id) => {
    if (!confirm('Kategoriyi silmek istediğinize emin misiniz?')) return;
    try {
        const childSnaps = await db.collection('categories').where('parentId', '==', id).get();

        const batch = db.batch();
        batch.delete(db.collection('categories').doc(id));
        childSnaps.docs.forEach(doc => {
            batch.delete(doc.ref);
        });

        await batch.commit();
        loadCategories();
    } catch (error) {
        alert('Silinemedi: ' + error.message);
    }
}

window.deleteAnnouncement = async (id) => {
    if (!confirm('Duyuruyu silmek istediğinize emin misiniz?')) return;
    try {
        await db.collection('announcements').doc(id).delete();
        loadAnnouncements();
    } catch (error) {
        alert('Hata: ' + error.message);
    }
}

window.deleteSliderImage = async (id) => {
    if (!confirm('Görseli silmek istediğinize emin misiniz?')) return;
    try {
        await db.collection('sliderImages').doc(id).delete();
        loadSliderImages();
    } catch (error) {
        alert('Hata: ' + error.message);
    }
}

// Excel Upload
window.uploadExcel = () => {
    const fileInput = document.getElementById('excelFile');
    if (!fileInput || !fileInput.files.length) {
        alert('Lütfen bir Excel dosyası seçin.');
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = async (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet);

        if (json.length === 0) {
            alert('Dosya boş veya okunamadı.');
            return;
        }

        let addedCount = 0;

        const batchSize = 500; // Firestore limit for batch is 500, but we'll use simple loops for now

        for (const row of json) {
            const name = row['Ad'] || row['Ürün Adı'] || row['name'];
            const price = row['Fiyat'] || row['price'];
            const category = row['Kategori'] || row['category'];
            const image = row['Resim'] || row['image'] || 'https://placehold.co/600x600?text=Resim+Yok';
            const desc = row['Açıklama'] || row['description'] || '';

            if (name && price) {
                try {
                    await db.collection('products').add({
                        name: String(name),
                        price: parseFloat(price),
                        category: String(category || 'Genel'),
                        image: String(image),
                        description: String(desc),
                        isShowcase: false
                    });
                    addedCount++;
                } catch (err) {
                    console.error("Row error:", err);
                }
            }
        }

        alert(`${addedCount} ürün başarıyla eklendi!`);
        loadProducts();
        fileInput.value = '';
    };

    reader.readAsArrayBuffer(file);
};






// ================= IMAGE UPLOAD UTILS =================

// Resize image to max 1000px to keep base64 size manageable
function resizeImage(file, maxWidth = 1000) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height *= maxWidth / width;
                    width = maxWidth;
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                // Compress to 0.7 quality jpeg
                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                resolve(dataUrl);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

window.handleFileSelect = async (input, previewId, targetUrlInputId) => {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        try {
            // Show loading or something?
            const base64 = await resizeImage(file);
            document.getElementById(targetUrlInputId).value = base64;

            const preview = document.getElementById(previewId);
            preview.src = base64;
            preview.style.display = 'block';
        } catch (e) {
            console.error(e);
            alert("Resim işlenirken hata oluştu.");
        }
    }
}

window.updatePreviewFromUrl = (url, previewId) => {
    const preview = document.getElementById(previewId);
    if (url && (url.startsWith('http') || url.startsWith('data:') || url.startsWith('images/'))) {
        preview.src = url;
        preview.style.display = 'block';
    } else {
        preview.style.display = 'none';
        preview.src = '';
    }
}

function setupDragAndDrop(dropZoneId, fileInputId) {
    const dropZone = document.getElementById(dropZoneId);
    const fileInput = document.getElementById(fileInputId);

    if (!dropZone || !fileInput) return;

    // Click to open file dialog
    dropZone.addEventListener('click', () => fileInput.click());

    // File Input Change
    fileInput.addEventListener('change', () => {
        // Trigger generic handler
        // Needs mapping to specific preview/target
        let previewId, targetId;
        if (fileInputId === 'pFile') { previewId = 'pPreview'; targetId = 'pImage'; }
        else if (fileInputId === 'sFile') { previewId = 'sPreview'; targetId = 'sliderUrl'; }

        handleFileSelect(fileInput, previewId, targetId);
    });

    // Drag Events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'), false);
    });

    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        fileInput.files = files; // Assign dropped files to input

        // Trigger change manually
        const event = new Event('change');
        fileInput.dispatchEvent(event);
    }, false);
}


// ================= DOM CONTENT LOADED =================
document.addEventListener('DOMContentLoaded', () => {
    const loginSection = document.getElementById('loginSection');
    const adminPanel = document.getElementById('adminPanel');
    const loginForm = document.getElementById('loginForm');
    const logoutBtn = document.getElementById('logoutBtn');

    // --- State Initialization ---
    setupDragAndDrop('pDropZone', 'pFile');
    setupDragAndDrop('sDropZone', 'sFile');

    // NO LOCAL STORAGE MIGRATION AUTOMATICALLY TO AVOID DUPLICATES ON REFRESH
    // Check if categories empty, maybe seed?
    /*
    db.collection('categories').get().then(snap => {
        if (snap.empty) {
             // seed default categories
        }
    });
    */

    // --- Auth Logic ---
    const showAdminPanel = () => {
        loginSection.classList.add('hidden');
        adminPanel.classList.remove('hidden');
        loadCategories();
        loadProducts();
        loadAnnouncements();
        loadSliderImages();
    }

    if (localStorage.getItem('adminLoggedIn') === 'true') {
        showAdminPanel();
    }

    // Init Credentials on Load
    initAdminCredentials();

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const u = document.getElementById('username').value;
        const p = document.getElementById('password').value;
        const btn = loginForm.querySelector('button');

        btn.disabled = true;
        btn.innerText = 'Kontrol ediliyor...';

        try {
            const doc = await db.collection('settings').doc('admin').get();
            if (!doc.exists) {
                await initAdminCredentials();
                alert('Sistem güncellendi, lütfen tekrar deneyin.');
                btn.disabled = false;
                btn.innerText = 'Giriş Yap';
                return;
            }

            const data = doc.data();
            const hash = await sha256(p);

            if (u === data.username && hash === data.passwordHash) {
                localStorage.setItem('adminLoggedIn', 'true');
                showAdminPanel();
                loginForm.reset();
            } else {
                alert('Hatalı kullanıcı adı veya şifre!');
            }
        } catch (err) {
            console.error(err);
            alert('Giriş yapılamadı: ' + err.message);
        } finally {
            btn.disabled = false;
            btn.innerText = 'Giriş Yap';
        }
    });

    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('adminLoggedIn');
        loginSection.classList.remove('hidden');
        adminPanel.classList.add('hidden');
    });

    // --- Product Form Listener ---
    const productForm = document.getElementById('productForm');
    if (productForm) {
        productForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const pIdField = document.getElementById('pId').value;

            // Common Product Object
            const pData = {
                name: document.getElementById('pName').value,
                price: parseFloat(document.getElementById('pPrice').value),
                category: document.getElementById('pCategory').value,
                image: document.getElementById('pImage').value,
                description: document.getElementById('pDesc') ? document.getElementById('pDesc').value : '',
                isShowcase: document.getElementById('pShowcase').checked,
                inStock: document.getElementById('pStock').checked
            };

            const saveBtn = document.getElementById('saveProductBtn');
            saveBtn.disabled = true;
            saveBtn.innerText = 'İşleniyor...';

            try {
                if (pIdField) {
                    // EDIT
                    await db.collection('products').doc(pIdField).update(pData);
                    alert('Ürün güncellendi.');

                    productForm.reset();
                    document.getElementById('pId').value = '';
                    saveBtn.innerText = 'Ekle';
                    document.getElementById('cancelEditBtn').style.display = 'none';
                } else {
                    // ADD
                    await db.collection('products').add(pData);
                    alert('Ürün eklendi!');
                    productForm.reset();
                    saveBtn.innerText = 'Ekle';
                }
                loadProducts();
            } catch (error) {
                alert('Hata: ' + error.message);
                saveBtn.innerText = pIdField ? 'Güncelle' : 'Ekle';
            } finally {
                saveBtn.disabled = false;
            }
        });
    }

    const cancelEditBtn = document.getElementById('cancelEditBtn');
    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', () => {
            productForm.reset();
            document.getElementById('pId').value = '';
            document.getElementById('saveProductBtn').innerText = 'Ekle';
            cancelEditBtn.style.display = 'none';
        });
    }

    const filterCategorySelect = document.getElementById('filterCategory');
    if (filterCategorySelect) {
        filterCategorySelect.addEventListener('change', loadProducts);
    }


    // --- Category Form ---
    const categoryForm = document.getElementById('categoryForm');
    if (categoryForm) {
        categoryForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const catName = document.getElementById('catName').value.trim();
            const parentId = document.getElementById('parentCategorySelect').value;
            if (!catName) return;

            // Simple Duplicate Check (inefficient for large DBs but fine here)
            const snap = await db.collection('categories').where('name', '==', catName).get();
            if (!snap.empty) {
                alert('Bu isimde bir kategori zaten mevcut!');
                return;
            }

            try {
                await db.collection('categories').add({
                    name: catName,
                    parentId: parentId || null // explicit null if empty
                });
                loadCategories();
                categoryForm.reset();
            } catch (e) {
                alert(e.message);
            }
        });
    }

    // --- Announcement Form ---
    const announcementForm = document.getElementById('announcementForm');
    if (announcementForm) {
        announcementForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const content = document.getElementById('annContent').value;

            try {
                await db.collection('announcements').add({
                    content: content,
                    date: new Date().toISOString()
                });
                alert('Duyuru yayınlandı!');
                announcementForm.reset();
                loadAnnouncements();
            } catch (e) {
                alert(e.message);
            }
        });
    }

    // --- Slider Form ---
    const sliderForm = document.getElementById('sliderForm');
    if (sliderForm) {
        sliderForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const url = document.getElementById('sliderUrl').value;
            try {
                await db.collection('sliderImages').add({
                    url: url
                });
                alert('Görsel eklendi!');
                sliderForm.reset();
                loadSliderImages();
            } catch (e) {
                alert(e.message);
            }
        });
    }
    // --- Change Password Form ---
    const changePasswordForm = document.getElementById('changePasswordForm');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const currentP = document.getElementById('currentPassword').value;
            const newP = document.getElementById('newPassword').value;
            const confirmP = document.getElementById('confirmPassword').value;

            if (newP !== confirmP) {
                alert('Yeni şifreler uyuşmuyor!');
                return;
            }

            try {
                const doc = await db.collection('settings').doc('admin').get();
                if (!doc.exists) return;

                const data = doc.data();
                const currentHash = await sha256(currentP);

                if (currentHash !== data.passwordHash) {
                    alert('Mevcut şifre yanlış!');
                    return;
                }

                const newHash = await sha256(newP);
                await db.collection('settings').doc('admin').update({
                    passwordHash: newHash
                });

                alert('Şifre başarıyla güncellendi!');
                changePasswordForm.reset();
            } catch (err) {
                alert('Hata: ' + err.message);
            }
        });
    }

    // --- Site Settings Form ---
    const siteSettingsForm = document.getElementById('siteSettingsForm');
    if (siteSettingsForm) {
        siteSettingsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const themeColor = document.getElementById('themeColor').value;
            const footerColor = document.getElementById('footerColor').value;
            const text = document.getElementById('topAnnouncement').value;
            const show = document.getElementById('showAnnouncement').checked;

            try {
                await db.collection('settings').doc('general').set({
                    themeColor: themeColor,
                    footerColor: footerColor,
                    announcementText: text,
                    showAnnouncement: show
                }, { merge: true });
                alert('Site ayarları güncellendi!');
            } catch (e) {
                alert('Hata: ' + e.message);
            }
        });
    }
});
