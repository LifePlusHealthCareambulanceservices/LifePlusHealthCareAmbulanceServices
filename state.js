const State = {
    data: {
        trips: JSON.parse(localStorage.getItem('trips')) || [],
        leads: JSON.parse(localStorage.getItem('leads')) || [],
        alerts: JSON.parse(localStorage.getItem('alerts')) || [],
        reports: JSON.parse(localStorage.getItem('reports')) || [],
        ambulances: JSON.parse(localStorage.getItem('ambulances')) || [{
            id: 'AMB-001',
            status: 'active',
            location: { 
                current: { lat: 20.5937, lng: 78.9629 },
                history: []
            }
        }],
        settings: JSON.parse(localStorage.getItem('settings')) || {
            notifications: true,
            theme: 'light',
            language: 'en'
        }
    },

    initialize() {
        window.addEventListener('storage', this.handleStorageChange.bind(this));
    },

    update(key, value) {
        try {
            if (!(key in this.data)) {
                throw new Error(`Invalid state key: ${key}`);
            }
            this.data[key] = value;
            localStorage.setItem(key, JSON.stringify(value));
            this.notifyListeners(key);
        } catch (error) {
            console.error('State update error:', error);
            Utils.showNotification('Failed to update application state', 'error');
        }
    },

    handleStorageChange(event) {
        if (event.key && this.data.hasOwnProperty(event.key)) {
            this.data[event.key] = JSON.parse(event.newValue);
            this.notifyListeners(event.key);
        }
    },

    get(key) {
        return this.data[key];
    },

    listeners: new Map(),

    subscribe(key, callback) {
        if (!this.listeners.has(key)) {
            this.listeners.set(key, new Set());
        }
        this.listeners.get(key).add(callback);
    },

    notifyListeners(key) {
        if (this.listeners.has(key)) {
            this.listeners.get(key).forEach(callback => callback(this.data[key]));
        }
    }
};

export default State; 