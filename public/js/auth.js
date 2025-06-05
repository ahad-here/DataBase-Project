document.addEventListener('DOMContentLoaded', () => {
    console.log('auth.js loaded'); // Debug: Verify script runs

    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const loginModal = document.getElementById('login-modal');
    const registerModal = document.getElementById('register-modal');
    const closeModal = document.getElementById('close-modal');
    const closeRegisterModal = document.getElementById('close-register-modal');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const registerLink = document.getElementById('register-link');
    const loginLink = document.getElementById('login-link');
    const adminLink = document.querySelector('.admin-only');

    // Check authentication status
    async function checkAuth() {
        try {
            console.log('Checking auth status...'); // Debug
            const response = await fetch('http://localhost:3000/api/auth/me', {
                method: 'GET',
                credentials: 'include'
            });
            const result = await response.json();
            if (response.ok && result.success) {
                console.log('User authenticated:', result.data); // Debug
                loginBtn.style.display = 'none';
                logoutBtn.style.display = 'inline';
                if (result.data.role === 'admin') {
                    adminLink.style.display = 'inline';
                }
            } else {
                console.log('User not authenticated'); // Debug
                loginBtn.style.display = 'inline';
                logoutBtn.style.display = 'none';
                adminLink.style.display = 'none';
            }
        } catch (err) {
            console.error('Error checking auth:', err);
            loginBtn.style.display = 'inline';
            logoutBtn.style.display = 'none';
            adminLink.style.display = 'none';
        }
    }
    checkAuth();

    // Login button
    if (loginBtn) {
        console.log('Login button found'); // Debug
        loginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Login button clicked'); // Debug
            loginModal.style.display = 'flex';
        });
    } else {
        console.error('Login button not found'); // Debug
    }

    // Logout button
    if (logoutBtn) {
        console.log('Logout button found'); // Debug
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            console.log('Logout button clicked'); // Debug
            try {
                const response = await fetch('http://localhost:3000/api/auth/logout', {
                    method: 'POST',
                    credentials: 'include'
                });
                const result = await response.json();
                console.log('Logout response:', result); // Debug
                if (response.ok && result.success) {
                    alert('Logged out successfully');
                    loginBtn.style.display = 'inline';
                    logoutBtn.style.display = 'none';
                    adminLink.style.display = 'none';
                    window.location.reload(); // Refresh to reset state
                } else {
                    alert('Failed to log out: ' + (result.message || 'Unknown error'));
                }
            } catch (err) {
                console.error('Error logging out:', err);
                alert('Error logging out: ' + err.message);
            }
        });
    } else {
        console.error('Logout button not found'); // Debug
    }

    // Close modals
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            loginModal.style.display = 'none';
        });
    }
    if (closeRegisterModal) {
        closeRegisterModal.addEventListener('click', () => {
            registerModal.style.display = 'none';
        });
    }

    // Switch between login and register modals
    if (registerLink) {
        registerLink.addEventListener('click', (e) => {
            e.preventDefault();
            loginModal.style.display = 'none';
            registerModal.style.display = 'flex';
        });
    }
    if (loginLink) {
        loginLink.addEventListener('click', (e) => {
            e.preventDefault();
            registerModal.style.display = 'none';
            loginModal.style.display = 'flex';
        });
    }

    // Login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('Login form submitted'); // Debug
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            try {
                const response = await fetch('http://localhost:3000/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password }),
                    credentials: 'include'
                });
                const result = await response.json();
                console.log('Login response:', result); // Debug
                if (response.ok && result.success) {
                    alert('Login successful');
                    loginModal.style.display = 'none';
                    checkAuth();
                } else {
                    alert('Login failed: ' + (result.message || 'Unknown error'));
                }
            } catch (err) {
                console.error('Error logging in:', err);
                alert('Error logging in: ' + err.message);
            }
        });
    }

    // Register form submission
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('Register form submitted'); // Debug
            const username = document.getElementById('reg-username').value;
            const email = document.getElementById('reg-email').value;
            const password = document.getElementById('reg-password').value;
            const confirmPassword = document.getElementById('reg-confirm-password').value;
            if (password !== confirmPassword) {
                alert('Passwords do not match');
                return;
            }
            try {
                const response = await fetch('http://localhost:3000/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email, password }),
                    credentials: 'include'
                });
                const result = await response.json();
                console.log('Register response:', result); // Debug
                if (response.ok && result.success) {
                    alert('Registration successful');
                    registerModal.style.display = 'none';
                    loginModal.style.display = 'flex';
                } else {
                    alert('Registration failed: ' + (result.message || 'Unknown error'));
                }
            } catch (err) {
                console.error('Error registering:', err);
                alert('Error registering: ' + err.message);
            }
        });
    }
});