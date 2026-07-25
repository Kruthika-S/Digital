const express = require('express');
const leadController = require('../controllers/lead.controller');
const validate = require('../middleware/validate.middleware');
const { leadValidation } = require('../middleware/validations');
const auth = require('../middleware/auth.middleware');

const router = express.Router();

// Public route for capture form
router.post('/capture', validate(leadValidation.createLead), leadController.createLead);

// Protected routes (all subsequent require auth)
router.use(auth());

// Lead list
router.get('/', validate(leadValidation.getLeads), leadController.getLeads);

// Lead detail
router.get('/:id', leadController.getLeadById);

// Lead activities
router.get('/:id/activities', leadController.getLeadActivities);

// Update lead and add notes
router.put('/:id', validate(leadValidation.updateLead), leadController.updateLead);
router.post('/:id/notes', validate(leadValidation.addNote), leadController.addNote);

// Admin only routes
router.post('/:id/assign', auth('admin'), validate(leadValidation.assignLead), leadController.assignLead);
router.delete('/:id', auth('admin'), leadController.deleteLead);

module.exports = router;
