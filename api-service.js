const ApiService = {
    baseUrl: 'http://localhost:3000/api',

    async saveTrip(tripData) {
        try {
            const response = await fetch(`${this.baseUrl}/trips`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(tripData)
            });
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    async getTrips() {
        try {
            const response = await fetch(`${this.baseUrl}/trips`);
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
}; 