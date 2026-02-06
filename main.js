// Firebase Initialization
const db = firebase.firestore();

// Global Functions to ensure they work from HTML if needed
window.GLOBAL_DATA = {
    products: [],
    categories: [],
    sliderImages: [],
    sliderIndex: 0,
    sliderInterval: null
};

document.addEventListener('DOMContentLoaded', () => {
    initData().then(() => {
        initApp();
    });
});

async function initData() {
    try {
        console.log("Fetching data from Firestore...");
        const [pSnap, cSnap, sSnap] = await Promise.all([
            db.collection('products').get(),
            db.collection('categories').get(),
            db.collection('sliderImages').get()
        ]);

        window.GLOBAL_DATA.products = pSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        window.GLOBAL_DATA.categories = cSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        window.GLOBAL_DATA.sliderImages = sSnap.docs.map(d => d.data().url);

        console.log("Data loaded:", window.GLOBAL_DATA);
    } catch (error) {
        console.error("Error loading data:", error);
    }
}

function initApp() {
    renderSidebar('all');
    renderProducts('all');
    renderSlider();
    renderCarousel();
    renderFooterCategories();
    initModalListeners();

    // Attach Search Listener Manually
    const btn = document.getElementById('searchBtn');
    if (btn) {
        btn.onclick = (e) => {
            e.preventDefault();
            doSearch();
        }
    }
    const inp = document.getElementById('searchInput');
    if (inp) {
        inp.onkeyup = (e) => {
            if (e.key === 'Enter') doSearch();
        }
    }
}

/* ================= SLIDER LOGIC ================= */
function renderSlider() {
    const wrapper = document.getElementById('sliderWrapper');
    const dots = document.getElementById('sliderDots');
    if (!wrapper) return;

    wrapper.innerHTML = '';
    if (dots) dots.innerHTML = '';

    if (window.GLOBAL_DATA.sliderImages.length === 0) {
        // Fallback or empty state
        wrapper.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#fff;">Görsel Yok</div>';
        return;
    }

    window.GLOBAL_DATA.sliderImages.forEach((img, idx) => {
        // Slide
        const div = document.createElement('div');
        div.className = 'slide';
        div.innerHTML = `<img src="${img}" style="width:100%; height:100%; object-fit:cover;">`;
        wrapper.appendChild(div);

        // Dot
        if (dots) {
            const d = document.createElement('div');
            d.className = `slider-dot ${idx === 0 ? 'active' : ''}`;
            d.onclick = () => moveSlider(idx);
            dots.appendChild(d);
        }
    });

    // Reset
    window.GLOBAL_DATA.sliderIndex = 0;
    updateSliderUI();
    startAutoSlide();

    // Attach Buttons
    const prev = document.querySelector('.slider-prev');
    const next = document.querySelector('.slider-next');
    if (prev) prev.onclick = (e) => { e.preventDefault(); changeSlide(-1); };
    if (next) next.onclick = (e) => { e.preventDefault(); changeSlide(1); };
}

window.changeSlide = function (dir) {
    if (window.GLOBAL_DATA.sliderImages.length === 0) return;
    let newIdx = window.GLOBAL_DATA.sliderIndex + dir;
    const total = window.GLOBAL_DATA.sliderImages.length;

    if (newIdx >= total) newIdx = 0;
    if (newIdx < 0) newIdx = total - 1;

    moveSlider(newIdx);
    resetAutoSlide();
}

function moveSlider(idx) {
    window.GLOBAL_DATA.sliderIndex = idx;
    updateSliderUI();
}

function updateSliderUI() {
    const wrapper = document.getElementById('sliderWrapper');
    if (wrapper) {
        wrapper.style.transform = `translateX(-${window.GLOBAL_DATA.sliderIndex * 100}%)`;
    }

    const dots = document.querySelectorAll('.slider-dot');
    dots.forEach((d, i) => {
        if (i === window.GLOBAL_DATA.sliderIndex) d.classList.add('active');
        else d.classList.remove('active');
    });
}

function startAutoSlide() {
    if (window.GLOBAL_DATA.sliderInterval) clearInterval(window.GLOBAL_DATA.sliderInterval);
    if (window.GLOBAL_DATA.sliderImages.length > 1) {
        window.GLOBAL_DATA.sliderInterval = setInterval(() => {
            changeSlide(1);
        }, 5000);
    }
}

function resetAutoSlide() {
    clearInterval(window.GLOBAL_DATA.sliderInterval);
    startAutoSlide();
}


/* ================= SEARCH LOGIC ================= */
window.doSearch = function () {
    const inp = document.getElementById('searchInput');
    if (!inp) return;

    const query = inp.value.trim().toLowerCase();

    // Always render ALL with query
    renderProducts('all', query);

    // Scroll
    const grid = document.getElementById('productGrid');
    if (grid) {
        grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}


/* ================= CAROUSEL LOGIC ================= */
function renderCarousel() {
    const c = document.getElementById('productCarousel');
    if (!c) return;

    const prods = window.GLOBAL_DATA.products.filter(p => p.isShowcase);
    // If no showcase, maybe show latest?
    const displayProds = prods.length > 0 ? prods : window.GLOBAL_DATA.products.slice(0, 10);

    c.innerHTML = '';
    displayProds.forEach(p => {
        const item = createProductCard(p);
        c.appendChild(item);
    });
}


/* ================= PRODUCT GRID LOGIC ================= */
function renderProducts(catFilter, query = '') {
    const grid = document.getElementById('productGrid');
    const title = document.getElementById('categoryTitle');
    const count = document.getElementById('resultCount');
    if (!grid) return;

    grid.innerHTML = '';

    let list = window.GLOBAL_DATA.products;

    // 1. Filter by Search Query (Priority)
    if (query) {
        if (title) title.innerText = `Arama: "${query}"`;
        list = list.filter(p =>
            p.name.toLowerCase().includes(query) ||
            p.category.toLowerCase().includes(query)
        );
    }
    // 2. Filter by Category
    else if (catFilter !== 'all') {
        if (title) title.innerText = catFilter;
        // Simple logic: Exact Match OR Child Category
        list = list.filter(p => {
            if (p.category === catFilter) return true;
            // Check if catFilter is a Parent
            const parent = window.GLOBAL_DATA.categories.find(c => c.name === catFilter);
            if (parent) {
                const children = window.GLOBAL_DATA.categories.filter(c => c.parentId === parent.id).map(c => c.name);
                if (children.includes(p.category)) return true;
            }
            return false;
        });
    } else {
        if (title) title.innerText = 'Tüm Ürünler';
    }

    // Render
    if (count) count.innerText = `${list.length} ürün listelendi`;

    if (list.length === 0) {
        grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:2rem;">Ürün bulunamadı.</div>`;
        return;
    }

    list.forEach(p => {
        grid.appendChild(createProductCard(p));
    });
}

function createProductCard(p) {
    const div = document.createElement('div');
    div.className = 'product-card';
    div.innerHTML = `
        <div class="product-img-wrapper">
            <img src="${p.image}" onerror="this.src='https://placehold.co/600x600?text=Yok'">
             <div class="product-actions">
                <div class="action-btn" title="İncele"><i class="fa-solid fa-eye"></i></div>
            </div>
        </div>
        <div class="product-info">
            <div class="product-cat">${p.category}</div>
            <h3 class="product-name">${p.name}</h3>
            <div class="product-price">${parseFloat(p.price).toFixed(2)} TL</div>
        </div>
    `;
    // Add Click listener
    div.addEventListener('click', () => window.openModal(p.id));
    return div;
}

/* ================= MODAL LOGIC ================= */
window.openModal = function (id) {
    const p = window.GLOBAL_DATA.products.find(x => x.id == id);
    if (!p) return;

    const modal = document.getElementById('productModal');
    if (!modal) return;

    // Fill Content
    document.getElementById('modalImg').src = p.image || '';
    document.getElementById('modalCat').innerText = p.category;
    document.getElementById('modalTitle').innerText = p.name;
    document.getElementById('modalPrice').innerText = `${parseFloat(p.price).toFixed(2)} TL`;
    document.getElementById('modalDesc').innerText = p.description || 'Bu ürün için henüz açıklama girilmemiş.';

    modal.style.display = 'flex';
}

// Close Modal Logic (Needs to be run on init)
function initModalListeners() {
    const modal = document.getElementById('productModal');
    const closeBtn = document.querySelector('.close-modal');

    if (closeBtn && modal) {
        closeBtn.onclick = () => modal.style.display = 'none';

        // Close on outside click
        window.onclick = (e) => {
            if (e.target == modal) {
                modal.style.display = 'none';
            }
        }
    }
}


/* ================= SIDEBAR LOGIC ================= */
function renderSidebar(active) {
    const list = document.getElementById('categorySidebarList');
    if (!list) return;
    list.innerHTML = '';

    // All
    const allLi = document.createElement('li');
    allLi.innerHTML = `<a href="#" class="${active === 'all' ? 'active' : ''}">Tüm Kategoriler</a>`;
    allLi.onclick = (e) => { e.preventDefault(); renderProducts('all'); renderSidebar('all'); };
    list.appendChild(allLi);

    // Parents
    const parents = window.GLOBAL_DATA.categories.filter(c => !c.parentId);
    parents.forEach(p => {
        const li = document.createElement('li');
        li.innerHTML = `<a href="#" class="${active === p.name ? 'active' : ''}">${p.name}</a>`;

        li.onclick = (e) => {
            e.preventDefault();
            renderProducts(p.name);
            renderSidebar(p.name);
        };

        // If Active, show children
        if (active === p.name) {
            const kids = window.GLOBAL_DATA.categories.filter(c => c.parentId === p.id);
            if (kids.length > 0) {
                const ul = document.createElement('ul');
                ul.style.paddingLeft = '15px';
                kids.forEach(k => {
                    const kli = document.createElement('li');
                    kli.innerHTML = `<a href="#" style="font-size:0.9rem; color:#666">- ${k.name}</a>`;
                    kli.onclick = (e) => {
                        e.preventDefault();
                        e.stopPropagation(); // Don't trigger parent click
                        renderProducts(k.name);
                        // Optional: make this active?
                    }
                    ul.appendChild(kli);
                });
                li.appendChild(ul);
            }
        }

        list.appendChild(li);
    });
}

function renderFooterCategories() {
    const list = document.getElementById('footerCategories');
    if (!list) return;

    list.innerHTML = '';
    const parents = window.GLOBAL_DATA.categories.filter(c => !c.parentId);

    if (parents.length === 0) {
        return;
    }

    parents.slice(0, 8).forEach(p => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = '#';
        a.innerText = p.name;
        a.onclick = (e) => {
            e.preventDefault();
            renderProducts(p.name);
            renderSidebar(p.name);
            const grid = document.getElementById('productGrid');
            if (grid) grid.scrollIntoView({ behavior: 'smooth' });
        };
        li.appendChild(a);
        list.appendChild(li);
    });
}
