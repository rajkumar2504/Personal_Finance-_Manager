const Layout = {
    init: () => {
        const currentUser = Storage.getCurrentUser();
        if (!currentUser) return; // Auth.js checks this, but safety first

        Layout.renderSidebar();
        Layout.renderHeader(currentUser);
        Layout.highlightCurrentPage();

        document.getElementById('logoutBtn').addEventListener('click', (e) => {
            e.preventDefault();
            Auth.logout();
        });
    },

    renderSidebar: () => {
        const sidebar = document.createElement('aside');
        sidebar.className = 'sidebar';
        sidebar.innerHTML = `
            <div class="logo">
                <i class="fas fa-wallet"></i> FinManager
            </div>
            <ul class="nav-links">
                <li><a href="index.html" data-page="index"><i class="fas fa-home"></i> Dashboard</a></li>
                <li><a href="expenses.html" data-page="expenses"><i class="fas fa-receipt"></i> Expenses</a></li>
                <li><a href="budget.html" data-page="budget"><i class="fas fa-chart-pie"></i> Budget</a></li>
                <li><a href="goals.html" data-page="goals"><i class="fas fa-bullseye"></i> Goals</a></li>
                <li><a href="reports.html" data-page="reports"><i class="fas fa-chart-line"></i> Reports</a></li>
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
    }
};

// We need to wait for DOMContentLoaded, but often this script is included at the end of body.
// We'll rely on the specific page scripts to call Layout.init() or do it here if DOM is ready.
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', Layout.init);
} else {
    Layout.init();
}
