const nodemailer = require('nodemailer');

/**
 * Email Service
 * Handles all email communications
 */

class EmailService {
  constructor() {
    this.initialized = false;
    this.transporter = null;
    this.init();
  }

  init() {
    try {
      // Check if SMTP credentials are available
      console.log('[EmailService] Checking SMTP configuration...');
      console.log('[EmailService] SMTP_USER:', process.env.SMTP_USER ? 'SET' : 'NOT SET');
      console.log('[EmailService] SMTP_PASS:', process.env.SMTP_PASS ? 'SET' : 'NOT SET');
      console.log('[EmailService] SMTP_HOST:', process.env.SMTP_HOST || 'smtp.sendgrid.net');
      console.log('[EmailService] SMTP_PORT:', process.env.SMTP_PORT || 587);
      
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn('⚠️  [EmailService] SMTP credentials not configured! Email sending will be skipped.');
        console.warn('⚠️  [EmailService] Please set SMTP_USER and SMTP_PASS environment variables.');
        this.initialized = false;
        return;
      }

      // Create transporter - optimized for SendGrid and production
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.sendgrid.net',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: false,
        connectionTimeout: 10000,  // Increased to 10s for better reliability
        socketTimeout: 10000,
        pool: {
          maxConnections: 1,
          maxMessages: 100
        },
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      this.initialized = true;
      console.log('✅ [EmailService] Email service initialized successfully');
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
    console.log(`[EmailService.sendPasswordResetOTP] Transporter exists: ${!!this.transporter}`);
    
    if (!this.initialized || !this.transporter) {
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

    const mailOptions = {
      from: process.env.FROM_EMAIL || `"MediSync" <${process.env.SMTP_USER}>`,
      to: toEmail,
      subject: '🔑 MediSync - Password Reset Verification Code',
      html: emailHtml,
      text: `MediSync Password Reset\n\nHi ${userName},\n\nYour verification code is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this, please ignore this email.\n\nMediSync Team`
    };

    try {
      console.log(`[EmailService.sendPasswordResetOTP] Attempting to send email via nodemailer...`);
      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ [EmailService.sendPasswordResetOTP] Password reset OTP sent to ${toEmail}`);
      console.log(`[EmailService.sendPasswordResetOTP] Email sent with messageId: ${result.messageId}`);
      return { success: true };
    } catch (error) {
      console.error(`❌ [EmailService.sendPasswordResetOTP] Failed to send OTP email to ${toEmail}`);
      console.error(`[EmailService.sendPasswordResetOTP] Error type: ${error.name}`);
      console.error(`[EmailService.sendPasswordResetOTP] Error message: ${error.message}`);
      console.error(`[EmailService.sendPasswordResetOTP] Error code: ${error.code}`);
      console.error(`[EmailService.sendPasswordResetOTP] Full error:`, error);
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new EmailService();
