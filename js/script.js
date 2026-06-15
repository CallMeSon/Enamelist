document.addEventListener('DOMContentLoaded', () => {
    // Theme Toggle Logic
    const themeToggleDarkIcon = document.getElementById('theme-toggle-dark-icon');
    const themeToggleLightIcon = document.getElementById('theme-toggle-light-icon');
    const themeToggleBtn = document.getElementById('theme-toggle');

    function setThemeA11y(isDark) {
        if (!themeToggleBtn) return;
        themeToggleBtn.setAttribute('aria-pressed', String(isDark));
        themeToggleBtn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    }

    // Change the icons inside the button based on previous settings
    if (localStorage.getItem('color-theme') === 'dark' || (!('color-theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
        themeToggleLightIcon.classList.remove('hidden');
        setThemeA11y(true);
    } else {
        document.documentElement.classList.remove('dark');
        themeToggleDarkIcon.classList.remove('hidden');
        setThemeA11y(false);
    }

    themeToggleBtn.addEventListener('click', function() {
        // toggle icons inside button
        themeToggleDarkIcon.classList.toggle('hidden');
        themeToggleLightIcon.classList.toggle('hidden');

        // if set via local storage previously
        if (localStorage.getItem('color-theme')) {
            if (localStorage.getItem('color-theme') === 'light') {
                document.documentElement.classList.add('dark');
                localStorage.setItem('color-theme', 'dark');
                setThemeA11y(true);
            } else {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('color-theme', 'light');
                setThemeA11y(false);
            }

        // if NOT set via local storage previously
        } else {
            if (document.documentElement.classList.contains('dark')) {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('color-theme', 'light');
                setThemeA11y(false);
            } else {
                document.documentElement.classList.add('dark');
                localStorage.setItem('color-theme', 'dark');
                setThemeA11y(true);
            }
        }
    });

    const productContainer = document.getElementById('product-container');

    let allProducts = [];

    // Function to fetch products from JSON
    async function fetchProducts() {
        try {
            const response = await fetch('data/products.json');
            if (!response.ok) {
                throw new Error('Failed to fetch products');
            }
            allProducts = await response.json();
            renderProducts(allProducts);
            setupFilters();
        } catch (error) {
            console.error('Error loading products:', error);
            productContainer.innerHTML = '<p class="text-center text-red-500 col-span-full">Gagal memuat katalog produk. Silakan coba lagi nanti.</p>';
        }
    }

    // Function to render product cards
    function renderProducts(products) {
        if (products.length === 0) {
            productContainer.innerHTML = '<p class="text-center text-gray-500 col-span-full py-10">Tidak ada produk dalam kategori ini.</p>';
            return;
        }

        const productsHTML = products.map(product => {
            return `
                <div class="product-card cursor-pointer bg-white dark:bg-dark-card rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-pastel-blue/20 dark:border-white/10 group flex flex-col h-full" data-id="${product.id}">
                    <div class="relative overflow-hidden aspect-square">
                        <img src="${product.image_url}" alt="${product.name}" loading="lazy" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
                        <span class="absolute top-3 left-3 bg-white/90 dark:bg-dark-bg/90 backdrop-blur-sm text-pastel-pink font-bold px-3 py-1 rounded-full text-xs uppercase tracking-wider shadow-sm">
                            ${product.type}
                        </span>
                    </div>
                    <div class="p-5 flex flex-col flex-grow">
                        <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-2">${product.name}</h3>
                        <p class="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2 flex-grow">${product.description}</p>
                        <div class="mt-auto pt-2">
                            <div class="flex flex-col gap-3">
                                <span class="text-xl font-black text-pastel-pink">${product.price}</span>
                                <a href="https://forms.google.com/your-form-link" target="_blank" rel="noopener noreferrer" class="block w-full text-center bg-pastel-blue hover:bg-pastel-blue-dark text-white font-bold py-2 rounded-xl transition-colors duration-300 shadow-md">
                                    Pesan Sekarang
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        productContainer.innerHTML = productsHTML;
    }

    // Function to setup filter button logic
    function setupFilters() {
        const filterButtons = document.querySelectorAll('.filter-btn');
        
        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Update active state
                filterButtons.forEach(b => {
                    b.classList.remove('bg-pastel-pink', 'text-white', 'shadow-md');
                    b.classList.add('bg-white', 'dark:bg-dark-card', 'text-gray-600', 'dark:text-gray-400');
                });
                btn.classList.add('bg-pastel-pink', 'text-white', 'shadow-md');
                btn.classList.remove('bg-white', 'dark:bg-dark-card', 'text-gray-600', 'dark:text-gray-400');

                const category = btn.getAttribute('data-category');
                
                if (category === 'all') {
                    renderProducts(allProducts);
                } else {
                    const filtered = allProducts.filter(p => p.type.toLowerCase() === category.toLowerCase());
                    renderProducts(filtered);
                }
            });
        });
    }

    // Modal Logic for Product Detail
    const productDetailModal = document.getElementById('product-detail-modal');
    const productDetailModalContent = document.getElementById('product-modal-content');
    const closeProductDetailModalButtons = document.querySelectorAll('#close-product-modal-btn, #product-modal-backdrop');

    const modalImage = document.getElementById('modal-product-image');
    const modalType = document.getElementById('modal-product-type');
    const modalName = document.getElementById('modal-product-name');
    const modalDescription = document.getElementById('modal-product-description');
    const modalPrice = document.getElementById('modal-product-price');

    function openProductDetailModal(product) {
        if (!productDetailModal || !productDetailModalContent) return;

        modalImage.src = product.image_url;
        modalImage.alt = product.name;
        modalType.textContent = product.type;
        modalName.textContent = product.name;
        modalDescription.textContent = product.description;
        modalPrice.textContent = product.price;

        productDetailModal.classList.remove('hidden');
        productDetailModal.classList.add('flex');
        setTimeout(() => {
            productDetailModalContent.classList.remove('scale-95', 'opacity-0');
            productDetailModalContent.classList.add('scale-100', 'opacity-100');
        }, 10);
    }

    function closeProductDetailModal() {
        if (!productDetailModal || !productDetailModalContent) return;
        productDetailModalContent.classList.remove('scale-100', 'opacity-100');
        productDetailModalContent.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            productDetailModal.classList.remove('flex');
            productDetailModal.classList.add('hidden');
        }, 300);
    }

    closeProductDetailModalButtons.forEach(btn => {
        btn.addEventListener('click', closeProductDetailModal);
    });

    // Handle clicking a product card (excluding links inside the card)
    if (productContainer) {
        productContainer.addEventListener('click', (e) => {
            const orderBtn = e.target.closest('a');
            if (orderBtn) return; // Let the anchor handler handle it

            const card = e.target.closest('.product-card');
            if (card) {
                const productId = parseInt(card.getAttribute('data-id'), 10);
                const product = allProducts.find(p => p.id === productId);
                if (product) {
                    openProductDetailModal(product);
                }
            }
        });
    }

    // Modal Logic for Unconfigured/Empty Links
    const formModal = document.getElementById('form-unavailable-modal');
    const formModalContent = document.getElementById('modal-content');
    const closeFormModalButtons = document.querySelectorAll('#close-modal-btn, #close-modal-btn-secondary, #modal-backdrop');

    function openFormModal() {
        if (!formModal || !formModalContent) return;
        formModal.classList.remove('hidden');
        formModal.classList.add('flex');
        setTimeout(() => {
            formModalContent.classList.remove('scale-95', 'opacity-0');
            formModalContent.classList.add('scale-100', 'opacity-100');
        }, 10);
    }

    function closeFormModal() {
        if (!formModal || !formModalContent) return;
        formModalContent.classList.remove('scale-100', 'opacity-100');
        formModalContent.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            formModal.classList.remove('flex');
            formModal.classList.add('hidden');
        }, 300);
    }

    closeFormModalButtons.forEach(btn => {
        btn.addEventListener('click', closeFormModal);
    });

    // Intercept clicks on form links
    document.addEventListener('click', (e) => {
        const anchor = e.target.closest('a');
        if (anchor) {
            const href = anchor.getAttribute('href');
            if (href && href.includes('your-form-link')) {
                e.preventDefault();
                openFormModal();
            }
        }
    });

    // Scroll-Reveal: Observe .reveal elements and animate when they enter viewport
    function initRevealObserver() {
        const revealEls = document.querySelectorAll('.reveal:not(.is-visible)');
        if (!revealEls.length) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, i) => {
                if (entry.isIntersecting) {
                    // Stagger each element by 80ms
                    setTimeout(() => {
                        entry.target.classList.add('is-visible');
                    }, i * 80);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12 });

        revealEls.forEach(el => observer.observe(el));
    }

    // Re-run observer after products render (to catch dynamically injected cards)
    const _originalRenderProducts = renderProducts;
    function renderProductsWithReveal(products) {
        _originalRenderProducts(products);
        // Allow DOM to update before observing
        requestAnimationFrame(() => initRevealObserver());
    }

    // Initialize fetch
    fetchProducts();

    // Initial observer pass for static elements
    initRevealObserver();
});