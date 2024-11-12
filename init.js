// Add to the beginning of the file
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
            console.log('ServiceWorker registration successful');
        })
        .catch(err => {
            console.error('ServiceWorker registration failed:', err);
        });
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    App.initialize();
});

const App = {
    initialize() {
        try {
            this.initializeModules();
            this.setupEventListeners();
            console.log('Application initialized successfully');
        } catch (error) {
            console.error('Initialization error:', error);
            Utils.showNotification('Application initialization failed', 'error');
        }
    },

    initializeModules() {
        // Initialize core modules
        Utils.initialize();
        Storage.initialize();
        State.initialize();
        
        // Initialize feature modules
        TripManagement.initialize();
        DataAnalytics.initialize();
        VisualizationTools.initialize();
        FinancialTools.initialize();
        TrackingTools.initialize();
        AutomationTools.initialize();
        LeadManagement.initialize();
        ExportImportTools.initialize();
    },

    setupEventListeners() {
        // Global event listeners
        window.addEventListener('online', () => {
            State.update('isOnline', true);
            Utils.showNotification('Back online', 'success');
        });

        window.addEventListener('offline', () => {
            State.update('isOnline', false);
            Utils.showNotification('Working offline', 'warning');
        });
    }
}; 