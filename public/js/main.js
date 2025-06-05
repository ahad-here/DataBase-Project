document.addEventListener('DOMContentLoaded', () => {
    console.log('main.js loaded');

    const hamburger = document.getElementById('hamburger');
    const navLinks = document.querySelector('.nav-links');
    const cartCount = document.querySelector('.cart-count');
    const gamesGrid = document.getElementById('games-grid');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            console.log('Hamburger clicked, navLinks active:', navLinks.classList.contains('active'));
        });
    } else {
        console.error('Hamburger or nav-links not found');
    }

    async function updateCartCount() {
        try {
            const response = await fetch('http://localhost:3000/api/cart', {
                credentials: 'include'
            });
            const result = await response.json();
            console.log('Cart API response:', result);
            if (result.success && Array.isArray(result.data)) {
                const count = result.data.reduce((sum, item) => sum + item.quantity, 0);
                cartCount.textContent = count;
            } else {
                cartCount.textContent = '0';
            }
        } catch (err) {
            console.error('Error fetching cart:', err);
            cartCount.textContent = '0';
        }
    }

    if (document.getElementById('game-carousel')) {
        loadLatestReleases();
    }

    async function loadLatestReleases() {
        try {
            console.log('Fetching latest releases...');
            const response = await fetch('http://localhost:3000/api/games?sort=newest&limit=5');
            const result = await response.json();
            console.log('Latest releases API response:', result);
            if (result.success) {
                const carousel = document.getElementById('game-carousel');
                carousel.innerHTML = result.data.map(game => `
                    <div class="game-card">
                        <h3>${game.title}</h3>
                        <p>${game.description ? game.description.substring(0, 100) + '...' : 'No description'}</p>
                        <p>$${typeof game.price === 'number' ? game.price.toFixed(2) : parseFloat(game.price).toFixed(2) || 'N/A'}</p>
                        <a href="game-details.html?id=${game.game_id}">View Details</a>
                        <button class="add-to-cart-btn" data-id="${game.game_id}">Add to Cart</button>
                    </div>
                `).join('');
                attachCartListeners();
            }
        } catch (err) {
            console.error('Error loading latest releases:', err);
        }
    }

    if (document.getElementById('category-grid')) {
        loadCategories();
    }

    async function loadCategories() {
        try {
            console.log('Fetching categories...');
            const response = await fetch('http://localhost:3000/api/games');
            const result = await response.json();
            console.log('Categories API response:', result);
            if (result.success) {
                const genres = [...new Set(result.data.map(game => game.genre).filter(Boolean))];
                const categoryGrid = document.getElementById('category-grid');
                categoryGrid.innerHTML = genres.map(genre => `
                    <div class="category-card">
                        <h3>${genre}</h3>
                        <a href="games.html?genre=${genre}">Explore</a>
                    </div>
                `).join('');
            }
        } catch (err) {
            console.error('Error loading categories:', err);
        }
    }

    if (document.getElementById('platform-grid')) {
        loadPlatforms();
    }

    async function loadPlatforms() {
        try {
            console.log('Fetching platforms...');
            const response = await fetch('http://localhost:3000/api/games');
            const result = await response.json();
            console.log('Platforms API response:', result);
            if (result.success) {
                const platforms = [...new Set(result.data.flatMap(game => game.platform ? game.platform.split(',') : []).filter(Boolean))];
                const platformGrid = document.getElementById('platform-grid');
                platformGrid.innerHTML = platforms.map(platform => `
                    <div class="platform-card">
                        <h3>${platform}</h3>
                        <a href="games.html?platform=${platform}">Explore</a>
                    </div>
                `).join('');
            }
        } catch (err) {
            console.error('Error loading platforms:', err);
        }
    }

    if (gamesGrid) {
        loadGames();
        setupGameFilters();
    } else {
        console.error('Games grid not found');
    }

    async function loadGames(params = {}) {
        const url = new URL('http://localhost:3000/api/games');
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
        try {
            console.log('Fetching games with params:', params);
            const response = await fetch(url, { credentials: 'include' });
            const result = await response.json();
            console.log('Games API response:', result);
            if (result.success && Array.isArray(result.data)) {
                gamesGrid.innerHTML = result.data.map(game => `
                    <div class="game-card">
                        <h3>${game.title}</h3>
                        <p>${game.description ? game.description.substring(0, 100) + '...' : 'No description'}</p>
                        <p>$${typeof game.price === 'number' ? game.price.toFixed(2) : parseFloat(game.price).toFixed(2) || 'N/A'}</p>
                        <a href="game-details.html?id=${game.game_id}">View Details</a>
                        <button class="add-to-cart-btn" data-id="${game.game_id}">Add to Cart</button>
                    </div>
                `).join('');
                attachCartListeners();
            } else {
                gamesGrid.innerHTML = '<p>No games found</p>';
            }
        } catch (err) {
            console.error('Error loading games:', err);
            gamesGrid.innerHTML = '<p>Error loading games</p>';
        }
    }

    function attachCartListeners() {
        const cartButtons = document.querySelectorAll('.add-to-cart-btn');
        console.log('Cart buttons found:', cartButtons.length);
        cartButtons.forEach(btn => {
            btn.addEventListener('click', async () => {
                const gameId = btn.getAttribute('data-id');
                console.log(`Add to cart clicked for game ID: ${gameId}`);
                try {
                    const response = await fetch('http://localhost:3000/api/cart', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ gameId: parseInt(gameId), quantity: 1 }),
                        credentials: 'include'
                    });
                    const result = await response.json();
                    console.log('Add to cart response:', result);
                    if (response.ok && result.success) {
                        updateCartCount();
                        alert('Added to cart');
                    } else {
                        alert('Failed to add to cart: ' + (result.message || 'Unknown error'));
                    }
                } catch (err) {
                    console.error('Error adding to cart:', err);
                    alert('Error adding to cart: ' + err.message);
                }
            });
        });
    }

    function setupGameFilters() {
        const searchInput = document.getElementById('search-input');
        const genreFilter = document.getElementById('genre-filter');
        const platformFilter = document.getElementById('platform-filter');
        const sortBy = document.getElementById('sort-by');

        if (searchInput) {
            searchInput.addEventListener('input', () => {
                loadGames({ q: searchInput.value });
                console.log('Search input:', searchInput.value);
            });
        }
        if (genreFilter) {
            genreFilter.addEventListener('change', () => {
                loadGames({ genre: genreFilter.value });
                console.log('Genre filter:', genreFilter.value);
            });
        }
        if (platformFilter) {
            platformFilter.addEventListener('change', () => {
                loadGames({ platform: platformFilter.value });
                console.log('Platform filter:', platformFilter.value);
            });
        }
        if (sortBy) {
            sortBy.addEventListener('change', () => {
                loadGames({ sort: sortBy.value });
                console.log('Sort by:', sortBy.value);
            });
        } else {
            console.warn('One or more filter elements not found');
        }
    }

    if (document.getElementById('game-title')) {
        loadGameDetails();
    }

    async function loadGameDetails() {
        console.log('Current URL:', window.location.href);
        console.log('Search params:', window.location.search);
        const urlParams = new URLSearchParams(window.location.search);
        const gameId = urlParams.get('id');
        console.log('Parsed game ID:', gameId);
        if (!gameId || isNaN(parseInt(gameId)) || parseInt(gameId) <= 0) {
            console.error('Invalid or missing game ID:', gameId);
            document.getElementById('game-title').textContent = 'Error: Invalid game ID';
            return;
        }
        // Reset DOM elements
        document.getElementById('game-title').textContent = 'Loading...';
        document.getElementById('game-description').textContent = '';
        document.getElementById('game-price').textContent = '';
        document.getElementById('game-platforms').textContent = '';
        document.getElementById('game-rating').textContent = '';
        document.getElementById('game-release').textContent = '';
        document.getElementById('game-developer').textContent = '';
        // Log media carousel content
        const mediaCarousel = document.getElementById('media-carousel');
        if (mediaCarousel) {
            console.log('Media carousel HTML:', mediaCarousel.innerHTML);
        } else {
            console.log('Media carousel not found');
        }
        try {
            const fetchUrl = `http://localhost:3000/api/games/${gameId}?t=${Date.now()}`;
            console.log('Fetching game details from:', fetchUrl);
            const response = await fetch(fetchUrl, { 
                credentials: 'include',
                cache: 'no-store' 
            });
            if (!response.ok) {
                console.error('Fetch failed with status:', response.status, response.statusText);
                throw new Error(`HTTP error ${response.status}`);
            }
            const result = await response.json();
            console.log('Game details API response:', result);
            if (result.success && result.data) {
                const game = result.data;
                console.log('Updating DOM with game:', game);
                document.getElementById('game-title').textContent = game.title || 'Untitled';
                document.getElementById('game-description').textContent = game.description || 'No description';
                // Handle price as number or string
                const price = parseFloat(game.price);
                document.getElementById('game-price').textContent = !isNaN(price) ? `$${price.toFixed(2)}` : 'N/A';
                document.getElementById('game-platforms').textContent = game.platform || 'N/A';
                document.getElementById('game-rating').textContent = game.rating || 'N/A';
                document.getElementById('game-release').textContent = game.release_date || 'N/A';
                document.getElementById('game-developer').textContent = game.developer || 'N/A';
                const addToCartBtn = document.getElementById('add-to-cart-btn');
                if (addToCartBtn) {
                    console.log('Add to cart button found');
                    const newBtn = addToCartBtn.cloneNode(true);
                    addToCartBtn.parentNode.replaceChild(newBtn, addToCartBtn);
                    newBtn.addEventListener('click', async () => {
                        console.log('Add to cart clicked in game details for ID:', gameId);
                        try {
                            const response = await fetch('http://localhost:3000/api/cart', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ gameId: parseInt(gameId), quantity: 1 }),
                                credentials: 'include'
                            });
                            const result = await response.json();
                            console.log('Add to cart response:', result);
                            if (result.success) {
                                updateCartCount();
                                alert('Added to cart');
                            } else {
                                alert('Failed to add to cart: ' + (result.message || 'Unknown error'));
                            }
                        } catch (err) {
                            console.error('Error adding to cart:', err);
                            alert('Error adding to cart: ' + err.message);
                        }
                    });
                } else {
                    console.error('Add to cart button not found');
                }
            } else {
                console.error('No game data returned:', result);
                document.getElementById('game-title').textContent = 'Game not found';
            }
        } catch (err) {
            console.error('Error loading game details:', err);
            document.getElementById('game-title').textContent = 'Error loading game';
        }
    }

    updateCartCount();
});