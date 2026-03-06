/**
 * Consultation Routes
 * Clean rebuild – mounted at /api/consultation
 */

const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middlewares/auth');
const c = require('../controllers/consultationController');

// All routes require authentication
router.use(verifyToken);

// ── Doctor Discovery ──
router.get('/doctors',               c.getDoctors);
router.get('/doctors/:doctorId',     c.getDoctorProfile);
router.get('/doctors/:doctorId/slots', c.getAvailableSlots);

// ── Booking ──
router.post('/book',                 c.bookConsultation);

// ── Patient endpoints ──
router.get('/my-consultations',      c.getMyConsultations);

// ── Doctor endpoints ──
router.get('/doctor/consultations',  requireRole(['doctor']), c.getDoctorConsultations);
router.get('/doctor/stats',          requireRole(['doctor']), c.getDoctorStats);
router.post('/:id/accept',          requireRole(['doctor']), c.acceptConsultation);
router.post('/:id/complete',        requireRole(['doctor']), c.completeConsultation);
router.post('/:id/prescription',    requireRole(['doctor']), c.addPrescription);

// ── Shared endpoints ──
router.get('/:id',                   c.getConsultation);
router.post('/:id/join',            c.joinConsultation);
router.post('/:id/cancel',          c.cancelConsultation);
router.post('/:id/pay',             c.payConsultation);
router.post('/:id/feedback',        c.addFeedback);
router.put('/:id/pre-consultation', c.updatePreConsultation);

module.exports = router;
