/**
 * Disease Routes
 * Handles CRUD operations for diseases with search and filtering
 * 
 * Example usage:
 * GET /api/diseases - Get all diseases with pagination and search
 * curl "http://localhost:5000/api/diseases?page=1&limit=10&name=flu&category=infectious"
 * 
 * GET /api/diseases/search - Text search diseases
 * curl "http://localhost:5000/api/diseases/search?q=fever headache&page=1&limit=5"
 * 
 * POST /api/diseases - Create new disease (admin only)
 * curl -X POST http://localhost:5000/api/diseases \
 *   -H "Content-Type: application/json" \
 *   -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
 *   -d '{"name":"Common Cold","description":"Viral infection","symptoms":["runny nose","cough"]}'
 */

const express = require('express');
const { body, query, param } = require('express-validator');
const diseaseController = require('../controllers/diseaseController');
const { verifyToken, requireRole } = require('../middlewares/auth');

const router = express.Router();

// Validation rules
const createDiseaseValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Disease name must be between 2 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  body('symptoms')
    .isArray({ min: 1 })
    .withMessage('At least one symptom is required'),
  body('symptoms.*')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Each symptom must be between 1 and 100 characters'),
  body('prevention')
    .optional()
    .isArray()
    .withMessage('Prevention must be an array'),
  body('treatment')
    .optional()
    .isArray()
    .withMessage('Treatment must be an array'),
  body('riskFactors')
    .optional()
    .isArray()
    .withMessage('Risk factors must be an array'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('sources')
    .optional()
    .isArray()
    .withMessage('Sources must be an array'),
  body('severity')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Invalid severity level'),
  body('category')
    .optional()
    .isIn([
      'infectious', 'chronic', 'genetic', 'autoimmune', 
      'cardiovascular', 'respiratory', 'neurological', 
      'digestive', 'endocrine', 'musculoskeletal', 
      'mental', 'cancer', 'other'
    ])
    .withMessage('Invalid disease category')
];

const updateDiseaseValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Disease name must be between 2 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  body('symptoms')
    .optional()
    .isArray({ min: 1 })
    .withMessage('At least one symptom is required'),
  body('severity')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Invalid severity level'),
  body('category')
    .optional()
    .isIn([
      'infectious', 'chronic', 'genetic', 'autoimmune', 
      'cardiovascular', 'respiratory', 'neurological', 
      'digestive', 'endocrine', 'musculoskeletal', 
      'mental', 'cancer', 'other'
    ])
    .withMessage('Invalid disease category')
];

const searchValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('name')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Name search term cannot be empty'),
  query('symptom')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Symptom search term cannot be empty')
];

const idValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid disease ID')
];

// Public routes

/**
 * @route   GET /api/diseases
 * @desc    Get diseases with pagination, search, and filters
 * @access  Public
 * @query   page, limit, name, symptom, category, severity, tags
 */
router.get('/', searchValidation, diseaseController.getDiseases);

/**
 * @route   GET /api/diseases/search
 * @desc    Full-text search diseases
 * @access  Public
 * @query   q (search query), page, limit, category, severity, tags
 * @example curl "http://localhost:5000/api/diseases/search?q=fever headache"
 */
router.get('/search', 
  [
    query('q')
      .trim()
      .isLength({ min: 1 })
      .withMessage('Search query is required'),
    ...searchValidation
  ],
  diseaseController.searchDiseases
);

/**
 * @route   GET /api/diseases/symptoms
 * @desc    Find diseases by symptoms
 * @access  Public
 * @query   symptoms (comma-separated), page, limit, minMatches
 */
router.get('/symptoms',
  [
    query('symptoms')
      .notEmpty()
      .withMessage('Symptoms parameter is required'),
    ...searchValidation
  ],
  diseaseController.findBySymptoms
);

/**
 * @route   GET /api/diseases/categories
 * @desc    Get all disease categories with counts
 * @access  Public
 */
router.get('/categories', diseaseController.getCategories);

/**
 * @route   GET /api/diseases/:id
 * @desc    Get disease by ID
 * @access  Public
 */
router.get('/:id', idValidation, diseaseController.getDiseaseById);

/**
 * @route   GET /api/diseases/:id/related
 * @desc    Get related diseases
 * @access  Public
 */
router.get('/:id/related', idValidation, diseaseController.getRelatedDiseases);

// Protected routes (admin only)

/**
 * @route   POST /api/diseases
 * @desc    Create new disease
 * @access  Private (Admin only)
 */
router.post('/', 
  verifyToken, 
  requireRole('admin'), 
  createDiseaseValidation, 
  diseaseController.createDisease
);

/**
 * @route   PUT /api/diseases/:id
 * @desc    Update disease
 * @access  Private (Admin only)
 */
router.put('/:id', 
  verifyToken, 
  requireRole('admin'), 
  idValidation,
  updateDiseaseValidation, 
  diseaseController.updateDisease
);

/**
 * @route   DELETE /api/diseases/:id
 * @desc    Delete disease (soft delete)
 * @access  Private (Admin only)
 */
router.delete('/:id', 
  verifyToken, 
  requireRole('admin'), 
  idValidation,
  diseaseController.deleteDisease
);

/**
 * @route   POST /api/diseases/:id/restore
 * @desc    Restore soft-deleted disease
 * @access  Private (Admin only)
 */
router.post('/:id/restore', 
  verifyToken, 
  requireRole('admin'), 
  idValidation,
  diseaseController.restoreDisease
);

module.exports = router;