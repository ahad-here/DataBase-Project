function isAuthenticated(req, res, next) {
    console.log('Checking authentication, session ID:', req.sessionID, 
                'cookie:', req.headers.cookie || 'No cookie', 
                'user:', req.session.user || 'No user');
    if (req.session.user) return next();
    res.status(401).json({ success: false, message: 'Not authenticated' });
}

function isAdmin(req, res, next) {
    console.log('Checking admin, session ID:', req.sessionID, 
                'user:', req.session.user || 'No user');
    if (req.session.user && req.session.user.role === 'admin') return next();
    res.status(403).json({ success: false, message: 'Unauthorized' });
}

module.exports = { isAuthenticated, isAdmin };