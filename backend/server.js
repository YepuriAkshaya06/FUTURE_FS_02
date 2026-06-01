require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();

// ============ CORS CONFIGURATION ============
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.options('*', cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============ TEST ROUTES ============
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

app.get('/test', (req, res) => {
    res.json({ message: '✅ Server is working!', timestamp: new Date().toISOString() });
});

// ============ LOGIN ROUTE ============
app.post('/api/auth/login', (req, res) => {
    console.log('📝 Login attempt:', req.body);
    
    const { email, password } = req.body;
    
    if (email === 'admin@crm.com' && password === 'admin123') {
        const token = jwt.sign(
            { email: 'admin@crm.com' },
            process.env.JWT_SECRET || 'my_secret_key',
            { expiresIn: '24h' }
        );
        return res.json({
            success: true,
            token: token,
            user: { email: 'admin@crm.com', role: 'admin' }
        });
    }
    
    res.status(401).json({ success: false, message: 'Invalid credentials' });
});

// ============ LEAD ROUTES (WITH MONGODB) ============
let Lead, Admin, bcrypt, mongoose;

try {
    mongoose = require('mongoose');
    bcrypt = require('bcryptjs');
    
    // Lead Schema
    const leadSchema = new mongoose.Schema({
        id: { type: String, unique: true },
        name: { type: String, required: true },
        email: { type: String, required: true },
        source: { type: String, default: 'Website Contact Form' },
        status: { type: String, default: 'new' },
        dealValue: { type: Number, default: 0 },
        notes: { type: String, default: '' },
        createdAt: { type: Date, default: Date.now },
        convertedAt: { type: Date, default: null }
    });
    
    Lead = mongoose.model('Lead', leadSchema);
    
    // Admin Schema
    const adminSchema = new mongoose.Schema({
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true }
    });
    Admin = mongoose.model('Admin', adminSchema);
    
    // Connect to MongoDB
    if (process.env.MONGODB_URI) {
        mongoose.connect(process.env.MONGODB_URI)
            .then(async () => {
                console.log('✅ MongoDB connected');
                // Create default admin if not exists
                const adminExists = await Admin.findOne({ email: 'admin@crm.com' });
                if (!adminExists) {
                    const hashedPassword = await bcrypt.hash('admin123', 10);
                    const defaultAdmin = new Admin({
                        email: 'admin@crm.com',
                        password: hashedPassword
                    });
                    await defaultAdmin.save();
                    console.log('✅ Default admin created');
                }
            })
            .catch(err => console.log('MongoDB connection error:', err.message));
    } else {
        console.log('⚠️ No MongoDB URI - running without database');
    }
} catch (err) {
    console.log('MongoDB modules not loaded:', err.message);
}

// ============ AUTH MIDDLEWARE ============
const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ success: false, message: 'No token provided' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'my_secret_key');
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ success: false, message: 'Invalid token' });
    }
};

// ============ LEAD API ROUTES ============
if (Lead) {
    app.get('/api/leads', authMiddleware, async (req, res) => {
        try {
            const leads = await Lead.find().sort({ createdAt: -1 });
            res.json({ success: true, data: leads });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error fetching leads' });
        }
    });
    
    app.post('/api/leads', authMiddleware, async (req, res) => {
        try {
            const { name, email, source, notes, dealValue, status } = req.body;
            
            if (!name || !email) {
                return res.status(400).json({ success: false, message: 'Name and email are required' });
            }
            
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
            res.status(201).json({ success: true, data: savedLead });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error creating lead' });
        }
    });
    
    app.put('/api/leads/:id/status', authMiddleware, async (req, res) => {
        try {
            const { status } = req.body;
            const lead = await Lead.findOneAndUpdate(
                { id: req.params.id },
                { status, convertedAt: status === 'won' ? new Date() : null },
                { new: true }
            );
            res.json({ success: true, data: lead });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error updating status' });
        }
    });
    
    app.put('/api/leads/:id', authMiddleware, async (req, res) => {
        try {
            const { name, email, source, status, notes, dealValue } = req.body;
            const updateData = {};
            if (name) updateData.name = name;
            if (email) updateData.email = email;
            if (source) updateData.source = source;
            if (status) updateData.status = status;
            if (notes !== undefined) updateData.notes = notes;
            if (dealValue !== undefined) updateData.dealValue = parseFloat(dealValue);
            
            const lead = await Lead.findOneAndUpdate({ id: req.params.id }, updateData, { new: true });
            res.json({ success: true, data: lead });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error updating lead' });
        }
    });
    
    app.post('/api/leads/:id/notes', authMiddleware, async (req, res) => {
        try {
            const { note } = req.body;
            const lead = await Lead.findOne({ id: req.params.id });
            const timestamp = new Date().toLocaleString();
            lead.notes = lead.notes ? lead.notes + '\n📝 [' + timestamp + '] ' + note : '📝 [' + timestamp + '] ' + note;
            await lead.save();
            res.json({ success: true, data: lead });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error adding note' });
        }
    });
    
    app.delete('/api/leads/:id', authMiddleware, async (req, res) => {
        try {
            await Lead.findOneAndDelete({ id: req.params.id });
            res.json({ success: true, message: 'Lead deleted' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error deleting lead' });
        }
    });
} else {
    console.log('⚠️ Lead routes disabled - MongoDB not available');
}

// ============ FALLBACK ============
app.get('*', (req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

// ============ START SERVER ============
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 Health check: https://mini-crm-backend.onrender.com/api/health`);
    console.log(`📍 Login: POST to https://mini-crm-backend.onrender.com/api/auth/login`);
    console.log(`🔐 Default login: admin@crm.com / admin123`);
});

module.exports = app;