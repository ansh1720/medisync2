const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

/**
 * Send OTP email for password reset
 */
const sendOTPEmail = async (to, otp, userName) => {
  const mailOptions = {
    from: `"MediSync" <${process.env.SMTP_USER}>`,
    to,
    subject: 'MediSync - Password Reset OTP',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #2563eb; margin: 0;">MediSync</h1>
          <p style="color: #6b7280; margin: 4px 0 0;">Your Health Companion</p>
        </div>
        <div style="background: #f9fafb; border-radius: 12px; padding: 24px; border: 1px solid #e5e7eb;">
          <h2 style="color: #111827; margin: 0 0 8px;">Password Reset Request</h2>
          <p style="color: #4b5563; margin: 0 0 20px;">
            Hi ${userName || 'there'},<br/>
            We received a request to reset your password. Use the OTP below to proceed:
          </p>
          <div style="background: #2563eb; color: #fff; font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; padding: 16px; border-radius: 8px; margin: 0 0 20px;">
            ${otp}
          </div>
          <p style="color: #6b7280; font-size: 14px; margin: 0 0 4px;">
            This code expires in <strong>10 minutes</strong>.
          </p>
          <p style="color: #6b7280; font-size: 14px; margin: 0;">
            If you didn't request a password reset, please ignore this email.
          </p>
        </div>
        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 16px 0 0;">
          &copy; ${new Date().getFullYear()} MediSync. All rights reserved.
        </p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendOTPEmail };
