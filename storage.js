const Storage = {
    initialize() {
        try {
            localStorage.setItem('test', 'test');
            localStorage.removeItem('test');
            
            // Initialize default data if not exists
            if (!localStorage.getItem('initialized')) {
                this.initializeDefaultData();
            }
        } catch (error) {
            console.error('Storage not available:', error);
            Utils.showNotification('Storage not available', 'error');
        }
    },

    initializeDefaultData() {
        const defaultData = {
            trips: [],
            leads: [],
            alerts: [],
            reports: [],
            ambulances: [{
                id: 'AMB-001',
                status: 'active',
                location: { lat: 20.5937, lng: 78.9629 }
            }],
            settings: {
                notifications: true,
                theme: 'light',
                language: 'en'
            },
            initialized: true
        };

        Object.entries(defaultData).forEach(([key, value]) => {
            this.save(key, value);
        });
    },

    save(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error('Storage save error:', error);
            Utils.showNotification('Failed to save data', 'error');
        }
    },

    get(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error('Storage get error:', error);
            Utils.showNotification('Failed to retrieve data', 'error');
            return null;
        }
    },

    getAll() {
        const data = {};
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                data[key] = this.get(key);
            }
            return data;
        } catch (error) {
            console.error('Storage getAll error:', error);
            return null;
        }
    },

    remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error('Storage remove error:', error);
        }
    }
}; 