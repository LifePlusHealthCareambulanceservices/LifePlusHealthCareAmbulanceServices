const TrackingTools = {
    markers: new Map(),
    
    initialize() {
        if (!this.checkDependencies()) return;
        this.initializeMap();
        this.setupTracking();
        this.setupOfflineSupport();
    },

    setupOfflineSupport() {
        // Cache map tiles for offline use
        if ('caches' in window) {
            caches.open('map-tiles').then(cache => {
                cache.add('https://tile.openstreetmap.org/{z}/{x}/{y}.png');
            });
        }
    },

    checkDependencies() {
        if (typeof L === 'undefined') {
            console.error('Leaflet.js is required but not loaded');
            Utils.showNotification('Map functionality unavailable', 'error');
            return false;
        }
        return true;
    },

    initializeMap() {
        try {
            const mapContainer = document.getElementById('ambulance-movement-map');
            if (!mapContainer) return;

            this.map = L.map(mapContainer).setView([20.5937, 78.9629], 5);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(this.map);
        } catch (error) {
            console.error('Map initialization error:', error);
            Utils.showNotification('Failed to initialize map', 'error');
        }
    },

    setupTracking() {
        const ambulanceSelect = document.getElementById('ambulance-select');
        if (!ambulanceSelect) return;

        ambulanceSelect.addEventListener('change', () => {
            const ambulanceId = ambulanceSelect.value;
            if (ambulanceId) {
                this.trackAmbulance(ambulanceId);
            }
        });
    },

    trackAmbulance(ambulanceId) {
        try {
            if (!this.map) throw new Error('Map not initialized');

            const ambulances = JSON.parse(localStorage.getItem('ambulances')) || [];
            const ambulance = ambulances.find(a => a.id === ambulanceId);
            
            if (!ambulance) throw new Error('Ambulance not found');

            // Clear existing marker
            if (this.markers.has(ambulanceId)) {
                this.markers.get(ambulanceId).remove();
            }

            // Add new marker
            const marker = L.marker([ambulance.location.current.lat, 
                ambulance.location.current.lng]).addTo(this.map);
            this.markers.set(ambulanceId, marker);

            // Simulate movement
            this.startSimulation(ambulanceId);

        } catch (error) {
            console.error('Tracking error:', error);
            Utils.showNotification('Failed to track ambulance', 'error');
        }
    },

    startSimulation(ambulanceId) {
        if (this.simulationInterval) clearInterval(this.simulationInterval);
        
        this.simulationInterval = setInterval(() => {
            const newPosition = this.simulateMovement();
            this.updateAmbulancePosition(ambulanceId, newPosition);
            
            // Update marker position
            const marker = this.markers.get(ambulanceId);
            if (marker) {
                marker.setLatLng([newPosition.lat, newPosition.lng]);
            }
        }, 5000);
    },

    simulateMovement() {
        // Implement movement simulation or real GPS tracking
        return {
            lat: 20.5937 + (Math.random() - 0.5) * 0.01,
            lng: 78.9629 + (Math.random() - 0.5) * 0.01
        };
    },

    updateAmbulancePosition(ambulanceId, position) {
        const ambulances = JSON.parse(localStorage.getItem('ambulances')) || [];
        const index = ambulances.findIndex(a => a.id === ambulanceId);
        if (index !== -1) {
            ambulances[index].location.current = position;
            ambulances[index].location.history.push({
                position,
                timestamp: new Date().toISOString()
            });
            localStorage.setItem('ambulances', JSON.stringify(ambulances));
        }
    }
}; 