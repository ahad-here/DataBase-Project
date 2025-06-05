document.addEventListener('DOMContentLoaded', async () => {
    console.log('admin.js loaded'); // Debug: Verify script runs

    // Load Games
    const gamesTable = document.getElementById('games-table');
    async function loadGames() {
        try {
            console.log('Fetching games...'); // Debug
            const response = await fetch('http://localhost:3000/api/games', {
                method: 'GET',
                credentials: 'include'
            });
            if (!response.ok) throw new Error(`HTTP error: ${response.status} - ${await response.text()}`);
            const result = await response.json();
            if (result.success && Array.isArray(result.data)) {
                gamesTable.innerHTML = result.data.map(game => `
                    <tr>
                        <td>${game.game_id}</td>
                        <td>${game.title}</td>
                        <td>$${game.price.toFixed(2)}</td>
                        <td>${game.stock_quantity}</td>
                        <td><button class="delete-btn" data-id="${game.game_id}">Delete</button></td>
                    </tr>
                `).join('');
                document.querySelectorAll('.delete-btn').forEach(btn => {
                    btn.addEventListener('click', async () => {
                        const gameId = btn.getAttribute('data-id');
                        if (confirm(`Delete game ID ${gameId}?`)) {
                            try {
                                const deleteResponse = await fetch(`http://localhost:3000/api/admin/games/${gameId}`, {
                                    method: 'DELETE',
                                    credentials: 'include'
                                });
                                if (deleteResponse.ok) {
                                    alert('Game deleted');
                                    loadGames();
                                } else {
                                    const errorResult = await deleteResponse.json();
                                    alert('Failed to delete game: ' + errorResult.message);
                                }
                            } catch (err) {
                                console.error('Error deleting game:', err);
                                alert('Error deleting game: ' + err.message);
                            }
                        }
                    });
                });
            } else {
                gamesTable.innerHTML = '<tr><td colspan="5">No games found</td></tr>';
            }
        } catch (err) {
            console.error('Error loading games:', err);
            gamesTable.innerHTML = '<tr><td colspan="5">Error loading games: ' + err.message + '</td></tr>';
        }
    }
    loadGames();

    // Add Game Form
    const addGameForm = document.getElementById('add-game-form');
    if (addGameForm) {
        console.log('Add game form found'); // Debug: Verify form exists
        addGameForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('Add game form submitted'); // Debug: Verify event fires
            const gameData = {
                title: document.getElementById('game-title').value.trim(),
                price: parseFloat(document.getElementById('game-price').value),
                genre: document.getElementById('game-genre').value.trim() || null,
                platform: document.getElementById('game-platform').value.trim() || null,
                stock_quantity: parseInt(document.getElementById('game-stock').value),
                description: document.getElementById('game-description').value.trim() || null
            };

            console.log('Game data:', gameData); // Debug: Log form data

            // Client-side validation
            if (!gameData.title) {
                alert('Title is required');
                return;
            }
            if (isNaN(gameData.price) || gameData.price < 0) {
                alert('Price must be a non-negative number');
                return;
            }
            if (isNaN(gameData.stock_quantity) || gameData.stock_quantity < 0) {
                alert('Stock quantity must be a non-negative integer');
                return;
            }

            try {
                console.log('Sending POST to /api/admin/games'); // Debug
                const response = await fetch('http://localhost:3000/api/admin/games', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(gameData),
                    credentials: 'include'
                });
                const result = await response.json();
                console.log('API response:', result); // Debug: Log response
                if (response.ok && result.success) {
                    alert('Game added successfully');
                    addGameForm.reset();
                    loadGames();
                } else {
                    console.error('Add Game API Error:', result);
                    alert('Failed to add game: ' + (result.message || 'Unknown error'));
                }
            } catch (err) {
                console.error('Error adding game:', err);
                alert('Error adding game: ' + err.message);
            }
        });
    } else {
        console.error('Add game form not found'); // Debug: Form missing
    }
});