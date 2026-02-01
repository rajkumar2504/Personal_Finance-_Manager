const Reports = {
    charts: {},

    init: () => {
        Reports.setupEventListeners();
        Reports.generateReport();
    },

    setupEventListeners: () => {
        document.getElementById('reportPeriod').addEventListener('change', Reports.generateReport);
    },

    getFilteredTransactions: () => {
        const user = Storage.getCurrentUser();
        const data = Storage.getData(user.id);
        const period = document.getElementById('reportPeriod').value;
        const now = new Date();

        return data.transactions.filter(t => {
            const date = new Date(t.date);
            if (period === 'month') {
                return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
            } else if (period === 'year') {
                return date.getFullYear() === now.getFullYear();
            }
            return true;
        });
    },

    generateReport: () => {
        const transactions = Reports.getFilteredTransactions();

        // Stats
        const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
        const expense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
        const savings = income - expense;

        document.getElementById('periodIncome').textContent = Utils.formatCurrency(income);
        document.getElementById('periodExpense').textContent = Utils.formatCurrency(expense);
        document.getElementById('periodSavings').textContent = Utils.formatCurrency(savings);

        Reports.renderCategoryChart(transactions);
        Reports.renderTrendChart(transactions);
        Reports.renderBreakdown(transactions, income, expense);
    },

    renderCategoryChart: (transactions) => {
        const ctx = document.getElementById('categoryChart').getContext('2d');
        const expenses = transactions.filter(t => t.type === 'expense');

        const categories = {};
        expenses.forEach(t => {
            categories[t.category] = (categories[t.category] || 0) + t.amount;
        });

        if (Reports.charts.category) Reports.charts.category.destroy();

        Reports.charts.category = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: Object.keys(categories),
                datasets: [{
                    data: Object.values(categories),
                    backgroundColor: ['#0052cc', '#00875a', '#ffAB00', '#de350b', '#6554c0', '#36b37e', '#ff991f', '#2684ff', '#57d9a3'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right' }
                }
            }
        });
    },

    renderTrendChart: (transactions) => {
        const ctx = document.getElementById('trendChart').getContext('2d');
        const period = document.getElementById('reportPeriod').value;

        // Group by Date (Day or Month depending on range)
        // For simplicity, let's group by Day if Month view, Month if Year view/All Time

        const isDaily = period === 'month';
        const points = {};

        transactions.forEach(t => {
            const date = new Date(t.date);
            const key = isDaily ? date.getDate() : date.getMonth(); // 1-31 or 0-11

            if (!points[key]) points[key] = { income: 0, expense: 0 };
            points[key][t.type] += t.amount;
        });

        const labels = Object.keys(points).sort((a, b) => parseInt(a) - parseInt(b)).map(k => {
            if (isDaily) return `Day ${k}`;
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return months[k];
        });

        const incomeData = Object.keys(points).sort((a, b) => parseInt(a) - parseInt(b)).map(k => points[k].income);
        const expenseData = Object.keys(points).sort((a, b) => parseInt(a) - parseInt(b)).map(k => points[k].expense);

        if (Reports.charts.trend) Reports.charts.trend.destroy();

        Reports.charts.trend = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Income',
                        data: incomeData,
                        borderColor: '#00875a',
                        backgroundColor: 'rgba(0, 135, 90, 0.1)',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Expense',
                        data: expenseData,
                        borderColor: '#de350b',
                        backgroundColor: 'rgba(222, 53, 11, 0.1)',
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    },

    renderBreakdown: (transactions, totalIncome, totalExpense) => {
        const tbody = document.getElementById('breakdownTable');
        const categories = {};

        transactions.forEach(t => {
            const key = `${t.category}-${t.type}`;
            if (!categories[key]) categories[key] = { name: t.category, type: t.type, amount: 0 };
            categories[key].amount += t.amount;
        });

        const sorted = Object.values(categories).sort((a, b) => b.amount - a.amount);

        tbody.innerHTML = sorted.map(c => {
            const total = c.type === 'income' ? totalIncome : totalExpense;
            const pct = total > 0 ? (c.amount / total * 100).toFixed(1) : 0;
            return `
                <tr>
                    <td>${c.name}</td>
                    <td><span class="status-badge ${c.type === 'income' ? 'status-income' : 'status-expense'}">${c.type}</span></td>
                    <td class="text-right">${Utils.formatCurrency(c.amount)}</td>
                    <td class="text-right">${pct}%</td>
                </tr>
            `;
        }).join('');
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', Reports.init);
} else {
    Reports.init();
}
