const Lead = require('../models/Lead');
const { formatDate, formatCurrency, sanitizeInput } = require('../utils/helpers');

// Get all leads with filters
const getAllLeads = async (req, res) => {
    try {
        const { status, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

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

        const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
        const leads = await Lead.find(query).sort(sort);
        
        // Get statistics
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

        res.json({
            success: true,
            data: leads,
            stats
        });
    } catch (error) {
        console.error('Get leads error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching leads'
        });
    }
};

// Get single lead
const getLeadById = async (req, res) => {
    try {
        const lead = await Lead.findOne({ id: req.params.id });
        
        if (!lead) {
            return res.status(404).json({
                success: false,
                message: 'Lead not found'
            });
        }
        
        res.json({
            success: true,
            data: lead
        });
    } catch (error) {
        console.error('Get lead error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching lead'
        });
    }
};

// Create lead
const createLead = async (req, res) => {
    try {
        const { name, email, source, notes, dealValue, status } = req.body;

        if (!name || !email) {
            return res.status(400).json({
                success: false,
                message: 'Name and email are required'
            });
        }

        const newLead = new Lead({
            name: sanitizeInput(name),
            email: email.toLowerCase(),
            source: source || 'Website Contact Form',
            notes: sanitizeInput(notes),
            dealValue: dealValue ? parseFloat(dealValue) : 0,
            status: status || 'new'
        });

        const savedLead = await newLead.save();
        
        res.status(201).json({
            success: true,
            message: 'Lead created successfully',
            data: savedLead
        });
    } catch (error) {
        console.error('Create lead error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating lead'
        });
    }
};

// Update lead status
const updateLeadStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];
        
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Valid status is required'
            });
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
            return res.status(404).json({
                success: false,
                message: 'Lead not found'
            });
        }

        res.json({
            success: true,
            message: 'Lead status updated successfully',
            data: lead
        });
    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating lead status'
        });
    }
};

// Update lead (full update)
const updateLead = async (req, res) => {
    try {
        const { name, email, source, status, notes, dealValue } = req.body;
        
        const updateData = {};
        if (name) updateData.name = sanitizeInput(name);
        if (email) updateData.email = email.toLowerCase();
        if (source) updateData.source = source;
        if (status) updateData.status = status;
        if (notes !== undefined) updateData.notes = sanitizeInput(notes);
        if (dealValue !== undefined) updateData.dealValue = parseFloat(dealValue);
        
        if (status === 'won' && !updateData.convertedAt) {
            updateData.convertedAt = new Date();
        }

        const lead = await Lead.findOneAndUpdate(
            { id: req.params.id },
            updateData,
            { new: true }
        );

        if (!lead) {
            return res.status(404).json({
                success: false,
                message: 'Lead not found'
            });
        }

        res.json({
            success: true,
            message: 'Lead updated successfully',
            data: lead
        });
    } catch (error) {
        console.error('Update lead error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating lead'
        });
    }
};

// Add note to lead
const addNote = async (req, res) => {
    try {
        const { note } = req.body;

        if (!note || !note.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Note content is required'
            });
        }

        const lead = await Lead.findOne({ id: req.params.id });
        
        if (!lead) {
            return res.status(404).json({
                success: false,
                message: 'Lead not found'
            });
        }

        const timestamp = new Date().toLocaleString();
        const newNote = `📝 [${timestamp}] ${sanitizeInput(note)}`;
        
        lead.notes = lead.notes ? `${lead.notes}\n${newNote}` : newNote;
        await lead.save();

        res.json({
            success: true,
            message: 'Note added successfully',
            data: lead
        });
    } catch (error) {
        console.error('Add note error:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding note'
        });
    }
};

// Delete lead
const deleteLead = async (req, res) => {
    try {
        const lead = await Lead.findOneAndDelete({ id: req.params.id });
        
        if (!lead) {
            return res.status(404).json({
                success: false,
                message: 'Lead not found'
            });
        }

        res.json({
            success: true,
            message: 'Lead deleted successfully'
        });
    } catch (error) {
        console.error('Delete lead error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting lead'
        });
    }
};

// Get pipeline analytics
const getPipelineAnalytics = async (req, res) => {
    try {
        const pipelineStats = await Lead.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalValue: { $sum: '$dealValue' }
                }
            }
        ]);
        
        const totalValue = await Lead.aggregate([
            { $group: { _id: null, total: { $sum: '$dealValue' } } }
        ]);
        
        const wonValue = await Lead.aggregate([
            { $match: { status: 'won' } },
            { $group: { _id: null, total: { $sum: '$dealValue' } } }
        ]);
        
        res.json({
            success: true,
            data: {
                pipelineStats,
                totalPipelineValue: totalValue[0]?.total || 0,
                wonValue: wonValue[0]?.total || 0
            }
        });
    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching analytics'
        });
    }
};

module.exports = {
    getAllLeads,
    getLeadById,
    createLead,
    updateLeadStatus,
    updateLead,
    addNote,
    deleteLead,
    getPipelineAnalytics
};