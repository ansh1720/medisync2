/**
 * Razorpay Payment Gateway Utility
 * Handles payment initiation and verification
 */

const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay with API keys from environment
const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

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

    const order = await razorpayInstance.orders.create(options);
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
    const body = orderId + '|' + paymentId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
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
    const payment = await razorpayInstance.payments.fetch(paymentId);
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
    const refund = await razorpayInstance.payments.refund(paymentId, {
      amount: Math.round(refundAmount * 100) // convert to paise
    });
    return refund;
  } catch (error) {
    throw new Error(`Failed to process refund: ${error.message}`);
  }
};

module.exports = exports;
