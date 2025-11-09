/**
 * Verification Routes
 * Routes for doctor verification submission, approval, and management
 */

const express = require('express');
const router = express.Router();
const {
  submitVerification,
  getVerificationStatus,
  getPendingVerifications,
  getVerificationDetails,
  approveVerification,
  rejectVerification,
  getVerifiedDoctors
} = require('../controllers/verificationController');
const { verifyToken, requireRole } = require('../middlewares/auth');

// Public routes
router.get('/verified-doctors', getVerifiedDoctors);

// Doctor routes (protected)
router.post('/submit', verifyToken, requireRole('doctor'), submitVerification);
router.get('/status', verifyToken, requireRole('doctor'), getVerificationStatus);

// Admin routes (protected)
router.get('/pending', verifyToken, requireRole('admin'), getPendingVerifications);
router.get('/doctor/:doctorId', verifyToken, requireRole('admin'), getVerificationDetails);
router.put('/approve/:doctorId', verifyToken, requireRole('admin'), approveVerification);
router.put('/reject/:doctorId', verifyToken, requireRole('admin'), rejectVerification);

module.exports = router;
