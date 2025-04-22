// utils/otpUtils.js
const crypto = require("crypto");
const Otp = require("../models/otp");
const User = require("../models/user");
const { sendOtpMail} = require("./sendEmail");

const ALLOWED_CONTEXTS = ["signup", "forgot-password"];

const generateOtp = () => crypto.randomInt(10000, 99999);

const sendOtp = async (emailId, context) => {
  if (!emailId) throw new Error("Email is required");
  if (!ALLOWED_CONTEXTS.includes(context)) throw new Error("Invalid context");

  if (context === "forgot-password") {
    const user = await User.findOne({ emailId: emailId });
    if (!user) throw new Error("User profile does not exist");
  }

  const otp = generateOtp();
  const now = Date.now();

  await Otp.findOneAndUpdate(
    { emailId },
    { otp, context, createdAt: now },
    { upsert: true, new: true }
  );

  await sendOtpMail(emailId, context, otp);
  return "OTP sent successfully";
};

const verifyOtp = async (emailId, inputOtp) => {
  if (!emailId || !inputOtp) throw new Error("Email and OTP are required");

  const otpRecord = await Otp.findOne({ emailId });
  if (!otpRecord) throw new Error("OTP has expired or does not exist");

  const FIVE_MINUTES = 5 * 60 * 1000;
  const now = Date.now();

  if (now - otpRecord.createdAt > FIVE_MINUTES) {
    await Otp.deleteOne({ emailId });
    throw new Error("OTP has expired");
  }

  if (otpRecord.otp !== inputOtp) throw new Error("Invalid OTP");

  await Otp.deleteOne({ emailId });
  return "OTP verified successfully";
};

module.exports = { sendOtp, verifyOtp };
