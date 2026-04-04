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
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    
    console.log('[Razorpay] Initializing with keys:', {
      keyId: keyId ? `${keyId.substring(0, 10)}...` : 'MISSING',
      keySecret: keySecret ? 'SET' : 'MISSING',
      nodeEnv: process.env.NODE_ENV
    });
    
    if (!keyId || !keySecret) {
      throw new Error('Razorpay API keys not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in environment variables.');
    }
    razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret
    });
  }
  return razorpayInstance;
};

/**
 * Create a Razorpay order for consultation booking
 * @param {number} amount - Amount in rupees
 * @param {string} consultationId - Consultation ID for reference
 * @param {string} userEmail - Patient email
 * @param {string} userName - Patient name
 * @param {string} currency - Currency code (default: 'INR')
 * @returns {Promise<Object>} Order details
 */
exports.createOrder = async (amount, consultationId, userEmail, userName, currency = 'INR') => {
  try {
    const razorpay = getRazorpayInstance();
    
    // Razorpay only supports specific currencies: INR, USD, GBP, etc.
    // If currency is USD, convert to INR (1 USD ≈ 83 INR)
    let finalAmount = amount;
    let finalCurrency = currency.toUpperCase();
    
    console.log('[Order] Creating order:', { amount, currency, finalAmount, finalCurrency });
    
    if (finalCurrency === 'USD') {
      finalAmount = Math.round(amount * 83); // Convert USD to INR
      finalCurrency = 'INR';
      console.log('[Order] Converted USD to INR:', { originalAmount: amount, convertedAmount: finalAmount });
    }
    
    const options = {
      amount: Math.round(finalAmount * 100), // convert to paise
      currency: finalCurrency,
      receipt: consultationId,
      notes: {
        consultationId,
        userEmail,
        userName,
        originalCurrency: currency
      }
    };

    console.log('[Order] Razorpay options:', { amount: options.amount, currency: options.currency });
    
    const order = await razorpay.orders.create(options);
    console.log('[Order] Success:', order.id);
    return order;
  } catch (error) {
    console.error('[Order] Failed:', error.message);
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
