document.addEventListener('DOMContentLoaded', () => {
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
        productContainer.innerHTML = '';
        
        if (products.length === 0) {
            productContainer.innerHTML = '<p class="text-center text-gray-500 col-span-full py-10">Tidak ada produk dalam kategori ini.</p>';
            return;
        }

        products.forEach(product => {
            const productCard = `
                <div class="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 border border-pastel-blue/20 group flex flex-col h-full">
                    <div class="relative overflow-hidden aspect-square">
                        <img src="${product.image_url}" alt="${product.name}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
                        <span class="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-pastel-pink font-bold px-3 py-1 rounded-full text-xs uppercase tracking-wider shadow-sm">
                            ${product.type}
                        </span>
                    </div>
                    <div class="p-5 flex flex-col flex-grow">
                        <h3 class="text-xl font-bold text-gray-800 mb-2">${product.name}</h3>
                        <p class="text-gray-600 text-sm mb-4 line-clamp-2 flex-grow">${product.description}</p>
                        <div class="mt-auto pt-2">
                            <div class="flex flex-col gap-3">
                                <span class="text-xl font-black text-pastel-pink">${product.price}</span>
                                <a href="https://forms.google.com/your-form-link" target="_blank" class="block w-full text-center bg-pastel-blue hover:bg-pastel-blue-dark text-white font-bold py-2 rounded-xl transition-colors duration-300 shadow-md">
                                    Pesan Sekarang
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            productContainer.innerHTML += productCard;
        });
    }

    // Function to setup filter button logic
    function setupFilters() {
        const filterButtons = document.querySelectorAll('.filter-btn');
        
        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Update active state
                filterButtons.forEach(b => {
                    b.classList.remove('bg-pastel-pink', 'text-white', 'shadow-md');
                    b.classList.add('bg-white', 'text-gray-600');
                });
                btn.classList.add('bg-pastel-pink', 'text-white', 'shadow-md');
                btn.classList.remove('bg-white', 'text-gray-600');

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

    // Initialize fetch
    fetchProducts();
});
