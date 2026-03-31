import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { EnvelopeIcon, KeyIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { authAPI } from '../utils/api';
import toast from 'react-hot-toast';

function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: enter email, 2: enter OTP + new password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    console.log('[ForgotPassword.handleSendOTP] === SEND OTP STARTED ===');
    console.log('[ForgotPassword.handleSendOTP] Email entered:', email);

    if (!email) {
      console.log('[ForgotPassword.handleSendOTP] Email validation failed - empty');
      toast.error('Please enter your email address');
      return;
    }

    setIsLoading(true);
    try {
      // First, wake up the server with a health check
      console.log('[ForgotPassword.handleSendOTP] Attempting health check...');
      toast.loading('Connecting to server...');
      try {
        console.log('[ForgotPassword.handleSendOTP] Fetching health endpoint...');
        const healthResponse = await fetch('https://medisync-api-9043.onrender.com/api', { 
          method: 'GET',
          timeout: 60000 
        });
        console.log('[ForgotPassword.handleSendOTP] ✓ Health check success:', healthResponse.status);
      } catch (healthCheckError) {
        console.warn('[ForgotPassword.handleSendOTP] Health check failed:', healthCheckError.message);
        console.warn('[ForgotPassword.handleSendOTP] Proceeding anyway...');
      }

      // Now send the actual OTP request
      console.log('[ForgotPassword.handleSendOTP] Sending forgotPassword API request...');
      const response = await authAPI.forgotPassword({ email });
      console.log('[ForgotPassword.handleSendOTP] ✓ API response received:', response.data);
      
      if (response.data?.success) {
        console.log('[ForgotPassword.handleSendOTP] Success! Moving to step 2');
        toast.success('OTP has been sent to your email!');
        setStep(2);
      }
    } catch (error) {
      console.error('[ForgotPassword.handleSendOTP] === ERROR OCCURRED ===');
      console.error('[ForgotPassword.handleSendOTP] Error name:', error.name);
      console.error('[ForgotPassword.handleSendOTP] Error message:', error.message);
      console.error('[ForgotPassword.handleSendOTP] Error code:', error.code);
      console.error('[ForgotPassword.handleSendOTP] Response status:', error.response?.status);
      console.error('[ForgotPassword.handleSendOTP] Response data:', error.response?.data);
      console.error('[ForgotPassword.handleSendOTP] Full error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to send OTP. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    console.log('[ForgotPassword.handleResetPassword] === RESET PASSWORD STARTED ===');
    console.log('[ForgotPassword.handleResetPassword] Email:', email);
    console.log('[ForgotPassword.handleResetPassword] OTP length:', otp.length);

    if (!otp || otp.length !== 6) {
      console.log('[ForgotPassword.handleResetPassword] OTP validation failed:', otp);
      toast.error('Please enter the 6-digit OTP');
      return;
    }

    if (newPassword.length < 6) {
      console.log('[ForgotPassword.handleResetPassword] Password too short:', newPassword.length);
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      console.log('[ForgotPassword.handleResetPassword] Passwords do not match');
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      console.log('[ForgotPassword.handleResetPassword] Sending resetPassword API request...');
      const response = await authAPI.resetPassword({ email, otp, newPassword });
      console.log('[ForgotPassword.handleResetPassword] ✓ API response received:', response.data);
      
      if (response.data?.success) {
        console.log('[ForgotPassword.handleResetPassword] ✓ Password reset successful! Redirecting to login...');
        toast.success('Password reset successfully! Please login with your new password.');
        navigate('/login');
      }
    } catch (error) {
      console.error('[ForgotPassword.handleResetPassword] === ERROR OCCURRED ===');
      console.error('[ForgotPassword.handleResetPassword] Error name:', error.name);
      console.error('[ForgotPassword.handleResetPassword] Error message:', error.message);
      console.error('[ForgotPassword.handleResetPassword] Response status:', error.response?.status);
      console.error('[ForgotPassword.handleResetPassword] Response data:', error.response?.data);
      console.error('[ForgotPassword.handleResetPassword] Full error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to reset password. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary-100">
            <KeyIcon className="h-8 w-8 text-primary-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            {step === 1 ? 'Forgot Password?' : 'Reset Password'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {step === 1
              ? 'Enter your email and we\'ll send you a verification code'
              : 'Enter the OTP and your new password'}
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center space-x-4">
          <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-primary-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}>1</div>
            <span className="text-sm font-medium hidden sm:inline">Verify Email</span>
          </div>
          <div className={`w-12 h-0.5 ${step >= 2 ? 'bg-primary-600' : 'bg-gray-200'}`} />
          <div className={`flex items-center space-x-2 ${step >= 2 ? 'text-primary-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}>2</div>
            <span className="text-sm font-medium hidden sm:inline">New Password</span>
          </div>
        </div>

        {/* Step 1: Enter Email */}
        {step === 1 && (
          <form className="mt-8 space-y-6" onSubmit={handleSendOTP}>
            <div>
              <label htmlFor="email" className="label">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  className="input pl-10"
                  placeholder="Enter your registered email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full flex justify-center py-3"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  <span>Waking up server and sending OTP...</span>
                </div>
              ) : (
                'Send Verification Code'
              )}
            </button>

            <div className="text-center">
              <Link to="/login" className="text-sm font-medium text-primary-600 hover:text-primary-500">
                Back to Login
              </Link>
            </div>
          </form>
        )}

        {/* Step 2: Enter OTP + New Password */}
        {step === 2 && (
          <form className="mt-8 space-y-6" onSubmit={handleResetPassword}>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">A 6-digit OTP has been sent to <strong>{email}</strong>. Check your inbox (and spam folder).</p>
            </div>

            <div>
              <label htmlFor="otp" className="label">
                Verification Code (OTP)
              </label>
              <input
                id="otp"
                type="text"
                maxLength={6}
                required
                className="input text-center text-xl tracking-widest font-mono"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              />
              <p className="mt-1 text-xs text-gray-500">Enter the 6-digit code. Expires in 10 minutes.</p>
            </div>

            <div>
              <label htmlFor="newPassword" className="label">
                New Password
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  className="input pr-10"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="label">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                className="input"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full flex justify-center py-3"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                'Reset Password'
              )}
            </button>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => { setStep(1); setOtp(''); }}
                className="text-sm font-medium text-gray-600 hover:text-gray-500"
              >
                Resend OTP
              </button>
              <Link to="/login" className="text-sm font-medium text-primary-600 hover:text-primary-500">
                Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default ForgotPassword;
