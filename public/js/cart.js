// js/cart.js
document.addEventListener('DOMContentLoaded', () => {
    const summaryItems = document.getElementById('summary-items');
    const summarySubtotal = document.getElementById('summary-subtotal');
    const summaryDiscount = document.getElementById('summary-discount');
    const summaryTax = document.getElementById('summary-tax');
    const summaryTotal = document.getElementById('summary-total');

    async function loadCart() {
        try {
            const response = await fetch('http://localhost:3000/api/cart', {
                credentials: 'include'
            });
            const result = await response.json();
            if (result.success) {
                if (result.data.length === 0) {
                    summaryItems.innerHTML = '<p>Your cart is empty.</p>';
                    updateTotals(0, 0, 0);
                    return;
                }
                // Fetch game details for cart items
                const gamePromises = result.data.map(item => 
                    fetch(`http://localhost:3000/api/games/${item.gameId}`).then(res => res.json())
                );
                const gameResults = await Promise.all(gamePromises);
                const games = gameResults.map(res => res.data);

                summaryItems.innerHTML = result.data.map((item, index) => {
                    const game = games[index];
                    return `
                        <div class="cart-item">
                            <h3>${game.title}</h3>
                            <p>$${game.price} x ${item.quantity}</p>
                            <button class="remove-btn" data-game-id="${item.gameId}">Remove</button>
                        </div>
                    `;
                }).join('');

                // Calculate totals
                const subtotal = result.data.reduce((sum, item, index) => 
                    sum + games[index].price * item.quantity, 0);
                const discount = subtotal * 0.1; // 10% discount
                const tax = subtotal * 0.05; // 5% tax
                const total = subtotal - discount + tax;

                updateTotals(subtotal, discount, tax, total);

                // Add remove button listeners
                document.querySelectorAll('.remove-btn').forEach(btn => {
                    btn.addEventListener('click', async () => {
                        const gameId = btn.dataset.gameId;
                        try {
                            const response = await fetch(`http://localhost:3000/api/cart/${gameId}`, {
                                method: 'DELETE',
                                credentials: 'include'
                            });
                            const result = await response.json();
                            if (result.success) {
                                loadCart();
                                updateCartCount();
                            } else {
                                alert(result.message);
                            }
                        } catch (err) {
                            alert('Error removing item');
                        }
                    });
                });
            } else {
                alert(result.message);
            }
        } catch (err) {
            alert('Error loading cart');
        }
    }

    function updateTotals(subtotal, discount, tax, total = subtotal - discount + tax) {
        summarySubtotal.textContent = `$${subtotal.toFixed(2)}`;
        summaryDiscount.textContent = `-$${discount.toFixed(2)}`;
        summaryTax.textContent = `$${tax.toFixed(2)}`;
        summaryTotal.textContent = `$${total.toFixed(2)}`;
    }

    async function updateCartCount() {
        try {
            const response = await fetch('http://localhost:3000/api/cart', {
                credentials: 'include'
            });
            const result = await response.json();
            if (result.success) {
                const count = result.data.reduce((sum, item) => sum + item.quantity, 0);
                document.querySelector('.cart-count').textContent = count;
            }
        } catch (err) {
            console.error('Error updating cart count');
        }
    }

    loadCart();
});