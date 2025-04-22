// utils/sendEmail.js
const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.USER_EMAIL,
    pass: process.env.USER_PASSWORD,
  },
});


const sendCustomEmail = async ({ to, subject, html }) => {
  const mailOptions = {
    from: process.env.USER_EMAIL,
    to,
    subject,
    html,
  };

  await transporter.sendMail(mailOptions);
};


const buildContextMailOptions = (emailId, context, otp) => {
  const subjects = {
    signup: "Your OTP for Email Verification",
    "forgot-password": "Password Reset OTP – DevConnect",
  };

  const messages = {
    signup: `
      <h2>Welcome to DevConnect</h2>
      <p>Thank you for registering with DevConnect.</p>
      <p>Your OTP for email verification:</p>
    `,
    "forgot-password": `
      <h2>Password Reset Request</h2>
      <p>We received a request to reset your DevConnect account password.</p>
      <p>Your OTP for password reset:</p>
    `,
  };

  return {
    from: process.env.USER_EMAIL,
    to: emailId,
    subject: subjects[context],
    html: `
      <div style="font-family: Arial; padding: 24px; border: 1px solid #e0e0e0; border-radius: 8px;">
        ${messages[context]}
        <h3 style="font-size: 28px; font-weight: bold; letter-spacing: 2px;">${otp}</h3>
        <p>This OTP is valid for 5 minutes. Please do not share it with anyone.</p>
        <footer style="margin-top: 20px; font-size: 12px; color: #888;">DevConnect Team</footer>
      </div>
    `,
  };
};

const sendOtpMail = async (emailId, context, otp) => {
  const mailOptions = buildContextMailOptions(emailId, context, otp);
  await transporter.sendMail(mailOptions);
};

module.exports = { sendOtpMail, sendCustomEmail };
