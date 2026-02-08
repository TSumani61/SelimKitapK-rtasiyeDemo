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
        // Hide Preloader with a slight delay to ensure styles are applied
        setTimeout(() => {
            const preloader = document.getElementById('preloader');
            if (preloader) preloader.classList.add('loaded');
        }, 800);
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
        let cImgs = cSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        // Sort categories by order
        cImgs.sort((a, b) => (a.order || 0) - (b.order || 0));
        window.GLOBAL_DATA.categories = cImgs;

        let sImgs = sSnap.docs.map(d => ({ ...d.data() }));
        // Sort by order
        sImgs.sort((a, b) => (a.order || 0) - (b.order || 0));

        window.GLOBAL_DATA.sliderImages = sImgs.map(d => d.url);

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
    renderCarousel();
    initCarouselListeners();
    renderFooterCategories();
    initModalListeners();
    applySiteSettings();
    initScrollAnimations();
    renderHeaderCategories();

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

    // Mobile Menu Listeners
    const mobToggle = document.getElementById('mobileMenuToggle');
    const mobOverlay = document.getElementById('mobileNavOverlay');
    const closeMob = document.getElementById('closeMobileNav');

    if (mobToggle && mobOverlay) {
        mobToggle.onclick = () => mobOverlay.classList.add('active');
    }
    if (closeMob && mobOverlay) {
        closeMob.onclick = () => mobOverlay.classList.remove('active');
    }

    // Close on outside click
    if (mobOverlay) {
        mobOverlay.onclick = (e) => {
            if (e.target === mobOverlay) mobOverlay.classList.remove('active');
        }
    }

    // --- DARK MODE TOGGLE ---
    const darkModeBtn = document.getElementById('darkModeToggle');
    if (darkModeBtn) {
        // Check saved
        if (localStorage.getItem('theme') === 'dark') {
            document.body.setAttribute('data-theme', 'dark');
            darkModeBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
        }

        darkModeBtn.onclick = () => {
            if (document.body.getAttribute('data-theme') === 'dark') {
                document.body.removeAttribute('data-theme');
                localStorage.setItem('theme', 'light');
                darkModeBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
            } else {
                document.body.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
                darkModeBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
            }
        }
    }
}


// Global scope for HTML onclicks
window.toggleMobileMenu = function () {
    const mobOverlay = document.getElementById('mobileNavOverlay');
    if (mobOverlay) mobOverlay.classList.toggle('active');
}

// --- Scroll Animation Observer ---
const observerOptions = {
    threshold: 0.15, // Trigger when 15% visible
    rootMargin: "0px 0px -50px 0px"
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
            observer.unobserve(entry.target); // Reveal only once
        }
    });
}, observerOptions);

function initScrollAnimations() {
    const elements = document.querySelectorAll('.reveal-on-scroll');
    elements.forEach(el => observer.observe(el));
}

/* ================= SLIDER LOGIC ================= */
function renderSlider() {
    const wrapper = document.getElementById('sliderWrapper');
    const dots = document.getElementById('sliderDots');
    if (!wrapper) return;

    wrapper.innerHTML = '';
    if (dots) dots.innerHTML = '';

    if (window.GLOBAL_DATA.sliderImages.length === 0) {
        // Use High Quality Fallbacks
        window.GLOBAL_DATA.sliderImages = [
            'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&q=80&w=1600', // Stationery vibe
            'https://images.unsplash.com/photo-1456735190827-d1261f7add50?auto=format&fit=crop&q=80&w=1600', // Writing
            'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=1600'  // Notebooks
        ];
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
    const displayProds = prods.length > 0 ? prods : window.GLOBAL_DATA.products;

    c.innerHTML = '';

    if (displayProds.length === 0) {
        c.innerHTML = '<div style="padding:20px; color:#888;">Gösterilecek ürün yok.</div>';
        return;
    }

    displayProds.forEach(p => {
        const item = createProductCard(p);
        item.classList.add('carousel-item');
        c.appendChild(item);
    });
}

function initCarouselListeners() {
    const prev = document.querySelector('.carousel-btn.prev');
    const next = document.querySelector('.carousel-btn.next');
    const carousel = document.getElementById('productCarousel');

    if (prev && carousel) {
        prev.onclick = () => {
            carousel.scrollBy({ left: -300, behavior: 'smooth' });
        };
    }
    if (next && carousel) {
        next.onclick = () => {
            carousel.scrollBy({ left: 300, behavior: 'smooth' });
        };
    }
}


/* ================= PRODUCT GRID LOGIC ================= */
/* ================= PRODUCT GRID LOGIC ================= */
let currentProductList = []; // Filtered list
let currentVisibleCount = 0; // How many currently shown
const PAGE_SIZE = 12; // Products per load

function renderProducts(catFilter, query = '') {
    const grid = document.getElementById('productGrid');
    const title = document.getElementById('categoryTitle');
    const count = document.getElementById('resultCount');
    if (!grid) return;

    // Reset layout if it's a new filter/search
    // We detect "new operation" by checking if we are appending or starting fresh.
    // For simplicity, let's assume any call to renderProducts is a "reset" unless specified internally.
    // Actually, we'll split logic: prepare list, then render chunks.

    grid.innerHTML = '';
    currentVisibleCount = 0;

    let list = window.GLOBAL_DATA.products;

    // 1. Filter by Search Query
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
        list = list.filter(p => {
            if (p.category === catFilter) return true;
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

    currentProductList = list;

    // Update Count Text
    if (count) count.innerText = `${list.length} ürün listelendi`;

    if (list.length === 0) {
        grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:2rem;">Ürün bulunamadı.</div>`;
        removeLoadMoreBtn();
        return;
    }

    // Initial Load
    loadMoreProducts();
}

function loadMoreProducts() {
    const grid = document.getElementById('productGrid');
    if (!grid) return;

    // Determine range
    const start = currentVisibleCount;
    const end = Math.min(start + PAGE_SIZE, currentProductList.length);

    const chunk = currentProductList.slice(start, end);

    chunk.forEach(p => {
        grid.appendChild(createProductCard(p));
    });

    currentVisibleCount = end;

    // Check if we need "Load More" button
    updateLoadMoreBtn();
}

function updateLoadMoreBtn() {
    removeLoadMoreBtn();

    // If there are still items to show
    if (currentVisibleCount < currentProductList.length) {
        const btnContainer = document.createElement('div');
        btnContainer.id = 'loadMoreContainer';
        btnContainer.style.width = '100%';
        btnContainer.style.textAlign = 'center';
        btnContainer.style.gridColumn = '1 / -1'; // Span full width in grid
        btnContainer.style.marginTop = '2rem';

        const btn = document.createElement('button');
        btn.innerText = 'Daha Fazla Göster';
        btn.className = 'btn btn-outline'; // Reusing existing style
        btn.onclick = () => {
            loadMoreProducts();
        };

        btnContainer.appendChild(btn);

        // Append to grid (or after grid? Grid is better if we use full span)
        const grid = document.getElementById('productGrid');
        grid.appendChild(btnContainer);
    }
}

function removeLoadMoreBtn() {
    const existing = document.getElementById('loadMoreContainer');
    if (existing) existing.remove();
}

function createProductCard(p) {
    const div = document.createElement('div');
    // Check Stock
    const isOutOfStock = (p.inStock === false); // explicit false check, default true

    div.className = `product-card ${isOutOfStock ? 'out-of-stock' : ''}`;
    div.innerHTML = `
        <div class="product-img-wrapper">
            ${isOutOfStock ? '<div class="out-of-stock-badge">TÜKENDİ</div>' : ''}
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

/* ================= SITE SETTINGS LOGIC ================= */
async function applySiteSettings() {
    try {
        const doc = await db.collection('settings').doc('general').get();
        if (!doc.exists) return;

        const data = doc.data();

        // 1. Theme Color
        if (data.themeColor) {
            document.documentElement.style.setProperty('--primary', data.themeColor);
        }

        // 2. Footer & Top Bar Color
        if (data.footerColor) {
            document.documentElement.style.setProperty('--footer-bg', data.footerColor);
        }

        // 3. Marquee Text (Previously Announcement Bar)
        if (data.announcementText) {
            const marqueeContent = document.querySelector('.marquee-content');
            if (marqueeContent) {
                // Repeat text for seamless loop
                const text = data.announcementText;
                let repeatedHTML = '';
                // 10 times is usually safe enough for varied screen widths
                for (let i = 0; i < 15; i++) {
                    repeatedHTML += `<span>${text}</span><span class="separator">•</span>`;
                }
                marqueeContent.innerHTML = repeatedHTML;
            } else {
                // Fallback if marquee is missing (should stick to index.html though)
            }

            // Remove old announcement bar logic if it exists (not creating it anymore)
        }

    } catch (error) {
        console.error("Settings load error:", error);
    }
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

    // Reset any stock warning
    const stockMsg = document.getElementById('modalStockMsg');
    if (stockMsg) stockMsg.remove();

    // Check Stock
    if (p.inStock === false) {
        const infoDiv = modal.querySelector('.modal-info');
        const warning = document.createElement('div');
        warning.id = 'modalStockMsg';
        warning.className = 'badge';
        warning.style.backgroundColor = '#636e72';
        warning.style.color = '#fff';
        warning.style.marginTop = '10px';
        warning.style.display = 'inline-block';
        warning.innerText = 'Bu ürün şu an stoklarımızda bulunmamaktadır.';

        // Insert after price
        const priceEl = document.getElementById('modalPrice');
        priceEl.parentNode.insertBefore(warning, priceEl.nextSibling);
    }

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

/* --- NEW HEADER NAV LOGIC --- */
function renderHeaderCategories() {
    const nav = document.getElementById('catNavBar');
    if (!nav) return;

    // Clear existing
    nav.innerHTML = '';

    const categories = window.GLOBAL_DATA.categories || [];
    const parents = categories.filter(c => !c.parentId);

    if (parents.length === 0) return;

    const ul = document.createElement('ul');
    ul.className = 'cat-menu';

    parents.forEach(p => {
        const li = document.createElement('li');
        li.className = 'cat-item';

        const children = categories.filter(c => c.parentId === p.id);
        const hasChildren = children.length > 0;

        // Parent Link
        const a = document.createElement('a');
        a.className = 'cat-link';
        // Add icon if children exist
        a.innerHTML = `${p.name} ${hasChildren ? '<i class="fa-solid fa-chevron-down" style="font-size: 0.7em; margin-left: 4px;"></i>' : ''}`;

        a.onclick = (e) => {
            e.preventDefault();
            renderProducts(p.name);
            scrollToProducts();
        };

        li.appendChild(a);

        // Dropdown
        if (hasChildren) {
            const subUl = document.createElement('ul');
            subUl.className = 'cat-dropdown';

            children.forEach(child => {
                const subLi = document.createElement('li');
                const subA = document.createElement('a');
                subA.className = 'cat-sub-link';
                subA.innerText = child.name;
                subA.href = '#';
                subA.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    renderProducts(child.name);
                    scrollToProducts();
                };
                subLi.appendChild(subA);
                subUl.appendChild(subLi);
            });
            li.appendChild(subUl);
        }

        ul.appendChild(li);
    });

    nav.appendChild(ul);
}

function scrollToProducts() {
    const section = document.querySelector('.products-section');
    // Or closer to grid
    const grid = document.getElementById('productGrid');

    if (grid) {
        // Scroll with offset for sticky header
        const headerOffset = 150;
        const elementPosition = grid.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
            top: offsetPosition,
            behavior: "smooth"
        });
    }
}
