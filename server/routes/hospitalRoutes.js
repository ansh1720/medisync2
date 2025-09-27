/**
 * Hospital Routes
 * Handles hospital locator with geospatial queries and CRUD operations
 * 
 * Example usage:
 * GET /api/hospitals/nearby - Find nearby hospitals
 * curl -X GET "http://localhost:5000/api/hospitals/nearby?lat=40.7128&lng=-74.0060&radius=25"
 * 
 * GET /api/hospitals - Get all hospitals with filtering
 * curl -X GET "http://localhost:5000/api/hospitals?services=emergency&type=general"
 * 
 * POST /api/hospitals - Create new hospital (admin only)
 * PUT /api/hospitals/:id - Update hospital (admin only)
 */

const express = require('express');
const { body, query, param } = require('express-validator');
const hospitalController = require('../controllers/hospitalController');
const { verifyToken, requireRole } = require('../middlewares/auth');

const router = express.Router();

// Validation rules
const nearbyValidation = [
  query('lat')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  query('lng')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  query('radius')
    .optional()
    .isFloat({ min: 0.1, max: 500 })
    .withMessage('Radius must be between 0.1 and 500 km'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  query('services')
    .optional()
    .isString()
    .withMessage('Services must be a string'),
  query('type')
    .optional()
    .isIn(['general', 'specialty', 'emergency', 'clinic', 'urgent_care'])
    .withMessage('Invalid hospital type')
];

const searchValidation = [
  query('q')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
  query('city')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('City must be between 1 and 50 characters'),
  query('state')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('State must be between 2 and 50 characters'),
  query('zipCode')
    .optional()
    .matches(/^\d{5}(-\d{4})?$/)
    .withMessage('Invalid ZIP code format'),
  query('services')
    .optional()
    .isString()
    .withMessage('Services must be a string'),
  query('acceptsInsurance')
    .optional()
    .isString()
    .withMessage('Insurance must be a string'),
  query('rating')
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage('Rating must be between 0 and 5'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
];

const hospitalValidation = [
  body('name')
    .isString()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Hospital name must be between 2 and 200 characters'),
  body('type')
    .isIn(['general', 'specialty', 'emergency', 'clinic', 'urgent_care'])
    .withMessage('Invalid hospital type'),
  body('address.street')
    .isString()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Street address must be between 5 and 200 characters'),
  body('address.city')
    .isString()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('City must be between 2 and 100 characters'),
  body('address.state')
    .isString()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('State must be between 2 and 50 characters'),
  body('address.zipCode')
    .matches(/^\d{5}(-\d{4})?$/)
    .withMessage('Invalid ZIP code format'),
  body('address.country')
    .isString()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Country must be between 2 and 50 characters'),
  body('location.coordinates')
    .isArray({ min: 2, max: 2 })
    .withMessage('Location coordinates must be an array of [longitude, latitude]'),
  body('location.coordinates.*')
    .isFloat()
    .withMessage('Coordinates must be numbers'),
  body('contactInfo.phone')
    .matches(/^\+?[\d\s\-\(\)]+$/)
    .withMessage('Invalid phone number format'),
  body('contactInfo.email')
    .optional()
    .isEmail()
    .withMessage('Invalid email format'),
  body('services')
    .isArray({ min: 1 })
    .withMessage('At least one service is required'),
  body('services.*')
    .isString()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each service must be between 1 and 50 characters'),
  body('operatingHours')
    .isObject()
    .withMessage('Operating hours must be an object'),
  body('capacity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Capacity must be a positive integer'),
  body('acceptedInsurance')
    .optional()
    .isArray()
    .withMessage('Accepted insurance must be an array'),
  body('acceptedInsurance.*')
    .optional()
    .isString()
    .trim()
    .withMessage('Each insurance must be a string')
];

const reviewValidation = [
  body('rating')
    .isFloat({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('comment')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Comment cannot exceed 1000 characters'),
  body('category')
    .optional()
    .isIn(['care_quality', 'staff', 'facilities', 'wait_time', 'overall'])
    .withMessage('Invalid review category')
];

// Routes

/**
 * @route   GET /api/hospitals/nearby
 * @desc    Find hospitals near given coordinates
 * @access  Public
 */
router.get('/nearby',
  nearbyValidation,
  hospitalController.findNearbyHospitals
);

/**
 * @route   GET /api/hospitals/search
 * @desc    Search hospitals with advanced filters
 * @access  Public
 */
router.get('/search',
  searchValidation,
  hospitalController.searchHospitals
);

/**
 * @route   GET /api/hospitals
 * @desc    Get all hospitals with pagination and filtering
 * @access  Public
 */
router.get('/',
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50'),
    query('type')
      .optional()
      .isIn(['general', 'specialty', 'emergency', 'clinic', 'urgent_care'])
      .withMessage('Invalid hospital type'),
    query('services')
      .optional()
      .isString()
      .withMessage('Services must be a string')
  ],
  hospitalController.getAllHospitals
);

/**
 * @route   GET /api/hospitals/:id
 * @desc    Get specific hospital by ID
 * @access  Public
 */
router.get('/:id',
  param('id').isMongoId().withMessage('Invalid hospital ID'),
  hospitalController.getHospitalById
);

/**
 * @route   POST /api/hospitals
 * @desc    Create new hospital (admin only)
 * @access  Private (Admin)
 */
router.post('/',
  verifyToken,
  requireRole('admin'),
  hospitalValidation,
  hospitalController.createHospital
);

/**
 * @route   PUT /api/hospitals/:id
 * @desc    Update hospital information (admin only)
 * @access  Private (Admin)
 */
router.put('/:id',
  verifyToken,
  requireRole('admin'),
  param('id').isMongoId().withMessage('Invalid hospital ID'),
  hospitalValidation,
  hospitalController.updateHospital
);

/**
 * @route   DELETE /api/hospitals/:id
 * @desc    Delete hospital (admin only)
 * @access  Private (Admin)
 */
router.delete('/:id',
  verifyToken,
  requireRole('admin'),
  param('id').isMongoId().withMessage('Invalid hospital ID'),
  hospitalController.deleteHospital
);

/**
 * @route   GET /api/hospitals/:id/availability
 * @desc    Get current hospital availability and wait times
 * @access  Public
 */
router.get('/:id/availability',
  param('id').isMongoId().withMessage('Invalid hospital ID'),
  hospitalController.getHospitalAvailability
);

/**
 * @route   GET /api/hospitals/:id/departments
 * @desc    Get hospital departments and their services
 * @access  Public
 */
router.get('/:id/departments',
  param('id').isMongoId().withMessage('Invalid hospital ID'),
  hospitalController.getHospitalDepartments
);

/**
 * @route   GET /api/hospitals/:id/doctors
 * @desc    Get doctors associated with hospital
 * @access  Public
 */
router.get('/:id/doctors',
  param('id').isMongoId().withMessage('Invalid hospital ID'),
  [
    query('specialty')
      .optional()
      .isString()
      .trim()
      .withMessage('Specialty must be a string'),
    query('available')
      .optional()
      .isBoolean()
      .withMessage('Available must be a boolean'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50')
  ],
  hospitalController.getHospitalDoctors
);

/**
 * @route   POST /api/hospitals/:id/reviews
 * @desc    Add review for hospital
 * @access  Private
 */
router.post('/:id/reviews',
  verifyToken,
  param('id').isMongoId().withMessage('Invalid hospital ID'),
  reviewValidation,
  hospitalController.addHospitalReview
);

/**
 * @route   GET /api/hospitals/:id/reviews
 * @desc    Get hospital reviews
 * @access  Public
 */
router.get('/:id/reviews',
  param('id').isMongoId().withMessage('Invalid hospital ID'),
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50'),
    query('rating')
      .optional()
      .isFloat({ min: 1, max: 5 })
      .withMessage('Rating filter must be between 1 and 5'),
    query('category')
      .optional()
      .isIn(['care_quality', 'staff', 'facilities', 'wait_time', 'overall'])
      .withMessage('Invalid review category')
  ],
  hospitalController.getHospitalReviews
);

/**
 * @route   POST /api/hospitals/:id/emergency-contact
 * @desc    Emergency contact for critical situations
 * @access  Public
 */
router.post('/:id/emergency-contact',
  param('id').isMongoId().withMessage('Invalid hospital ID'),
  [
    body('patientInfo.name')
      .isString()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Patient name must be between 2 and 100 characters'),
    body('patientInfo.age')
      .isInt({ min: 0, max: 150 })
      .withMessage('Age must be between 0 and 150'),
    body('emergencyType')
      .isIn(['cardiac', 'stroke', 'trauma', 'respiratory', 'poisoning', 'other'])
      .withMessage('Invalid emergency type'),
    body('severity')
      .isIn(['low', 'medium', 'high', 'critical'])
      .withMessage('Invalid severity level'),
    body('symptoms')
      .isArray({ min: 1 })
      .withMessage('At least one symptom is required'),
    body('contactPhone')
      .matches(/^\+?[\d\s\-\(\)]+$/)
      .withMessage('Invalid phone number format')
  ],
  hospitalController.emergencyContact
);

/**
 * @route   GET /api/hospitals/statistics/overview
 * @desc    Get hospital statistics overview
 * @access  Public
 */
router.get('/statistics/overview',
  [
    query('region')
      .optional()
      .isString()
      .trim()
      .withMessage('Region must be a string'),
    query('type')
      .optional()
      .isIn(['general', 'specialty', 'emergency', 'clinic', 'urgent_care'])
      .withMessage('Invalid hospital type')
  ],
  hospitalController.getHospitalStatistics
);

/**
 * @route   POST /api/hospitals/:id/report-issue
 * @desc    Report issue with hospital information
 * @access  Private
 */
router.post('/:id/report-issue',
  verifyToken,
  param('id').isMongoId().withMessage('Invalid hospital ID'),
  [
    body('issueType')
      .isIn(['incorrect_info', 'closed_permanently', 'wrong_location', 'other'])
      .withMessage('Invalid issue type'),
    body('description')
      .isString()
      .trim()
      .isLength({ min: 10, max: 500 })
      .withMessage('Description must be between 10 and 500 characters'),
    body('contactInfo')
      .optional()
      .isString()
      .trim()
      .withMessage('Contact info must be a string')
  ],
  hospitalController.reportIssue
);

/**
 * @route   GET /api/hospitals/:id/directions
 * @desc    Get directions to hospital from given location
 * @access  Public
 */
router.get('/:id/directions',
  param('id').isMongoId().withMessage('Invalid hospital ID'),
  [
    query('fromLat')
      .isFloat({ min: -90, max: 90 })
      .withMessage('From latitude must be between -90 and 90'),
    query('fromLng')
      .isFloat({ min: -180, max: 180 })
      .withMessage('From longitude must be between -180 and 180'),
    query('mode')
      .optional()
      .isIn(['driving', 'walking', 'transit'])
      .withMessage('Invalid travel mode')
  ],
  hospitalController.getDirections
);

module.exports = router;