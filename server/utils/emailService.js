const sgMail = require('@sendgrid/mail');

/**
 * Email Service using SendGrid Web API
 * More reliable than SMTP for cloud deployments like Render
 */
class EmailService {
  constructor() {
    this.initialized = false;
    this.init();
  }

  init() {
    try {
      // Check if SendGrid API key is available
      console.log('[EmailService] Checking SendGrid configuration...');
      console.log('[EmailService] SENDGRID_API_KEY (SMTP_PASS):', process.env.SMTP_PASS ? 'SET' : 'NOT SET');
      console.log('[EmailService] FROM_EMAIL:', process.env.FROM_EMAIL || 'noreply@medisync.com');
      
      if (!process.env.SMTP_PASS) {
        console.warn('⚠️  [EmailService] SendGrid API key not configured (SMTP_PASS env var)!');
        console.warn('⚠️  [EmailService] Please set SMTP_PASS to your SendGrid API key.');
        this.initialized = false;
        return;
      }

      // Initialize SendGrid with API key
      sgMail.setApiKey(process.env.SMTP_PASS);
      this.initialized = true;
      console.log('✅ [EmailService] Email service initialized successfully with SendGrid Web API');
    } catch (error) {
      console.error('❌ [EmailService] Failed to initialize email service:', error.message);
      console.error('[EmailService] Error details:', error);
      this.initialized = false;
    }
  }

  /**
   * Send OTP email for password reset
   * @param {string} toEmail - Recipient email
   * @param {string} otp - OTP code
   * @param {string} userName - User's name
   */
  async sendPasswordResetOTP(toEmail, otp, userName = 'User') {
    console.log(`[EmailService.sendPasswordResetOTP] Starting email send to ${toEmail}`);
    console.log(`[EmailService.sendPasswordResetOTP] Service initialized: ${this.initialized}`);
    
    if (!this.initialized) {
      console.warn('⚠️  [EmailService.sendPasswordResetOTP] Email service not initialized, skipping email send');
      console.warn('⚠️  [EmailService.sendPasswordResetOTP] OTP will NOT be sent via email, but password reset may still work');
      return;
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #444; }
            .container { max-width: 480px; margin: 0 auto; padding: 20px; background-color: #f9fafb; }
            .header { text-align: center; margin-bottom: 24px; }
            .logo { color: #2563eb; font-size: 24px; font-weight: bold; }
            .tagline { color: #6b7280; font-size: 14px; margin-top: 4px; }
            .content { background-color: white; border-radius: 12px; padding: 24px; border: 1px solid #e5e7eb; }
            .title { color: #111827; font-size: 20px; font-weight: bold; margin: 0 0 8px; }
            .message { color: #4b5563; margin: 0 0 20px; }
            .otp-box { background-color: #2563eb; color: white; font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; padding: 16px; border-radius: 8px; margin: 20px 0; font-family: monospace; }
            .expiry { color: #6b7280; font-size: 14px; margin: 16px 0; }
            .footer { color: #9ca3af; font-size: 12px; text-align: center; margin-top: 24px; }
            .warning { color: #dc2626; background-color: #fee2e2; border-left: 4px solid #dc2626; padding: 12px; border-radius: 4px; margin: 16px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🏥 MediSync</div>
              <div class="tagline">Your Health Companion</div>
            </div>
            
            <div class="content">
              <h2 class="title">Password Reset Request</h2>
              <p class="message">Hi ${userName},</p>
              <p class="message">
                We received a request to reset your password. Use the verification code below to proceed:
              </p>
              
              <div class="otp-box">${otp}</div>
              
              <div class="expiry">
                ⏰ <strong>This code expires in 10 minutes</strong>
              </div>
              
              <div class="warning">
                <strong>🔒 Security Notice:</strong> If you didn't request a password reset, please ignore this email or contact support immediately.
              </div>
              
              <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
                This is an automated message, please don't reply to this email.
              </p>
            </div>
            
            <div class="footer">
              © ${new Date().getFullYear()} MediSync Healthcare Platform. All rights reserved.
            </div>
          </div>
        </body>
      </html>
    `;

    const msg = {
      to: toEmail,
      from: process.env.FROM_EMAIL || 'noreply@medisync.com',
      subject: '🔑 MediSync - Password Reset Verification Code',
      html: emailHtml,
      text: `MediSync Password Reset\n\nHi ${userName},\n\nYour verification code is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this, please ignore this email.\n\nMediSync Team`
    };

    try {
      console.log('[EmailService.sendPasswordResetOTP] Sending email via SendGrid Web API...');
      const response = await sgMail.send(msg);
      console.log(`✅ [EmailService.sendPasswordResetOTP] Password reset OTP sent to ${toEmail}`);
      console.log(`[EmailService.sendPasswordResetOTP] SendGrid response code: ${response[0].statusCode}`);
      return { success: true };
    } catch (error) {
      console.error(`❌ [EmailService.sendPasswordResetOTP] Failed to send OTP email to ${toEmail}`);
      console.error(`[EmailService.sendPasswordResetOTP] Error type: ${error.type || error.name}`);
      console.error(`[EmailService.sendPasswordResetOTP] Error message: ${error.message}`);
      console.error(`[EmailService.sendPasswordResetOTP] Error code: ${error.code}`);
      console.error(`[EmailService.sendPasswordResetOTP] Full error:`, error);
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new EmailService();
