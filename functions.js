// Global State Management with TypeScript-like structure
const state = {
    trips: JSON.parse(localStorage.getItem('trips')) || [],
    leads: JSON.parse(localStorage.getItem('leads')) || [],
    alerts: JSON.parse(localStorage.getItem('alerts')) || [],
    reports: JSON.parse(localStorage.getItem('reports')) || [],
    ambulances: JSON.parse(localStorage.getItem('ambulances')) || initializeAmbulances(),
    financials: JSON.parse(localStorage.getItem('financials')) || [],
    customGraphs: JSON.parse(localStorage.getItem('customGraphs')) || [],
    settings: JSON.parse(localStorage.getItem('settings')) || initializeSettings(),
    currentUser: null,
    systemStatus: {
        isOnline: navigator.onLine,
        lastSync: null,
        pendingUpdates: []
    }
};

// Add type checking to state updates
const stateProxy = new Proxy(state, {
    set: (target, property, value) => {
        // Validate data types before setting
        switch(property) {
            case 'trips':
            case 'leads':
            case 'alerts':
            case 'reports':
            case 'ambulances':
                if (!Array.isArray(value)) {
                    console.error(`${property} must be an array`);
                    return false;
                }
                break;
            case 'settings':
                if (typeof value !== 'object') {
                    console.error('settings must be an object');
                    return false;
                }
                break;
        }
        
        target[property] = value;
        
        // Persist changes to storage
        if (property !== 'systemStatus' && property !== 'currentUser') {
            storage.save(property, value);
        }
        
        return true;
    }
});

// Initialize default settings with detailed configuration
function initializeSettings() {
    return {
        alerts: {
            frequency: 300000, // Check alerts every 5 minutes
            notifications: {
                email: true,
                browser: true,
                mobile: false
            }
        },
        tracking: {
            updateFrequency: 60000, // Update tracking every minute
            retainHistoryDays: 30 // Keep location history for 30 days
        },
        reports: {
            defaultFormat: 'pdf',
            autoGenerate: {
                daily: true,
                weekly: true,
                monthly: true
            }
        },
        display: {
            currency: 'INR',
            dateFormat: 'DD/MM/YYYY',
            timeFormat: '24h'
        }
    };
}

// Initialize ambulance fleet with comprehensive data structure
function initializeAmbulances() {
    return [
        {
            id: 'AMB-001',
            status: 'active',
            maintenance: {
                lastMaintenance: new Date().toISOString(),
                nextMaintenance: calculateNextMaintenance(),
                history: []
            },
            metrics: {
                totalDistance: 0,
                fuelEfficiency: 0,
                tripCount: 0
            },
            location: {
                current: null,
                history: []
            }
        }
        // Add more ambulances as needed
    ];
}

// Core Utility Functions
const utils = {
    generateId: (prefix = '') => {
        return `${prefix}${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    },

    formatCurrency: (amount, options = {}) => {
        const defaults = {
            currency: state.settings.currency.code,
            style: 'currency',
            minimumFractionDigits: 2
        };
        return new Intl.NumberFormat('en-IN', { ...defaults, ...options }).format(amount);
    },

    formatDate: (date, format = state.settings.dateFormat.display) => {
        const d = new Date(date);
        return d.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    validateData: (data, schema) => {
        const errors = [];
        Object.entries(schema).forEach(([field, rules]) => {
            if (rules.required && !data[field]) {
                errors.push(`${field} is required`);
            }
            if (rules.type && typeof data[field] !== rules.type) {
                errors.push(`${field} must be of type ${rules.type}`);
            }
            if (rules.min && data[field] < rules.min) {
                errors.push(`${field} must be at least ${rules.min}`);
            }
            if (rules.max && data[field] > rules.max) {
                errors.push(`${field} must be no more than ${rules.max}`);
            }
        });
        return errors;
    },

    generateUniqueId: (prefix = '') => {
        return `${prefix}${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    },

    refreshAllViews: () => {
        if (document.getElementById('trip-form')) {
            tripManagement.updateTripList();
        }
        if (document.getElementById('analytics-dashboard')) {
            dataAnalytics.updateSummaryStatistics();
            dataAnalytics.updateDisplayedTrips(state.trips);
        }
        if (document.getElementById('lead-dashboard')) {
            leadManagement.updateLeadTracker();
        }
        // Add other view updates as needed
    },

    displayErrors: (errors, containerId = 'error-container') => {
        const container = document.getElementById(containerId) || 
            document.createElement('div');
        container.id = containerId;
        container.className = 'error-container';
        
        container.innerHTML = `
            <ul class="error-list">
                ${errors.map(error => `<li>${error}</li>`).join('')}
            </ul>
        `;
        
        if (!document.getElementById(containerId)) {
            document.body.insertBefore(container, document.body.firstChild);
        }
        
        setTimeout(() => container.remove(), 5000);
    },

    validateField: (field) => {
        const value = field.value.trim();
        const type = field.type;
        const required = field.hasAttribute('required');
        
        if (required && !value) {
            return 'This field is required';
        }
        
        switch(type) {
            case 'email':
                if (value && !value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
                    return 'Invalid email format';
                }
                break;
            case 'tel':
                if (value && !value.match(/^\+?[\d\s-]{10,}$/)) {
                    return 'Invalid phone number';
                }
                break;
            case 'number':
                if (value && isNaN(value)) {
                    return 'Must be a valid number';
                }
                break;
        }
        
        return '';
    },

    showFieldError: (field, error) => {
        const errorElement = field.parentElement.querySelector('.field-error') ||
            document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.textContent = error;
        
        if (!field.parentElement.querySelector('.field-error')) {
            field.parentElement.appendChild(errorElement);
        }
    }
};

// Storage Management
const storage = {
    save: (key, data) => {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error(`Storage error: ${error.message}`);
            return false;
        }
    },

    get: (key) => {
        try {
            return JSON.parse(localStorage.getItem(key));
        } catch (error) {
            console.error(`Retrieval error: ${error.message}`);
            return null;
        }
    },

    remove: (key) => {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error(`Removal error: ${error.message}`);
            return false;
        }
    },

    clear: () => {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error(`Clear error: ${error.message}`);
            return false;
        }
    }
};


// Trip Management Section
const tripManagement = {
    // Trip Form Initialization and Event Handlers
    initialize: () => {
        const tripForm = document.getElementById('trip-form');
        if (tripForm) {
            tripForm.addEventListener('submit', tripManagement.handleSubmission);
            tripManagement.setupFormListeners();
        }
    },

    setupFormListeners: () => {
        const form = document.getElementById('trip-form');
        if (!form) return;

        // Prevent double submission
        form.addEventListener('submit', (e) => {
            const submitButton = form.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.disabled = true;
                setTimeout(() => submitButton.disabled = false, 2000);
            }
        });

        // Add real-time validation
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                const error = tripManagement.validateField(input);
                tripManagement.showFieldError(input, error);
            });
        });

        // Expense calculation listeners
        ['driver-expense', 'fuel-expense', 'maintenance-expense', 
         'nursing-staff-expense', 'misc-expense'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', tripManagement.calculateExpenses);
                element.addEventListener('change', tripManagement.updateProfitMargin);
            }
        });

        // Patient status handling
        const statusSelect = document.getElementById('patient-status');
        const customStatusField = document.getElementById('patient-custom-status');
        if (statusSelect && customStatusField) {
            statusSelect.addEventListener('change', () => {
                customStatusField.style.display = 
                    statusSelect.value === 'custom' ? 'block' : 'none';
            });
        }

        // Distance-based calculations
        const distanceInput = document.getElementById('trip-distance');
        if (distanceInput) {
            distanceInput.addEventListener('input', tripManagement.calculateCharges);
        }

        // Payment type handling
        const paymentType = document.getElementById('payment-type');
        if (paymentType) {
            paymentType.addEventListener('change', tripManagement.handlePaymentTypeChange);
        }
    },

    handleSubmission: (e) => {
        e.preventDefault();
        try {
            const formData = new FormData(e.target);
            
            // Validate form data
            const validationErrors = tripManagement.validateTripData(formData);
            if (validationErrors.length > 0) {
                tripManagement.displayErrors(validationErrors);
                return;
            }

            // Create and save trip
            const tripData = tripManagement.createTripObject(formData);
            if (tripManagement.saveTrip(tripData)) {
                tripManagement.handleSuccessfulSubmission(tripData);
            } else {
                throw new Error('Failed to save trip data');
            }
        } catch (error) {
            console.error('Trip submission error:', error);
            utils.showNotification('Failed to submit trip', 'error');
        }
    },

    validateTripData: (formData) => {
        const errors = [];
        const requiredFields = {
            'patient-name': 'Patient Name',
            'patient-contact': 'Patient Contact',
            'patient-status': 'Patient Status',
            'origin-hospital': 'Origin Hospital',
            'origin-city': 'Origin City',
            'destination-hospital': 'Destination Hospital',
            'destination-city': 'Destination City',
            'driver-name': 'Driver Name',
            'nursing-staff': 'Nursing Staff'
        };

        // Check required fields
        Object.entries(requiredFields).forEach(([field, label]) => {
            if (!formData.get(field)) {
                errors.push(`${label} is required`);
            }
        });

        // Validate numeric fields
        const numericFields = ['trip-distance', 'total-charge'];
        numericFields.forEach(field => {
            const value = parseFloat(formData.get(field));
            if (isNaN(value) || value <= 0) {
                errors.push(`Invalid ${field.replace('-', ' ')}`);
            }
        });

        return errors;
    },

    createTripObject: (formData) => {
        return {
            id: utils.generateId('TRIP-'),
            timestamp: {
                created: new Date().toISOString(),
                updated: new Date().toISOString()
            },
            patient: {
                name: formData.get('patient-name'),
                contact: formData.get('patient-contact'),
                status: formData.get('patient-status'),
                customStatus: formData.get('patient-custom-status') || null
            },
            locations: {
                origin: {
                    hospital: formData.get('origin-hospital'),
                    city: formData.get('origin-city'),
                    coordinates: null // To be implemented with geocoding
                },
                destination: {
                    hospital: formData.get('destination-hospital'),
                    city: formData.get('destination-city'),
                    coordinates: null
                }
            },
            staff: {
                driver: formData.get('driver-name'),
                nursing: formData.get('nursing-staff'),
                additionalStaff: []
            },
            tripDetails: {
                distance: parseFloat(formData.get('trip-distance')),
                duration: null, // To be calculated
                startTime: null,
                endTime: null,
                status: 'scheduled'
            },
            financial: {
                charges: parseFloat(formData.get('total-charge')),
                payment: {
                    type: formData.get('payment-type'),
                    status: 'pending',
                    history: []
                },
                expenses: {
                    driver: parseFloat(formData.get('driver-expense')) || 0,
                    fuel: parseFloat(formData.get('fuel-expense')) || 0,
                    maintenance: parseFloat(formData.get('maintenance-expense')) || 0,
                    nursingStaff: parseFloat(formData.get('nursing-staff-expense')) || 0,
                    miscellaneous: parseFloat(formData.get('misc-expense')) || 0
                },
                allocation: {
                    savings: parseFloat(formData.get('savings')) || 0,
                    futureProjects: parseFloat(formData.get('future-projects')) || 0
                }
            },
            metrics: {
                profitMargin: 0, // To be calculated
                efficiency: 0,
                customerSatisfaction: null
            }
        };
    },

    saveTrip: (tripData) => {
        try {
            // Calculate derived values
            tripData.metrics.profitMargin = tripManagement.calculateProfitMargin(tripData);
            
            // Update state
            state.trips.push(tripData);
            
            // Save to storage
            return storage.save('trips', state.trips);
        } catch (error) {
            console.error('Error saving trip:', error);
            return false;
        }
    },

    calculateExpenses: () => {
        const expenseTypes = ['driver', 'fuel', 'maintenance', 'nursing-staff', 'misc'];
        const total = expenseTypes.reduce((sum, type) => {
            const value = parseFloat(document.getElementById(`${type}-expense`).value) || 0;
            return sum + value;
        }, 0);

        document.getElementById('total-expenditure').textContent = 
            utils.formatCurrency(total);
        
        return total;
    },

    calculateCharges: (e) => {
        const distance = parseFloat(e.target.value) || 0;
        const baseRate = 50; // Base rate per kilometer
        const minimumCharge = 500; // Minimum charge
        
        let suggestedCharge = Math.max(
            distance * baseRate,
            minimumCharge
        );

        // Add peak hour charges if applicable
        if (tripManagement.isPeakHour()) {
            suggestedCharge *= 1.2; // 20% peak hour surcharge
        }

        document.getElementById('total-charge').value = suggestedCharge.toFixed(2);
        tripManagement.updateProfitMargin();
    },

    isPeakHour: () => {
        const hour = new Date().getHours();
        return (hour >= 7 && hour <= 10) || (hour >= 17 && hour <= 20);
    },

    calculateProfitMargin: (tripData) => {
        const totalExpenses = Object.values(tripData.financial.expenses)
            .reduce((sum, expense) => sum + expense, 0);
        const revenue = tripData.financial.charges;
        
        return revenue > 0 ? 
            ((revenue - totalExpenses) / revenue) * 100 : 0;
    },

    handleSuccessfulSubmission: (tripData) => {
        // Update related systems
        tripManagement.updateAmbulanceStatus(tripData);
        tripManagement.updateFinancialRecords(tripData);
        tripManagement.scheduleNotifications(tripData);

        // Reset form
        document.getElementById('trip-form').reset();
        
        // Show success message
        tripManagement.showNotification('Trip successfully recorded!', 'success');
    },

    showNotification: (message, type = 'info') => {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 5000);
    }
};


// Data Analytics & Reporting Section
const dataAnalytics = {
    initialize: () => {
        dataAnalytics.setupDashboard();
        dataAnalytics.initializeCharts();
        dataAnalytics.setupSearchAndFilters();
        dataAnalytics.updateSummaryStatistics();
        
        // Set up auto-refresh
        setInterval(() => {
            dataAnalytics.refreshDashboard();
        }, 300000); // Refresh every 5 minutes
    },

    setupDashboard: () => {
        const tripHistoryTable = document.getElementById('trip-history-table');
        if (tripHistoryTable) {
            dataAnalytics.populateTripHistory();
            dataAnalytics.setupTableSorting(tripHistoryTable);
            dataAnalytics.setupPagination();
            dataAnalytics.setupExportControls();
        }
    },

    setupSearchAndFilters: () => {
        // Search functionality
        const searchInput = document.getElementById('search-trips');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                dataAnalytics.filterTrips({ searchTerm: e.target.value });
            });
        }

        // Filter dropdown
        const filterSelect = document.getElementById('filter-trips');
        if (filterSelect) {
            filterSelect.addEventListener('change', (e) => {
                dataAnalytics.filterTrips({ filterType: e.target.value });
            });
        }

        // Date range filters
        const dateInputs = ['date-from', 'date-to'].map(id => 
            document.getElementById(id));
        
        dateInputs.forEach(input => {
            if (input) {
                input.addEventListener('change', () => {
                    dataAnalytics.filterTrips({
                        dateRange: {
                            from: dateInputs[0].value,
                            to: dateInputs[1].value
                        }
                    });
                });
            }
        });
    },

    filterTrips: (filters = {}) => {
        let filteredTrips = state.trips;

        // Apply search filter
        if (filters.searchTerm) {
            const searchTerm = filters.searchTerm.toLowerCase();
            filteredTrips = filteredTrips.filter(trip => 
                trip.patient.name.toLowerCase().includes(searchTerm) ||
                trip.locations.destination.city.toLowerCase().includes(searchTerm) ||
                trip.staff.driver.toLowerCase().includes(searchTerm)
            );
        }

        // Apply date range filter
        if (filters.dateRange) {
            const fromDate = new Date(filters.dateRange.from);
            const toDate = new Date(filters.dateRange.to);
            
            filteredTrips = filteredTrips.filter(trip => {
                const tripDate = new Date(trip.timestamp.created);
                return tripDate >= fromDate && tripDate <= toDate;
            });
        }

        // Apply specific filters
        if (filters.filterType) {
            switch (filters.filterType) {
                case 'ambulance':
                    // Filter by ambulance number
                    break;
                case 'city':
                    // Filter by city
                    break;
                case 'hospital':
                    // Filter by hospital
                    break;
                // Add more filter cases
            }
        }

        dataAnalytics.updateDisplayedTrips(filteredTrips);
    },

    updateDisplayedTrips: (trips) => {
        const tbody = document.querySelector('#trip-history-table tbody');
        if (!tbody) return;

        // Clear existing rows
        tbody.innerHTML = '';

        // Apply pagination
        const currentPage = state.settings.pagination.currentPage || 1;
        const itemsPerPage = state.settings.pagination.itemsPerPage;
        const startIndex = (currentPage - 1) * itemsPerPage;
        const paginatedTrips = trips.slice(startIndex, startIndex + itemsPerPage);

        // Create and append new rows
        paginatedTrips.forEach(trip => {
            const row = dataAnalytics.createTripRow(trip);
            tbody.appendChild(row);
        });

        // Update pagination controls
        dataAnalytics.updatePaginationControls(trips.length);
        
        // Update summary statistics
        dataAnalytics.updateSummaryStatistics(trips);
    },

    createTripRow: (trip) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td data-sort="date">${utils.formatDate(trip.timestamp.created)}</td>
            <td data-sort="invoice">${trip.id}</td>
            <td data-sort="patient">${trip.patient.name}</td>
            <td data-sort="destination">${trip.locations.destination.hospital}, 
                ${trip.locations.destination.city}</td>
            <td data-sort="driver">${trip.staff.driver}</td>
            <td data-sort="distance">${trip.tripDetails.distance} km</td>
            <td data-sort="charges">${utils.formatCurrency(trip.financial.charges)}</td>
            <td>
                <button onclick="dataAnalytics.viewTripDetails('${trip.id}')" 
                    class="btn-action">View</button>
                <button onclick="dataAnalytics.exportTripDetails('${trip.id}')" 
                    class="btn-action">Export</button>
            </td>
        `;
        return row;
    },

    viewTripDetails: (tripId) => {
        const trip = state.trips.find(t => t.id === tripId);
        if (!trip) return;

        // Create modal with trip details
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>Trip Details</h2>
                <div class="trip-details">
                    ${dataAnalytics.generateTripDetailsHTML(trip)}
                </div>
                <button onclick="this.closest('.modal').remove()">Close</button>
            </div>
        `;
        document.body.appendChild(modal);
    },

    generateTripDetailsHTML: (trip) => {
        return `
            <div class="detail-section">
                <h3>Patient Information</h3>
                <p>Name: ${trip.patient.name}</p>
                <p>Contact: ${trip.patient.contact}</p>
                <p>Status: ${trip.patient.status}</p>
            </div>
            <div class="detail-section">
                <h3>Trip Information</h3>
                <p>From: ${trip.locations.origin.hospital}, ${trip.locations.origin.city}</p>
                <p>To: ${trip.locations.destination.hospital}, ${trip.locations.destination.city}</p>
                <p>Distance: ${trip.tripDetails.distance} km</p>
                <p>Status: ${trip.tripDetails.status}</p>
            </div>
            <div class="detail-section">
                <h3>Financial Details</h3>
                <p>Total Charges: ${utils.formatCurrency(trip.financial.charges)}</p>
                <p>Payment Status: ${trip.financial.payment.status}</p>
                <p>Profit Margin: ${trip.metrics.profitMargin.toFixed(2)}%</p>
            </div>
        `;
    },

    updateSummaryStatistics: (trips = state.trips) => {
        const stats = dataAnalytics.calculateStatistics(trips);
        
        // Update DOM elements
        document.getElementById('total-trips-count').textContent = stats.totalTrips;
        document.getElementById('avg-distance').textContent = 
            `${stats.averageDistance.toFixed(2)} km`;
        document.getElementById('total-revenue').textContent = 
            utils.formatCurrency(stats.totalRevenue);
        document.getElementById('avg-trip-cost').textContent = 
            utils.formatCurrency(stats.averageCost);
    },

    calculateStatistics: (trips) => {
        return {
            totalTrips: trips.length,
            averageDistance: trips.reduce((sum, trip) => 
                sum + trip.tripDetails.distance, 0) / trips.length || 0,
            totalRevenue: trips.reduce((sum, trip) => 
                sum + trip.financial.charges, 0),
            averageCost: trips.reduce((sum, trip) => {
                const totalExpenses = Object.values(trip.financial.expenses)
                    .reduce((a, b) => a + b, 0);
                return sum + totalExpenses;
            }, 0) / trips.length || 0
        };
    }
};


// Visualization Tools Section
const visualizationTools = {
    initialize: () => {
        if (typeof Chart === 'undefined') {
            console.error('Chart.js is required but not loaded');
            utils.showNotification('Visualization tools unavailable', 'error');
            return;
        }
        visualizationTools.setupDashboardCharts();
        visualizationTools.setupCustomGraphs();
        visualizationTools.setupComparisonReports();
        
        // Set up auto-refresh for charts
        setInterval(() => {
            visualizationTools.refreshAllCharts();
        }, 300000); // Refresh every 5 minutes
    },

    setupDashboardCharts: () => {
        // Initialize all dashboard charts
        const charts = {
            income: visualizationTools.createIncomeChart(),
            expense: visualizationTools.createExpenseChart(),
            trips: visualizationTools.createTripChart(),
            utilization: visualizationTools.createUtilizationChart(),
            patientDistribution: visualizationTools.createPatientDistributionChart()
        };

        state.charts = charts; // Store chart references in state
    },

    createIncomeChart: () => {
        const ctx = document.getElementById('income-chart')?.getContext('2d');
        if (!ctx) return null;

        const incomeData = visualizationTools.processIncomeData();
        return new Chart(ctx, {
            type: 'line',
            data: {
                labels: incomeData.labels,
                datasets: [{
                    label: 'Monthly Income',
                    data: incomeData.values,
                    borderColor: '#4CAF50',
                    fill: false,
                    tension: 0.4
                }]
            },
            options: visualizationTools.getChartOptions('income')
        });
    },

    createExpenseChart: () => {
        const ctx = document.getElementById('expense-chart')?.getContext('2d');
        if (!ctx) return null;

        const expenseData = visualizationTools.processExpenseData();
        return new Chart(ctx, {
            type: 'pie',
            data: {
                labels: expenseData.labels,
                datasets: [{
                    data: expenseData.values,
                    backgroundColor: visualizationTools.getChartColors(),
                    borderWidth: 1
                }]
            },
            options: visualizationTools.getChartOptions('expense')
        });
    },

    createTripChart: () => {
        const ctx = document.getElementById('trip-chart')?.getContext('2d');
        if (!ctx) return null;

        const tripData = visualizationTools.processTripData();
        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: tripData.labels,
                datasets: [{
                    label: 'Number of Trips',
                    data: tripData.values,
                    backgroundColor: '#2196F3'
                }]
            },
            options: visualizationTools.getChartOptions('trips')
        });
    },

    processIncomeData: (period = 'monthly') => {
        const groupedData = state.trips.reduce((acc, trip) => {
            const date = new Date(trip.timestamp.created);
            const key = visualizationTools.getDateKey(date, period);
            acc[key] = (acc[key] || 0) + trip.financial.charges;
            return acc;
        }, {});

        return {
            labels: Object.keys(groupedData),
            values: Object.values(groupedData)
        };
    },

    processExpenseData: () => {
        const expenses = state.trips.reduce((acc, trip) => {
            Object.entries(trip.financial.expenses).forEach(([category, amount]) => {
                acc[category] = (acc[category] || 0) + amount;
            });
            return acc;
        }, {});

        return {
            labels: Object.keys(expenses).map(key => key.charAt(0).toUpperCase() + key.slice(1)),
            values: Object.values(expenses)
        };
    },

    setupCustomGraphs: () => {
        const form = document.getElementById('custom-graph-form');
        if (form) {
            form.addEventListener('submit', visualizationTools.handleCustomGraphGeneration);
        }

        // Setup graph type change handler
        const graphTypeSelect = document.getElementById('graph-type');
        if (graphTypeSelect) {
            graphTypeSelect.addEventListener('change', visualizationTools.updateGraphOptions);
        }
    },

    handleCustomGraphGeneration: (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        const config = {
            type: formData.get('graph-type'),
            data: formData.get('graph-data'),
            period: formData.get('graph-period'),
            startDate: formData.get('graph-start-date'),
            endDate: formData.get('graph-end-date')
        };

        const processedData = visualizationTools.processCustomGraphData(config);
        visualizationTools.renderCustomGraph(processedData, config);
    },

    processCustomGraphData: (config) => {
        let filteredData = state.trips;
        
        // Apply date range filter
        if (config.startDate && config.endDate) {
            filteredData = filteredData.filter(trip => {
                const tripDate = new Date(trip.timestamp.created);
                return tripDate >= new Date(config.startDate) && 
                       tripDate <= new Date(config.endDate);
            });
        }

        // Process data based on type
        switch (config.data) {
            case 'revenue':
                return visualizationTools.processIncomeData(config.period);
            case 'trips':
                return visualizationTools.processTripData(config.period);
            case 'expenditure':
                return visualizationTools.processExpenseData();
            default:
                return { labels: [], values: [] };
        }
    },

    renderCustomGraph: (data, config) => {
        const ctx = document.getElementById('custom-graph')?.getContext('2d');
        if (!ctx) return;

        // Destroy existing chart if any
        if (state.customChart) {
            state.customChart.destroy();
        }

        state.customChart = new Chart(ctx, {
            type: config.type,
            data: {
                labels: data.labels,
                datasets: [{
                    label: config.data.charAt(0).toUpperCase() + config.data.slice(1),
                    data: data.values,
                    backgroundColor: config.type === 'line' ? 
                        '#4CAF50' : visualizationTools.getChartColors(),
                    borderColor: config.type === 'line' ? '#4CAF50' : undefined,
                    fill: config.type === 'line' ? false : undefined
                }]
            },
            options: visualizationTools.getChartOptions(config.data)
        });
    },

    setupComparisonReports: () => {
        const comparisonForm = document.getElementById('comparison-form');
        if (comparisonForm) {
            comparisonForm.addEventListener('submit', 
                visualizationTools.handleComparisonReport);
        }
    },

    getChartColors: () => [
        '#4CAF50', '#2196F3', '#FFC107', '#E91E63',
        '#9C27B0', '#00BCD4', '#FF5722', '#795548'
    ],

    getChartOptions: (type) => {
        const baseOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            }
        };

        switch (type) {
            case 'income':
                return {
                    ...baseOptions,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: value => utils.formatCurrency(value)
                            }
                        }
                    }
                };
            case 'trips':
                return {
                    ...baseOptions,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1
                            }
                        }
                    }
                };
            default:
                return baseOptions;
        }
    }
};


// Financial Tools and Reports Section
const financialTools = {
    initialize: () => {
        financialTools.setupFinancialTracking();
        financialTools.setupTaxReporting();
        financialTools.setupProfitabilityAnalysis();
        financialTools.initializeFinancialDashboard();
        
        // Set up auto-refresh
        setInterval(() => {
            financialTools.refreshFinancialData();
        }, 300000); // Refresh every 5 minutes
    },

    setupFinancialTracking: () => {
        const trackingPeriod = document.getElementById('tracking-period');
        const startDate = document.getElementById('tracking-start-date');
        const endDate = document.getElementById('tracking-end-date');
        const generateButton = document.getElementById('generate-tracking');

        if (trackingPeriod) {
            trackingPeriod.addEventListener('change', (e) => {
                const showCustomDates = e.target.value === 'custom';
                startDate.style.display = showCustomDates ? 'block' : 'none';
                endDate.style.display = showCustomDates ? 'block' : 'none';
            });
        }

        if (generateButton) {
            generateButton.addEventListener('click', () => {
                const period = trackingPeriod.value;
                const dateRange = period === 'custom' ? {
                    start: startDate.value,
                    end: endDate.value
                } : financialTools.getDateRangeForPeriod(period);

                financialTools.generateFinancialReport(dateRange);
            });
        }
    },

    getDateRangeForPeriod: (period) => {
        const now = new Date();
        const start = new Date();

        switch (period) {
            case 'daily':
                start.setHours(0, 0, 0, 0);
                break;
            case 'weekly':
                start.setDate(now.getDate() - 7);
                break;
            case 'monthly':
                start.setMonth(now.getMonth() - 1);
                break;
            case 'quarterly':
                start.setMonth(now.getMonth() - 3);
                break;
            case 'yearly':
                start.setFullYear(now.getFullYear() - 1);
                break;
        }

        return { start, end: now };
    },

    generateFinancialReport: (dateRange) => {
        const financialData = financialTools.calculateFinancialMetrics(dateRange);
        financialTools.displayFinancialReport(financialData);
        financialTools.updateFinancialCharts(financialData);
        
        // Save report to history
        financialTools.saveReportToHistory(financialData);
    },

    calculateFinancialMetrics: (dateRange) => {
        const relevantTrips = state.trips.filter(trip => {
            const tripDate = new Date(trip.timestamp.created);
            return tripDate >= dateRange.start && tripDate <= dateRange.end;
        });

        return {
            period: {
                start: dateRange.start,
                end: dateRange.end
            },
            revenue: {
                total: relevantTrips.reduce((sum, trip) => sum + trip.financial.charges, 0),
                byCategory: financialTools.calculateRevenueByCategory(relevantTrips)
            },
            expenses: {
                total: relevantTrips.reduce((sum, trip) => {
                    return sum + Object.values(trip.financial.expenses)
                        .reduce((a, b) => a + b, 0);
                }, 0),
                byCategory: financialTools.calculateExpensesByCategory(relevantTrips)
            },
            profitability: {
                grossProfit: 0, // Calculated below
                netProfit: 0,
                margins: {
                    gross: 0,
                    net: 0
                }
            },
            taxes: financialTools.calculateTaxLiability(relevantTrips),
            cashFlow: financialTools.calculateCashFlow(relevantTrips),
            metrics: {
                tripCount: relevantTrips.length,
                averageRevenuePerTrip: 0,
                averageProfitPerTrip: 0
            }
        };
    },

    calculateRevenueByCategory: (trips) => {
        return trips.reduce((acc, trip) => {
            const category = trip.patient.status;
            acc[category] = (acc[category] || 0) + trip.financial.charges;
            return acc;
        }, {});
    },

    calculateExpensesByCategory: (trips) => {
        return trips.reduce((acc, trip) => {
            Object.entries(trip.financial.expenses).forEach(([category, amount]) => {
                acc[category] = (acc[category] || 0) + amount;
            });
            return acc;
        }, {});
    },

    calculateTaxLiability: (trips) => {
        const totalRevenue = trips.reduce((sum, trip) => 
            sum + trip.financial.charges, 0);
        const totalExpenses = trips.reduce((sum, trip) => 
            sum + Object.values(trip.financial.expenses)
                .reduce((a, b) => a + b, 0), 0);
        
        const taxableIncome = totalRevenue - totalExpenses;
        const taxRate = 0.18; // 18% GST
        
        return {
            taxableIncome,
            estimatedTax: taxableIncome * taxRate,
            breakdown: {
                gst: taxableIncome * taxRate,
                otherTaxes: 0 // Add other tax calculations as needed
            }
        };
    },

    calculateCashFlow: (trips) => {
        const cashFlowByDate = trips.reduce((acc, trip) => {
            const date = trip.timestamp.created.split('T')[0];
            
            if (!acc[date]) {
                acc[date] = {
                    inflow: 0,
                    outflow: 0,
                    net: 0
                };
            }

            acc[date].inflow += trip.financial.charges;
            acc[date].outflow += Object.values(trip.financial.expenses)
                .reduce((a, b) => a + b, 0);
            acc[date].net = acc[date].inflow - acc[date].outflow;
            
            return acc;
        }, {});

        return {
            daily: cashFlowByDate,
            summary: {
                totalInflow: Object.values(cashFlowByDate)
                    .reduce((sum, day) => sum + day.inflow, 0),
                totalOutflow: Object.values(cashFlowByDate)
                    .reduce((sum, day) => sum + day.outflow, 0),
                netCashFlow: Object.values(cashFlowByDate)
                    .reduce((sum, day) => sum + day.net, 0)
            }
        };
    },

    displayFinancialReport: (data) => {
        const table = document.getElementById('financial-tracking-table');
        if (!table) return;

        table.innerHTML = `
            <thead>
                <tr>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Percentage</th>
                </tr>
            </thead>
            <tbody>
                ${financialTools.generateFinancialTableRows(data)}
            </tbody>
            <tfoot>
                ${financialTools.generateFinancialTableSummary(data)}
            </tfoot>
        `;
    },

    generateFinancialTableRows: (data) => {
        let rows = '';
        
        // Revenue breakdown
        Object.entries(data.revenue.byCategory).forEach(([category, amount]) => {
            const percentage = (amount / data.revenue.total * 100).toFixed(2);
            rows += `
                <tr>
                    <td>Revenue - ${category}</td>
                    <td>${utils.formatCurrency(amount)}</td>
                    <td>${percentage}%</td>
                </tr>
            `;
        });

        // Expense breakdown
        Object.entries(data.expenses.byCategory).forEach(([category, amount]) => {
            const percentage = (amount / data.expenses.total * 100).toFixed(2);
            rows += `
                <tr>
                    <td>Expense - ${category}</td>
                    <td>${utils.formatCurrency(amount)}</td>
                    <td>${percentage}%</td>
                </tr>
            `;
        });

        return rows;
    },

    generateFinancialTableSummary: (data) => {
        const netProfit = data.revenue.total - data.expenses.total;
        const profitMargin = (netProfit / data.revenue.total * 100).toFixed(2);
        
        return `
            <tr class="summary-row">
                <td>Total Revenue</td>
                <td>${utils.formatCurrency(data.revenue.total)}</td>
                <td>100%</td>
            </tr>
            <tr class="summary-row">
                <td>Total Expenses</td>
                <td>${utils.formatCurrency(data.expenses.total)}</td>
                <td>${((data.expenses.total / data.revenue.total) * 100).toFixed(2)}%</td>
            </tr>
            <tr class="summary-row highlight">
                <td>Net Profit</td>
                <td>${utils.formatCurrency(netProfit)}</td>
                <td>${profitMargin}%</td>
            </tr>
        `;
    },

    setupTaxReporting: () => {
        const taxReportBtn = document.getElementById('generate-tax-report');
        const complianceReportBtn = document.getElementById('generate-compliance-report');

        if (taxReportBtn) {
            taxReportBtn.addEventListener('click', () => {
                const taxReport = financialTools.generateTaxReport();
                financialTools.displayTaxReport(taxReport);
            });
        }

        if (complianceReportBtn) {
            complianceReportBtn.addEventListener('click', () => {
                const complianceReport = financialTools.generateComplianceReport();
                financialTools.displayComplianceReport(complianceReport);
            });
        }
    },

    generateTaxReport: () => {
        const currentYear = new Date().getFullYear();
        const yearlyTrips = state.trips.filter(trip => {
            const tripYear = new Date(trip.timestamp.created).getFullYear();
            return tripYear === currentYear;
        });

        return {
            year: currentYear,
            quarters: financialTools.calculateQuarterlyTaxes(yearlyTrips),
            annual: {
                revenue: yearlyTrips.reduce((sum, trip) => sum + trip.financial.charges, 0),
                expenses: yearlyTrips.reduce((sum, trip) => {
                    return sum + Object.values(trip.financial.expenses)
                        .reduce((a, b) => a + b, 0);
                }, 0),
                taxableIncome: 0, // Calculated below
                gst: 0,
                tds: 0,
                otherTaxes: 0,
                totalTaxLiability: 0
            }
        };
    },

    calculateQuarterlyTaxes: (trips) => {
        const quarters = {
            Q1: { months: [0, 1, 2], trips: [], taxes: {} },
            Q2: { months: [3, 4, 5], trips: [], taxes: {} },
            Q3: { months: [6, 7, 8], trips: [], taxes: {} },
            Q4: { months: [9, 10, 11], trips: [], taxes: {} }
        };

        // Sort trips into quarters
        trips.forEach(trip => {
            const month = new Date(trip.timestamp.created).getMonth();
            const quarter = Object.keys(quarters).find(q => 
                quarters[q].months.includes(month)
            );
            if (quarter) {
                quarters[quarter].trips.push(trip);
            }
        });

        // Calculate taxes for each quarter
        Object.keys(quarters).forEach(quarter => {
            const quarterTrips = quarters[quarter].trips;
            quarters[quarter].taxes = {
                revenue: quarterTrips.reduce((sum, trip) => 
                    sum + trip.financial.charges, 0),
                expenses: quarterTrips.reduce((sum, trip) => 
                    sum + Object.values(trip.financial.expenses)
                        .reduce((a, b) => a + b, 0), 0),
                gst: 0,
                tds: 0
            };

            // Calculate GST (18%)
            quarters[quarter].taxes.gst = 
                quarters[quarter].taxes.revenue * 0.18;

            // Calculate TDS (2%)
            quarters[quarter].taxes.tds = 
                quarters[quarter].taxes.revenue * 0.02;
        });

        return quarters;
    },

    setupProfitabilityAnalysis: () => {
        const profitabilityTable = document.getElementById('ambulance-profitability-table');
        if (profitabilityTable) {
            financialTools.updateProfitabilityAnalysis();
        }
    },

    updateProfitabilityAnalysis: () => {
        const profitabilityData = financialTools.calculateProfitabilityMetrics();
        financialTools.displayProfitabilityAnalysis(profitabilityData);
    },

    calculateProfitabilityMetrics: () => {
        const profitabilityByAmbulance = state.ambulances.map(ambulance => {
            const ambulanceTrips = state.trips.filter(trip => 
                trip.ambulanceId === ambulance.id
            );

            const metrics = {
                ambulanceId: ambulance.id,
                registrationNumber: ambulance.registrationNumber,
                totalTrips: ambulanceTrips.length,
                totalRevenue: ambulanceTrips.reduce((sum, trip) => 
                    sum + trip.financial.charges, 0),
                totalExpenses: ambulanceTrips.reduce((sum, trip) => 
                    sum + Object.values(trip.financial.expenses)
                        .reduce((a, b) => a + b, 0), 0),
                utilization: (ambulanceTrips.length / state.trips.length) * 100,
                profitMargin: 0
            };

            // Calculate profit margin
            metrics.profitMargin = metrics.totalRevenue > 0 ? 
                ((metrics.totalRevenue - metrics.totalExpenses) / 
                    metrics.totalRevenue * 100) : 0;

            return metrics;
        });

        return {
            byAmbulance: profitabilityByAmbulance,
            overall: {
                totalRevenue: profitabilityByAmbulance.reduce((sum, amb) => 
                    sum + amb.totalRevenue, 0),
                totalExpenses: profitabilityByAmbulance.reduce((sum, amb) => 
                    sum + amb.totalExpenses, 0),
                averageProfitMargin: profitabilityByAmbulance.reduce((sum, amb) => 
                    sum + amb.profitMargin, 0) / profitabilityByAmbulance.length
            }
        };
    },

    displayProfitabilityAnalysis: (data) => {
        const table = document.getElementById('ambulance-profitability-table');
        if (!table) return;

        table.innerHTML = `
            <thead>
                <tr>
                    <th>Ambulance</th>
                    <th>Total Trips</th>
                    <th>Revenue</th>
                    <th>Expenses</th>
                    <th>Profit Margin</th>
                    <th>Utilization</th>
                </tr>
            </thead>
            <tbody>
                ${data.byAmbulance.map(ambulance => `
                    <tr>
                        <td>${ambulance.registrationNumber}</td>
                        <td>${ambulance.totalTrips}</td>
                        <td>${utils.formatCurrency(ambulance.totalRevenue)}</td>
                        <td>${utils.formatCurrency(ambulance.totalExpenses)}</td>
                        <td>${ambulance.profitMargin.toFixed(2)}%</td>
                        <td>${ambulance.utilization.toFixed(2)}%</td>
                    </tr>
                `).join('')}
            </tbody>
            <tfoot>
                <tr>
                    <td colspan="2">Overall</td>
                    <td>${utils.formatCurrency(data.overall.totalRevenue)}</td>
                    <td>${utils.formatCurrency(data.overall.totalExpenses)}</td>
                    <td>${data.overall.averageProfitMargin.toFixed(2)}%</td>
                    <td>100%</td>
                </tr>
            </tfoot>
        `;
    }
};


// Tracking Tools Section
const trackingTools = {
    initialize: () => {
        if (typeof google === 'undefined' || !google.maps) {
            console.error('Google Maps is required but not loaded');
            utils.showNotification('Tracking tools unavailable', 'error');
            return;
        }
        trackingTools.setupAmbulanceTracking();
        trackingTools.initializeRealTimeStatus();
        trackingTools.setupGeolocationTracking();
        trackingTools.initializeMovementHistory();

        // Set up periodic updates
        setInterval(() => {
            trackingTools.updateAllAmbulanceLocations();
        }, state.settings.maps.updateFrequency);
    },

    setupAmbulanceTracking: () => {
        // Initialize map
        const mapOptions = {
            center: state.settings.maps.defaultCenter,
            zoom: state.settings.maps.defaultZoom
        };
        
        const map = new google.maps.Map(
            document.getElementById('ambulance-movement-map'), 
            mapOptions
        );

        // Store map reference in state
        state.map = map;
        state.markers = new Map();

        // Initialize markers for all ambulances
        state.ambulances.forEach(ambulance => {
            trackingTools.createAmbulanceMarker(ambulance, map);
        });

        // Setup ambulance selector
        const ambulanceSelect = document.getElementById('ambulance-select');
        if (ambulanceSelect) {
            ambulanceSelect.addEventListener('change', (e) => {
                trackingTools.focusAmbulance(e.target.value);
            });
        }
    },

    createAmbulanceMarker: (ambulance, map) => {
        const marker = new google.maps.Marker({
            position: ambulance.location.current,
            map: map,
            title: `Ambulance ${ambulance.registrationNumber}`,
            icon: trackingTools.getAmbulanceIcon(ambulance.status)
        });

        // Add info window
        const infoWindow = new google.maps.InfoWindow({
            content: trackingTools.createInfoWindowContent(ambulance)
        });

        marker.addListener('click', () => {
            infoWindow.open(map, marker);
        });

        state.markers.set(ambulance.id, {
            marker: marker,
            infoWindow: infoWindow
        });
    },

    getAmbulanceIcon: (status) => {
        const icons = {
            available: 'green-ambulance.png',
            busy: 'red-ambulance.png',
            maintenance: 'yellow-ambulance.png'
        };
        return `icons/${icons[status] || icons.available}`;
    },

    createInfoWindowContent: (ambulance) => {
        return `
            <div class="ambulance-info">
                <h3>Ambulance ${ambulance.registrationNumber}</h3>
                <p>Status: ${ambulance.status}</p>
                <p>Driver: ${ambulance.crew.driver || 'Not assigned'}</p>
                <p>Last Updated: ${utils.formatDate(ambulance.location.lastUpdate)}</p>
                <button onclick="trackingTools.showAmbulanceDetails('${ambulance.id}')">
                    View Details
                </button>
            </div>
        `;
    },

    updateAmbulanceLocation: (ambulanceId, newLocation) => {
        const ambulance = state.ambulances.find(a => a.id === ambulanceId);
        if (!ambulance) return;

        // Update ambulance location
        ambulance.location.current = newLocation;
        ambulance.location.history.push({
            position: newLocation,
            timestamp: new Date().toISOString()
        });
        ambulance.location.lastUpdate = new Date().toISOString();

        // Update marker on map
        const markerInfo = state.markers.get(ambulanceId);
        if (markerInfo) {
            markerInfo.marker.setPosition(newLocation);
            markerInfo.infoWindow.setContent(
                trackingTools.createInfoWindowContent(ambulance)
            );
        }

        // Save updated state
        storage.save('ambulances', state.ambulances);
    },

    initializeRealTimeStatus: () => {
        const statusTable = document.getElementById('ambulance-status-table');
        if (!statusTable) return;

        // Initial update
        trackingTools.updateStatusTable();

        // Set up real-time updates
        setInterval(() => {
            trackingTools.updateStatusTable();
        }, 30000); // Update every 30 seconds
    },

    updateStatusTable: () => {
        const tbody = document.querySelector('#ambulance-status-table tbody');
        if (!tbody) return;

        tbody.innerHTML = state.ambulances.map(ambulance => `
            <tr class="status-${ambulance.status.toLowerCase()}">
                <td>${ambulance.registrationNumber}</td>
                <td>${ambulance.status}</td>
                <td>${ambulance.crew.driver || 'Not assigned'}</td>
                <td>${utils.formatDate(ambulance.location.lastUpdate)}</td>
                <td>
                    <button onclick="trackingTools.updateAmbulanceStatus('${ambulance.id}')">
                        Update
                    </button>
                    <button onclick="trackingTools.viewAmbulanceDetails('${ambulance.id}')">
                        Details
                    </button>
                </td>
            </tr>
        `).join('');
    },

    setupGeolocationTracking: () => {
        if (!navigator.geolocation) {
            console.error('Geolocation is not supported by this browser.');
            return;
        }

        const options = {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        };

        // Watch position for active ambulances
        state.ambulances.forEach(ambulance => {
            if (ambulance.status === 'busy') {
                navigator.geolocation.watchPosition(
                    position => trackingTools.handlePositionUpdate(ambulance.id, position),
                    error => trackingTools.handleGeolocationError(error),
                    options
                );
            }
        });
    },

    handlePositionUpdate: (ambulanceId, position) => {
        const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
        };

        trackingTools.updateAmbulanceLocation(ambulanceId, newLocation);
        trackingTools.calculateAndUpdateMetrics(ambulanceId, position);
    },

    calculateAndUpdateMetrics: (ambulanceId, position) => {
        try {
            const ambulance = state.ambulances.find(a => a.id === ambulanceId);
            if (!ambulance) {
                throw new Error(`Ambulance with ID ${ambulanceId} not found`);
            }
            if (!ambulance.location.history.length) {
                ambulance.location.history = [];
            }
            const lastPosition = ambulance.location.history[ambulance.location.history.length - 2];
            const distance = trackingTools.calculateDistance(
                lastPosition.position,
                { lat: position.coords.latitude, lng: position.coords.longitude }
            );

            // Update metrics
            ambulance.metrics.totalDistance += distance;
            ambulance.metrics.fuelEfficiency = trackingTools.calculateFuelEfficiency(
                distance,
                position.timestamp - new Date(lastPosition.timestamp).getTime()
            );

            // Save updates
            storage.save('ambulances', state.ambulances);
        } catch (error) {
            console.error('Error updating metrics:', error);
            utils.showNotification('Failed to update ambulance metrics', 'error');
        }
    },

    calculateDistance: (point1, point2) => {
        const R = 6371; // Earth's radius in km
        const dLat = trackingTools.toRad(point2.lat - point1.lat);
        const dLon = trackingTools.toRad(point2.lng - point1.lng);
        const lat1 = trackingTools.toRad(point1.lat);
        const lat2 = trackingTools.toRad(point2.lat);

        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.sin(dLon/2) * Math.sin(dLon/2) * 
                Math.cos(lat1) * Math.cos(lat2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    },

    toRad: (value) => {
        return value * Math.PI / 180;
    },

    handleGeolocationError: (error) => {
        console.error('Geolocation error:', error);
        // Implement error handling UI feedback
    }
};


// Automation Tools Section
const automationTools = {
    initialize: () => {
        try {
            if (!document.getElementById('automation-dashboard')) {
                console.log('Automation dashboard not found, skipping initialization');
                return;
            }
            automationTools.setupAlertSystem();
            automationTools.setupReportAutomation();
            automationTools.initializeAutomatedTasks();
            
            // Start monitoring systems
            automationTools.startMonitoring();
        } catch (error) {
            console.error('Automation initialization error:', error);
            utils.showNotification('Failed to initialize automation tools', 'error');
        }
    },

    setupAlertSystem: () => {
        const alertForm = document.getElementById('alert-form');
        if (alertForm) {
            alertForm.addEventListener('submit', automationTools.handleAlertSetup);
        }

        // Initialize active alerts display
        automationTools.updateActiveAlerts();
        
        // Start alert monitoring
        setInterval(() => {
            automationTools.checkAllAlerts();
        }, state.settings.alerts.frequency);
    },

    handleAlertSetup: (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        const alertConfig = {
            id: utils.generateId('ALERT-'),
            type: formData.get('alert-type'),
            threshold: parseFloat(formData.get('alert-threshold')),
            conditions: {
                operator: formData.get('alert-operator') || '>',
                value: parseFloat(formData.get('alert-threshold')),
                timeFrame: formData.get('alert-timeframe') || 'immediate'
            },
            notification: {
                method: formData.get('alert-notification') || 'browser',
                recipients: formData.get('alert-recipients')?.split(',') || []
            },
            status: 'active',
            created: new Date().toISOString(),
            lastTriggered: null,
            triggerCount: 0
        };

        // Validate alert configuration
        const validationErrors = automationTools.validateAlertConfig(alertConfig);
        if (validationErrors.length > 0) {
            automationTools.displayErrors(validationErrors);
            return;
        }

        // Save alert
        state.alerts.push(alertConfig);
        storage.save('alerts', state.alerts);
        automationTools.updateActiveAlerts();
        automationTools.showNotification('Alert configured successfully', 'success');
    },

    validateAlertConfig: (config) => {
        const errors = [];
        if (!config.type) errors.push('Alert type is required');
        if (isNaN(config.threshold)) errors.push('Valid threshold value is required');
        return errors;
    },

    checkAllAlerts: () => {
        state.alerts.forEach(alert => {
            if (alert.status === 'active') {
                const shouldTrigger = automationTools.evaluateAlertCondition(alert);
                if (shouldTrigger) {
                    automationTools.triggerAlert(alert);
                }
            }
        });
    },

    evaluateAlertCondition: (alert) => {
        switch (alert.type) {
            case 'maintenance':
                return automationTools.checkMaintenanceAlert(alert);
            case 'expenditure':
                return automationTools.checkExpenditureAlert(alert);
            case 'trip':
                return automationTools.checkTripAlert(alert);
            default:
                return false;
        }
    },

    checkMaintenanceAlert: (alert) => {
        return state.ambulances.some(ambulance => {
            const daysSinceLastMaintenance = 
                (new Date() - new Date(ambulance.maintenance.lastMaintenance)) / 
                (1000 * 60 * 60 * 24);
            return daysSinceLastMaintenance > alert.threshold;
        });
    },

    checkExpenditureAlert: (alert) => {
        const recentTrips = state.trips.filter(trip => {
            const tripDate = new Date(trip.timestamp.created);
            const timeFrame = new Date();
            timeFrame.setDate(timeFrame.getDate() - 7); // Last 7 days
            return tripDate >= timeFrame;
        });

        const totalExpenses = recentTrips.reduce((sum, trip) => {
            return sum + Object.values(trip.financial.expenses)
                .reduce((a, b) => a + b, 0);
        }, 0);

        return totalExpenses > alert.threshold;
    },

    checkTripAlert: (alert) => {
        const today = new Date();
        const todaysTrips = state.trips.filter(trip => {
            const tripDate = new Date(trip.timestamp.created);
            return tripDate.toDateString() === today.toDateString();
        });

        return todaysTrips.length > alert.threshold;
    },

    triggerAlert: (alert) => {
        // Update alert status
        alert.lastTriggered = new Date().toISOString();
        alert.triggerCount++;

        // Create notification
        const notification = {
            id: utils.generateId('NOTIF-'),
            alertId: alert.id,
            type: alert.type,
            message: automationTools.generateAlertMessage(alert),
            timestamp: new Date().toISOString(),
            status: 'unread'
        };

        // Send notification based on configured method
        automationTools.sendNotification(notification, alert.notification);

        // Save updated alert state
        storage.save('alerts', state.alerts);
    },

    generateAlertMessage: (alert) => {
        const messages = {
            maintenance: 'Maintenance alert: Vehicle requires attention',
            expenditure: 'High expenditure detected',
            trip: 'Unusual trip activity detected'
        };
        return messages[alert.type] || 'Alert triggered';
    },

    sendNotification: (notification, config) => {
        switch (config.method) {
            case 'browser':
                automationTools.showBrowserNotification(notification);
                break;
            case 'email':
                automationTools.sendEmailNotification(notification, config.recipients);
                break;
            case 'sms':
                automationTools.sendSMSNotification(notification, config.recipients);
                break;
        }
    },

    showBrowserNotification: (notification) => {
        if ('Notification' in window) {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    new Notification(notification.message, {
                        icon: '/icons/alert.png',
                        body: `Alert triggered at ${utils.formatDate(notification.timestamp)}`
                    });
                }
            });
        }
    },

    setupReportAutomation: () => {
        const reportForm = document.getElementById('report-form');
        if (reportForm) {
            reportForm.addEventListener('submit', automationTools.handleReportAutomation);
        }

        // Schedule existing automated reports
        automationTools.scheduleAutomatedReports();
    },

    handleReportAutomation: (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        const reportConfig = {
            id: utils.generateId('REPORT-'),
            type: formData.get('report-type'),
            frequency: formData.get('report-frequency'),
            format: formData.get('report-format'),
            delivery: {
                method: formData.get('report-delivery'),
                recipients: formData.get('report-email')?.split(',') || []
            },
            schedule: {
                nextGeneration: automationTools.calculateNextReportDate(
                    formData.get('report-frequency')
                ),
                lastGenerated: null
            },
            status: 'active'
        };

        state.reports.push(reportConfig);
        storage.save('reports', state.reports);
        automationTools.scheduleReport(reportConfig);
    },

    calculateNextReportDate: (frequency) => {
        const now = new Date();
        switch (frequency) {
            case 'daily':
                return new Date(now.setDate(now.getDate() + 1));
            case 'weekly':
                return new Date(now.setDate(now.getDate() + 7));
            case 'monthly':
                return new Date(now.setMonth(now.getMonth() + 1));
            default:
                return new Date(now.setDate(now.getDate() + 1));
        }
    }
};


// Lead Management Section
const leadManagement = {
    initialize: () => {
        leadManagement.setupLeadForm();
        leadManagement.initializeLeadTracker();
        leadManagement.setupConversionAnalytics();
        leadManagement.setupFollowUpSystem();

        // Set up auto-refresh
        setInterval(() => {
            leadManagement.refreshLeadData();
        }, 300000); // Refresh every 5 minutes
    },

    setupLeadForm: () => {
        const leadForm = document.getElementById('lead-form');
        if (leadForm) {
            leadForm.addEventListener('submit', leadManagement.handleLeadSubmission);
            leadManagement.setupLeadFormValidation();
        }
    },

    setupLeadFormValidation: () => {
        const leadForm = document.getElementById('lead-form');
        if (!leadForm) {
            console.log('Lead form not found, skipping validation setup');
            return;
        }
        
        const fields = ['lead-name', 'lead-service', 'lead-urgency'];
        fields.forEach(fieldId => {
            const field = leadForm.querySelector(`#${fieldId}`);
            if (field) {
                field.addEventListener('input', () => {
                    leadManagement.validateField(field);
                });
            }
        });
    },

    validateField: (field) => {
        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';

        switch (field.id) {
            case 'lead-name':
                isValid = value.length >= 3;
                errorMessage = 'Name must be at least 3 characters long';
                break;
            case 'lead-service':
                isValid = value.length > 0;
                errorMessage = 'Service is required';
                break;
            case 'lead-urgency':
                isValid = ['low', 'medium', 'high'].includes(value);
                errorMessage = 'Please select a valid urgency level';
                break;
        }

        leadManagement.showFieldValidation(field, isValid, errorMessage);
        return isValid;
    },

    showFieldValidation: (field, isValid, errorMessage) => {
        const errorElement = field.parentElement.querySelector('.error-message') ||
            document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = isValid ? '' : errorMessage;
        
        if (!field.parentElement.querySelector('.error-message')) {
            field.parentElement.appendChild(errorElement);
        }

        field.classList.toggle('invalid', !isValid);
    },

    handleLeadSubmission: (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        const leadData = {
            id: utils.generateId('LEAD-'),
            timestamp: {
                created: new Date().toISOString(),
                updated: new Date().toISOString()
            },
            details: {
                name: formData.get('lead-name'),
                service: formData.get('lead-service'),
                urgency: formData.get('lead-urgency'),
                source: formData.get('lead-source') || 'direct'
            },
            status: 'new',
            followUps: [],
            notes: [],
            metrics: {
                conversionProbability: leadManagement.calculateConversionProbability(formData),
                responseTime: null,
                interactions: 0
            },
            assignments: {
                assignedTo: null,
                assignmentHistory: []
            }
        };

        if (leadManagement.saveLead(leadData)) {
            leadManagement.handleSuccessfulSubmission(leadData);
        } else {
            leadManagement.handleFailedSubmission();
        }
    },

    calculateConversionProbability: (formData) => {
        let probability = 50; // Base probability

        // Adjust based on urgency
        const urgencyScores = { high: 20, medium: 10, low: 0 };
        probability += urgencyScores[formData.get('lead-urgency')] || 0;

        // Adjust based on source
        const sourceScores = { 
            referral: 15, 
            website: 10, 
            social: 5, 
            direct: 0 
        };
        probability += sourceScores[formData.get('lead-source')] || 0;

        // Cap probability between 0 and 100
        return Math.min(Math.max(probability, 0), 100);
    },

    saveLead: (leadData) => {
        try {
            state.leads.push(leadData);
            storage.save('leads', state.leads);
            
            // Schedule initial follow-up
            leadManagement.scheduleFollowUp(leadData);
            
            return true;
        } catch (error) {
            console.error('Error saving lead:', error);
            return false;
        }
    },

    scheduleFollowUp: (lead) => {
        const followUpDelay = leadManagement.calculateFollowUpDelay(lead.details.urgency);
        const followUp = {
            id: utils.generateId('FOLLOWUP-'),
            leadId: lead.id,
            scheduledDate: new Date(Date.now() + followUpDelay).toISOString(),
            status: 'pending',
            type: 'initial',
            notes: ''
        };

        lead.followUps.push(followUp);
        storage.save('leads', state.leads);
    },

    calculateFollowUpDelay: (urgency) => {
        const delays = {
            high: 1800000,    // 30 minutes
            medium: 7200000,  // 2 hours
            low: 86400000     // 24 hours
        };
        return delays[urgency] || delays.medium;
    },

    initializeLeadTracker: () => {
        const trackerTable = document.getElementById('lead-tracker-table');
        if (trackerTable) {
            leadManagement.updateLeadTracker();
            leadManagement.setupLeadFilters();
        }
    },

    updateLeadTracker: () => {
        const tbody = document.querySelector('#lead-tracker-table tbody');
        if (!tbody) return;

        tbody.innerHTML = state.leads.map(lead => `
            <tr class="lead-status-${lead.status.toLowerCase()}">
                <td>${lead.details.name}</td>
                <td>${utils.formatDate(lead.timestamp.created)}</td>
                <td>${lead.details.urgency}</td>
                <td>${lead.status}</td>
                <td>${lead.metrics.conversionProbability}%</td>
                <td>
                    <button onclick="leadManagement.openFollowUpForm('${lead.id}')" 
                        class="btn-action">Follow Up</button>
                    <button onclick="leadManagement.viewLeadDetails('${lead.id}')" 
                        class="btn-action">Details</button>
                </td>
            </tr>
        `).join('');
    },

    openFollowUpForm: (leadId) => {
        const lead = state.leads.find(l => l.id === leadId);
        if (!lead) return;

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>Follow Up - ${lead.details.name}</h2>
                <form id="follow-up-form" onsubmit="leadManagement.handleFollowUpSubmission(event, '${leadId}')">
                    <div class="form-group">
                        <label for="follow-up-status">Status:</label>
                        <select id="follow-up-status" name="status" required>
                            <option value="contacted">Contacted</option>
                            <option value="interested">Interested</option>
                            <option value="not-interested">Not Interested</option>
                            <option value="converted">Converted</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="follow-up-notes">Notes:</label>
                        <textarea id="follow-up-notes" name="notes" rows="4"></textarea>
                    </div>
                    <div class="form-group">
                        <label for="next-follow-up">Next Follow Up:</label>
                        <input type="datetime-local" id="next-follow-up" name="nextFollowUp">
                    </div>
                    <button type="submit">Save Follow Up</button>
                    <button type="button" onclick="this.closest('.modal').remove()">Cancel</button>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
    },

    handleFollowUpSubmission: (e, leadId) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const lead = state.leads.find(l => l.id === leadId);
        
        if (!lead) return;

        const followUp = {
            id: utils.generateId('FOLLOWUP-'),
            date: new Date().toISOString(),
            status: formData.get('status'),
            notes: formData.get('notes'),
            nextFollowUp: formData.get('nextFollowUp')
        };

        lead.followUps.push(followUp);
        lead.status = formData.get('status');
        lead.timestamp.updated = new Date().toISOString();

        storage.save('leads', state.leads);
        leadManagement.updateLeadTracker();
        e.target.closest('.modal').remove();
    },

    setupConversionAnalytics: () => {
        const conversionChart = document.getElementById('conversion-chart');
        if (conversionChart) {
            const ctx = conversionChart.getContext('2d');
            const data = leadManagement.calculateConversionMetrics();
            
            new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: ['Converted', 'In Progress', 'Lost'],
                    datasets: [{
                        data: [
                            data.converted,
                            data.inProgress,
                            data.lost
                        ],
                        backgroundColor: ['#4CAF50', '#FFC107', '#F44336']
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
            });
        }
    },

    calculateConversionMetrics: () => {
        return state.leads.reduce((acc, lead) => {
            switch (lead.status) {
                case 'converted':
                    acc.converted++;
                    break;
                case 'lost':
                case 'not-interested':
                    acc.lost++;
                    break;
                default:
                    acc.inProgress++;
            }
            return acc;
        }, { converted: 0, inProgress: 0, lost: 0 });
    }
};


    // Continuing Lead Management Section
    updateLeadTracker: () => {
        const tbody = document.querySelector('#lead-tracker-table tbody');
        if (!tbody) return;

        tbody.innerHTML = state.leads.map(lead => `
            <tr class="lead-status-${lead.status.toLowerCase()}">
                <td>${lead.details.name}</td>
                <td>${utils.formatDate(lead.timestamp.created)}</td>
                <td>${lead.details.urgency}</td>
                <td>${lead.status}</td>
                <td>${lead.metrics.conversionProbability}%</td>
                <td>
                    <button onclick="leadManagement.openFollowUpForm('${lead.id}')" 
                        class="btn-action">Follow Up</button>
                    <button onclick="leadManagement.viewLeadDetails('${lead.id}')" 
                        class="btn-action">Details</button>
                </td>
            </tr>
        `).join('');
    },

    setupLeadFilters: () => {
        const filterForm = document.createElement('form');
        filterForm.className = 'lead-filters';
        filterForm.innerHTML = `
            <select id="status-filter">
                <option value="">All Statuses</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="converted">Converted</option>
                <option value="lost">Lost</option>
            </select>
            <select id="urgency-filter">
                <option value="">All Urgencies</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
            </select>
            <input type="date" id="date-filter" />
            <button type="reset">Clear Filters</button>
        `;

        const trackerTable = document.getElementById('lead-tracker-table');
        trackerTable.parentNode.insertBefore(filterForm, trackerTable);

        // Add event listeners
        filterForm.addEventListener('change', leadManagement.applyFilters);
        filterForm.addEventListener('reset', () => {
            setTimeout(leadManagement.updateLeadTracker, 0);
        });
    },

    applyFilters: () => {
        const statusFilter = document.getElementById('status-filter').value;
        const urgencyFilter = document.getElementById('urgency-filter').value;
        const dateFilter = document.getElementById('date-filter').value;

        const filteredLeads = state.leads.filter(lead => {
            const matchesStatus = !statusFilter || lead.status === statusFilter;
            const matchesUrgency = !urgencyFilter || lead.details.urgency === urgencyFilter;
            const matchesDate = !dateFilter || 
                new Date(lead.timestamp.created).toLocaleDateString() === 
                new Date(dateFilter).toLocaleDateString();

            return matchesStatus && matchesUrgency && matchesDate;
        });

        leadManagement.updateLeadTrackerWithData(filteredLeads);
    },

    updateLeadTrackerWithData: (leads) => {
        const tbody = document.querySelector('#lead-tracker-table tbody');
        if (!tbody) return;

        tbody.innerHTML = leads.map(lead => `
            <tr class="lead-status-${lead.status.toLowerCase()}">
                <td>${lead.details.name}</td>
                <td>${utils.formatDate(lead.timestamp.created)}</td>
                <td>${lead.details.urgency}</td>
                <td>${lead.status}</td>
                <td>${lead.metrics.conversionProbability}%</td>
                <td>
                    <button onclick="leadManagement.openFollowUpForm('${lead.id}')" 
                        class="btn-action">Follow Up</button>
                    <button onclick="leadManagement.viewLeadDetails('${lead.id}')" 
                        class="btn-action">Details</button>
                </td>
            </tr>
        `).join('');

        // Update summary statistics
        leadManagement.updateLeadStatistics(leads);
    },

    updateLeadStatistics: (leads) => {
        const stats = {
            total: leads.length,
            byStatus: leads.reduce((acc, lead) => {
                acc[lead.status] = (acc[lead.status] || 0) + 1;
                return acc;
            }, {}), // Add missing closing bracket and initial value
            conversionRate: (leads.filter(lead => 
                lead.status === 'converted').length / leads.length * 100) || 0
        };

        // Update DOM elements
        document.getElementById('total-leads').textContent = stats.total;
        document.getElementById('conversion-rate').textContent = 
            `${stats.conversionRate.toFixed(1)}%`;
        
        // Update status breakdown
        Object.entries(stats.byStatus).forEach(([status, count]) => {
            const element = document.getElementById(`${status}-count`);
            if (element) element.textContent = count;
        });
    }
};

// Export/Import Tools Section
const exportImportTools = {
    initialize: () => {
        exportImportTools.setupExportTools();
        exportImportTools.setupImportTools();
        exportImportTools.setupAutoBackup();
    },

    setupExportTools: () => {
        const exportForm = document.getElementById('export-form');
        if (exportForm) {
            exportForm.addEventListener('submit', exportImportTools.handleDataExport);
        }

        // Setup quick export buttons
        const quickExportButtons = document.querySelectorAll('.quick-export');
        quickExportButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const format = e.target.dataset.format;
                const type = e.target.dataset.type;
                exportImportTools.quickExport(type, format);
            });
        });
    },

    handleDataExport: (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        try {
            const exportConfig = {
                dataType: formData.get('export-data'),
                format: formData.get('export-format'),
                dateRange: {
                    start: formData.get('export-start-date'),
                    end: formData.get('export-end-date')
                },
                filters: {
                    status: formData.get('export-status'),
                    category: formData.get('export-category')
                }
            };

            const data = exportImportTools.getExportData(exportConfig);
            exportImportTools.processExport(data, exportConfig);
            
            utils.showNotification('Export completed successfully', 'success');
        } catch (error) {
            console.error('Export error:', error);
            utils.showNotification('Export failed', 'error');
        }
    },

    getExportData: (config) => {
        let data = state[config.dataType] || [];

        // Apply date range filter if specified
        if (config.dateRange.start && config.dateRange.end) {
            data = data.filter(item => {
                const itemDate = new Date(item.timestamp.created);
                return itemDate >= new Date(config.dateRange.start) && 
                       itemDate <= new Date(config.dateRange.end);
            });
        }

        // Apply additional filters
        if (config.filters) {
            if (config.filters.status) {
                data = data.filter(item => item.status === config.filters.status);
            }
            if (config.filters.category) {
                data = data.filter(item => item.category === config.filters.category);
            }
        }

        return data;
    },

    processExport: (data, config) => {
        switch (config.format.toLowerCase()) {
            case 'csv':
                exportImportTools.exportAsCSV(data, config.dataType);
                break;
            case 'json':
                exportImportTools.exportAsJSON(data, config.dataType);
                break;
            case 'pdf':
                exportImportTools.exportAsPDF(data, config.dataType);
                break;
            case 'excel':
                exportImportTools.exportAsExcel(data, config.dataType);
                break;
            default:
                throw new Error('Unsupported export format');
        }
    },

    exportAsCSV: (data, filename) => {
        if (!data.length) return;

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(item => 
                headers.map(header => 
                    JSON.stringify(item[header] || '')
                ).join(',')
            )
        ].join('\n');

        exportImportTools.downloadFile(csvContent, `${filename}.csv`, 'text/csv');
    },

    exportAsJSON: (data, filename) => {
        const jsonContent = JSON.stringify(data, null, 2);
        exportImportTools.downloadFile(
            jsonContent, 
            `${filename}.json`, 
            'application/json'
        );
    },

    exportAsPDF: (data, filename) => {
        // Implementation would require a PDF library
        // Basic example using window.print():
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>${filename}</title>
                    <style>
                        table { border-collapse: collapse; width: 100%; }
                        th, td { border: 1px solid black; padding: 8px; }
                        th { background-color: #f2f2f2; }
                    </style>
                </head>
                <body>
                    <h1>${filename}</h1>
                    ${exportImportTools.generatePDFTable(data)}
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    },

    generatePDFTable: (data) => {
        if (!data.length) return '<p>No data available</p>';

        const headers = Object.keys(data[0]);
        return `
            <table>
                <thead>
                    <tr>
                        ${headers.map(header => `<th>${header}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${data.map(item => `
                        <tr>
                            ${headers.map(header => 
                                `<td>${item[header]}</td>`
                            ).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    },

    downloadFile: (content, filename, contentType) => {
        const blob = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    },

    setupImportTools: () => {
        const importForm = document.getElementById('import-form');
        if (importForm) {
            importForm.addEventListener('submit', exportImportTools.handleDataImport);
            
            // Setup drag and drop
            const dropZone = document.createElement('div');
            dropZone.className = 'drop-zone';
            dropZone.innerHTML = 'Drag and drop files here';
            
            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropZone.classList.add('dragover');
            });
            
            dropZone.addEventListener('dragleave', () => {
                dropZone.classList.remove('dragover');
            });
            
            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.classList.remove('dragover');
                const files = e.dataTransfer.files;
                exportImportTools.handleFileImport(files);
            });
            
            importForm.appendChild(dropZone);
        }
    },

    handleDataImport: (e) => {
        e.preventDefault();
        const fileInput = e.target.querySelector('input[type="file"]');
        if (fileInput.files.length) {
            exportImportTools.handleFileImport(fileInput.files);
        }
    },

    handleFileImport: (files) => {
        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = exportImportTools.parseImportedData(file, e.target.result);
                    exportImportTools.processImportedData(data);
                    utils.showNotification('Import successful', 'success');
                } catch (error) {
                    console.error('Import error:', error);
                    utils.showNotification('Import failed', 'error');
                }
            };
            
            reader.onerror = () => {
                utils.showNotification('Error reading file', 'error');
            };
            
            if (file.name.endsWith('.csv')) {
                reader.readAsText(file);
            } else if (file.name.endsWith('.json')) {
                reader.readAsText(file);
            } else {
                utils.showNotification('Unsupported file format', 'error');
            }
        });
    },

    parseImportedData: (file, content) => {
        if (file.name.endsWith('.csv')) {
            return exportImportTools.parseCSV(content);
        } else if (file.name.endsWith('.json')) {
            return JSON.parse(content);
        }
        throw new Error('Unsupported file format');
    },

    parseCSV: (content) => {
        const lines = content.split('\n');
        const headers = lines[0].split(',').map(header => 
            header.trim().replace(/^["']|["']$/g, '')
        );
        
        return lines.slice(1).map(line => {
            const values = line.split(',').map(value => 
                value.trim().replace(/^["']|["']$/g, '')
            );
            return headers.reduce((obj, header, index) => {
                obj[header] = values[index];
                return obj;
            }, {});
        });
    },

    processImportedData: (data) => {
        // Validate imported data
        const validationResult = exportImportTools.validateImportedData(data);
        if (!validationResult.isValid) {
            throw new Error(`Invalid data: ${validationResult.errors.join(', ')}`);
        }

        // Merge with existing data
        exportImportTools.mergeImportedData(data);

        // Update UI
        utils.refreshAllViews();
    },

    validateImportedData: (data) => {
        const errors = [];
        const requiredFields = ['id', 'timestamp'];

        if (!Array.isArray(data)) {
            return {
                isValid: false,
                errors: ['Imported data must be an array']
            };
        }

        data.forEach((item, index) => {
            requiredFields.forEach(field => {
                if (!item[field]) {
                    errors.push(`Missing ${field} in item ${index + 1}`);
                }
            });
        });

        return {
            isValid: errors.length === 0,
            errors
        };
    },

    mergeImportedData: (data) => {
        // Implement merge strategy (e.g., replace, append, or merge by ID)
        data.forEach(item => {
            const existingIndex = state[item.type]?.findIndex(
                existing => existing.id === item.id
            );

            if (existingIndex >= 0) {
                state[item.type][existingIndex] = {
                    ...state[item.type][existingIndex],
                    ...item
                };
            } else {
                state[item.type].push(item);
            }
        });

        // Save updated state
        Object.keys(state).forEach(key => {
            storage.save(key, state[key]);
        });
    }
};

// Initialize everything when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Initialize core modules first
        utils.initialize();
        storage.initialize();
        
        // Initialize feature modules if their UI elements exist
        if (document.getElementById('trip-form')) {
            tripManagement.initialize();
        }
        if (document.getElementById('analytics-dashboard')) {
            dataAnalytics.initialize();
        }
        if (document.getElementById('visualization-container')) {
            visualizationTools.initialize();
        }
        if (document.getElementById('financial-dashboard')) {
            financialTools.initialize();
        }
        if (document.getElementById('tracking-dashboard')) {
            trackingTools.initialize();
        }
        if (document.getElementById('automation-dashboard')) {
            automationTools.initialize();
        }
        if (document.getElementById('lead-dashboard')) {
            leadManagement.initialize();
        }
        if (document.getElementById('export-import-tools')) {
            exportImportTools.initialize();
        }

        // Setup global event listeners
        setupGlobalEventListeners();
        
        console.log('Application initialized successfully');
    } catch (error) {
        console.error('Initialization error:', error);
    }
});

// Add missing utility initialization
const utils = {
    initialize: () => {
        // Initialize utility functions
        utils.setupErrorHandling();
        utils.setupNotifications();
    },
    
    setupErrorHandling: () => {
        window.onerror = (msg, url, line, col, error) => {
            console.error('Global error:', { msg, url, line, col, error });
            utils.showNotification('An error occurred', 'error');
            return false;
        };
    },
    
    setupNotifications: () => {
        // Create notification container if it doesn't exist
        if (!document.getElementById('notification-container')) {
            const container = document.createElement('div');
            container.id = 'notification-container';
            document.body.appendChild(container);
        }
    },
    
    showNotification: (message, type = 'info') => {
        const container = document.getElementById('notification-container');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        container.appendChild(notification);
        setTimeout(() => notification.remove(), 5000);
    }
};

// Add missing storage initialization
const storage = {
    initialize: () => {
        try {
            // Test storage availability
            localStorage.setItem('test', 'test');
            localStorage.removeItem('test');
            
            // Initialize state if empty
            if (!localStorage.getItem('initialized')) {
                storage.initializeDefaultState();
            }
        } catch (error) {
            console.error('Storage initialization error:', error);
            utils.showNotification('Storage initialization failed', 'error');
        }
    },
    
    initializeDefaultState: () => {
        const defaultState = {
            trips: [],
            leads: [],
            alerts: [],
            reports: [],
            ambulances: initializeAmbulances(),
            settings: initializeSettings(),
            initialized: true
        };
        
        Object.entries(defaultState).forEach(([key, value]) => {
            storage.save(key, value);
        });
    }
};

// Add missing global event listeners setup
function setupGlobalEventListeners() {
    window.addEventListener('online', () => {
        state.systemStatus.isOnline = true;
        utils.showNotification('Back online', 'success');
    });

    window.addEventListener('offline', () => {
        state.systemStatus.isOnline = false;
        utils.showNotification('Working offline', 'warning');
    });

    // Handle storage events for multi-tab synchronization
    window.addEventListener('storage', (e) => {
        if (e.key && e.key in state) {
            state[e.key] = JSON.parse(e.newValue);
            utils.refreshAllViews();
        }
    });
}

function calculateNextMaintenance() {
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 30); // Set next maintenance 30 days ahead
    return nextDate.toISOString();
}
