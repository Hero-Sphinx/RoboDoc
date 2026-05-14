const express = require('express');
const router = express.Router();
const triageController = require('../controllers/triageController');

// Submit new assessment
router.post('/create', triageController.createTriageRecord);

// Get the doctor's list
router.get('/history', triageController.getAllTriageRecords);

router.patch('/:id/status', triageController.updateTriageStatus);

module.exports = router;