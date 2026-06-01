const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const { formatDate } = require('../utils/helpers');

const generateToken = (admin) => {
    return jwt.sign(
        { 
            id: admin._id, 
            email: admin.email, 
            role: admin.role 
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        const admin = await Admin.findOne({ email: email.toLowerCase() });
        
        if (!admin) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const isPasswordValid = await admin.comparePassword(password);
        
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        admin.lastLogin = new Date();
        await admin.save();

        const token = generateToken(admin);

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: admin._id,
                email: admin.email,
                role: admin.role,
                lastLogin: formatDate(admin.lastLogin)
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
};

const verifyToken = async (req, res) => {
    try {
        const admin = await Admin.findById(req.user.id).select('-password');
        
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            user: {
                id: admin._id,
                email: admin.email,
                role: admin.role
            }
        });
    } catch (error) {
        console.error('Verify token error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

const createDefaultAdmin = async () => {
    try {
        const adminExists = await Admin.findOne({ email: 'admin@crm.com' });
        if (!adminExists) {
            const defaultAdmin = new Admin({
                email: 'admin@crm.com',
                password: 'admin123',
                role: 'admin'
            });
            await defaultAdmin.save();
            console.log('✅ Default admin created: admin@crm.com / admin123');
        }
    } catch (error) {
        console.error('Error creating default admin:', error);
    }
};

module.exports = {
    login,
    verifyToken,
    createDefaultAdmin
};