const sgMail = require('@sendgrid/mail');
require('dotenv').config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Verify SendGrid configuration (will be called from server start)
async function verifyTransporter() {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      console.error('SendGrid API Key not configured');
      return false;
    }
    console.log('SendGrid email service configured');
    return true;
  } catch (err) {
    console.error('Failed to configure SendGrid:', err);
    return false;
  }
}

async function sendVerificationEmail(to, token) {
  const baseUrl = process.env.FRONTEND_BASE_URL || process.env.VITE_APP_BASE_URL;
  const verifyUrl = `${baseUrl.replace(/\/$/, '')}/verify-email?token=${token}`;

  const msg = {
    to,
    from: process.env.EMAIL_FROM || 'noreply@lsp.com',
    subject: 'Please verify your email',
    html: `
      <p>Thank you for registering. Please verify your email by clicking the link below:</p>
      <p><a href="${verifyUrl}">Verify Email</a></p>
      <p>If the link doesn't work, copy and paste this URL into your browser:</p>
      <p>${verifyUrl}</p>
    `,
  };

  try {
    const result = await sgMail.send(msg);
    console.log('Verification email sent via SendGrid:', result[0].statusCode);
    return result;
  } catch (err) {
    console.error('Error sending verification email:', err && err.message ? err.message : err);
    throw err;
  }
}

module.exports = { sendVerificationEmail, verifyTransporter };
