document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('productGrid');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const extraFilterTriggers = document.querySelectorAll('.filter-trigger');

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

    // Ensure Categories are loaded for filtering logic
    const allCategories = JSON.parse(localStorage.getItem('categories')) || [];

    // Initial Render
    renderProducts('all');

    // Filter Logic for Tab Buttons
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            activateFilter(btn.dataset.category);
        });
    });

    // Filter Logic for Nav Links & Category Cards
    extraFilterTriggers.forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            // If it's the logo or valid internal link, allow default behavior unless it's a filter action
            if (!trigger.dataset.category) return;

            e.preventDefault();
            const category = trigger.dataset.category;
            activateFilter(category);

            // Scroll to product grid if on homepage
            const gridEl = document.getElementById('productGrid');
            if (gridEl) {
                gridEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                // If on details page, go home
                window.location.href = `index.html#productGrid`;
            }
        });
    });

    function activateFilter(category) {
        // Update Buttons UI
        filterBtns.forEach(b => {
            if (b.dataset.category === category) b.classList.add('active');
            else b.classList.remove('active');
        });

        renderProducts(category);
    }

    function renderProducts(categoryName) {
        if (!grid) return; // Guard clause if grid missing
        grid.innerHTML = '';

        let currentProducts = JSON.parse(localStorage.getItem('products')) || [];

        const filtered = categoryName === 'all'
            ? currentProducts
            : currentProducts.filter(p => {
                // 1. Direct Match (e.g. Product is 'Kalem', Filter is 'Kalem')
                if (p.category === categoryName) return true;

                // 2. Subcategory Match (e.g. Product is 'Dolma Kalem', Filter is 'Kalem' [Parent])
                // Find if 'categoryName' is a parent
                const parentCat = allCategories.find(c => c.name === categoryName);
                if (parentCat) {
                    // Find children names
                    const subCatNames = allCategories
                        .filter(c => c.parentId === parentCat.id)
                        .map(c => c.name);

                    // Check if product's category is one of the children
                    if (subCatNames.includes(p.category)) return true;
                }
                return false;
            });

        if (filtered.length === 0) {
            grid.innerHTML = '<p style="color: var(--text-secondary); grid-column: 1/-1; text-align: center; font-size: 1.2rem; padding: 2rem;">Bu kategoride henüz ürün bulunmuyor.</p>';
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

    function formatCurrency(amount) {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
    }
});
