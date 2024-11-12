const LeadManagement = {
    validateLeadForm(formData) {
        const errors = [];
        
        if (!formData.get('lead-name')?.trim()) {
            errors.push('Lead name is required');
        }
        
        if (!formData.get('lead-service')?.trim()) {
            errors.push('Service type is required');
        }
        
        if (!['low', 'medium', 'high'].includes(formData.get('lead-urgency'))) {
            errors.push('Invalid urgency level');
        }
        
        return errors;
    },

    handleLeadSubmission(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const errors = this.validateLeadForm(formData);
        
        if (errors.length > 0) {
            Utils.showNotification(errors.join('\n'), 'error');
            return;
        }
        
        // Process valid form data
        this.saveLead(formData);
    }
}; 