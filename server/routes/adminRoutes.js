/**
 * Admin Routes
 * Handles admin-specific operations like user management
 */

const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middlewares/auth');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Consultation = require('../models/Consultation');
const Post = require('../models/Post');

/**
 * @route   GET /api/admin/users
 * @desc    Get all users with pagination
 * @access  Admin only
 */
router.get('/users', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 50, role, status } = req.query;
    
    const filter = {};
    if (role) filter.role = role;
    if (status === 'active') filter.isActive = true;
    if (status === 'inactive') filter.isActive = false;

    const users = await User.find(filter)
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   PUT /api/admin/users/:userId/status
 * @desc    Toggle user active status
 * @access  Admin only
 */
router.put('/users/:userId/status', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { isActive },
      { new: true }
    ).select('-passwordHash');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { user },
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   DELETE /api/admin/users/:userId
 * @desc    Delete a user
 * @access  Admin only
 */
router.delete('/users/:userId', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/admin/stats
 * @desc    Get admin dashboard statistics
 * @access  Admin only
 */
router.get('/stats', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalDoctors = await Doctor.countDocuments();
    const totalPatients = await User.countDocuments({ role: 'user' });
    const activeConsultations = await Consultation.countDocuments({ 
      status: { $in: ['requested', 'confirmed', 'in_progress'] } 
    });
    const pendingVerifications = await Doctor.countDocuments({ verificationStatus: 'pending' });

    res.json({
      success: true,
      data: {
        totalUsers,
        totalDoctors,
        totalPatients,
        activeConsultations,
        pendingApprovals: pendingVerifications,
        systemAlerts: 0 // Can be calculated based on your requirements
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
