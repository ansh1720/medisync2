/**
 * News Routes
 * Handles health news and alerts with categorization
 */

const express = require('express');
const { query } = require('express-validator');
const newsController = require('../controllers/newsController');
const { verifyToken, optionalAuth } = require('../middlewares/auth');

const router = express.Router();

/**
 * @route   GET /api/news
 * @desc    Get health news articles
 * @access  Public
 */
router.get('/',
  optionalAuth,
  [
    query('category')
      .optional()
      .isString()
      .trim()
      .withMessage('Category must be a string'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50')
  ],
  newsController.getNews
);

/**
 * @route   GET /api/news/alerts
 * @desc    Get health alerts and warnings
 * @access  Private
 */
router.get('/alerts',
  verifyToken,
  [
    query('severity')
      .optional()
      .isIn(['low', 'medium', 'high', 'critical'])
      .withMessage('Invalid severity level'),
    query('region')
      .optional()
      .isString()
      .trim()
      .withMessage('Region must be a string')
  ],
  newsController.getAlerts
);

/**
 * @route   GET /api/news/categories
 * @desc    Get available news categories
 * @access  Public
 */
router.get('/categories',
  newsController.getCategories
);

module.exports = router;