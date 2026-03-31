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
      if (!process.env.SMTP_PASS) {
        this.initialized = false;
        return;
      }

      // Initialize SendGrid with API key
      sgMail.setApiKey(process.env.SMTP_PASS);
      this.initialized = true;
    } catch (error) {
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
    if (!this.initialized) {
      return;
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { margin-bottom: 20px; }
            .content { margin: 20px 0; }
            .otp-box { border: 1px solid #ddd; padding: 15px; background-color: #f5f5f5; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px; font-family: monospace; margin: 20px 0; }
            .footer { margin-top: 30px; border-top: 1px solid #ddd; padding-top: 15px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>MediSync Password Reset</h2>
            </div>
            
            <div class="content">
              <p>Hi ${userName},</p>
              
              <p>You requested to reset your password. Use the code below to proceed:</p>
              
              <div class="otp-box">${otp}</div>
              
              <p>This code expires in 10 minutes.</p>
              
              <p>If you didn't request a password reset, please ignore this email.</p>
            </div>
            
            <div class="footer">
              <p>MediSync Healthcare Platform</p>
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
      const response = await sgMail.send(msg);
      return { success: true };
    } catch (error) {
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new EmailService();
