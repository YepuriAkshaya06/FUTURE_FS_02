const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
    id: { 
        type: String, 
        unique: true 
    },
    name: { 
        type: String, 
        required: [true, 'Lead name is required'],
        trim: true 
    },
    email: { 
        type: String, 
        required: [true, 'Email is required'],
        lowercase: true,
        trim: true 
    },
    source: { 
        type: String, 
        enum: ['Website Contact Form', 'Landing Page', 'Referral', 'Social Media', 'Email Campaign', 'Webinar', 'Other'],
        default: 'Website Contact Form' 
    },
    status: { 
        type: String, 
        enum: ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'],
        default: 'new' 
    },
    dealValue: { 
        type: Number, 
        default: 0,
        min: 0
    },
    notes: { 
        type: String, 
        default: '' 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    convertedAt: { 
        type: Date, 
        default: null 
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Generate unique ID before saving
leadSchema.pre('save', async function(next) {
    if (!this.id) {
        this.id = 'lead_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8);
    }
    next();
});

// Virtual for lead age in days
leadSchema.virtual('age').get(function() {
    return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Virtual for formatted deal value
leadSchema.virtual('formattedDealValue').get(function() {
    if (!this.dealValue) return '₹0';
    return '₹' + this.dealValue.toLocaleString('en-IN');
});

module.exports = mongoose.model('Lead', leadSchema);