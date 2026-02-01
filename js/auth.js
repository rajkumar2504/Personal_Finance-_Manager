const Auth = {
    init: () => {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');

        if (loginForm) {
            loginForm.addEventListener('submit', Auth.handleLogin);
        }

        if (registerForm) {
            registerForm.addEventListener('submit', Auth.handleRegister);
        }

        Auth.checkAuth();
    },

    checkAuth: () => {
        const currentUser = Storage.getCurrentUser();
        const path = window.location.pathname;
        const isAuthPage = path.includes('login.html') || path.includes('register.html');

        if (!currentUser && !isAuthPage) {
            window.location.href = 'login.html';
        } else if (currentUser && isAuthPage) {
            window.location.href = 'index.html';
        }
    },

    handleRegister: (e) => {
        e.preventDefault();
        const name = document.getElementById('fullname').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (password !== confirmPassword) {
            Utils.showNotification('Passwords do not match', 'error');
            return;
        }

        const users = Storage.getUsers();
        if (users.find(u => u.email === email)) {
            Utils.showNotification('Email already registered', 'error');
            return;
        }

        const newUser = {
            id: Utils.generateId(),
            name,
            email,
            password
        };

        Storage.saveUser(newUser);
        Utils.showNotification('Registration successful! Please login.');
        setTimeout(() => window.location.href = 'login.html', 1500);
    },

    handleLogin: (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        const users = Storage.getUsers();
        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            Storage.setCurrentUser(user);
            Utils.showNotification('Login successful!');
            setTimeout(() => window.location.href = 'index.html', 1000);
        } else {
            Utils.showNotification('Invalid credentials', 'error');
        }
    },

    logout: () => {
        Storage.remove('currentUser');
        window.location.href = 'login.html';
    }
};

document.addEventListener('DOMContentLoaded', Auth.init);
