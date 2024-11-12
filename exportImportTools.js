const ExportImportTools = {
    initialize() {
        this.setupEventListeners();
    },

    setupEventListeners() {
        const exportForm = document.getElementById('export-form');
        const importForm = document.getElementById('import-form');

        if (exportForm) {
            exportForm.addEventListener('submit', (e) => this.handleExport(e));
        }
        if (importForm) {
            importForm.addEventListener('submit', (e) => this.handleImport(e));
        }
    },

    async handleExport(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const dataType = formData.get('export-data');
        const format = formData.get('export-format');

        try {
            const data = Storage.get(dataType) || [];
            const blob = this.createExportBlob(data, format);
            this.downloadFile(blob, `${dataType}-export.${format}`);
        } catch (error) {
            this.handleExportError(error);
        }
    },

    createExportBlob(data, format) {
        switch (format) {
            case 'json':
                return new Blob([JSON.stringify(data, null, 2)], 
                    { type: 'application/json' });
            case 'csv':
                return new Blob([this.convertToCSV(data)], 
                    { type: 'text/csv' });
            default:
                throw new Error('Unsupported format');
        }
    },

    downloadFile(blob, filename) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    },

    validateFileType(file) {
        const allowedTypes = [
            'application/json',
            'text/csv',
            'application/vnd.ms-excel'
        ];
        
        if (!allowedTypes.includes(file.type)) {
            throw new Error('Invalid file type. Please upload JSON or CSV files only.');
        }
        return true;
    },

    validateFileSize(file) {
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            throw new Error('File size exceeds 5MB limit.');
        }
        return true;
    },

    handleImportError(error) {
        console.error('Import error:', error);
        Utils.showNotification(error.message || 'Failed to import data', 'error');
    }
}; 