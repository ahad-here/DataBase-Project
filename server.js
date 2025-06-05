require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const cors = require('cors');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        }
    }
}));
app.use(session({
    secret: process.env.SESSION_SECRET,
    store: new MySQLStore({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    }),
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

// Database connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect(err => {
    if (err) throw err;
    console.log('MySQL Connected');
});

// Authentication middleware
function isAuthenticated(req, res, next) {
    if (req.session.user) return next();
    res.status(401).json({ success: false, message: 'Not authenticated' });
}

function isAdmin(req, res, next) {
    if (req.session.user && req.session.user.role === 'admin') return next();
    res.status(403).json({ success: false, message: 'Not authorized' });
}

// Authentication Endpoints
app.post('/api/auth/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.query('INSERT INTO Users (username, email, password, role) VALUES (?, ?, ?, ?)', 
            [username, email, hashedPassword, 'customer'], (err, result) => {
                if (err) return res.status(400).json({ success: false, message: err.message });
                req.session.user = { user_id: result.insertId, username, email, role: 'customer' };
                res.json({ success: true, data: req.session.user });
            });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        db.query('SELECT * FROM Users WHERE email = ?', [email], async (err, results) => {
            if (err || !results.length) return res.status(401).json({ success: false, message: 'Invalid credentials' });
            const user = results[0];
            if (!(await bcrypt.compare(password, user.password))) {
                return res.status(401).json({ success: false, message: 'Invalid credentials' });
            }
            req.session.user = { user_id: user.user_id, username: user.username, email, role: user.role };
            res.json({ success: true, data: req.session.user });
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.post('/api/auth/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

app.get('/api/auth/me', (req, res) => {
    if (!req.session.user) return res.status(401).json({ success: false, message: 'Not authenticated' });
    res.json({ success: true, data: req.session.user });
});

// Game Endpoints
app.get('/api/games', (req, res) => {
    const { page = 1, limit = 10, genre, platform, sort, q } = req.query;
    const offset = (page - 1) * limit;
    let query = 'SELECT * FROM Games WHERE 1=1';
    let params = [];
    
    if (q) {
        query += ' AND title LIKE ?';
        params.push(`%${q}%`);
    }
    if (genre) {
        query += ' AND genre = ?';
        params.push(genre);
    }
    if (platform) {
        query += ' AND platform LIKE ?';
        params.push(`%${platform}%`);
    }
    if (sort === 'newest') {
        query += ' ORDER BY created_at DESC';
    } else if (sort === 'price-low') {
        query += ' ORDER BY price ASC';
    } else if (sort === 'price-high') {
        query += ' ORDER BY price DESC';
    }
    
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    db.query(query, params, (err, results) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        const parsedResults = results.map(game => ({
            ...game,
            price: parseFloat(game.price)
        }));
        res.json({ success: true, data: parsedResults });
    });
});

app.get('/api/games/:id', (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    const gameId = parseInt(req.params.id, 10);
    console.log('Requested game ID:', gameId, 'Raw ID:', req.params.id);
    if (isNaN(gameId) || gameId <= 0) {
        console.log('Invalid game ID:', req.params.id);
        return res.status(400).json({ success: false, message: 'Invalid game ID' });
    }
    const query = 'SELECT * FROM Games WHERE game_id = ?';
    console.log('Executing query:', query, 'with game_id:', gameId);
    db.query(query, [gameId], (err, results) => {
        console.log('Query results:', results);
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ success: false, message: err.message });
        }
        if (results.length === 0) {
            console.log('No game found for ID:', gameId);
            return res.status(404).json({ success: false, message: 'Game not found' });
        }
        const game = { ...results[0], price: parseFloat(results[0].price) };
        console.log('Returning game:', game);
        res.json({ success: true, data: game });
    });
});

// Cart Endpoints
app.get('/api/cart', isAuthenticated, (req, res) => {
    db.query('SELECT c.game_id, c.quantity, g.price FROM Cart c JOIN Games g ON c.game_id = g.game_id WHERE c.user_id = ?', 
        [req.session.user.user_id], (err, results) => {
            if (err) return res.status(500).json({ success: false, message: err.message });
            const parsedResults = results.map(item => ({
                gameId: item.game_id,
                quantity: item.quantity,
                price: parseFloat(item.price)
            }));
            res.json({ success: true, data: parsedResults });
        });
});

app.post('/api/cart', isAuthenticated, (req, res) => {
    const { gameId, quantity } = req.body;
    if (!gameId || quantity <= 0) return res.status(400).json({ success: false, message: 'Invalid game ID or quantity' });
    
    db.query('SELECT stock_quantity FROM Games WHERE game_id = ?', [gameId], (err, results) => {
        if (err || results.length === 0) return res.status(404).json({ success: false, message: 'Game not found' });
        if (results[0].stock_quantity < quantity) return res.status(400).json({ success: false, message: 'Insufficient stock' });

        db.query('SELECT quantity FROM Cart WHERE user_id = ? AND game_id = ?', 
            [req.session.user.user_id, gameId], (err, results) => {
                if (err) return res.status(500).json({ success: false, message: err.message });
                if (results.length > 0) {
                    db.query('UPDATE Cart SET quantity = quantity + ? WHERE user_id = ? AND game_id = ?', 
                        [quantity, req.session.user.user_id, gameId], (err) => {
                            if (err) return res.status(500).json({ success: false, message: err.message });
                            res.json({ success: true });
                        });
                } else {
                    db.query('INSERT INTO Cart (user_id, game_id, quantity) VALUES (?, ?, ?)', 
                        [req.session.user.user_id, gameId, quantity], (err) => {
                            if (err) return res.status(500).json({ success: false, message: err.message });
                            res.json({ success: true });
                        });
                }
            });
    });
});

app.delete('/api/cart/:gameId', isAuthenticated, (req, res) => {
    const { gameId } = req.params;
    db.query('DELETE FROM Cart WHERE user_id = ? AND game_id = ?', [req.session.user.user_id, parseInt(gameId)], (err) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true });
    });
});

app.delete('/api/cart', isAuthenticated, (req, res) => {
    db.query('DELETE FROM Cart WHERE user_id = ?', [req.session.user.user_id], (err) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true });
    });
});

// Order Endpoints
app.post('/api/orders', isAuthenticated, async (req, res) => {
    const { items, total_amount, payment_method } = req.body;
    
    if (!items || !total_amount || !payment_method) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    for (const item of items) {
        const [game] = await db.promise().query('SELECT stock_quantity, price FROM Games WHERE game_id = ?', [item.gameId]);
        if (!game.length || game[0].stock_quantity < item.quantity) {
            return res.status(400).json({ success: false, message: `Insufficient stock for game ID ${item.gameId}` });
        }
        item.price = parseFloat(game[0].price);
    }

    try {
        const [orderResult] = await db.promise().query('INSERT INTO Orders (user_id, total_amount) VALUES (?, ?)', 
            [req.session.user.user_id, total_amount]);
        const orderId = orderResult.insertId;

        const orderItems = items.map(item => [orderId, item.gameId, item.quantity, item.price]);
        await db.promise().query('INSERT INTO Order_Items (order_id, game_id, quantity, price_at_purchase) VALUES ?', [orderItems]);

        await db.promise().query('INSERT INTO Payments (order_id, payment_status, payment_method, amount) VALUES (?, ?, ?, ?)', 
            [orderId, 'completed', payment_method, total_amount]);

        await db.promise().query('DELETE FROM Cart WHERE user_id = ?', [req.session.user.user_id]);

        res.json({ success: true, data: { orderId } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get('/api/orders', isAuthenticated, (req, res) => {
    db.query('SELECT * FROM Orders WHERE user_id = ?', [req.session.user.user_id], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, data: results });
    });
});

app.get('/api/orders/:id', isAuthenticated, (req, res) => {
    db.query('SELECT * FROM Orders WHERE order_id = ? AND user_id = ?', [req.params.id, req.session.user.user_id], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        if (results.length === 0) return res.status(404).json({ success: false, message: 'Order not found' });
        res.json({ success: true, data: results[0] });
    });
});

// Admin Endpoints
app.post('/api/admin/games', isAdmin, (req, res) => {
    const { title, description, price, genre, platform, stock_quantity } = req.body;
    if (!title || !price || !stock_quantity) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    db.query('INSERT INTO Games (title, description, price, genre, platform, stock_quantity) VALUES (?, ?, ?, ?, ?, ?)', 
        [title, description, parseFloat(price), genre, platform, stock_quantity], (err, result) => {
            if (err) return res.status(500).json({ success: false, message: err.message });
            res.json({ success: true, data: { game_id: result.insertId } });
        });
});

app.put('/api/admin/games/:id', isAdmin, (req, res) => {
    const { title, description, price, genre, platform, stock_quantity } = req.body;
    if (!title || !price || !stock_quantity) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    db.query('UPDATE Games SET title = ?, description = ?, price = ?, genre = ?, platform = ?, stock_quantity = ? WHERE game_id = ?', 
        [title, description, parseFloat(price), genre, platform, stock_quantity, req.params.id], (err) => {
            if (err) return res.status(500).json({ success: false, message: err.message });
            res.json({ success: true });
        });
});

app.delete('/api/admin/games/:id', isAdmin, (req, res) => {
    db.query('DELETE FROM Games WHERE game_id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true });
    });
});

app.get('/api/admin/games', isAdmin, (req, res) => {
    db.query('SELECT * FROM Games', (err, results) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        const parsedResults = results.map(game => ({
            ...game,
            price: parseFloat(game.price)
        }));
        res.json({ success: true, data: parsedResults });
    });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));