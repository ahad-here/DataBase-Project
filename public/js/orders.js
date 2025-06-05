document.addEventListener('DOMContentLoaded', async () => {
    const ordersTable = document.getElementById('orders-table');
    console.log('orders.js loaded, ordersTable:', ordersTable);

    async function loadOrders() {
        try {
            console.log('Fetching orders from http://localhost:3000/api/orders');
            const response = await fetch('http://localhost:3000/api/orders', {
                method: 'GET',
                credentials: 'include',
                headers: { 'Accept': 'application/json' }
            });

            console.log('Response status:', response.status, response.statusText);
            console.log('Response headers:', [...response.headers.entries()]);

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('You are not logged in. Please log in and try again.');
                }
                const errorText = await response.text();
                console.log('Error response text:', errorText);
                throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
            }

            let result;
            try {
                result = await response.json();
                console.log('Parsed API response:', result);
            } catch (jsonErr) {
                const rawText = await response.text();
                console.error('Failed to parse JSON:', jsonErr, 'Raw response:', rawText);
                throw new Error('Invalid server response: not JSON');
            }

            if (typeof result.success === 'undefined') {
                throw new Error('Invalid response format: missing success field');
            }

            if (result.success) {
                console.log('Orders data:', result.data);
                if (!Array.isArray(result.data) || result.data.length === 0) {
                    console.log('No orders found, updating table');
                    ordersTable.innerHTML = '<tr><td colspan="5">No orders found.</td></tr>';
                    return;
                }
                console.log('Rendering orders to table');
                ordersTable.innerHTML = result.data.map(order => {
                    console.log('Processing order:', order);
                    console.log('total_amount:', order.total_amount, 'type:', typeof order.total_amount);
                    // Convert total_amount to number, handle null/undefined
                    const totalAmount = order.total_amount != null ? parseFloat(order.total_amount) : 0;
                    const formattedAmount = isNaN(totalAmount) ? '0.00' : totalAmount.toFixed(2);
                    return `
                        <tr>
                            <td>${order.order_id}</td>
                            <td>${new Date(order.order_date).toLocaleDateString()}</td>
                            <td>$${formattedAmount}</td>
                            <td>${order.status}</td>
                            <td><a href="orders.html?id=${order.order_id}" class="action-link">View Details</a></td>
                        </tr>
                    `;
                }).join('');
            } else {
                console.error('API error:', result);
                throw new Error(result.message || 'Failed to load orders from server');
            }
        } catch (err) {
            console.error('Error loading orders:', err);
            const errorMessage = err.message.includes('not logged in') 
                ? err.message 
                : `Error loading orders: ${err.message || 'Unable to connect to the server. Please try again later.'}`;
            console.log('Displaying error in table');
            ordersTable.innerHTML = `<tr><td colspan="5">${errorMessage}</td></tr>`;
            alert(errorMessage);
        }
    }

    console.log('Calling loadOrders');
    await loadOrders();
});