const Storage = {
    get: (key) => {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    },

    set: (key, value) => {
        localStorage.setItem(key, JSON.stringify(value));
    },

    remove: (key) => {
        localStorage.removeItem(key);
    },

    // Specific Data Helpers
    getUsers: () => Storage.get('users') || [],
    saveUser: (user) => {
        const users = Storage.getUsers();
        users.push(user);
        Storage.set('users', users);
    },

    getCurrentUser: () => Storage.get('currentUser'),
    setCurrentUser: (user) => Storage.set('currentUser', user),

    getData: (userId) => {
        return Storage.get(`data_${userId}`) || {
            transactions: [],
            budgets: [],
            goals: []
        };
    },

    saveData: (userId, data) => {
        Storage.set(`data_${userId}`, data);
    }
};
