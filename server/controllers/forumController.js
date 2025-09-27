/**
 * Forum Controller
 * Handles community forum operations with real-time Socket.IO integration
 */

const { validationResult } = require('express-validator');
const Post = require('../models/Post');
const { getIO } = require('../utils/socket'); // Socket.IO instance

/**
 * Get forum posts with filtering
 */
exports.getPosts = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: errors.array()
      });
    }

    const {
      category,
      tags,
      search,
      sortBy = 'newest',
      page = 1,
      limit = 20
    } = req.query;

    // Build filter
    const filter = { status: 'published' };
    
    if (category) {
      filter.category = category;
    }
    
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      filter.tags = { $in: tagArray };
    }
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { body: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort
    const sortOptions = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      popular: { 'stats.likes': -1, 'stats.comments': -1 },
      trending: { 'stats.views': -1, createdAt: -1 }
    };

    // Execute query
    const skip = (page - 1) * limit;
    const [posts, total] = await Promise.all([
      Post.find(filter)
        .populate('userId', 'name')
        .select('-body') // Exclude full body for list view
        .sort(sortOptions[sortBy])
        .skip(skip)
        .limit(parseInt(limit)),
      Post.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        },
        filters: { category, tags, search, sortBy }
      }
    });

  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving posts'
    });
  }
};

/**
 * Create new forum post
 */
exports.createPost = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('Post validation errors:', errors.array());
      console.error('Request body:', req.body);
      console.error('Request user:', req.user);
      return res.status(400).json({
        success: false,
        message: 'Invalid post data',
        errors: errors.array()
      });
    }

    const { title, body, category, tags = [], isAnonymous = false } = req.body;

    const post = new Post({
      title,
      body,
      userId: req.user.userId,
      category,
      tags,
      isAnonymous,
      status: 'published'
    });

    await post.save();
    await post.populate('userId', 'name');

    // Send real-time notification
    try {
      const io = getIO();
      if (io) {
        io.emit('new_post', {
          id: post._id,
          title: post.title,
          category: post.category,
          author: isAnonymous ? 'Anonymous' : post.userId.name,
          createdAt: post.createdAt
        });
      }
    } catch (socketError) {
      console.log('Socket.IO not available:', socketError.message);
    }

    res.status(201).json({
      success: true,
      data: post,
      message: 'Post created successfully'
    });

  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating post',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get specific post with comments
 */
exports.getPostById = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await Post.findById(id)
      .populate('userId', 'name')
      .populate('comments.userId', 'name')
      .populate('comments.replies.userId', 'name');

    if (!post || post.status !== 'published') {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Increment view count
    post.stats.views = (post.stats.views || 0) + 1;
    await post.save();

    res.json({
      success: true,
      data: post
    });

  } catch (error) {
    console.error('Get post by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving post'
    });
  }
};

/**
 * Add comment to post
 */
exports.addComment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid comment data',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { content, parentCommentId, isAnonymous = false } = req.body;

    const post = await Post.findById(id);
    if (!post || post.status !== 'published') {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const comment = {
      text: content,
      userId: req.user.userId,
      isAnonymous,
      createdAt: new Date()
    };

    if (parentCommentId) {
      // Add as reply to existing comment
      const parentComment = post.comments.id(parentCommentId);
      if (!parentComment) {
        return res.status(404).json({
          success: false,
          message: 'Parent comment not found'
        });
      }
      parentComment.replies.push(comment);
    } else {
      // Add as top-level comment
      post.comments.push(comment);
    }

    post.stats.comments = post.comments.length + 
      post.comments.reduce((total, c) => total + c.replies.length, 0);

    await post.save();
    await post.populate('comments.userId', 'name');
    await post.populate('comments.replies.userId', 'name');

    // Send real-time notification
    try {
      const io = getIO();
      if (io) {
        io.emit('new_comment', {
          postId: post._id,
          comment: parentCommentId ? 
            parentComment.replies[parentComment.replies.length - 1] :
            post.comments[post.comments.length - 1],
          isReply: !!parentCommentId
        });
      }
    } catch (socketError) {
      console.log('Socket.IO not available:', socketError.message);
    }

    res.status(201).json({
      success: true,
      data: {
        postId: post._id,
        comment: parentCommentId ? 
          parentComment.replies[parentComment.replies.length - 1] :
          post.comments[post.comments.length - 1]
      },
      message: 'Comment added successfully'
    });

  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding comment'
    });
  }
};

/**
 * Get post comments
 */
exports.getPostComments = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20, sortBy = 'newest' } = req.query;

    const post = await Post.findById(id)
      .populate('comments.userId', 'name')
      .populate('comments.replies.userId', 'name')
      .select('comments');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Sort comments
    const sortedComments = post.comments.sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return a.createdAt - b.createdAt;
        case 'popular':
          return b.likes.length - a.likes.length;
        case 'newest':
        default:
          return b.createdAt - a.createdAt;
      }
    });

    // Paginate
    const skip = (page - 1) * limit;
    const paginatedComments = sortedComments.slice(skip, skip + parseInt(limit));

    res.json({
      success: true,
      data: {
        comments: paginatedComments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: post.comments.length,
          pages: Math.ceil(post.comments.length / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get post comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving comments'
    });
  }
};

/**
 * Toggle post like
 */
exports.togglePostLike = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await Post.findById(id);
    if (!post || post.status !== 'published') {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const userId = req.user.id;
    const likeIndex = post.likes.indexOf(userId);

    if (likeIndex > -1) {
      // Remove like
      post.likes.splice(likeIndex, 1);
      post.stats.likes = post.likes.length;
    } else {
      // Add like
      post.likes.push(userId);
      post.stats.likes = post.likes.length;
    }

    await post.save();

    res.json({
      success: true,
      data: {
        postId: post._id,
        liked: likeIndex === -1,
        totalLikes: post.likes.length
      },
      message: likeIndex === -1 ? 'Post liked' : 'Post unliked'
    });

  } catch (error) {
    console.error('Toggle post like error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating post like'
    });
  }
};

/**
 * Get available categories
 */
exports.getCategories = async (req, res) => {
  try {
    const categories = [
      { id: 'general', name: 'General Health', description: 'General health discussions' },
      { id: 'diabetes', name: 'Diabetes', description: 'Diabetes management and support' },
      { id: 'heart_health', name: 'Heart Health', description: 'Cardiovascular health topics' },
      { id: 'mental_health', name: 'Mental Health', description: 'Mental wellness and support' },
      { id: 'nutrition', name: 'Nutrition', description: 'Diet and nutrition advice' },
      { id: 'fitness', name: 'Fitness', description: 'Exercise and physical activity' },
      { id: 'medications', name: 'Medications', description: 'Medication questions and experiences' },
      { id: 'chronic_conditions', name: 'Chronic Conditions', description: 'Living with chronic illnesses' },
      { id: 'preventive_care', name: 'Preventive Care', description: 'Prevention and wellness' },
      { id: 'support_groups', name: 'Support Groups', description: 'Peer support and encouragement' }
    ];

    res.json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving categories'
    });
  }
};

/**
 * Get trending posts
 */
exports.getTrendingPosts = async (req, res) => {
  try {
    const { period = 'week', limit = 10 } = req.query;

    // Calculate date range
    const now = new Date();
    const periodDays = { day: 1, week: 7, month: 30 };
    const startDate = new Date(now.getTime() - (periodDays[period] || 7) * 24 * 60 * 60 * 1000);

    const trendingPosts = await Post.find({
      status: 'published',
      createdAt: { $gte: startDate }
    })
    .populate('userId', 'name')
    .select('-body')
    .sort({ 
      'stats.views': -1, 
      'stats.likes': -1, 
      'stats.comments': -1 
    })
    .limit(parseInt(limit));

    res.json({
      success: true,
      data: {
        posts: trendingPosts,
        period,
        dateRange: { start: startDate, end: now }
      }
    });

  } catch (error) {
    console.error('Get trending posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving trending posts'
    });
  }
};

/**
 * Get user's own posts
 */
exports.getUserPosts = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const skip = (page - 1) * limit;
    const [posts, total] = await Promise.all([
      Post.find({ userId: req.user.userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Post.countDocuments({ userId: req.user.userId })
    ]);

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving user posts'
    });
  }
};

// Placeholder implementations for remaining methods
exports.updatePost = async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Update post functionality not yet implemented'
  });
};

exports.deletePost = async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Delete post functionality not yet implemented'
  });
};

exports.toggleCommentLike = async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Comment like functionality not yet implemented'
  });
};

exports.reportPost = async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Report post functionality not yet implemented'
  });
};

module.exports = exports;