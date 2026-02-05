document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('productGrid');
    const filterBtns = document.querySelectorAll('.filter-btn');
    // Select all elements that should trigger a filter (Nav links, Category cards)
    const extraFilterTriggers = document.querySelectorAll('.filter-trigger');

    // Default Mock Data
    const MOCK_DATA = [
        { id: 1, name: 'Premium Deri Defter', price: 250, category: 'Defter', image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80' },
        { id: 2, name: 'Altın Kaplama Dolma Kalem', price: 1200, category: 'Kalem', image: 'https://images.unsplash.com/photo-1585336261022-680e295ce3fe?auto=format&fit=crop&w=800&q=80' },
        { id: 3, name: 'Deri Evrak Çantası', price: 3500, category: 'Çanta', image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80' },
        { id: 4, name: 'Masa Düzenleyici Set', price: 850, category: 'Ofis', image: 'https://images.unsplash.com/photo-1505330622279-bf7d7fc918f4?auto=format&fit=crop&w=800&q=80' },
        { id: 5, name: 'Mat Siyah Kurşun Kalem Seti', price: 120, category: 'Kalem', image: 'https://images.unsplash.com/photo-1595064506822-628d488e364c?auto=format&fit=crop&w=800&q=80' }
    ];

    // Initialize LocalStorage if empty
    if (!localStorage.getItem('products')) {
        localStorage.setItem('products', JSON.stringify(MOCK_DATA));
    }

    let products = JSON.parse(localStorage.getItem('products')) || [];

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
            e.preventDefault();
            const category = trigger.dataset.category;
            activateFilter(category);

            // Scroll to product grid
            document.getElementById('productGrid').scrollIntoView({ behavior: 'smooth', block: 'start' });
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

    function renderProducts(category) {
        grid.innerHTML = '';

        let currentProducts = JSON.parse(localStorage.getItem('products')) || [];

        const filtered = category === 'all'
            ? currentProducts
            : currentProducts.filter(p => p.category === category);

        if (filtered.length === 0) {
            grid.innerHTML = '<p style="color: var(--text-secondary); grid-column: 1/-1; text-align: center; font-size: 1.2rem; padding: 2rem;">Bu kategoride henüz ürün bulunmuyor.</p>';
            return;
        }

        filtered.forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card';

            // New V2 Card Structure (Clean - No Cart/Heart)
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
                    <!-- Removing Price if sales are not intended? User kept Price in 'Review' but said no sales. I'll keep price for reference but no cart. -->
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
