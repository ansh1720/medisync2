/**
 * Equipment Readings Routes
 * Handles medical device readings with interpretation logic
 * 
 * Supported equipment types:
 * - Blood Pressure Monitor (systolic/diastolic)
 * - Thermometer (temperature)
 * - Pulse Oximeter (oxygen saturation, heart rate)
 * - Glucometer (blood glucose)
 * - ECG Monitor (heart rhythm data)
 * - Peak Flow Meter (lung function)
 * - Weight Scale (body weight)
 * 
 * Example usage:
 * POST /api/equipment/readings - Submit new reading
 * curl -X POST http://localhost:5000/api/equipment/readings \
 *   -H "Content-Type: application/json" \
 *   -H "Authorization: Bearer YOUR_JWT_TOKEN" \
 *   -d '{
 *     "equipmentType": "blood_pressure",
 *     "readings": {"systolic": 140, "diastolic": 90},
 *     "deviceInfo": {"model": "Omron HEM-7120", "serialNumber": "BP001"}
 *   }'
 */

const express = require('express');
const { body, query, param } = require('express-validator');
const equipmentController = require('../controllers/equipmentController');
const { verifyToken } = require('../middlewares/auth');
const multer = require('multer');

const router = express.Router();

// Configure multer for file uploads (ECG files, etc.)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow specific file types for medical data
    const allowedMimes = [
      'text/csv',
      'application/json',
      'text/plain',
      'application/octet-stream'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only CSV, JSON, and text files allowed.'));
    }
  }
});

// Validation rules
const readingValidation = [
  body('equipmentType')
    .isIn([
      'blood_pressure', 'thermometer', 'pulse_oximeter', 
      'glucometer', 'ecg_monitor', 'peak_flow_meter', 
      'weight_scale', 'heart_rate_monitor'
    ])
    .withMessage('Invalid equipment type'),
    
  body('readings')
    .isObject()
    .withMessage('Readings must be an object'),
    
  body('deviceInfo')
    .optional()
    .isObject()
    .withMessage('Device info must be an object'),
    
  body('deviceInfo.model')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Device model must be a string under 100 characters'),
    
  body('deviceInfo.serialNumber')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Serial number must be a string under 50 characters'),
    
  body('notes')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters'),
    
  body('location')
    .optional()
    .isObject()
    .withMessage('Location must be an object'),
    
  body('timestamp')
    .optional()
    .isISO8601()
    .withMessage('Timestamp must be a valid ISO 8601 date')
];

const historyValidation = [
  query('equipmentType')
    .optional()
    .isIn([
      'blood_pressure', 'thermometer', 'pulse_oximeter', 
      'glucometer', 'ecg_monitor', 'peak_flow_meter', 
      'weight_scale', 'heart_rate_monitor'
    ])
    .withMessage('Invalid equipment type'),
    
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
    
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
    
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

// Routes

/**
 * @route   POST /api/equipment/readings
 * @desc    Submit new equipment reading
 * @access  Private
 */
router.post('/readings',
  verifyToken,
  readingValidation,
  equipmentController.submitReading
);

/**
 * @route   POST /api/equipment/readings/bulk
 * @desc    Submit multiple readings at once
 * @access  Private
 */
router.post('/readings/bulk',
  verifyToken,
  [
    body('readings')
      .isArray({ min: 1, max: 50 })
      .withMessage('Readings must be an array with 1-50 items'),
    body('readings.*.equipmentType')
      .isIn([
        'blood_pressure', 'thermometer', 'pulse_oximeter', 
        'glucometer', 'ecg_monitor', 'peak_flow_meter', 
        'weight_scale', 'heart_rate_monitor'
      ])
      .withMessage('Invalid equipment type in readings array'),
    body('readings.*.readings')
      .isObject()
      .withMessage('Each reading must have a readings object')
  ],
  equipmentController.submitBulkReadings
);

/**
 * @route   POST /api/equipment/readings/file
 * @desc    Upload readings from file (CSV/JSON)
 * @access  Private
 */
router.post('/readings/file',
  verifyToken,
  upload.single('dataFile'),
  [
    body('equipmentType')
      .isIn([
        'blood_pressure', 'thermometer', 'pulse_oximeter', 
        'glucometer', 'ecg_monitor', 'peak_flow_meter', 
        'weight_scale', 'heart_rate_monitor'
      ])
      .withMessage('Invalid equipment type')
  ],
  equipmentController.uploadReadingsFile
);

/**
 * @route   GET /api/equipment/readings
 * @desc    Get user's equipment reading history
 * @access  Private
 */
router.get('/readings',
  verifyToken,
  historyValidation,
  equipmentController.getReadingHistory
);

/**
 * @route   GET /api/equipment/readings/:id
 * @desc    Get specific reading by ID
 * @access  Private
 */
router.get('/readings/:id',
  verifyToken,
  param('id').isMongoId().withMessage('Invalid reading ID'),
  equipmentController.getReadingById
);

/**
 * @route   GET /api/equipment/analytics
 * @desc    Get analytics and trends for user's readings
 * @access  Private
 */
router.get('/analytics',
  verifyToken,
  [
    query('equipmentType')
      .optional()
      .isIn([
        'blood_pressure', 'thermometer', 'pulse_oximeter', 
        'glucometer', 'ecg_monitor', 'peak_flow_meter', 
        'weight_scale', 'heart_rate_monitor'
      ])
      .withMessage('Invalid equipment type'),
    query('period')
      .optional()
      .isIn(['week', 'month', 'quarter', 'year'])
      .withMessage('Period must be week, month, quarter, or year'),
    query('includeAverages')
      .optional()
      .isBoolean()
      .withMessage('Include averages must be a boolean')
  ],
  equipmentController.getAnalytics
);

/**
 * @route   GET /api/equipment/alerts
 * @desc    Get alerts based on abnormal readings
 * @access  Private
 */
router.get('/alerts',
  verifyToken,
  [
    query('severity')
      .optional()
      .isIn(['low', 'medium', 'high', 'critical'])
      .withMessage('Invalid severity level'),
    query('acknowledged')
      .optional()
      .isBoolean()
      .withMessage('Acknowledged must be a boolean'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50')
  ],
  equipmentController.getAlerts
);

/**
 * @route   POST /api/equipment/alerts/:id/acknowledge
 * @desc    Acknowledge an alert
 * @access  Private
 */
router.post('/alerts/:id/acknowledge',
  verifyToken,
  param('id').isMongoId().withMessage('Invalid alert ID'),
  [
    body('notes')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Notes cannot exceed 500 characters')
  ],
  equipmentController.acknowledgeAlert
);

/**
 * @route   GET /api/equipment/summary
 * @desc    Get summary of latest readings for dashboard
 * @access  Private
 */
router.get('/summary',
  verifyToken,
  equipmentController.getReadingSummary
);

/**
 * @route   GET /api/equipment/export
 * @desc    Export readings as CSV or JSON
 * @access  Private
 */
router.get('/export',
  verifyToken,
  [
    query('format')
      .optional()
      .isIn(['csv', 'json'])
      .withMessage('Format must be csv or json'),
    query('equipmentType')
      .optional()
      .isIn([
        'blood_pressure', 'thermometer', 'pulse_oximeter', 
        'glucometer', 'ecg_monitor', 'peak_flow_meter', 
        'weight_scale', 'heart_rate_monitor'
      ])
      .withMessage('Invalid equipment type'),
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid ISO 8601 date'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid ISO 8601 date')
  ],
  equipmentController.exportReadings
);

/**
 * @route   DELETE /api/equipment/readings/:id
 * @desc    Delete a reading
 * @access  Private
 */
router.delete('/readings/:id',
  verifyToken,
  param('id').isMongoId().withMessage('Invalid reading ID'),
  equipmentController.deleteReading
);

/**
 * @route   PUT /api/equipment/readings/:id
 * @desc    Update a reading (add notes, correct values)
 * @access  Private
 */
router.put('/readings/:id',
  verifyToken,
  param('id').isMongoId().withMessage('Invalid reading ID'),
  [
    body('notes')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Notes cannot exceed 500 characters'),
    body('readings')
      .optional()
      .isObject()
      .withMessage('Readings must be an object')
  ],
  equipmentController.updateReading
);

/**
 * @route   GET /api/equipment/reference-ranges
 * @desc    Get normal reference ranges for different equipment types
 * @access  Public
 */
router.get('/reference-ranges',
  equipmentController.getReferenceRanges
);

/**
 * @route   POST /api/equipment/readings/:id/share
 * @desc    Share reading with healthcare provider
 * @access  Private
 */
router.post('/readings/:id/share',
  verifyToken,
  param('id').isMongoId().withMessage('Invalid reading ID'),
  [
    body('doctorId')
      .isMongoId()
      .withMessage('Invalid doctor ID'),
    body('message')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Message cannot exceed 500 characters')
  ],
  equipmentController.shareReading
);

module.exports = router;