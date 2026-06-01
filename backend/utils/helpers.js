// Helper functions for common operations

// Format date for display
const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// Format currency
const formatCurrency = (amount) => {
    if (!amount || amount === 0) return '₹0';
    return '₹' + amount.toLocaleString('en-IN');
};

// Format compact currency (e.g., ₹50K, ₹1.2M)
const formatCompactCurrency = (amount) => {
    if (!amount || amount === 0) return '₹0';
    if (amount >= 10000000) return '₹' + (amount / 10000000).toFixed(1) + 'Cr';
    if (amount >= 100000) return '₹' + (amount / 100000).toFixed(1) + 'L';
    if (amount >= 1000) return '₹' + (amount / 1000).toFixed(0) + 'K';
    return '₹' + amount;
};

// Validate email format
const isValidEmail = (email) => {
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    return emailRegex.test(email);
};

// Sanitize input
const sanitizeInput = (input) => {
    if (!input) return '';
    return input.trim().replace(/[<>]/g, '');
};

// Calculate conversion rate
const calculateConversionRate = (total, converted) => {
    if (!total || total === 0) return 0;
    return ((converted / total) * 100).toFixed(1);
};

// Group leads by stage
const groupLeadsByStage = (leads) => {
    const stages = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];
    const result = {};
    stages.forEach(stage => {
        result[stage] = leads.filter(lead => lead.status === stage);
    });
    return result;
};

module.exports = {
    formatDate,
    formatCurrency,
    formatCompactCurrency,
    isValidEmail,
    sanitizeInput,
    calculateConversionRate,
    groupLeadsByStage
};