require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// ============ MANUAL CORS HEADERS (GUARANTEED FIX) ============
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Origin, X-Requested-With, Accept');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============ SCHEMAS ============

const leadSchema = new mongoose.Schema({
    id: { type: String, unique: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    source: { type: String, default: 'Website Contact Form' },
    status: { type: String, default: 'new' },
    dealValue: { type: Number, default: 0 },
    notes: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
    convertedAt: { type: Date, default: null }
});

const adminSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, default: 'admin' },
    lastLogin: { type: Date, default: null }
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

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

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
        
        const token = jwt.sign(
            { id: admin._id, email: admin.email },
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
        console.error('Create lead error:', error);
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
        
        const lead = await Lead.findOneAndUpdate(
            { id: req.params.id },
            updateData,
            { new: true }
        );
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

// ============ INITIALIZATION ============

async function createDefaultAdmin() {
    try {
        const adminExists = await Admin.findOne({ email: 'admin@crm.com' });
        if (!adminExists) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            const defaultAdmin = new Admin({
                email: 'admin@crm.com',
                password: hashedPassword
            });
            await defaultAdmin.save();
            console.log('✅ Default admin created: admin@crm.com / admin123');
        }
    } catch (error) {
        console.error('Error creating admin:', error);
    }
}

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('✅ MongoDB connected');
        await createDefaultAdmin();
        
        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📍 Backend URL: https://mini-crm-backend.onrender.com`);
            console.log(`🔐 Login: admin@crm.com / admin123`);
        });
    })
    .catch(err => {
        console.error('❌ MongoDB error:', err.message);
        process.exit(1);
    });

module.exports = app;