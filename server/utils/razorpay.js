/**
 * Razorpay Payment Gateway Utility
 * Handles payment initiation and verification
 */

const Razorpay = require('razorpay');
const crypto = require('crypto');

// Lazy initialization - only create instance when needed
let razorpayInstance = null;

const getRazorpayInstance = () => {
  if (!razorpayInstance) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay API keys not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in environment variables.');
    }
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
  }
  return razorpayInstance;
};

/**
 * Create a Razorpay order for consultation booking
 * @param {number} amount - Amount in smallest currency unit (paise for INR)
 * @param {string} consultationId - Consultation ID for reference
 * @param {string} userEmail - Patient email
 * @param {string} userName - Patient name
 * @returns {Promise<Object>} Order details
 */
exports.createOrder = async (amount, consultationId, userEmail, userName) => {
  try {
    const razorpay = getRazorpayInstance();
    const options = {
      amount: Math.round(amount * 100), // convert to paise
      currency: 'INR',
      receipt: consultationId,
      notes: {
        consultationId,
        userEmail,
        userName
      }
    };

    const order = await razorpay.orders.create(options);
    return order;
  } catch (error) {
    throw new Error(`Failed to create Razorpay order: ${error.message}`);
  }
};

/**
 * Verify Razorpay payment signature
 * @param {string} orderId - Razorpay order ID
 * @param {string} paymentId - Razorpay payment ID
 * @param {string} signature - Razorpay signature from frontend
 * @returns {boolean} True if signature is valid
 */
exports.verifyPaymentSignature = (orderId, paymentId, signature) => {
  try {
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      throw new Error('Razorpay key secret not configured');
    }
    
    const body = orderId + '|' + paymentId;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    return expectedSignature === signature;
  } catch (error) {
    return false;
  }
};

/**
 * Fetch payment details from Razorpay
 * @param {string} paymentId - Razorpay payment ID
 * @returns {Promise<Object>} Payment details
 */
exports.fetchPaymentDetails = async (paymentId) => {
  try {
    const razorpay = getRazorpayInstance();
    const payment = await razorpay.payments.fetch(paymentId);
    return payment;
  } catch (error) {
    throw new Error(`Failed to fetch payment details: ${error.message}`);
  }
};

/**
 * Refund a payment (for consultation cancellation)
 * @param {string} paymentId - Razorpay payment ID
 * @param {number} refundAmount - Amount to refund in rupees
 * @returns {Promise<Object>} Refund details
 */
exports.refundPayment = async (paymentId, refundAmount) => {
  try {
    const razorpay = getRazorpayInstance();
    const refund = await razorpay.payments.refund(paymentId, {
      amount: Math.round(refundAmount * 100) // convert to paise
    });
    return refund;
  } catch (error) {
    throw new Error(`Failed to process refund: ${error.message}`);
  }
};

module.exports = exports;
