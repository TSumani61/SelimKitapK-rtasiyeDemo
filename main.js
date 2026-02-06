document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('productGrid');
    const extraFilterTriggers = document.querySelectorAll('.filter-trigger');
    const categorySidebarList = document.getElementById('categorySidebarList');
    const categoryTitle = document.getElementById('categoryTitle');
    const resultCount = document.getElementById('resultCount');

    // Default Mock Data
    const MOCK_DATA = [
        { id: 1, name: 'Premium Deri Defter', price: 250, category: 'Defter', image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80' },
        { id: 2, name: 'Altın Kaplama Dolma Kalem', price: 1200, category: 'Kalem', image: 'https://images.unsplash.com/photo-1585336261022-680e295ce3fe?auto=format&fit=crop&w=800&q=80' },
        { id: 3, name: 'Deri Evrak Çantası', price: 3500, category: 'Çanta', image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80' },
        { id: 4, name: 'Masa Düzenleyici Set', price: 850, category: 'Ofis', image: 'https://images.unsplash.com/photo-1505330622279-bf7d7fc918f4?auto=format&fit=crop&w=800&q=80' },
        { id: 5, name: 'Mat Siyah Kurşun Kalem Seti', price: 120, category: 'Kalem', image: 'https://images.unsplash.com/photo-1595064506822-628d488e364c?auto=format&fit=crop&w=800&q=80' }
    ];

    // Initialize Data if empty
    if (!localStorage.getItem('products')) {
        localStorage.setItem('products', JSON.stringify(MOCK_DATA));
    }

    // Seed Categories if empty (For Sidebar Demo)
    if (!localStorage.getItem('categories')) {
        const defaultCats = [
            { id: 1, name: 'Kırtasiye', parentId: null },
            { id: 2, name: 'Defter', parentId: 1 },
            { id: 3, name: 'Kalem', parentId: 1 },
            { id: 4, name: 'Çanta', parentId: null },
            { id: 5, name: 'Ofis', parentId: null }
        ];
        localStorage.setItem('categories', JSON.stringify(defaultCats));
    }

    const allCategories = JSON.parse(localStorage.getItem('categories')) || [];
    let activeCategoryState = 'all'; // Current active filter

    // Initial Render
    renderSidebar('all');
    renderProducts('all');
    initCarousel();
    initSlider(); // Ensure slider is also called if it exists

    // --- SEARCH LOGIC ---
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');

    function performSearch(query) {
        query = query.toLowerCase();
        renderProducts(activeCategoryState, query);
        // Optional: Scroll to products when searching
        if (!query) return; // Don't scroll on empty clear
        const gridEl = document.getElementById('productGrid');
        if (gridEl) {
            // Only scroll if we are far away, e.g. top of page
            if (window.scrollY < 300) {
                gridEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    }

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            performSearch(e.target.value);
        });

        searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                performSearch(searchInput.value);
                // Force scroll on Enter
                const gridEl = document.getElementById('productGrid');
                if (gridEl) gridEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }

    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', () => {
            performSearch(searchInput.value);
            const gridEl = document.getElementById('productGrid');
            if (gridEl) gridEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }

    // --- SIDEBAR RENDER LOGIC ---
    function renderSidebar(activeCatName) {
        if (!categorySidebarList) return;
        categorySidebarList.innerHTML = '';

        // Determine hierarchy context
        // 1. Is 'activeCatName' a main category?
        // 2. Is it a subcategory?
        // 3. Is it 'all'?

        let displayCats = [];
        let parentCat = null;
        let showBackButton = false;

        const activeCatObj = allCategories.find(c => c.name === activeCatName);

        if (activeCatName === 'all' || !activeCatObj) {
            // Show all Top Level Categories or Unparented categories
            displayCats = allCategories.filter(c => !c.parentId);
            categoryTitle.innerText = "Tüm Ürünler";
        } else {
            if (activeCatObj.parentId) {
                // It is a subcategory. Show siblings.
                parentCat = allCategories.find(c => c.id === activeCatObj.parentId);
                displayCats = allCategories.filter(c => c.parentId === activeCatObj.parentId);
                showBackButton = true;
                categoryTitle.innerText = activeCatName; // Display current subcat name
            } else {
                // It is a parent category. Show children.
                displayCats = allCategories.filter(c => c.parentId === activeCatObj.id);
                // If no children, maybe show itself or siblings? 
                // If it has children, show children. If no children (like 'Çanta' in seed), show siblings at root?
                if (displayCats.length === 0) {
                    displayCats = allCategories.filter(c => !c.parentId); // Fallback to root if leaf node
                } else {
                    showBackButton = true; // "Back to All" essentially
                }
                categoryTitle.innerText = activeCatName;
            }
        }

        // "Tümü" / Back Link Logic
        const allLi = document.createElement('li');
        const allA = document.createElement('a');
        allA.href = "#";

        if (showBackButton) {
            if (parentCat) {
                allA.innerText = `< ${parentCat.name} (Tümü)`;
                allA.dataset.cat = parentCat.name;
            } else {
                allA.innerText = "< Tüm Kategoriler";
                allA.dataset.cat = "all";
            }
        } else {
            allA.innerText = "Tüm Kategoriler";
            allA.dataset.cat = "all";
            if (activeCatName === 'all') allA.classList.add('active');
        }

        allA.addEventListener('click', (e) => {
            e.preventDefault();
            const target = allA.dataset.cat;
            activeCategoryState = target;
            renderSidebar(target);
            renderProducts(target);
        });

        allLi.appendChild(allA);
        categorySidebarList.appendChild(allLi);

        // Render List
        displayCats.forEach(cat => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = "#";
            a.innerText = cat.name;
            if (cat.name === activeCatName) a.classList.add('active');

            a.addEventListener('click', (e) => {
                e.preventDefault();
                activeCategoryState = cat.name;
                renderSidebar(cat.name);
                renderProducts(cat.name);
            });

            li.appendChild(a);
            categorySidebarList.appendChild(li);
        });
    }


    // --- FILTER TRIGGERS --- (Nav & Homepage Cards)
    extraFilterTriggers.forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            if (!trigger.dataset.category) return;

            e.preventDefault();
            const category = trigger.dataset.category;
            activeCategoryState = category;

            renderSidebar(category);
            renderProducts(category);

            // Scroll to product grid if on homepage
            const gridEl = document.getElementById('productGrid');
            if (gridEl) {
                gridEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // --- SLIDER LOGIC ---
    const sliderWrapper = document.getElementById('sliderWrapper');
    const sliderDots = document.getElementById('sliderDots');
    let sliderInterval;

    function initSlider() {
        if (!sliderWrapper) return;

        let images = JSON.parse(localStorage.getItem('sliderImages')) || [];
        if (images.length === 0) {
            images = [
                'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=80',
                'https://images.unsplash.com/photo-1456735190827-d1261f7add50?auto=format&fit=crop&w=1200&q=80',
                'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1200&q=80'
            ];
        }

        sliderWrapper.innerHTML = '';
        if (sliderDots) sliderDots.innerHTML = '';

        images.forEach((img, index) => {
            // Slide
            const slide = document.createElement('div');
            slide.className = 'slide';
            slide.innerHTML = `<img src="${img}" alt="Slide ${index + 1}">`;
            sliderWrapper.appendChild(slide);

            // Dot
            if (sliderDots) {
                const dot = document.createElement('div');
                dot.className = `slider-dot ${index === 0 ? 'active' : ''}`;
                dot.addEventListener('click', () => goToSlide(index));
                sliderDots.appendChild(dot);
            }
        });

        // Controls
        const prevBtn = document.querySelector('.slider-prev');
        const nextBtn = document.querySelector('.slider-next');

        if (prevBtn) prevBtn.replaceWith(prevBtn.cloneNode(true)); // remove old listeners
        if (nextBtn) nextBtn.replaceWith(nextBtn.cloneNode(true));

        const newPrev = document.querySelector('.slider-prev');
        const newNext = document.querySelector('.slider-next');

        if (newPrev) newPrev.addEventListener('click', () => nextSlide(-1));
        if (newNext) newNext.addEventListener('click', () => nextSlide(1));

        startAutoSlide();
    }

    let currentSlide = 0;

    function goToSlide(index) {
        const slides = document.querySelectorAll('.slide');
        const dots = document.querySelectorAll('.slider-dot');
        if (slides.length === 0) return;

        if (index >= slides.length) currentSlide = 0;
        else if (index < 0) currentSlide = slides.length - 1;
        else currentSlide = index;

        if (sliderWrapper) sliderWrapper.style.transform = `translateX(-${currentSlide * 100}%)`;

        dots.forEach(d => d.classList.remove('active'));
        if (dots[currentSlide]) dots[currentSlide].classList.add('active');

        resetAutoSlide();
    }

    function nextSlide(direction = 1) {
        goToSlide(currentSlide + direction);
    }

    function startAutoSlide() {
        if (sliderInterval) clearInterval(sliderInterval);
        sliderInterval = setInterval(() => nextSlide(1), 5000);
    }

    function resetAutoSlide() {
        clearInterval(sliderInterval);
        startAutoSlide();
    }

    // --- CAROUSEL LOGIC ---
    function initCarousel() {
        const carousel = document.getElementById('productCarousel');
        if (!carousel) return;

        const products = JSON.parse(localStorage.getItem('products')) || [];

        // Filter by Showcase, fallback to first 10 if none elected
        let showcaseProducts = products.filter(p => p.isShowcase);
        if (showcaseProducts.length === 0) {
            showcaseProducts = products.slice(0, 10);
        }

        carousel.innerHTML = '';
        showcaseProducts.forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card'; // Or 'carousel-item' depending on your CSS

            card.innerHTML = `
                <div class="product-img-wrapper">
                    <img src="${product.image}" alt="${product.name}" onerror="this.src='https://placehold.co/600x600/f1f2f6/2d3436?text=Resim+Yok'">
                    <div class="product-actions">
                        <div class="action-btn" title="İncele"><i class="fa-solid fa-eye"></i></div>
                    </div>
                </div>
                <div class="product-info">
                    <div class="product-cat">${product.category}</div>
                    <h3 class="product-name">${product.name}</h3>
                    <div class="product-price">${formatCurrency(product.price)}</div>
                </div>
            `;
            carousel.appendChild(card);
        });
        // You might need to initialize a carousel library here (e.g., Swiper, Owl Carousel)
        // For example: new Swiper('#productCarousel', { /* options */ });
    }

    // --- RENDER PRODUCTS ---
    function renderProducts(categoryName, searchQuery = '') {
        if (!grid) return;
        grid.innerHTML = '';

        let currentProducts = JSON.parse(localStorage.getItem('products')) || [];

        // Apply Search Filter First
        if (searchQuery) {
            currentProducts = currentProducts.filter(p =>
                p.name.toLowerCase().includes(searchQuery) ||
                p.category.toLowerCase().includes(searchQuery)
            );
        }

        // Logic for "categoryName":
        // Refined: If 'all', show all.
        // If Parent selected, show all items belonging to it + its children.
        // If Child selected, show items matching exactly.

        const filtered = categoryName === 'all'
            ? currentProducts
            : currentProducts.filter(p => {
                // 1. Direct Match
                if (p.category === categoryName) return true;

                // 2. Parent Context Match
                const contextCat = allCategories.find(c => c.name === categoryName);
                if (contextCat) {
                    // If this context category is a PARENT, we should include its CHILDREN products too
                    // Find children IDs
                    const childrenIds = allCategories.filter(c => c.parentId === contextCat.id).map(c => c.name);
                    if (childrenIds.includes(p.category)) return true;
                }

                return false;
            });

        if (resultCount) resultCount.innerText = `${filtered.length} ürün listelendi`;

        if (filtered.length === 0) {
            grid.innerHTML = '<p style="color: var(--text-light); grid-column: 1/-1; text-align: center; font-size: 1.2rem; padding: 2rem;">Ürün bulunamadı.</p>';
            return;
        }

        filtered.forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card';

            card.innerHTML = `
                <div class="product-img-wrapper">
                    <img src="${product.image}" alt="${product.name}" onerror="this.src='https://placehold.co/600x600/f1f2f6/2d3436?text=Resim+Yok'">
                    <div class="product-actions">
                        <div class="action-btn" title="İncele"><i class="fa-solid fa-eye"></i></div>
                    </div>
                </div>
                <div class="product-info">
                    <div class="product-cat">${product.category}</div>
                    <h3 class="product-name">${product.name}</h3>
                    <div class="product-price">${formatCurrency(product.price)}</div>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    // --- UTILS ---
    function formatCurrency(amount) {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
    }
});
