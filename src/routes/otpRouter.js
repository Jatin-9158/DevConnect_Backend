const express = require("express");
const { sendOtp, verifyOtp } = require("../utils/otpHandler");
const otpRouter = express.Router();
const jwt = require('jsonwebtoken');
const User = require("../models/user")
otpRouter.post("/send-otp", async (req, res) => {
  const { emailId, context } = req.body;
  try {
    const existingUser = await User.findOne({emailId:emailId});
    if(existingUser && context==="signup") {
       throw new Error("Existing Verified User")
    }
    const message = await sendOtp(emailId, context);

    res
  .status(200)
  .json({ message});
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

otpRouter.post("/verify-otp", async (req, res) => {
  const { emailId, otp } = req.body;
  try {
    const message = await verifyOtp(emailId, otp);
    const token = jwt.sign({ emailId }, process.env.SECRET_KEY, { expiresIn: '15m' });

    res
      .cookie('otp_token', token, {
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000, 
      })
      .status(200)
      .json({ message:message });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = otpRouter;
