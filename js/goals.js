const Goals = {
    editingId: null,

    init: () => {
        Goals.renderGoals();
        Goals.setupEventListeners();
    },

    setupEventListeners: () => {
        document.getElementById('addGoalBtn').addEventListener('click', () => {
            Goals.openModal();
        });

        document.getElementById('closeModalBtn').addEventListener('click', Goals.closeModal);
        document.getElementById('goalForm').addEventListener('submit', Goals.handleFormSubmit);
        document.getElementById('depositForm').addEventListener('submit', Goals.handleDeposit);
    },

    openModal: (goal = null) => {
        const modal = document.getElementById('goalModal');
        Goals.editingId = goal ? goal.id : null;
        document.getElementById('modalTitle').textContent = goal ? 'Edit Goal' : 'Create Goal';

        if (goal) {
            document.getElementById('title').value = goal.title;
            document.getElementById('target').value = goal.target;
            document.getElementById('current').value = goal.current;
            document.getElementById('deadline').value = goal.deadline || '';
        } else {
            document.getElementById('goalForm').reset();
        }

        modal.style.display = 'flex';
    },

    closeModal: () => {
        document.getElementById('goalModal').style.display = 'none';
        Goals.editingId = null;
    },

    openDepositModal: (id) => {
        document.getElementById('depositGoalId').value = id;
        document.getElementById('depositAmount').value = '';
        document.getElementById('depositModal').style.display = 'flex';
    },

    handleFormSubmit: (e) => {
        e.preventDefault();

        const user = Storage.getCurrentUser();
        const data = Storage.getData(user.id);

        const title = document.getElementById('title').value;
        const target = parseFloat(document.getElementById('target').value);
        const current = parseFloat(document.getElementById('current').value);
        const deadline = document.getElementById('deadline').value;

        if (Goals.editingId) {
            const index = data.goals.findIndex(g => g.id === Goals.editingId);
            if (index !== -1) {
                // Update properties
                data.goals[index] = { ...data.goals[index], title, target, current, deadline };
                // Check completion
                if (current >= target && !data.goals[index].completed) {
                    data.goals[index].completed = true;
                    Utils.showNotification('Goal reached! Congratulations!', 'success');
                }
            }
            Utils.showNotification('Goal updated');
        } else {
            const goal = {
                id: Utils.generateId(),
                title,
                target,
                current,
                deadline,
                completed: current >= target
            };
            data.goals = data.goals || [];
            data.goals.push(goal);
            Utils.showNotification('Goal created');

            if (goal.completed) Utils.showNotification('Goal reached! Congratulations!', 'success');
        }

        Storage.saveData(user.id, data);
        Goals.closeModal();
        Goals.renderGoals();
    },

    handleDeposit: (e) => {
        e.preventDefault();
        const id = document.getElementById('depositGoalId').value;
        const amount = parseFloat(document.getElementById('depositAmount').value);

        if (amount <= 0) return;

        const user = Storage.getCurrentUser();
        const data = Storage.getData(user.id);
        const index = data.goals.findIndex(g => g.id === id);

        if (index !== -1) {
            data.goals[index].current += amount;
            if (data.goals[index].current >= data.goals[index].target && !data.goals[index].completed) {
                data.goals[index].completed = true;
                Utils.showNotification('Goal reached! Congratulations!', 'success');
            } else {
                Utils.showNotification('Deposit added');
            }
            Storage.saveData(user.id, data);
            document.getElementById('depositModal').style.display = 'none';
            Goals.renderGoals();
        }
    },

    deleteGoal: (id) => {
        if (!confirm('Delete this goal?')) return;

        const user = Storage.getCurrentUser();
        const data = Storage.getData(user.id);

        data.goals = data.goals.filter(g => g.id !== id);
        Storage.saveData(user.id, data);
        Utils.showNotification('Goal deleted');
        Goals.renderGoals();
    },

    renderGoals: () => {
        const user = Storage.getCurrentUser();
        const data = Storage.getData(user.id);
        const container = document.getElementById('goalsContainer');
        const noGoals = document.getElementById('noGoals');

        if (!data.goals || data.goals.length === 0) {
            container.innerHTML = '';
            noGoals.style.display = 'block';
            return;
        }

        noGoals.style.display = 'none';
        container.innerHTML = data.goals.map(g => {
            const percent = Math.min((g.current / g.target) * 100, 100);
            let color = 'var(--accent-color)';
            if (g.completed) color = 'var(--secondary-color)';

            // Escape single quotes for calling JS functions
            const safeGoal = JSON.stringify(g).replace(/"/g, '&quot;');

            // Calculate days left
            let daysLeft = '';
            if (g.deadline) {
                const diff = new Date(g.deadline) - new Date();
                const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
                daysLeft = days > 0 ? `${days} days left` : (days === 0 ? 'Due today' : 'Overdue');
            }

            return `
                <div class="card goal-card ${g.completed ? 'completed' : ''}">
                    <i class="fas fa-trophy goal-icon"></i>
                    <div class="text-center mb-2">
                        <div class="progress-circle" style="background: conic-gradient(${color} ${percent * 3.6}deg, var(--bg-body) 0deg);">
                            <div class="progress-inner">
                                ${Math.round(percent)}%
                            </div>
                        </div>
                        <h3>${g.title}</h3>
                        <p style="color:var(--text-secondary); font-size:0.9rem;">${daysLeft}</p>
                    </div>
                    
                    <div class="flex-between mb-2" style="font-size:0.9rem;">
                        <span>${Utils.formatCurrency(g.current)}</span>
                        <span>of ${Utils.formatCurrency(g.target)}</span>
                    </div>

                    <div class="flex gap-1">
                        <button class="btn btn-primary btn-block" style="flex:2" onclick="Goals.openDepositModal('${g.id}')">
                            <i class="fas fa-plus"></i> Add Funds
                        </button>
                        <button class="btn btn-secondary" style="flex:1" onclick='Goals.openModal(${safeGoal})'>
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-danger" style="flex:1" onclick="Goals.deleteGoal('${g.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
             `;
        }).join('');
    }
};

window.Goals = Goals;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', Goals.init);
} else {
    Goals.init();
}
