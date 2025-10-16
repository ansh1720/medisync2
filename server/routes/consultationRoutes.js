/**
 * Consultation Routes
 * Handles doctor consultation booking and management system
 * 
 * Example usage:
 * POST /api/consultation/book - Book new consultation
 * curl -X POST http://localhost:5000/api/consultation/book \
 *   -H "Content-Type: application/json" \
 *   -H "Authorization: Bearer YOUR_JWT_TOKEN" \
 *   -d '{
 *     "doctorId": "507f1f77bcf86cd799439011",
 *     "preferredDateTime": "2024-02-15T14:00:00Z",
 *     "consultationType": "video",
 *     "symptoms": "Persistent headaches",
 *     "urgency": "medium"
 *   }'
 * 
 * GET /api/consultation/my-consultations - Get user's consultations
 * PUT /api/consultation/:id/reschedule - Reschedule consultation
 * POST /api/consultation/:id/cancel - Cancel consultation
 */

const express = require('express');
const { body, query, param } = require('express-validator');
const consultationController = require('../controllers/consultationController');
const { verifyToken, requireRole } = require('../middlewares/auth');

const router = express.Router();

// DEBUG: Simple test endpoint to check doctors
router.get('/debug-doctors', async (req, res) => {
  try {
    const Doctor = require('../models/Doctor');
    const allDocs = await Doctor.find({}).limit(10);
    const activeDocs = await Doctor.find({ isActive: true }).limit(10);
    
    res.json({
      success: true,
      debug: {
        totalDoctors: allDocs.length,
        activeDoctors: activeDocs.length,
        firstDoctor: allDocs[0] ? {
          name: allDocs[0].name,
          specialty: allDocs[0].specialty,
          isActive: allDocs[0].isActive
        } : null
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Validation rules
const bookingValidation = [
  body('doctorId')
    .isMongoId()
    .withMessage('Invalid doctor ID'),
  body('preferredDateTime')
    .isISO8601()
    .withMessage('Invalid date time format'),
  body('consultationType')
    .isIn(['video', 'audio', 'chat', 'in_person'])
    .withMessage('Invalid consultation type'),
  body('symptoms')
    .isString()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Symptoms description must be between 10 and 1000 characters'),
  body('urgency')
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid urgency level'),
  body('medicalHistory')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Medical history cannot exceed 2000 characters'),
  body('currentMedications')
    .optional()
    .isArray()
    .withMessage('Current medications must be an array'),
  body('currentMedications.*')
    .optional()
    .isString()
    .trim()
    .withMessage('Each medication must be a string'),
  body('allergies')
    .optional()
    .isArray()
    .withMessage('Allergies must be an array'),
  body('allergies.*')
    .optional()
    .isString()
    .trim()
    .withMessage('Each allergy must be a string'),
  body('insuranceInfo')
    .optional()
    .isObject()
    .withMessage('Insurance info must be an object')
];

const rescheduleValidation = [
  body('newDateTime')
    .isISO8601()
    .withMessage('Invalid new date time format'),
  body('reason')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason cannot exceed 500 characters')
];

const consultationListValidation = [
  query('status')
    .optional()
    .isIn(['scheduled', 'ongoing', 'completed', 'cancelled', 'rescheduled'])
    .withMessage('Invalid consultation status'),
  query('type')
    .optional()
    .isIn(['video', 'audio', 'chat', 'in_person'])
    .withMessage('Invalid consultation type'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format'),
  query('doctorId')
    .optional()
    .isMongoId()
    .withMessage('Invalid doctor ID'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
];

const availabilityValidation = [
  query('doctorId')
    .isMongoId()
    .withMessage('Invalid doctor ID'),
  query('date')
    .isISO8601()
    .withMessage('Invalid date format'),
  query('duration')
    .optional()
    .isInt({ min: 15, max: 180 })
    .withMessage('Duration must be between 15 and 180 minutes')
];

// Routes

/**
 * @route   POST /api/consultation/book
 * @desc    Book new consultation with doctor
 * @access  Private
 */
router.post('/book',
  verifyToken,
  bookingValidation,
  consultationController.bookConsultation
);

/**
 * @route   GET /api/consultation/availability
 * @desc    Get doctor availability slots
 * @access  Private
 */
router.get('/availability',
  verifyToken,
  availabilityValidation,
  consultationController.getDoctorAvailability
);

/**
 * @route   GET /api/consultation/my-consultations
 * @desc    Get user's consultations with filtering
 * @access  Private
 */
router.get('/my-consultations',
  verifyToken,
  consultationListValidation,
  consultationController.getUserConsultations
);

/**
 * @route   GET /api/consultation/doctors
 * @desc    Get available doctors for consultation
 * @access  Public
 */
router.get('/doctors',
  [
    query('specialty')
      .optional()
      .isString()
      .withMessage('Specialty must be a string'),
    query('consultationType')
      .optional()
      .isIn(['video', 'audio', 'chat', 'in_person'])
      .withMessage('Invalid consultation type'),
    query('rating')
      .optional()
      .isFloat({ min: 0, max: 5 })
      .withMessage('Rating must be between 0 and 5'),
    query('location')
      .optional()
      .isString()
      .withMessage('Location must be a string'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50')
  ],
  consultationController.getAvailableDoctors
);

/**
 * @route   PUT /api/consultation/:id/reschedule
 * @desc    Reschedule existing consultation
 * @access  Private
 */
router.put('/:id/reschedule',
  verifyToken,
  param('id').isMongoId().withMessage('Invalid consultation ID'),
  rescheduleValidation,
  consultationController.rescheduleConsultation
);

/**
 * @route   POST /api/consultation/:id/cancel
 * @desc    Cancel consultation
 * @access  Private
 */
router.post('/:id/cancel',
  verifyToken,
  param('id').isMongoId().withMessage('Invalid consultation ID'),
  [
    body('reason')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Cancellation reason cannot exceed 500 characters'),
    body('requestRefund')
      .optional()
      .isBoolean()
      .withMessage('Request refund must be a boolean')
  ],
  consultationController.cancelConsultation
);

/**
 * @route   POST /api/consultation/:id/join
 * @desc    Join ongoing consultation (get meeting details)
 * @access  Private
 */
router.post('/:id/join',
  verifyToken,
  param('id').isMongoId().withMessage('Invalid consultation ID'),
  consultationController.joinConsultation
);

/**
 * @route   POST /api/consultation/:id/complete
 * @desc    Mark consultation as completed (doctor only)
 * @access  Private (Doctor)
 */
router.post('/:id/complete',
  verifyToken,
  requireRole('doctor'),
  param('id').isMongoId().withMessage('Invalid consultation ID'),
  [
    body('diagnosis')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Diagnosis cannot exceed 2000 characters'),
    body('treatmentPlan')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Treatment plan cannot exceed 2000 characters'),
    body('prescriptions')
      .optional()
      .isArray()
      .withMessage('Prescriptions must be an array'),
    body('followUpRequired')
      .optional()
      .isBoolean()
      .withMessage('Follow up required must be a boolean'),
    body('followUpDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid follow up date format'),
    body('notes')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Notes cannot exceed 2000 characters')
  ],
  consultationController.completeConsultation
);

/**
 * @route   GET /api/consultation/doctor/schedule
 * @desc    Get doctor's consultation schedule (doctor only)
 * @access  Private (Doctor)
 */
router.get('/doctor/schedule',
  verifyToken,
  requireRole('doctor'),
  [
    query('date')
      .optional()
      .isISO8601()
      .withMessage('Invalid date format'),
    query('view')
      .optional()
      .isIn(['day', 'week', 'month'])
      .withMessage('Invalid view type'),
    query('status')
      .optional()
      .isIn(['scheduled', 'ongoing', 'completed', 'cancelled'])
      .withMessage('Invalid status filter')
  ],
  consultationController.getDoctorSchedule
);

/**
 * @route   POST /api/consultation/:id/add-notes
 * @desc    Add consultation notes (doctor only)
 * @access  Private (Doctor)
 */
router.post('/:id/add-notes',
  verifyToken,
  requireRole('doctor'),
  param('id').isMongoId().withMessage('Invalid consultation ID'),
  [
    body('notes')
      .isString()
      .trim()
      .isLength({ min: 1, max: 2000 })
      .withMessage('Notes must be between 1 and 2000 characters'),
    body('isPrivate')
      .optional()
      .isBoolean()
      .withMessage('Is private must be a boolean')
  ],
  consultationController.addConsultationNotes
);

/**
 * @route   POST /api/consultation/:id/prescription
 * @desc    Add prescription to consultation (doctor only)
 * @access  Private (Doctor)
 */
router.post('/:id/prescription',
  verifyToken,
  requireRole('doctor'),
  param('id').isMongoId().withMessage('Invalid consultation ID'),
  [
    body('medications')
      .isArray({ min: 1 })
      .withMessage('At least one medication is required'),
    body('medications.*.name')
      .isString()
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('Medication name must be between 1 and 200 characters'),
    body('medications.*.dosage')
      .isString()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Dosage must be between 1 and 100 characters'),
    body('medications.*.frequency')
      .isString()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Frequency must be between 1 and 100 characters'),
    body('medications.*.duration')
      .isString()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Duration must be between 1 and 100 characters'),
    body('medications.*.instructions')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Instructions cannot exceed 500 characters'),
    body('pharmacyInstructions')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Pharmacy instructions cannot exceed 1000 characters')
  ],
  consultationController.addPrescription
);

/**
 * @route   GET /api/consultation/:id/prescription
 * @desc    Get consultation prescription
 * @access  Private
 */
router.get('/:id/prescription',
  verifyToken,
  param('id').isMongoId().withMessage('Invalid consultation ID'),
  consultationController.getConsultationPrescription
);

/**
 * @route   POST /api/consultation/:id/review
 * @desc    Add review for consultation
 * @access  Private
 */
router.post('/:id/review',
  verifyToken,
  param('id').isMongoId().withMessage('Invalid consultation ID'),
  [
    body('rating')
      .isFloat({ min: 1, max: 5 })
      .withMessage('Rating must be between 1 and 5'),
    body('comment')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Comment cannot exceed 1000 characters'),
    body('categories')
      .optional()
      .isObject()
      .withMessage('Categories must be an object'),
    body('categories.punctuality')
      .optional()
      .isFloat({ min: 1, max: 5 })
      .withMessage('Punctuality rating must be between 1 and 5'),
    body('categories.communication')
      .optional()
      .isFloat({ min: 1, max: 5 })
      .withMessage('Communication rating must be between 1 and 5'),
    body('categories.expertise')
      .optional()
      .isFloat({ min: 1, max: 5 })
      .withMessage('Expertise rating must be between 1 and 5'),
    body('wouldRecommend')
      .optional()
      .isBoolean()
      .withMessage('Would recommend must be a boolean')
  ],
  consultationController.addConsultationReview
);

/**
 * @route   GET /api/consultation/stats/overview
 * @desc    Get consultation statistics overview
 * @access  Private
 */
router.get('/stats/overview',
  verifyToken,
  [
    query('period')
      .optional()
      .isIn(['week', 'month', 'quarter', 'year'])
      .withMessage('Invalid period'),
    query('doctorId')
      .optional()
      .isMongoId()
      .withMessage('Invalid doctor ID')
  ],
  consultationController.getConsultationStats
);

/**
 * @route   POST /api/consultation/:id/payment
 * @desc    Process consultation payment
 * @access  Private
 */
router.post('/:id/payment',
  verifyToken,
  param('id').isMongoId().withMessage('Invalid consultation ID'),
  [
    body('paymentMethod')
      .isIn(['card', 'insurance', 'cash', 'wallet'])
      .withMessage('Invalid payment method'),
    body('amount')
      .isFloat({ min: 0 })
      .withMessage('Amount must be a positive number'),
    body('currency')
      .optional()
      .isIn(['USD', 'EUR', 'GBP', 'INR'])
      .withMessage('Invalid currency'),
    body('paymentDetails')
      .optional()
      .isObject()
      .withMessage('Payment details must be an object')
  ],
  consultationController.processPayment
);

/**
 * @route   GET /api/consultation/upcoming
 * @desc    Get upcoming consultations (next 24 hours)
 * @access  Private
 */
router.get('/upcoming',
  verifyToken,
  [
    query('hours')
      .optional()
      .isInt({ min: 1, max: 168 })
      .withMessage('Hours must be between 1 and 168 (1 week)')
  ],
  consultationController.getUpcomingConsultations
);

/**
 * @route   POST /api/consultation/bulk-availability
 * @desc    Check availability for multiple doctors
 * @access  Private
 * @todo    Implement bulkCheckAvailability controller function
 */
/*
router.post('/bulk-availability',
  verifyToken,
  [
    body('doctorIds')
      .isArray({ min: 1, max: 10 })
      .withMessage('Doctor IDs must be an array with 1-10 items'),
    body('doctorIds.*')
      .isMongoId()
      .withMessage('Each doctor ID must be valid'),
    body('dateRange')
      .isObject()
      .withMessage('Date range must be an object'),
    body('dateRange.start')
      .isISO8601()
      .withMessage('Invalid start date format'),
    body('dateRange.end')
      .isISO8601()
      .withMessage('Invalid end date format'),
    body('duration')
      .optional()
      .isInt({ min: 15, max: 180 })
      .withMessage('Duration must be between 15 and 180 minutes')
  ],
  consultationController.bulkCheckAvailability
);
*/

/**
 * @route   GET /api/consultation/:id
 * @desc    Get specific consultation details
 * @access  Private
 */
router.get('/:id',
  verifyToken,
  param('id').isMongoId().withMessage('Invalid consultation ID'),
  consultationController.getConsultationById
);

module.exports = router;