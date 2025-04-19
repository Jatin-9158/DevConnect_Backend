const express = require("express");
const nodemailer = require("nodemailer");
const crypto = require('crypto');
const Otp = require('../models/otp');
const message = require("../models/message");
const otpRouter = express.Router();

require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.USER_EMAIL,
    pass: process.env.USER_PASSWORD,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error('SMTP Connection Error:', error);
  } else {
    console.log('SMTP Server is ready to send emails');
  }
});

const generateOtp = () => {
  return crypto.randomInt(10000, 99999);
};

otpRouter.post('/send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }
  
  const otp = generateOtp();
  await Otp.findOneAndUpdate(
    { email },
    { otp, createdAt: Date.now() },
    { upsert: true, new: true }
  );
  
  const mailOptions = {
    from: process.env.USER_EMAIL,
    to: email,
    subject: 'Your OTP for email verification',
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px; text-align: center; border-radius: 8px; max-width: 600px; margin: auto;">
        <h2 style="color: #2c3e50; font-size: 30px;">Welcome to DevConnect!</h2>
        <p style="font-size: 18px; color: #34495e; margin-top: 10px;">Thank you for joining us! We're excited to have you as part of the DevConnect community.</p>
        <p style="font-size: 20px; color: #3498db; font-weight: bold; margin-top: 20px;">Your OTP for email verification is:</p>
        <h3 style="color: #1abc9c; font-size: 36px; font-weight: bold; margin-top: 10px;">${otp}</h3>
        <p style="font-size: 16px; color: #34495e; margin-top: 20px;">This OTP is valid for the next 5 minutes. Please enter it to verify your email and complete your registration.</p>
        <p style="font-size: 14px; color: #7f8c8d; margin-top: 10px;">If you did not request this OTP, please disregard this message.</p>
        <hr style="border: 1px solid #1abc9c; margin-top: 30px;">
        <footer style="font-size: 12px; color: #7f8c8d; margin-top: 20px;">
          <p>DevConnect Team</p>
          <p>Connect, collaborate, and grow with DevConnect!</p>
        </footer>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Error sending OTP email:', error);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
});

otpRouter.post('/verify-otp',async(req,res)=>{
    const {email,otp} = req.body;
    try{
        const otpRecord = await Otp.findOne({email});
        if(!otpRecord){
            return res.status(400).json({message:"OTP has expired"})
        }
        if(otp === otpRecord.otp){
            await Otp.deleteOne({email});
            return res.status(200).json({message:"OTP verified successfully"});
        }
        else{
          return res.status(400).json({message: "Invalid OTP"})
        }
    }
    catch (err){
        res.status(500).json({message:"Verification failed"});
    }
})

module.exports = otpRouter;
