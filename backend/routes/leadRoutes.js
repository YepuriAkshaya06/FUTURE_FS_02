const express = require('express');
const router = express.Router();
const leadController = require('../controllers/leadController');
const authMiddleware = require('../middleware/authMiddleware');

// All lead routes require authentication
router.use(authMiddleware);

// Lead CRUD routes
router.get('/', leadController.getAllLeads);
router.get('/analytics/pipeline', leadController.getPipelineAnalytics);
router.get('/:id', leadController.getLeadById);
router.post('/', leadController.createLead);
router.put('/:id', leadController.updateLead);
router.put('/:id/status', leadController.updateLeadStatus);
router.post('/:id/notes', leadController.addNote);
router.delete('/:id', leadController.deleteLead);

module.exports = router;