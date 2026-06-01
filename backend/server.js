require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// ============ CORS CONFIGURATION (FIXED FOR RENDER) ============
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============ SCHEMAS ============

// Lead Schema with dealValue field
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

const adminSchema = new mongoose.Schema({
    email: { 
        type: String, 
        required: true, 
        unique: true,
        lowercase: true,
        trim: true 
    },
    password: { 
        type: String, 
        required: true,
        minlength: 6 
    },
    role: { 
        type: String, 
        enum: ['admin', 'super_admin'],
        default: 'admin' 
    },
    lastLogin: { 
        type: Date, 
        default: null 
    }
}, {
    timestamps: true
});

const Lead = mongoose.model('Lead', leadSchema);
const Admin = mongoose.model('Admin', adminSchema);

// ============ MIDDLEWARE ============

const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ success: false, message: 'No token provided' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ success: false, message: 'Invalid token' });
    }
};

// ============ ROUTES ============

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const admin = await Admin.findOne({ email });
        
        if (!admin) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        
        const isValid = await bcrypt.compare(password, admin.password);
        if (!isValid) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        
        admin.lastLogin = new Date();
        await admin.save();
        
        const token = jwt.sign(
            { id: admin._id, email: admin.email, role: admin.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        res.json({
            success: true,
            token,
            user: { email: admin.email, role: admin.role }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET all leads
app.get('/api/leads', authMiddleware, async (req, res) => {
    try {
        const { status, search } = req.query;
        let query = {};
        
        if (status && status !== 'all') {
            query.status = status;
        }
        
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }
        
        const leads = await Lead.find(query).sort({ createdAt: -1 });
        
        const stats = {
            total: await Lead.countDocuments(),
            new: await Lead.countDocuments({ status: 'new' }),
            contacted: await Lead.countDocuments({ status: 'contacted' }),
            qualified: await Lead.countDocuments({ status: 'qualified' }),
            proposal: await Lead.countDocuments({ status: 'proposal' }),
            negotiation: await Lead.countDocuments({ status: 'negotiation' }),
            won: await Lead.countDocuments({ status: 'won' }),
            lost: await Lead.countDocuments({ status: 'lost' }),
            totalValue: await Lead.aggregate([
                { $group: { _id: null, total: { $sum: '$dealValue' } } }
            ]).then(result => result[0]?.total || 0)
        };
        
        res.json({ success: true, data: leads, stats });
    } catch (error) {
        console.error('Get leads error:', error);
        res.status(500).json({ success: false, message: 'Error fetching leads' });
    }
});

// GET single lead by ID
app.get('/api/leads/:id', authMiddleware, async (req, res) => {
    try {
        const lead = await Lead.findOne({ id: req.params.id });
        if (!lead) {
            return res.status(404).json({ success: false, message: 'Lead not found' });
        }
        res.json({ success: true, data: lead });
    } catch (error) {
        console.error('Get lead error:', error);
        res.status(500).json({ success: false, message: 'Error fetching lead' });
    }
});

// CREATE lead
app.post('/api/leads', authMiddleware, async (req, res) => {
    try {
        const { name, email, source, notes, dealValue, status } = req.body;
        
        if (!name || !email) {
            return res.status(400).json({ success: false, message: 'Name and email are required' });
        }
        
        console.log('Creating lead with dealValue:', dealValue);
        
        const newLead = new Lead({
            id: 'lead_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8),
            name: name,
            email: email.toLowerCase(),
            source: source || 'Website Contact Form',
            notes: notes || '',
            dealValue: dealValue ? parseFloat(dealValue) : 0,
            status: status || 'new'
        });
        
        const savedLead = await newLead.save();
        console.log('✅ Lead created:', savedLead.name, 'Deal Value:', savedLead.dealValue);
        
        res.status(201).json({
            success: true,
            message: 'Lead created successfully',
            data: savedLead
        });
    } catch (error) {
        console.error('Create lead error:', error);
        res.status(500).json({ success: false, message: 'Error creating lead: ' + error.message });
    }
});

// UPDATE lead status only
app.put('/api/leads/:id/status', authMiddleware, async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];
        
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Valid status is required' });
        }
        
        const updateData = { status };
        if (status === 'won') {
            updateData.convertedAt = new Date();
        }
        
        const lead = await Lead.findOneAndUpdate(
            { id: req.params.id },
            updateData,
            { new: true }
        );
        
        if (!lead) {
            return res.status(404).json({ success: false, message: 'Lead not found' });
        }
        
        console.log('✅ Lead status updated:', lead.name, '→', status);
        res.json({ success: true, data: lead });
    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({ success: false, message: 'Error updating status' });
    }
});

// UPDATE full lead (including dealValue)
app.put('/api/leads/:id', authMiddleware, async (req, res) => {
    try {
        const { name, email, source, status, notes, dealValue } = req.body;
        
        console.log('Updating lead:', req.params.id);
        
        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (email !== undefined) updateData.email = email.toLowerCase();
        if (source !== undefined) updateData.source = source;
        if (status !== undefined) updateData.status = status;
        if (notes !== undefined) updateData.notes = notes;
        if (dealValue !== undefined) updateData.dealValue = parseFloat(dealValue);
        
        if (status === 'won' && !updateData.convertedAt) {
            updateData.convertedAt = new Date();
        }
        
        const lead = await Lead.findOneAndUpdate(
            { id: req.params.id },
            updateData,
            { new: true, runValidators: true }
        );
        
        if (!lead) {
            return res.status(404).json({ success: false, message: 'Lead not found' });
        }
        
        console.log('✅ Lead updated successfully:', lead.name);
        res.json({ success: true, message: 'Lead updated successfully', data: lead });
    } catch (error) {
        console.error('Update lead error:', error);
        res.status(500).json({ success: false, message: 'Error updating lead: ' + error.message });
    }
});

// ADD note to lead
app.post('/api/leads/:id/notes', authMiddleware, async (req, res) => {
    try {
        const { note } = req.body;
        
        if (!note || !note.trim()) {
            return res.status(400).json({ success: false, message: 'Note is required' });
        }
        
        const lead = await Lead.findOne({ id: req.params.id });
        if (!lead) {
            return res.status(404).json({ success: false, message: 'Lead not found' });
        }
        
        const timestamp = new Date().toLocaleString();
        const newNote = `📝 [${timestamp}] ${note.trim()}`;
        lead.notes = lead.notes ? lead.notes + '\n' + newNote : newNote;
        await lead.save();
        
        console.log('✅ Note added to lead:', lead.name);
        res.json({ success: true, data: lead });
    } catch (error) {
        console.error('Add note error:', error);
        res.status(500).json({ success: false, message: 'Error adding note' });
    }
});

// DELETE lead
app.delete('/api/leads/:id', authMiddleware, async (req, res) => {
    try {
        const lead = await Lead.findOneAndDelete({ id: req.params.id });
        if (!lead) {
            return res.status(404).json({ success: false, message: 'Lead not found' });
        }
        console.log('✅ Lead deleted:', lead.name);
        res.json({ success: true, message: 'Lead deleted successfully' });
    } catch (error) {
        console.error('Delete lead error:', error);
        res.status(500).json({ success: false, message: 'Error deleting lead' });
    }
});

// ============ INITIALIZATION ============

async function createDefaultAdmin() {
    try {
        const adminExists = await Admin.findOne({ email: 'admin@crm.com' });
        if (!adminExists) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            const defaultAdmin = new Admin({
                email: 'admin@crm.com',
                password: hashedPassword,
                role: 'admin'
            });
            await defaultAdmin.save();
            console.log('✅ Default admin created: admin@crm.com / admin123');
        } else {
            console.log('✅ Admin already exists');
        }
    } catch (error) {
        console.error('Error creating admin:', error);
    }
}

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('✅ MongoDB connected successfully');
        await createDefaultAdmin();
        
        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📍 API URL: https://mini-crm-backend.onrender.com/api`);
            console.log(`🔐 Default login: admin@crm.com / admin123`);
            console.log(`📊 Pipeline stages: new → contacted → qualified → proposal → negotiation → won → lost`);
        });
    })
    .catch(err => {
        console.error('❌ MongoDB connection error:', err.message);
        process.exit(1);
    });

// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
});

module.exports = app;