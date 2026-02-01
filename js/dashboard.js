const Dashboard = {
    init: () => {
        Dashboard.loadStats();
        Dashboard.renderRecentTransactions();
        try {
            if (typeof Chart !== 'undefined') {
                Dashboard.renderCharts();
            } else {
                console.warn('Chart.js not loaded');
            }
        } catch (e) {
            console.error('Error rendering charts:', e);
        }
    },

    loadStats: () => {
        const user = Storage.getCurrentUser();
        if (!user) return;

        // Ensure data structure
        let data = Storage.getData(user.id);

        // Seed simple data if empty for demo
        if (!data.transactions.length && !data.seeded) {
            data = Dashboard.seedData(user.id);
        }

        const income = data.transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const expenses = data.transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        const balance = income - expenses;
        const activeGoals = data.goals ? data.goals.filter(g => !g.completed).length : 0;

        document.getElementById('totalBalance').textContent = Utils.formatCurrency(balance);
        document.getElementById('totalIncome').textContent = Utils.formatCurrency(income);
        document.getElementById('totalExpenses').textContent = Utils.formatCurrency(expenses);
        document.getElementById('activeGoals').textContent = activeGoals;
    },

    seedData: (userId) => {
        const today = new Date();
        const seededData = {
            transactions: [
                { id: Utils.generateId(), type: 'income', category: 'Salary', description: 'Monthly Salary', amount: 5000, date: new Date(today.getFullYear(), today.getMonth(), 1).toISOString() },
                { id: Utils.generateId(), type: 'expense', category: 'Rent', description: 'Apartment Rent', amount: 1200, date: new Date(today.getFullYear(), today.getMonth(), 3).toISOString() },
                { id: Utils.generateId(), type: 'expense', category: 'Food', description: 'Grocery Shopping', amount: 150, date: new Date(today.getFullYear(), today.getMonth(), 5).toISOString() },
                { id: Utils.generateId(), type: 'expense', category: 'Transport', description: 'Uber Rides', amount: 45, date: new Date(today.getFullYear(), today.getMonth(), 7).toISOString() },
                { id: Utils.generateId(), type: 'expense', category: 'Entertainment', description: 'Netflix Subscription', amount: 15, date: new Date(today.getFullYear(), today.getMonth(), 10).toISOString() },
            ],
            budgets: [
                { id: Utils.generateId(), category: 'Food', limit: 400, spent: 150 },
                { id: Utils.generateId(), category: 'Entertainment', limit: 100, spent: 15 },
            ],
            goals: [
                { id: Utils.generateId(), title: 'Vacation Fund', target: 2000, current: 500, deadline: '2026-12-31', completed: false }
            ],
            seeded: true
        };
        Storage.saveData(userId, seededData);
        return seededData;
    },

    renderRecentTransactions: () => {
        const user = Storage.getCurrentUser();
        const data = Storage.getData(user.id);
        const tbody = document.getElementById('recentTransactions');

        let transactions = [...data.transactions];
        // Sort by date desc
        transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Take top 5
        const recent = transactions.slice(0, 5);

        tbody.innerHTML = recent.map(t => `
            <tr>
                <td>${t.description}</td>
                <td><span class="status-badge" style="background:var(--bg-body); color:var(--text-secondary); border: 1px solid var(--border-color);">${t.category}</span></td>
                <td>${Utils.formatDate(t.date)}</td>
                <td class="text-right">
                    <span class="status-badge ${t.type === 'income' ? 'status-income' : 'status-expense'}">
                        ${t.type === 'income' ? '+' : '-'} ${Utils.formatCurrency(t.amount)}
                    </span>
                </td>
            </tr>
        `).join('');

        if (recent.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center">No transactions found</td></tr>';
        }
    },

    renderCharts: () => {
        const user = Storage.getCurrentUser();
        const data = Storage.getData(user.id);

        const expenses = data.transactions.filter(t => t.type === 'expense');

        // Group by category
        const categories = {};
        expenses.forEach(t => {
            categories[t.category] = (categories[t.category] || 0) + t.amount;
        });

        const ctx = document.getElementById('spendingChart').getContext('2d');

        // Colors matching variables approximately
        const colors = ['#0052cc', '#00875a', '#ffAB00', '#de350b', '#6554c0', '#36b37e', '#ff991f'];

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(categories),
                datasets: [{
                    data: Object.values(categories),
                    backgroundColor: colors,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    }
                }
            }
        });
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', Dashboard.init);
} else {
    Dashboard.init();
}
