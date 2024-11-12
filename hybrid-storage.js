import { db } from './firebase-config';
import { collection, addDoc, getDocs, onSnapshot } from 'firebase/firestore';

const HybridStorage = {
    initialize() {
        try {
            // Test localStorage availability
            localStorage.setItem('test', 'test');
            localStorage.removeItem('test');
            
            // Initialize default data if not exists
            if (!localStorage.getItem('initialized')) {
                this.initializeDefaultData();
            }

            // Setup real-time sync with Firebase
            this.setupFirebaseSync();
        } catch (error) {
            console.error('Storage initialization error:', error);
            Utils.showNotification('Storage initialization failed', 'error');
        }
    },

    async save(key, value) {
        try {
            // Save to localStorage
            localStorage.setItem(key, JSON.stringify(value));

            // Save to Firebase
            if (this.shouldSyncToFirebase(key)) {
                await addDoc(collection(db, key), {
                    data: value,
                    timestamp: new Date().toISOString()
                });
            }
        } catch (error) {
            console.error('Save error:', error);
            Utils.showNotification('Failed to save data', 'error');
        }
    },

    get(key) {
        try {
            // Get from localStorage first
            const localData = localStorage.getItem(key);
            return localData ? JSON.parse(localData) : null;
        } catch (error) {
            console.error('Get error:', error);
            Utils.showNotification('Failed to retrieve data', 'error');
            return null;
        }
    },

    setupFirebaseSync() {
        // Listen for Firebase changes
        const collections = ['trips', 'leads', 'ambulances'];
        
        collections.forEach(collectionName => {
            onSnapshot(collection(db, collectionName), (snapshot) => {
                const data = [];
                snapshot.forEach((doc) => {
                    data.push({ id: doc.id, ...doc.data() });
                });
                
                // Update localStorage with Firebase data
                this.syncToLocal(collectionName, data);
            });
        });
    },

    syncToLocal(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            // Notify state management of updates
            State.update(key, data);
        } catch (error) {
            console.error('Sync to local error:', error);
        }
    },

    shouldSyncToFirebase(key) {
        // Define which data should be synced to Firebase
        const syncedCollections = ['trips', 'leads', 'ambulances'];
        return syncedCollections.includes(key);
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

    async getAll() {
        const data = {};
        try {
            // Get all from localStorage
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                data[key] = this.get(key);
            }

            // Merge with Firebase data
            const collections = ['trips', 'leads', 'ambulances'];
            for (const collectionName of collections) {
                const snapshot = await getDocs(collection(db, collectionName));
                data[collectionName] = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
            }

            return data;
        } catch (error) {
            console.error('GetAll error:', error);
            return null;
        }
    }
};

export default HybridStorage; 