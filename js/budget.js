const Budget = {
    categories: ['Food', 'Transport', 'Entertainment', 'Bills', 'Shopping', 'Healthcare', 'Education', 'Rent', 'Others'],
    editingId: null,

    init: () => {
        Budget.renderBudgets();
        Budget.setupEventListeners();
    },

    setupEventListeners: () => {
        document.getElementById('addBudgetBtn').addEventListener('click', () => {
            Budget.openModal();
        });

        document.getElementById('closeModalBtn').addEventListener('click', Budget.closeModal);
        document.getElementById('budgetForm').addEventListener('submit', Budget.handleFormSubmit);
    },

    openModal: (budget = null) => {
        const modal = document.getElementById('budgetModal');
        const select = document.getElementById('category');

        Budget.editingId = budget ? budget.id : null;
        document.getElementById('modalTitle').textContent = budget ? 'Edit Budget' : 'Set Budget';

        // Populate Categories
        select.innerHTML = '';
        Budget.categories.forEach(c => {
            const option = document.createElement('option');
            option.value = c;
            option.textContent = c;
            select.appendChild(option);
        });

        if (budget) {
            select.value = budget.category;
            document.getElementById('limit').value = budget.limit;
            // Disable changing category on edit to simplify logic (or allow it, but we typically edit amounts)
            // select.disabled = true; 
        } else {
            document.getElementById('budgetForm').reset();
            select.disabled = false;
        }

        modal.style.display = 'flex';
    },

    closeModal: () => {
        document.getElementById('budgetModal').style.display = 'none';
        Budget.editingId = null;
    },

    handleFormSubmit: (e) => {
        e.preventDefault();

        const user = Storage.getCurrentUser();
        const data = Storage.getData(user.id);

        const category = document.getElementById('category').value;
        const limit = parseFloat(document.getElementById('limit').value);

        if (Budget.editingId) {
            const index = data.budgets.findIndex(b => b.id === Budget.editingId);
            if (index !== -1) {
                data.budgets[index].limit = limit;
                data.budgets[index].category = category;
            }
            Utils.showNotification('Budget updated');
        } else {
            // Check if budget for category already exists
            const exists = data.budgets.find(b => b.category === category);
            if (exists) {
                Utils.showNotification('Budget for this category already exists', 'error');
                return;
            }

            const budget = {
                id: Utils.generateId(),
                category,
                limit
            };
            data.budgets.push(budget);
            Utils.showNotification('Budget created');
        }

        Storage.saveData(user.id, data);
        Budget.closeModal();
        Budget.renderBudgets();
    },

    getSpentAmount: (category, transactions) => {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        return transactions
            .filter(t =>
                t.type === 'expense' &&
                t.category === category &&
                new Date(t.date).getMonth() === currentMonth &&
                new Date(t.date).getFullYear() === currentYear
            )
            .reduce((sum, t) => sum + t.amount, 0);
    },

    deleteBudget: (id) => {
        if (!confirm('Stop tracking budget for this category?')) return;

        const user = Storage.getCurrentUser();
        const data = Storage.getData(user.id);

        data.budgets = data.budgets.filter(b => b.id !== id);
        Storage.saveData(user.id, data);
        Utils.showNotification('Budget deleted');
        Budget.renderBudgets();
    },

    renderBudgets: () => {
        const user = Storage.getCurrentUser();
        const data = Storage.getData(user.id);
        const container = document.getElementById('budgetContainer');
        const noBudgets = document.getElementById('noBudgets');

        if (!data.budgets || data.budgets.length === 0) {
            container.innerHTML = '';
            noBudgets.style.display = 'block';
            return;
        }

        noBudgets.style.display = 'none';
        container.innerHTML = data.budgets.map(b => {
            const spent = Budget.getSpentAmount(b.category, data.transactions);
            const percent = Math.min((spent / b.limit) * 100, 100);
            let statusColor = 'var(--secondary-color)'; // Green
            if (percent > 80) statusColor = 'var(--warning-color)'; // Orange
            if (percent >= 100) statusColor = 'var(--danger-color)'; // Red

            return `
                <div class="card budget-card">
                    <div class="flex-between mb-1">
                        <h3>${b.category}</h3>
                        <div class="text-right">
                             <button class="btn btn-secondary" style="padding: 2px 6px; font-size: 0.7rem;" onclick="Budget.openModal({id:'${b.id}', category:'${b.category}', limit:${b.limit}})">Edit</button>
                             <button class="btn btn-danger" style="padding: 2px 6px; font-size: 0.7rem;" onclick="Budget.deleteBudget('${b.id}')"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                    <div class="mb-1">
                        <span style="font-size: 1.2rem; font-weight: bold; color: ${statusColor};">${Utils.formatCurrency(spent)}</span>
                        <span style="color: var(--text-secondary);"> / ${Utils.formatCurrency(b.limit)}</span>
                    </div>
                    <div class="progress-container">
                        <div class="progress-bar" style="width: ${percent}%; background-color: ${statusColor};"></div>
                    </div>
                    <div class="text-right" style="font-size: 0.8rem; color: var(--text-secondary);">
                        ${percent >= 100 ? 'Over Budget!' : `${Math.round(100 - percent)}% remaining`}
                    </div>
                </div>
             `;
        }).join('');
    }
};

window.Budget = Budget; // Expose for HTML onclick

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', Budget.init);
} else {
    Budget.init();
}
