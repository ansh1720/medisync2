# Razorpay Payment Integration Setup

## Environment Variables Required

### Backend (.env)
```
# Razorpay API Keys (get from https://dashboard.razorpay.com)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

### Frontend (.env or .env.local)
```
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
```

## How to Get Razorpay Keys

1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com)
2. Sign up or log in to your account
3. Navigate to Settings → API Keys
4. Copy your **Key ID** and **Key Secret**
5. Add them to your `.env` files in both server and client directories

## Payment Flow

1. **User books consultation** with fee
2. **Frontend calls `/consultation/:id/initiate-payment`** to create Razorpay order
3. **Razorpay popup appears** for payment entry
4. **User enters payment details** (Card, UPI, Wallet, etc.)
5. **After successful payment**, Razorpay returns signature
6. **Frontend calls `/consultation/:id/verify-payment`** with signature
7. **Backend verifies signature** and marks consultation as "paid"
8. **Consultation is confirmed** with doctor

## Testing

You can use these **test credentials** during development:
- **Card Number**: 4111 1111 1111 1111
- **Expiry**: 12/25 or any future date
- **CVV**: Any 3 digits
- **OTP**: 123456 (for test mode)

## Files Modified

- `server/utils/razorpay.js` - Payment gateway utility
- `server/controllers/consultationController.js` - Added `initiatePayment()` and `verifyPayment()`
- `server/routes/consultationRoutes.js` - Added payment routes
- `server/models/Consultation.js` - Added razorpayOrderId and razorpayPaymentId fields
- `client/src/pages/BookingPage.jsx` - Integrated Razorpay checkout
- `client/src/utils/api.js` - Added payment API endpoints

## Deployment Checklist

- [ ] Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to backend `.env`
- [ ] Add VITE_RAZORPAY_KEY_ID to frontend `.env` or build config
- [ ] Test payment flow end-to-end in staging
- [ ] Ensure doctor has consultationFee.amount set (> 0)
- [ ] Verify email notifications work after payment
- [ ] Monitor Razorpay dashboard for successful transactions
