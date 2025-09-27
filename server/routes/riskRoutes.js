/**
 * Risk Assessment Routes
 * Handles health risk calculation based on symptoms, age, and conditions
 * 
 * Example usage:
 * POST /api/risk - Calculate risk assessment
 * curl -X POST http://localhost:5000/api/risk \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "age": 35,
 *     "symptoms": ["fever", "cough", "headache"],
 *     "conditions": ["diabetes"],
 *     "location": {"latitude": 40.7128, "longitude": -74.0060}
 *   }'
 * 
 * GET /api/risk/history - Get user's risk assessment history (authenticated)
 * curl -X GET http://localhost:5000/api/risk/history \
 *   -H "Authorization: Bearer YOUR_JWT_TOKEN"
 */

const express = require('express');
const { body, query } = require('express-validator');
const riskController = require('../controllers/riskController');
const { verifyToken, optionalAuth } = require('../middlewares/auth');

const router = express.Router();

// Validation rules
const riskAssessmentValidation = [
  body('age')
    .isInt({ min: 0, max: 150 })
    .withMessage('Age must be between 0 and 150'),
  body('symptoms')
    .isArray({ min: 1 })
    .withMessage('At least one symptom is required'),
  body('symptoms.*')
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Each symptom must be a valid string between 1 and 100 characters'),
  body('conditions')
    .optional()
    .isArray()
    .withMessage('Conditions must be an array'),
  body('conditions.*')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Each condition must be a valid string between 1 and 100 characters'),
  body('location')
    .optional()
    .isObject()
    .withMessage('Location must be an object'),
  body('location.latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('location.longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  body('additionalInfo')
    .optional()
    .isObject()
    .withMessage('Additional info must be an object'),
  body('additionalInfo.gender')
    .optional()
    .isIn(['male', 'female', 'other', 'prefer_not_to_say'])
    .withMessage('Invalid gender value')
];

const historyValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  query('riskLevel')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Invalid risk level'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date')
];

// Routes

/**
 * @route   POST /api/risk
 * @desc    Calculate health risk assessment
 * @access  Public (but saves to history if authenticated)
 */
router.post('/', 
  optionalAuth, // Optional authentication - saves to history if logged in
  riskAssessmentValidation,
  riskController.calculateRisk
);

/**
 * @route   GET /api/risk/history
 * @desc    Get user's risk assessment history
 * @access  Private
 */
router.get('/history',
  verifyToken,
  historyValidation,
  riskController.getRiskHistory
);

/**
 * @route   GET /api/risk/history/:id
 * @desc    Get specific risk assessment by ID
 * @access  Private
 */
router.get('/history/:id',
  verifyToken,
  riskController.getRiskAssessmentById
);

/**
 * @route   GET /api/risk/trends
 * @desc    Get user's risk trends over time
 * @access  Private
 */
router.get('/trends',
  verifyToken,
  [
    query('days')
      .optional()
      .isInt({ min: 1, max: 365 })
      .withMessage('Days must be between 1 and 365')
  ],
  riskController.getRiskTrends
);

/**
 * @route   GET /api/risk/symptoms
 * @desc    Get user's most common symptoms
 * @access  Private
 */
router.get('/symptoms',
  verifyToken,
  [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50')
  ],
  riskController.getCommonSymptoms
);

/**
 * @route   POST /api/risk/history/:id/feedback
 * @desc    Add feedback to a risk assessment
 * @access  Private
 */
router.post('/history/:id/feedback',
  verifyToken,
  [
    body('helpfulRating')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Helpful rating must be between 1 and 5'),
    body('accuracyRating')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Accuracy rating must be between 1 and 5'),
    body('comment')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Comment cannot exceed 500 characters'),
    body('followedRecommendations')
      .optional()
      .isBoolean()
      .withMessage('Followed recommendations must be a boolean'),
    body('actualOutcome')
      .optional()
      .isIn(['better', 'same', 'worse', 'sought_medical_help'])
      .withMessage('Invalid actual outcome')
  ],
  riskController.addFeedback
);

/**
 * @route   POST /api/risk/history/:id/reminder
 * @desc    Set follow-up reminder for risk assessment
 * @access  Private
 */
router.post('/history/:id/reminder',
  verifyToken,
  [
    body('reminderDate')
      .isISO8601()
      .withMessage('Reminder date must be a valid ISO 8601 date'),
    body('notes')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Notes cannot exceed 500 characters')
  ],
  riskController.setReminder
);

/**
 * @route   POST /api/risk/history/:id/share
 * @desc    Share risk assessment with doctor
 * @access  Private
 */
router.post('/history/:id/share',
  verifyToken,
  [
    body('doctorId')
      .isMongoId()
      .withMessage('Invalid doctor ID'),
    body('permissions')
      .optional()
      .isIn(['view', 'comment', 'full'])
      .withMessage('Invalid permissions level')
  ],
  riskController.shareWithDoctor
);

/**
 * @route   DELETE /api/risk/history/:id
 * @desc    Delete risk assessment from history
 * @access  Private
 */
router.delete('/history/:id',
  verifyToken,
  riskController.deleteRiskAssessment
);

/**
 * @route   GET /api/risk/weights
 * @desc    Get current symptom weights (for transparency)
 * @access  Public
 */
router.get('/weights',
  riskController.getSymptomWeights
);

module.exports = router;