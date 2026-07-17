const sgMail = require('@sendgrid/mail');
const nodemailer = require('nodemailer');

/**
 * Email Service using SendGrid Web API with Nodemailer SMTP fallback
 */
class EmailService {
  constructor() {
    this.initialized = false;
    this.useSmtp = false;
    this.smtpTransporter = null;
    this.init();
  }

  init() {
    try {
      const pass = process.env.SMTP_PASS;
      if (!pass) {
        this.initialized = false;
        return;
      }

      if (pass.startsWith('SG.')) {
        // Initialize SendGrid with API key
        sgMail.setApiKey(pass);
        this.initialized = true;
        this.useSmtp = false;
        console.log('✉️ Email service initialized with SendGrid');
      } else {
        // Initialize Nodemailer SMTP with Gmail app password or standard SMTP
        this.smtpTransporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: parseInt(process.env.SMTP_PORT) || 587,
          secure: parseInt(process.env.SMTP_PORT) === 465,
          auth: {
            user: process.env.SMTP_USER,
            pass: pass
          }
        });
        this.initialized = true;
        this.useSmtp = true;
        console.log('✉️ Email service initialized with SMTP (Nodemailer)');
      }
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error);
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
      console.warn('⚠️ Email service is not initialized');
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

    if (this.useSmtp) {
      const mailOptions = {
        from: process.env.FROM_EMAIL || `"MediSync Support" <${process.env.SMTP_USER}>`,
        to: toEmail,
        subject: '🔑 MediSync - Password Reset Verification Code',
        html: emailHtml,
        text: `MediSync Password Reset\n\nHi ${userName},\n\nYour verification code is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this, please ignore this email.\n\nMediSync Team`
      };

      try {
        await this.smtpTransporter.sendMail(mailOptions);
        console.log(`✉️ Password reset OTP sent successfully via SMTP to ${toEmail}`);
        return { success: true };
      } catch (error) {
        console.error('❌ SMTP sendMail error:', error);
        throw error;
      }
    } else {
      const msg = {
        to: toEmail,
        from: process.env.FROM_EMAIL || 'noreply@medisync.com',
        subject: '🔑 MediSync - Password Reset Verification Code',
        html: emailHtml,
        text: `MediSync Password Reset\n\nHi ${userName},\n\nYour verification code is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this, please ignore this email.\n\nMediSync Team`
      };

      try {
        await sgMail.send(msg);
        console.log(`✉️ Password reset OTP sent successfully via SendGrid to ${toEmail}`);
        return { success: true };
      } catch (error) {
        console.error('❌ SendGrid send error:', error);
        throw error;
      }
    }
  }
}

// Export singleton instance
module.exports = new EmailService();
