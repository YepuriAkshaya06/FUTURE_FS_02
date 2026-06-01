require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();

// ✅ STRICT CORS CONFIGURATION
const corsOptions = {
    origin: '*', // Allow all origins (for testing)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

// ✅ SIMPLE TEST ROUTE
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

// ✅ LOGIN ROUTE (HARDCODED FOR TESTING)
app.post('/api/auth/login', (req, res) => {
    console.log('📝 Login attempt:', req.body);
    
    const { email, password } = req.body;
    
    if (email === 'admin@crm.com' && password === 'admin123') {
        const token = jwt.sign(
            { email: 'admin@crm.com' },
            'my_secret_key',
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

// ✅ FALLBACK ROUTE
app.get('*', (req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 Health check: https://mini-crm-backend.onrender.com/api/health`);
    console.log(`📍 Login endpoint: POST https://mini-crm-backend.onrender.com/api/auth/login`);
});