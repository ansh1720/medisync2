/**
 * Forum Routes
 * Handles community forum posts, comments, and social interactions
 * 
 * Example usage:
 * POST /api/forum/posts - Create new post
 * curl -X POST http://localhost:5000/api/forum/posts \
 *   -H "Content-Type: application/json" \
 *   -H "Authorization: Bearer YOUR_JWT_TOKEN" \
 *   -d '{
 *     "title": "Managing diabetes symptoms",
 *     "body": "Looking for tips on managing daily symptoms...",
 *     "category": "diabetes",
 *     "tags": ["diabetes", "management", "tips"]
 *   }'
 */

const express = require('express');
const { body, query, param } = require('express-validator');
const forumController = require('../controllers/forumController');
const { verifyToken, optionalAuth } = require('../middlewares/auth');

const router = express.Router();

// Validation rules
const postValidation = [
  body('title')
    .isString()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('body')
    .isString()
    .trim()
    .isLength({ min: 10, max: 5000 })
    .withMessage('Content must be between 10 and 5000 characters'),
  body('category')
    .isString()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Category must be between 2 and 50 characters'),
  body('tags')
    .optional()
    .isArray({ max: 10 })
    .withMessage('Maximum 10 tags allowed'),
  body('tags.*')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage('Each tag must be between 1 and 30 characters'),
  body('isAnonymous')
    .optional()
    .isBoolean()
    .withMessage('Is anonymous must be a boolean')
];

const commentValidation = [
  body('content')
    .isString()
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Comment must be between 1 and 2000 characters'),
  body('parentCommentId')
    .optional()
    .isMongoId()
    .withMessage('Invalid parent comment ID'),
  body('isAnonymous')
    .optional()
    .isBoolean()
    .withMessage('Is anonymous must be a boolean')
];

const postListValidation = [
  query('category')
    .optional()
    .isString()
    .trim()
    .withMessage('Category must be a string'),
  query('tags')
    .optional()
    .isString()
    .withMessage('Tags must be a comma-separated string'),
  query('search')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
  query('sortBy')
    .optional()
    .isIn(['newest', 'oldest', 'popular', 'trending'])
    .withMessage('Invalid sort option'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
];

// Routes

/**
 * @route   GET /api/forum/posts
 * @desc    Get forum posts with filtering and pagination
 * @access  Public
 */
router.get('/posts',
  optionalAuth,
  postListValidation,
  forumController.getPosts
);

/**
 * @route   POST /api/forum/posts
 * @desc    Create new forum post
 * @access  Private
 */
router.post('/posts',
  verifyToken,
  postValidation,
  forumController.createPost
);

/**
 * @route   GET /api/forum/posts/:id
 * @desc    Get specific post with comments
 * @access  Public
 */
router.get('/posts/:id',
  optionalAuth,
  param('id').isMongoId().withMessage('Invalid post ID'),
  forumController.getPostById
);

/**
 * @route   PUT /api/forum/posts/:id
 * @desc    Update post (author only)
 * @access  Private
 */
router.put('/posts/:id',
  verifyToken,
  param('id').isMongoId().withMessage('Invalid post ID'),
  [
    body('title')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Title must be between 5 and 200 characters'),
    body('content')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 10, max: 5000 })
      .withMessage('Content must be between 10 and 5000 characters'),
    body('tags')
      .optional()
      .isArray({ max: 10 })
      .withMessage('Maximum 10 tags allowed')
  ],
  forumController.updatePost
);

/**
 * @route   DELETE /api/forum/posts/:id
 * @desc    Delete post (author only)
 * @access  Private
 */
router.delete('/posts/:id',
  verifyToken,
  param('id').isMongoId().withMessage('Invalid post ID'),
  forumController.deletePost
);

/**
 * @route   POST /api/forum/posts/:id/comments
 * @desc    Add comment to post
 * @access  Private
 */
router.post('/posts/:id/comments',
  verifyToken,
  param('id').isMongoId().withMessage('Invalid post ID'),
  commentValidation,
  forumController.addComment
);

/**
 * @route   GET /api/forum/posts/:id/comments
 * @desc    Get post comments
 * @access  Public
 */
router.get('/posts/:id/comments',
  optionalAuth,
  param('id').isMongoId().withMessage('Invalid post ID'),
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50'),
    query('sortBy')
      .optional()
      .isIn(['newest', 'oldest', 'popular'])
      .withMessage('Invalid sort option')
  ],
  forumController.getPostComments
);

/**
 * @route   POST /api/forum/posts/:id/like
 * @desc    Like/unlike post
 * @access  Private
 */
router.post('/posts/:id/like',
  verifyToken,
  param('id').isMongoId().withMessage('Invalid post ID'),
  forumController.togglePostLike
);

/**
 * @route   POST /api/forum/comments/:id/like
 * @desc    Like/unlike comment
 * @access  Private
 */
router.post('/comments/:id/like',
  verifyToken,
  param('id').isMongoId().withMessage('Invalid comment ID'),
  forumController.toggleCommentLike
);

/**
 * @route   POST /api/forum/posts/:id/report
 * @desc    Report inappropriate post
 * @access  Private
 */
router.post('/posts/:id/report',
  verifyToken,
  param('id').isMongoId().withMessage('Invalid post ID'),
  [
    body('reason')
      .isIn(['spam', 'harassment', 'inappropriate', 'misinformation', 'other'])
      .withMessage('Invalid report reason'),
    body('description')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description cannot exceed 500 characters')
  ],
  forumController.reportPost
);

/**
 * @route   GET /api/forum/categories
 * @desc    Get available forum categories
 * @access  Public
 */
router.get('/categories',
  forumController.getCategories
);

/**
 * @route   GET /api/forum/trending
 * @desc    Get trending posts
 * @access  Public
 */
router.get('/trending',
  optionalAuth,
  [
    query('period')
      .optional()
      .isIn(['day', 'week', 'month'])
      .withMessage('Invalid period'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 20 })
      .withMessage('Limit must be between 1 and 20')
  ],
  forumController.getTrendingPosts
);

/**
 * @route   GET /api/forum/my-posts
 * @desc    Get user's own posts
 * @access  Private
 */
router.get('/my-posts',
  verifyToken,
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50')
  ],
  forumController.getUserPosts
);

module.exports = router;