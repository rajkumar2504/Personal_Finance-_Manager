const Expenses = {
    currentFilter: {
        type: 'all',
        category: 'all',
        search: ''
    },

    categories: {
        expense: ['Food', 'Transport', 'Entertainment', 'Bills', 'Shopping', 'Healthcare', 'Education', 'Rent', 'Others'],
        income: ['Salary', 'Freelance', 'Investment', 'Gift', 'Others']
    },

    editingId: null,

    init: () => {
        Expenses.renderTable();
        Expenses.setupEventListeners();

        // Check URL params for quick actions
        const urlParams = new URLSearchParams(window.location.search);
        const action = urlParams.get('action');
        if (action === 'add_expense' || action === 'add_income') {
            Expenses.openModal(action === 'add_income' ? 'income' : 'expense');
            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    },

    setupEventListeners: () => {
        document.getElementById('searchInput').addEventListener('input', (e) => {
            Expenses.currentFilter.search = e.target.value.toLowerCase();
            Expenses.renderTable();
        });

        document.getElementById('typeFilter').addEventListener('change', (e) => {
            Expenses.currentFilter.type = e.target.value;
            Expenses.populateFilterCategories(); // Update category filter options based on type
            Expenses.renderTable();
        });

        document.getElementById('categoryFilter').addEventListener('change', (e) => {
            Expenses.currentFilter.category = e.target.value;
            Expenses.renderTable();
        });

        document.getElementById('addTransactionBtn').addEventListener('click', () => {
            Expenses.openModal();
        });

        document.getElementById('closeModalBtn').addEventListener('click', Expenses.closeModal);

        // Modal Form Submit
        document.getElementById('transactionForm').addEventListener('submit', Expenses.handleFormSubmit);

        // Initialize Categories in Filter
        Expenses.populateFilterCategories();
    },

    populateFilterCategories: () => {
        const type = Expenses.currentFilter.type;
        const select = document.getElementById('categoryFilter');
        select.innerHTML = '<option value="all">All Categories</option>';

        let cats = [];
        if (type === 'all') {
            cats = [...Expenses.categories.expense, ...Expenses.categories.income];
            // unique
            cats = [...new Set(cats)];
        } else {
            cats = Expenses.categories[type];
        }

        cats.sort().forEach(c => {
            const option = document.createElement('option');
            option.value = c;
            option.textContent = c;
            select.appendChild(option);
        });
    },

    populateCategories: (type) => {
        const select = document.getElementById('category');
        select.innerHTML = '';
        Expenses.categories[type].forEach(c => {
            const option = document.createElement('option');
            option.value = c;
            option.textContent = c;
            select.appendChild(option);
        });
    },

    openModal: (type = 'expense', transaction = null) => {
        const modal = document.getElementById('transactionModal');
        const form = document.getElementById('transactionForm');

        Expenses.editingId = transaction ? transaction.id : null;
        document.getElementById('modalTitle').textContent = transaction ? 'Edit Transaction' : 'Add Transaction';

        // Set default date to today if new
        if (!transaction) {
            document.getElementById('date').valueAsDate = new Date();
            form.reset();
            document.getElementById('date').valueAsDate = new Date(); // Reset clears it
        }

        // Set Type
        const initialType = transaction ? transaction.type : type;
        const typeInput = document.querySelector(`input[name="type"][value="${initialType}"]`);
        if (typeInput) {
            typeInput.checked = true;
            // update UI
            updateTypeUI();
        }

        // Populate categories
        Expenses.populateCategories(initialType);

        if (transaction) {
            document.getElementById('amount').value = transaction.amount;
            document.getElementById('date').value = transaction.date.split('T')[0];
            document.getElementById('description').value = transaction.description;
            // Set category after population
            setTimeout(() => {
                document.getElementById('category').value = transaction.category;
            }, 0);
        }

        modal.classList.add('active');
    },

    closeModal: () => {
        document.getElementById('transactionModal').classList.remove('active');
        Expenses.editingId = null;
    },

    handleFormSubmit: (e) => {
        e.preventDefault();

        const user = Storage.getCurrentUser();
        const data = Storage.getData(user.id);

        const type = document.querySelector('input[name="type"]:checked').value;
        const amount = parseFloat(document.getElementById('amount').value);
        const date = document.getElementById('date').value;
        const category = document.getElementById('category').value;
        const description = document.getElementById('description').value;

        const transaction = {
            id: Expenses.editingId || Utils.generateId(),
            type,
            amount,
            date: new Date(date).toISOString(),
            category,
            description
        };

        if (Expenses.editingId) {
            const index = data.transactions.findIndex(t => t.id === Expenses.editingId);
            if (index !== -1) data.transactions[index] = transaction;
            Utils.showNotification('Transaction updated');
        } else {
            data.transactions.push(transaction);
            Utils.showNotification('Transaction added');
        }

        Storage.saveData(user.id, data);
        Expenses.closeModal();
        Expenses.renderTable();
    },

    deleteTransaction: (id) => {
        if (!confirm('Are you sure you want to delete this transaction?')) return;

        const user = Storage.getCurrentUser();
        const data = Storage.getData(user.id);

        data.transactions = data.transactions.filter(t => t.id !== id);
        Storage.saveData(user.id, data);

        Utils.showNotification('Transaction deleted');
        Expenses.renderTable();
    },

    renderTable: () => {
        const user = Storage.getCurrentUser();
        const data = Storage.getData(user.id);
        const tbody = document.getElementById('transactionTableBody');

        let transactions = data.transactions;

        // Filters
        if (Expenses.currentFilter.type !== 'all') {
            transactions = transactions.filter(t => t.type === Expenses.currentFilter.type);
        }

        if (Expenses.currentFilter.category !== 'all') {
            transactions = transactions.filter(t => t.category === Expenses.currentFilter.category);
        }

        if (Expenses.currentFilter.search) {
            transactions = transactions.filter(t =>
                t.description.toLowerCase().includes(Expenses.currentFilter.search)
            );
        }

        // Sort by date desc
        transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

        tbody.innerHTML = transactions.map(t => `
            <tr>
                <td>${Utils.formatDate(t.date)}</td>
                <td>${t.description}</td>
                <td><span class="status-badge" style="border: 1px solid var(--border-color);">${t.category}</span></td>
                <td><span class="status-badge ${t.type === 'income' ? 'status-income' : 'status-expense'}">${t.type.toUpperCase()}</span></td>
                <td class="text-right font-weight-bold ${t.type === 'income' ? 'text-success' : 'text-danger'}">
                    ${t.type === 'income' ? '+' : '-'} ${Utils.formatCurrency(t.amount)}
                </td>
                <td class="text-center">
                    <button class="btn btn-secondary" onclick='Expenses.editTransaction("${t.id}")' style="padding: 4px 8px; font-size: 0.8rem;"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-danger" onclick="Expenses.deleteTransaction('${t.id}')" style="padding: 4px 8px; font-size: 0.8rem;"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');

        if (transactions.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No transactions found matching your filters.</td></tr>';
        }
    },

    // Helper used in HTML string interpolation above needs to be global or accessible
    editTransaction: (id) => {
        const user = Storage.getCurrentUser();
        const data = Storage.getData(user.id);
        const t = data.transactions.find(x => x.id === id);
        if (t) Expenses.openModal(t.type, t);
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', Expenses.init);
} else {
    Expenses.init();
}
