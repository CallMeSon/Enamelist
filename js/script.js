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

    themeToggleBtn.addEventListener('click', function () {
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

        // Sync 3D scene lighting/background theme
        if (typeof setThemeMode === 'function') {
            setThemeMode(document.documentElement.classList.contains('dark'));
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

    const productCardTemplate = document.getElementById('product-card-template');

    // Function to render product cards
    function renderProducts(products) {
        if (!productContainer || !productCardTemplate) return;

        // Clear existing content efficiently
        while (productContainer.firstChild) {
            productContainer.removeChild(productContainer.firstChild);
        }

        if (products.length === 0) {
            const emptyMsg = document.createElement('p');
            emptyMsg.className = 'text-center text-gray-500 col-span-full py-10';
            emptyMsg.textContent = 'Tidak ada produk dalam kategori ini.';
            productContainer.appendChild(emptyMsg);
            return;
        }

        const fragment = document.createDocumentFragment();

        products.forEach((product, index) => {
            // Clone the template
            const clone = productCardTemplate.content.cloneNode(true);
            const card = clone.querySelector('.product-card');

            // Apply title typography consistency
            const nameEl = card.querySelector('.product-name');
            nameEl.classList.add('tracking-tighter');

            // Bind data
            card.setAttribute('data-id', product.id);
            card.setAttribute('aria-label', `Lihat detail ${product.name}`);

            const img = card.querySelector('.product-img');
            img.src = product.image_url;
            img.alt = product.name;

            const typeBadge = card.querySelector('.product-type');
            typeBadge.textContent = product.type;

            const name = card.querySelector('.product-name');
            name.textContent = product.name;

            const desc = card.querySelector('.product-desc');
            desc.textContent = product.description;

            const price = card.querySelector('.product-price');
            price.textContent = product.price;

            fragment.appendChild(clone);
        });

        productContainer.appendChild(fragment);
    }

    // Function to handle product card selection (Click or Keyboard)
    function handleProductSelection(card) {
        const productId = parseInt(card.getAttribute('data-id'), 10);
        const product = allProducts.find(p => p.id === productId);
        if (product) {
            openProductDetailModal(product);
        }
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
            // Focus trap - focus the close button
            document.getElementById('close-product-modal-btn')?.focus();
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
                handleProductSelection(card);
            }
        });

        // Keyboard support for product cards
        productContainer.addEventListener('keydown', (e) => {
            const card = e.target.closest('.product-card');
            if (card && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                handleProductSelection(card);
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

    // 3D Customizer Logic Integration
    // Initialize 3D Viewer if container exists
    if (document.getElementById('canvas-3d-container')) {
        init3DViewer('canvas-3d-container');

        // Debug helper: auto-load sample image if ?test=true is in URL
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('test') === 'true') {
            fetch('assets/images/Product1.png')
                .then(res => res.blob())
                .then(blob => {
                    const file = new File([blob], "Product1.png", { type: "image/png" });
                    handleFileUpload(file);
                })
                .catch(err => console.error('Error loading test image:', err));
        }
    }

    // Drag and Drop / File Upload Handlers
    const dropZone = document.getElementById('drop-zone');
    const imageUpload = document.getElementById('image-upload');
    const fileStatus = document.getElementById('file-status');
    const fileName = document.getElementById('file-name');
    const removeFileBtn = document.getElementById('remove-file-btn');
    const canvasPlaceholder = document.getElementById('canvas-placeholder');
    let uploadedImageBase64 = null;

    function handleFileUpload(file) {
        if (!file || !file.type.startsWith('image/')) {
            alert('Silakan unggah file gambar yang valid!');
            return;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
            uploadedImageBase64 = e.target.result;

            // Show status
            if (fileName) fileName.textContent = file.name;
            if (dropZone) dropZone.classList.add('hidden');
            if (fileStatus) fileStatus.classList.remove('hidden');

            // Trigger 3D render update
            trigger3DRenderUpdate();
        };
        reader.readAsDataURL(file);
    }

    if (dropZone && imageUpload) {
        // Click drop zone opens file dialog
        dropZone.addEventListener('click', () => imageUpload.click());

        // Keyboard support for drop zone
        dropZone.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                imageUpload.click();
            }
        });

        imageUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            handleFileUpload(file);
        });

        // Drag events
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                dropZone.classList.add('dragover');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                dropZone.classList.remove('dragover');
            }, false);
        });

        dropZone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const file = dt.files[0];
            handleFileUpload(file);
        });
    }

    // Remove file handler
    if (removeFileBtn) {
        removeFileBtn.addEventListener('click', () => {
            uploadedImageBase64 = null;
            if (imageUpload) imageUpload.value = '';
            if (fileStatus) fileStatus.classList.add('hidden');
            if (dropZone) dropZone.classList.remove('hidden');

            // Show canvas placeholder and hide loader/canvas
            if (canvasPlaceholder) {
                canvasPlaceholder.classList.remove('opacity-0', 'pointer-events-none', 'hidden');
            }
            if (typeof renderer !== 'undefined' && renderer && renderer.domElement) {
                renderer.domElement.classList.add('hidden');
            }

            // Clear Three.js model
            if (typeof keychainGroup !== 'undefined' && keychainGroup) {
                while (keychainGroup.children.length > 0) {
                    const obj = keychainGroup.children[0];
                    if (obj.geometry) obj.geometry.dispose();
                    if (Array.isArray(obj.material)) {
                        obj.material.forEach(m => m.dispose());
                    } else if (obj.material) {
                        obj.material.dispose();
                    }
                    keychainGroup.remove(obj);
                }
            }
        });
    }

    // Control selectors (Shape, Metal, Thickness)
    const shapeButtons = document.querySelectorAll('.shape-btn');
    const metalButtons = document.querySelectorAll('.metal-btn');
    const thicknessSlider = document.getElementById('thickness-slider');
    const thicknessVal = document.getElementById('thickness-val');
    const reset3dBtn = document.getElementById('reset-3d-btn');

    let selectedShape = 'custom';
    let selectedMetal = 'gold';
    let selectedThickness = 4.0;

    function trigger3DRenderUpdate() {
        if (!uploadedImageBase64) return;
        if (typeof update3DModel === 'function') {
            update3DModel(uploadedImageBase64, selectedShape, selectedThickness, selectedMetal);
        }
    }

    shapeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            shapeButtons.forEach(b => {
                b.classList.remove('active', 'border-pastel-blue/20', 'bg-pastel-blue/10', 'text-pastel-blue');
                b.classList.add('border-gray-200', 'dark:border-white/10', 'bg-white', 'dark:bg-dark-bg', 'text-gray-600', 'dark:text-gray-400');
            });
            btn.classList.add('active', 'border-pastel-blue/20', 'bg-pastel-blue/10', 'text-pastel-blue');
            btn.classList.remove('border-gray-200', 'dark:border-white/10', 'bg-white', 'dark:bg-dark-bg', 'text-gray-600', 'dark:text-gray-400');

            selectedShape = btn.getAttribute('data-shape');
            if (uploadedImageBase64 && typeof updateShape === 'function') {
                updateShape(selectedShape);
            }
        });
    });

    metalButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            metalButtons.forEach(b => {
                b.classList.remove('active', 'border-pastel-pink');
                b.classList.add('border-gray-200', 'dark:border-white/10', 'hover:bg-gray-50', 'dark:hover:bg-gray-800');
            });
            btn.classList.add('active', 'border-pastel-pink');
            btn.classList.remove('border-gray-200', 'dark:border-white/10', 'hover:bg-gray-50', 'dark:hover:bg-gray-800');

            selectedMetal = btn.getAttribute('data-metal');
            if (uploadedImageBase64 && typeof updateMetalColor === 'function') {
                updateMetalColor(selectedMetal);
            }
        });
    });

    if (thicknessSlider && thicknessVal) {
        thicknessSlider.addEventListener('input', (e) => {
            selectedThickness = parseFloat(e.target.value);
            thicknessVal.textContent = selectedThickness.toFixed(1) + ' mm';
            if (uploadedImageBase64 && typeof updateThickness === 'function') {
                updateThickness(selectedThickness);
            }
        });
    }

    if (reset3dBtn) {
        reset3dBtn.addEventListener('click', () => {
            if (typeof reset3DView === 'function') {
                reset3DView();
            }
        });
    }
});