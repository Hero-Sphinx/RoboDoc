const express = require('express');
const router = express.Router();
const triageController = require('../controllers/triageController');
const authController = require('../controllers/authController'); // 1. YOU NEEDED THIS LINE
const authenticateToken = require('../middleware/authMiddleware');
const isAdmin = require('../middleware/adminMiddleware'); // Only the Medical Director can register new doctors
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// --- Auth Routes ---

// Only the Admin (MD) can register new doctors
router.post('/register', authenticateToken, isAdmin, authController.register);

// Doctor Login
router.post('/login', authController.login); // 2. ADD THIS so doctors can actually log in!

// --- Triage Records Routes ---

// Submit new assessment
router.post('/create', triageController.createTriageRecord);

// Get the doctor's list
router.get('/history', triageController.getAllTriageRecords);

// Public route for patients to check their own status
router.get('/public/status/:medical_id', triageController.getPatientStatus);

// Update status (Seen/Pending)
router.patch('/:id/status', triageController.updateTriageStatus);

// Update Clinical Notes
router.patch('/:id/notes', async (req, res) => {
  const { id } = req.params;
  const { notes } = req.body; 
  
  try {
    const updated = await prisma.triageRecord.update({
      where: { id: parseInt(id) },
      data: { doctorNotes: notes } 
    });
    
    // Notify the dashboard in real-time via Socket.io
    const io = req.app.get('socketio');
    if (io) {
        io.emit('patient_updated', updated);
    }
    
    res.json(updated);
  } catch (error) {
    console.error("Error saving doctor notes:", error);
    res.status(500).json({ error: "Failed to save clinical notes" });
  }
});

module.exports = router;