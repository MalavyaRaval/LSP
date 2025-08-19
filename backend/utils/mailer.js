const nodemailer = require('nodemailer');
require('dotenv').config();

// Configure transporter using SMTP settings from env
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Optional: verify transporter configuration (will be called from server start)
async function verifyTransporter() {
  try {
    await transporter.verify();
    console.log('SMTP transporter verified');
    return true;
  } catch (err) {
    console.error('Failed to verify SMTP transporter:', err);
    return false;
  }
}

async function sendVerificationEmail(to, token) {
  const baseUrl = process.env.FRONTEND_BASE_URL || process.env.VITE_APP_BASE_URL || 'https://lsp-frontend.onrender.com';
  const verifyUrl = `${baseUrl.replace(/\/$/, '')}/verify-email?token=${token}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'no-reply@lsp.com',
    to,
    subject: 'Please verify your email',
    html: `
      <p>Thank you for registering. Please verify your email by clicking the link below:</p>
      <p><a href="${verifyUrl}">Verify Email</a></p>
      <p>If the link doesn't work, copy and paste this URL into your browser:</p>
      <p>${verifyUrl}</p>
    `,
  };

  return transporter.sendMail(mailOptions);
}

module.exports = { sendVerificationEmail, verifyTransporter };
