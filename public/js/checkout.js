// js/checkout.js
document.addEventListener('DOMContentLoaded', () => {
    const shippingStep = document.getElementById('shipping-step');
    const paymentStep = document.getElementById('payment-step');
    const confirmationStep = document.getElementById('confirmation-step');
    const shippingNext = document.getElementById('shipping-next');
    const paymentBack = document.getElementById('payment-back');
    const paymentNext = document.getElementById('payment-next');
    const steps = document.querySelectorAll('.checkout-step');
    const stepIndicators = document.querySelectorAll('.checkout-steps .step');
    const summaryItems = document.getElementById('summary-items');
    const summarySubtotal = document.getElementById('summary-subtotal');
    const summaryDiscount = document.getElementById('summary-discount');
    const summaryTax = document.getElementById('summary-tax');
    const summaryTotal = document.getElementById('summary-total');

    let cartData = [];

    async function loadCartSummary() {
        try {
            const response = await fetch('http://localhost:3000/api/cart', {
                credentials: 'include'
            });
            const result = await response.json();
            if (result.success) {
                cartData = result.data;
                if (cartData.length === 0) {
                    summaryItems.innerHTML = '<p>Your cart is empty.</p>';
                    updateTotals(0, 0, 0);
                    return;
                }
                const gamePromises = cartData.map(item => 
                    fetch(`http://localhost:3000/api/games/${item.gameId}`).then(res => res.json())
                );
                const gameResults = await Promise.all(gamePromises);
                const games = gameResults.map(res => res.data);

                // Update cartData with price
                cartData = cartData.map((item, index) => ({
                    gameId: item.gameId,
                    quantity: item.quantity,
                    price: games[index].price
                }));

                summaryItems.innerHTML = cartData.map((item, index) => {
                    const game = games[index];
                    return `
                        <div class="cart-item">
                            <h3>${game.title}</h3>
                            <p>$${game.price} x ${item.quantity}</p>
                        </div>
                    `;
                }).join('');

                const subtotal = cartData.reduce((sum, item) => 
                    sum + item.price * item.quantity, 0);
                const discount = subtotal * 0.1; // 10% discount
                const tax = subtotal * 0.05; // 5% tax
                const total = subtotal - discount + tax;

                updateTotals(subtotal, discount, tax, total);
            } else {
                console.error('Cart fetch failed:', result);
                alert(`Failed to load cart: ${result.message || 'Unknown error'}`);
            }
        } catch (err) {
            console.error('Error loading cart summary:', err);
            alert(`Error loading cart summary: ${err.message || 'Network or server error'}`);
        }
    }

    function updateTotals(subtotal, discount, tax, total = subtotal - discount + tax) {
        summarySubtotal.textContent = `$${subtotal.toFixed(2)}`;
        summaryDiscount.textContent = `-$${discount.toFixed(2)}`;
        summaryTax.textContent = `$${tax.toFixed(2)}`;
        summaryTotal.textContent = `$${total.toFixed(2)}`;
    }

    function switchStep(activeStep) {
        steps.forEach(step => step.classList.remove('active'));
        stepIndicators.forEach(indicator => indicator.classList.remove('active'));
        document.getElementById(`${activeStep}-step`).classList.add('active');
        document.querySelector(`.step[data-step="${activeStep === 'shipping' ? 1 : activeStep === 'payment' ? 2 : 3}"]`).classList.add('active');
    }

    shippingNext.addEventListener('click', () => {
        const form = document.getElementById('checkout-form');
        if (form.checkValidity()) {
            switchStep('payment');
        } else {
            form.reportValidity();
        }
    });

    paymentBack.addEventListener('click', () => {
        switchStep('shipping');
    });

    paymentNext.addEventListener('click', async () => {
        const paymentMethod = document.querySelector('input[name="payment_method"]:checked').value;
        const subtotal = cartData.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const total = subtotal - (subtotal * 0.1) + (subtotal * 0.05);

        // Validate payment details
        const form = document.getElementById('checkout-form');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: cartData.map(item => ({
                        gameId: item.gameId,
                        quantity: item.quantity,
                        price: item.price
                    })),
                    total_amount: total,
                    payment_method: paymentMethod
                }),
                credentials: 'include'
            });
            const result = await response.json();
            if (result.success) {
                switchStep('confirmation');
                document.getElementById('order-number').textContent = result.data.orderId;
                document.getElementById('order-date').textContent = new Date().toLocaleDateString();
                document.getElementById('order-total').textContent = `$${total.toFixed(2)}`;
                document.getElementById('payment-method').textContent = paymentMethod;
                document.getElementById('customer-email').textContent = document.getElementById('email').value;

                // Clear cart
                await fetch('http://localhost:3000/api/cart', {
                    method: 'DELETE',
                    credentials: 'include'
                });
                updateCartCount();
            } else {
                console.error('Order placement failed:', result);
                alert(`Failed to place order: ${result.message || 'Unknown error'}`);
            }
        } catch (err) {
            console.error('Error placing order:', err);
            alert(`Error placing order: ${err.message || 'Network or server error'}`);
        }
    });

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

    // Payment method toggle
    document.querySelectorAll('.payment-option').forEach(option => {
        option.addEventListener('click', () => {
            document.querySelectorAll('.payment-option').forEach(opt => opt.classList.remove('active'));
            document.querySelectorAll('.payment-details').forEach(detail => detail.classList.remove('active'));
            option.classList.add('active');
            document.getElementById(`${option.dataset.method}-details`).classList.add('active');
            option.querySelector('input').checked = true;
        });
    });

    loadCartSummary();
});