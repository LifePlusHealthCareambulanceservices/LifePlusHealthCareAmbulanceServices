const TripManagement = {
    initialize() {
        this.form = document.getElementById('trip-form');
        if (!this.form) return;

        this.setupFormListeners();
        this.setupCalculations();
        this.setupOfflineSupport();
    },

    setupFormListeners() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Status change handler
        const statusSelect = document.getElementById('patient-status');
        const customStatus = document.getElementById('patient-custom-status');
        if (statusSelect && customStatus) {
            statusSelect.addEventListener('change', () => {
                customStatus.style.display = 
                    statusSelect.value === 'custom' ? 'block' : 'none';
            });
        }

        // Setup expense calculations
        const expenseInputs = this.form.querySelectorAll('[id$="-expense"]');
        expenseInputs.forEach(input => {
            input.addEventListener('input', () => this.calculateTotalExpenditure());
        });
    },

    setupCalculations() {
        // Auto-calculate distance based on origin and destination
        const originCity = document.getElementById('origin-city');
        const destCity = document.getElementById('destination-city');
        const distanceField = document.getElementById('trip-distance');

        if (originCity && destCity && distanceField) {
            [originCity, destCity].forEach(input => {
                input.addEventListener('change', () => {
                    if (originCity.value && destCity.value) {
                        this.calculateDistance(originCity.value, destCity.value)
                            .then(distance => {
                                distanceField.value = distance;
                                this.calculateCharges(distance);
                            });
                    }
                });
            });
        }
    },

    async calculateDistance(origin, destination) {
        try {
            // Simple distance simulation for static version
            return Math.floor(Math.random() * 100) + 50; // Returns 50-150 km
        } catch (error) {
            console.error('Distance calculation error:', error);
            return 50; // Default distance
        }
    },

    calculateTotalExpenditure() {
        const expenses = [
            'driver-expense',
            'fuel-expense',
            'maintenance-expense',
            'nursing-staff-expense',
            'misc-expense'
        ];

        const total = expenses.reduce((sum, expenseId) => {
            const input = document.getElementById(expenseId);
            return sum + (Number(input?.value) || 0);
        }, 0);

        const totalElement = document.getElementById('total-expenditure');
        if (totalElement) {
            totalElement.textContent = total.toFixed(2);
        }
    },

    handleSubmit(e) {
        e.preventDefault();
        try {
            const formData = new FormData(this.form);
            const tripData = this.createTripObject(formData);
            
            if (this.validateTripData(tripData)) {
                // Get existing trips from localStorage
                const trips = JSON.parse(localStorage.getItem('trips')) || [];
                trips.push(tripData);
                localStorage.setItem('trips', JSON.stringify(trips));
                
                // Update state
                State.update('trips', trips);
                
                Utils.showNotification('Trip saved successfully', 'success');
                this.form.reset();
            }
        } catch (error) {
            console.error('Trip submission error:', error);
            Utils.showNotification('Failed to save trip', 'error');
        }
    },

    createTripObject(formData) {
        return {
            id: Utils.generateUniqueId('TRIP-'),
            timestamp: new Date().toISOString(),
            patientName: formData.get('patient-name'),
            patientContact: formData.get('patient-contact'),
            status: formData.get('patient-status'),
            customStatus: formData.get('patient-custom-status'),
            origin: {
                hospital: formData.get('origin-hospital'),
                city: formData.get('origin-city')
            },
            destination: {
                hospital: formData.get('destination-hospital'),
                city: formData.get('destination-city')
            },
            staff: {
                driver: formData.get('driver-name'),
                nursing: formData.get('nursing-staff')
            },
            distance: Number(formData.get('trip-distance')),
            charges: Number(formData.get('total-charge')),
            payment: {
                type: formData.get('payment-type'),
                status: 'pending'
            },
            expenses: {
                driver: Number(formData.get('driver-expense')),
                fuel: Number(formData.get('fuel-expense')),
                maintenance: Number(formData.get('maintenance-expense')),
                nursing: Number(formData.get('nursing-staff-expense')),
                misc: Number(formData.get('misc-expense'))
            }
        };
    },

    validateTripData(data) {
        const errors = [];
        
        // Add proper validation logic
        if (!data.patientName) errors.push('Patient name is required');
        if (!data.patientContact) errors.push('Patient contact is required');
        if (!data.origin.hospital) errors.push('Origin hospital is required');
        if (!data.destination.hospital) errors.push('Destination hospital is required');
        if (!data.staff.driver) errors.push('Driver name is required');
        if (!data.staff.nursing) errors.push('Nursing staff is required');
        
        if (errors.length > 0) {
            Utils.showNotification(errors.join('\n'), 'error');
            return false;
        }
        return true;
    },

    calculateCharges(distance) {
        try {
            const baseRate = 50; // Base rate per kilometer
            const charges = baseRate * distance;
            const chargesField = document.getElementById('total-charge');
            if (chargesField) {
                chargesField.value = charges.toFixed(2);
            }
        } catch (error) {
            console.error('Charge calculation error:', error);
            Utils.showNotification('Failed to calculate charges', 'error');
        }
    },

    setupOfflineSupport() {
        // Save form data to localStorage when offline
        window.addEventListener('offline', () => {
            this.form.addEventListener('submit', this.handleOfflineSubmit);
        });

        window.addEventListener('online', () => {
            this.form.removeEventListener('submit', this.handleOfflineSubmit);
            this.processPendingTrips();
        });
    },

    handleOfflineSubmit(e) {
        e.preventDefault();
        const formData = new FormData(this.form);
        const tripData = this.createTripObject(formData);
        
        const pendingTrips = JSON.parse(localStorage.getItem('pendingTrips')) || [];
        pendingTrips.push(tripData);
        localStorage.setItem('pendingTrips', JSON.stringify(pendingTrips));
        
        Utils.showNotification('Trip saved offline', 'info');
        this.form.reset();
    },

    processPendingTrips() {
        const pendingTrips = JSON.parse(localStorage.getItem('pendingTrips')) || [];
        if (pendingTrips.length > 0) {
            pendingTrips.forEach(trip => {
                const trips = JSON.parse(localStorage.getItem('trips')) || [];
                trips.push(trip);
                localStorage.setItem('trips', JSON.stringify(trips));
            });
            localStorage.removeItem('pendingTrips');
            Utils.showNotification('Pending trips processed', 'success');
        }
    }
}; 