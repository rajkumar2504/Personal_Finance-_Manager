const Layout = {
    init: () => {
        const currentUser = Storage.getCurrentUser();
        if (!currentUser) return; // Auth.js checks this, but safety first

        Layout.renderSidebar();
        Layout.renderHeader(currentUser);
        Layout.highlightCurrentPage();
        Layout.initTheme(); // Initialize theme

        document.getElementById('logoutBtn').addEventListener('click', (e) => {
            e.preventDefault();
            Auth.logout();
        });

        // Add Theme Toggle Listener
        const themeBtn = document.getElementById('themeToggle');
        if (themeBtn) {
            themeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                Layout.toggleTheme();
            });
        }
    },

    renderSidebar: () => {
        const sidebar = document.createElement('aside');
        sidebar.className = 'sidebar';
        sidebar.innerHTML = `
            <div class="logo">
                <i class="fas fa-wallet"></i> Personal Finance Manager
            </div>
            <ul class="nav-links">
                <li><a href="index.html" data-page="index"><i class="fas fa-home"></i> Dashboard</a></li>
                <li><a href="expenses.html" data-page="expenses"><i class="fas fa-receipt"></i> Expenses</a></li>
                <li><a href="budget.html" data-page="budget"><i class="fas fa-chart-pie"></i> Budget</a></li>
                <li><a href="goals.html" data-page="goals"><i class="fas fa-bullseye"></i> Goals</a></li>
                <li><a href="reports.html" data-page="reports"><i class="fas fa-chart-line"></i> Reports</a></li>
                <li><a href="#" id="themeToggle"><i class="fas fa-moon"></i> Dark Mode</a></li>
            </ul>
        `;
        document.querySelector('.app-container').prepend(sidebar);
    },

    renderHeader: (user) => {
        const mainContent = document.querySelector('.main-content');
        const header = document.createElement('header');
        header.className = 'top-bar';
        header.innerHTML = `
            <div class="page-title">
                <h2>${document.title.split('-')[0].trim()}</h2>
            </div>
            <div class="user-profile" id="userProfile">
                <div class="user-info text-right">
                    <span style="display:block; font-weight:600;">${user.name}</span>
                    <span style="display:block; font-size:0.8rem; color:var(--text-secondary);">${user.email}</span>
                </div>
                <div class="avatar">${user.name.charAt(0).toUpperCase()}</div>
                 <a href="#" id="logoutBtn" style="margin-left: 10px; color: var(--danger-color); font-size: 0.9rem;"><i class="fas fa-sign-out-alt"></i></a>
            </div>
        `;
        mainContent.prepend(header);
    },

    highlightCurrentPage: () => {
        const path = window.location.pathname;
        let page = 'index';
        if (path.includes('expenses')) page = 'expenses';
        else if (path.includes('budget')) page = 'budget';
        else if (path.includes('goals')) page = 'goals';
        else if (path.includes('reports')) page = 'reports';

        const link = document.querySelector(`a[data-page="${page}"]`);
        if (link) link.classList.add('active');
    },

    initTheme: () => {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        Layout.updateThemeIcon(savedTheme);
    },

    toggleTheme: () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        Layout.updateThemeIcon(newTheme);
    },

    updateThemeIcon: (theme) => {
        const themeBtn = document.getElementById('themeToggle');
        if (!themeBtn) return;

        const icon = themeBtn.querySelector('i');
        const text = themeBtn.childNodes[1]; // The text node after <i>

        if (theme === 'dark') {
            icon.className = 'fas fa-sun';
            text.textContent = ' Light Mode';
        } else {
            icon.className = 'fas fa-moon';
            text.textContent = ' Dark Mode';
        }
    }
};

// We need to wait for DOMContentLoaded, but often this script is included at the end of body.
// We'll rely on the specific page scripts to call Layout.init() or do it here if DOM is ready.
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', Layout.init);
} else {
    Layout.init();
}
