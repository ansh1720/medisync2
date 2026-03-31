/**
 * Authentication Controller
 * Handles user authentication, registration, and profile management
 */

const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const emailService = require('../utils/emailService');

/**
 * Generate JWT token
 * @param {string} userId - User ID
 * @returns {string} JWT token
 */
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

/**
 * Register a new user
 * @route POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, password, role = 'user', phone, language = 'en' } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password, // This will be hashed by the User model
      role,
      phone,
      language
    });

    await user.save();

    // If role is doctor, create a Doctor document
    if (role === 'doctor') {
      try {
        const doctor = new Doctor({
          name: user.name,
          email: user.email,
          specialty: 'general', // Default, will be updated during verification
          contact: {
            phone: phone || '',
            officeAddress: {
              country: 'United States'
            }
          },
          userRef: user._id,
          createdBy: user._id,
          verificationStatus: 'not_submitted',
          isVerified: false,
          isActive: true
        });
        await doctor.save();
      } catch (doctorError) {
        console.error('Error creating doctor document:', doctorError);
        // Don't fail registration if doctor creation fails
      }
    }

    // Generate token
    const token = generateToken(user._id);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    res.status(201).json({
      success: true,
      data: {
        token,
        user: user.getPublicProfile(),
        expiresIn: process.env.JWT_EXPIRE || '7d'
      },
      message: 'User registered successfully'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 * @route POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    res.json({
      success: true,
      data: {
        token,
        user: user.getPublicProfile(),
        expiresIn: process.env.JWT_EXPIRE || '7d'
      },
      message: 'Login successful'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get user profile
 * @route GET /api/auth/profile
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId).select('-passwordHash');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { user },
      message: 'Profile retrieved successfully'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 * @route PUT /api/auth/profile
 */
const updateProfile = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, phone, language, preferences } = req.body;
    const userId = req.user.userId;

    // Build update object
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (language !== undefined) updateData.language = language;
    if (preferences !== undefined) updateData.preferences = preferences;

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
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
      message: 'Profile updated successfully'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Change user password
 * @route POST /api/auth/change-password
 */
const changePassword = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword; // This will be hashed by the User model
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Forgot password - generate OTP
 * @route POST /api/auth/forgot-password
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    console.log('[ForgotPassword] === REQUEST STARTED ===');
    console.log(`[ForgotPassword] Received email: ${email}`);

    // Validate input
    if (!email || !email.trim()) {
      console.log('[ForgotPassword] Email validation failed - empty email');
      return res.status(400).json({
        success: false,
        message: 'Email address is required'
      });
    }
    console.log('[ForgotPassword] Email validation passed');

    // Find user by email
    console.log(`[ForgotPassword] Looking up user with email: ${email}`);
    const user = await User.findByEmail(email);
    if (!user) {
      // For security, don't reveal if email exists
      console.log(`[ForgotPassword] User not found for email: ${email}`);
      return res.status(400).json({
        success: false,
        message: 'If an account exists with this email, we\'ll send a password reset code'
      });
    }
    console.log(`[ForgotPassword] User found: ${user.email} (ID: ${user._id})`);

    // Check if account is active
    if (!user.isActive) {
      console.log(`[ForgotPassword] User account is inactive: ${email}`);
      return res.status(400).json({
        success: false,
        message: 'This account is deactivated. Please contact support.'
      });
    }
    console.log('[ForgotPassword] User account is active');

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    console.log(`[ForgotPassword] Generated OTP: ${otp}`);
    console.log(`[ForgotPassword] OTP expiry: ${otpExpiry}`);

    // Save OTP to user record
    user.resetPasswordOTP = otp;
    user.resetPasswordExpire = otpExpiry;
    console.log('[ForgotPassword] Saving OTP to user record...');
    await user.save();
    console.log('[ForgotPassword] ✅ OTP saved successfully to database');

    console.log('[ForgotPassword] Attempting to send password reset email...');
    // Send OTP email
    try {
      await emailService.sendPasswordResetOTP(email, otp, user.name);
      console.log(`[ForgotPassword] ✅ Email sent successfully to ${email}`);
    } catch (emailError) {
      console.error(`[ForgotPassword] ❌ Failed to send email to ${email}:`, emailError.message);
      console.error('[ForgotPassword] Email error details:', emailError);
      // Still success - user can use the code even if email failed
      console.log('[ForgotPassword] Continuing anyway - OTP is saved in database');
    }

    // Response - don't reveal OTP in API response
    console.log('[ForgotPassword] === REQUEST COMPLETED SUCCESSFULLY ===');
    res.json({
      success: true,
      message: 'If an account exists with this email, a password reset code has been sent. Please check your inbox and spam folder.'
    });

  } catch (error) {
    console.error('[ForgotPassword] === ERROR IN FORGOT PASSWORD ===');
    console.error('[ForgotPassword] Error type:', error.name);
    console.error('[ForgotPassword] Error message:', error.message);
    console.error('[ForgotPassword] Full error:', error);
    console.error('[ForgotPassword] Stack trace:', error.stack);
    next(error);
  }
};

/**
 * Reset password using OTP
 * @route POST /api/auth/reset-password
 */
const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;
    console.log('[ResetPassword] === REQUEST STARTED ===');
    console.log('[ResetPassword] Received email:', email);
    console.log('[ResetPassword] Received OTP length:', otp?.length);

    // Validate inputs
    if (!email || !email.trim()) {
      console.log('[ResetPassword] Email validation failed - empty');
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    if (!otp || otp.length !== 6) {
      console.log('[ResetPassword] OTP validation failed - length:', otp?.length);
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please enter the 6-digit code.'
      });
    }

    if (!newPassword || newPassword.length < 6) {
      console.log('[ResetPassword] Password validation failed - length:', newPassword?.length);
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Find user
    console.log('[ResetPassword] Looking up user with email:', email);
    const user = await User.findByEmail(email);
    if (!user) {
      console.log('[ResetPassword] User not found for email:', email);
      return res.status(400).json({
        success: false,
        message: 'Invalid email or OTP'
      });
    }
    console.log('[ResetPassword] User found:', user.email);

    // Verify OTP exists and hasn't expired
    console.log('[ResetPassword] OTP in DB exists:', !!user.resetPasswordOTP);
    console.log('[ResetPassword] OTP expiry time:', user.resetPasswordExpire);
    console.log('[ResetPassword] Current time:', new Date());
    
    if (!user.resetPasswordOTP) {
      console.log('[ResetPassword] No OTP found for user');
      return res.status(400).json({
        success: false,
        message: 'No password reset request found. Please request a new code.'
      });
    }

    // Check OTP expiry
    if (new Date() > user.resetPasswordExpire) {
      console.log('[ResetPassword] OTP expired');
      user.resetPasswordOTP = null;
      user.resetPasswordExpire = null;
      await user.save();
      return res.status(400).json({
        success: false,
        message: 'Password reset code has expired. Please request a new one.'
      });
    }

    // Verify OTP matches
    console.log('[ResetPassword] Comparing OTPs...');
    console.log('[ResetPassword] OTP from request:', otp);
    console.log('[ResetPassword] OTP in DB:', user.resetPasswordOTP);
    if (user.resetPasswordOTP !== otp) {
      console.log('[ResetPassword] OTP mismatch!');
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please check and try again.'
      });
    }
    console.log('[ResetPassword] ✓ OTP verified successfully');

    // Update password
    console.log('[ResetPassword] Updating password...');
    user.password = newPassword; // Will be hashed by pre-save middleware
    user.resetPasswordOTP = null;
    user.resetPasswordExpire = null;
    await user.save();
    console.log('[ResetPassword] ✓ Password updated and OTP cleared');

    console.log(`[ResetPassword] ✓ Password reset successful for ${email}`);

    res.json({
      success: true,
      message: 'Your password has been reset successfully. Please login with your new password.'
    });

  } catch (error) {
    console.error('[ResetPassword] === ERROR IN RESET PASSWORD ===');
    console.error('[ResetPassword] Error type:', error.name);
    console.error('[ResetPassword] Error message:', error.message);
    console.error('[ResetPassword] Full error:', error);
    console.error('[ResetPassword] Stack trace:', error.stack);
    next(error);
  }
};

/**
 * Logout user (client handles token removal)
 * @route POST /api/auth/logout
 */
const logout = async (req, res) => {
  // In a stateless JWT system, logout is handled client-side by removing the token
  // Optionally, you could implement a token blacklist here
  res.json({
    success: true,
    message: 'Logout successful'
  });
};

/**
 * Verify JWT token
 * @route GET /api/auth/verify
 */
const verifyToken = async (req, res) => {
  // If we reach here, the token is valid (verified by middleware)
  res.json({
    success: true,
    data: {
      userId: req.user.userId,
      valid: true
    },
    message: 'Token is valid'
  });
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  logout,
  verifyToken
};