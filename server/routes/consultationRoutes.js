/**
 * Consultation Routes
 * Clean rebuild – mounted at /api/consultation
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { verifyToken, requireRole } = require('../middlewares/auth');
const c = require('../controllers/consultationController');

// Multer config for document uploads (max 5 files, 10MB each)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('File type not allowed. Use images, PDFs, or documents.'));
  }
});

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
router.post('/:id/documents',       upload.array('files', 5), c.uploadDocuments);

module.exports = router;
