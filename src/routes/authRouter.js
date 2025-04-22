const express = require("express");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const User = require("../models/user");
const validator = require("validator")
const jwt = require('jsonwebtoken');
const { validateSignUpData, validationLoginData } = require("../utils/validation");

const authRouter = express.Router();


authRouter.post("/login", async (req, res) => {
  try {
    const validationResult = validationLoginData(req);
    if (validationResult) {
      return res.status(validationResult.status).json({ message: validationResult.message });
    }

    const { emailId, password } = req.body;
    const user = await User.findOne({ emailId });

    if (!user) {
      return res.status(401).json({ message: "Invalid Credentials" });
    }

    const isPasswordValid = await user.validatePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid Credentials" });
    }

    const { firstName, lastName, age, gender, photoURL, about, skills } = user;
    const jwt_token = await user.getJWT();

    res.cookie("token", jwt_token, {
      expires: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
      httpOnly: true,
      sameSite: "strict",
    });

    return res.status(200).json({
      message: "Login Successful",
      user: { firstName, lastName, emailId, age, gender, photoURL, about, skills },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Something went wrong" });
  }
});

authRouter.post("/signup", async (req, res) => {
  try {
    const validationResult = validateSignUpData(req);
    if (validationResult) {
      return res.status(validationResult.status).json({ message: validationResult.message });
    }
    const { firstName, lastName, emailId, password, age, gender,termsAccepted } = req.body;
    const token = req.cookies?.otp_token;
    if (!token) return res.status(401).json({ message: "Please Reverify the Email" });

    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    if (decoded.emailId !== emailId) {
      return res.status(400).json({ message: "Email mismatch" });
    }
    if (!termsAccepted) {
      return res.status(400).json({ message: "You must agree to the terms and conditions." });
    }
    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = new User({
      firstName,
      lastName,
      emailId,
      password: passwordHash,
      age,
      gender,
      isVerified:true,
      termsAccepted,
    });

    await newUser.save();
    res.clearCookie('otp_token');
    return res.status(201).json({
      message: "User Account Created Successfully!!",
      data: {
        firstName,
        lastName,
        emailId,
        age,
        gender,
      },
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "User already exists with the same emailId" });
    }
    return res.status(500).json({ message: "Internal Server Error" });
  }
});
authRouter.post("/forgot-password", async (req, res) => {
  try {
    const { emailId, password } = req.body;


    if (!emailId || emailId.trim() === "") {
      return res.status(400).json({ message: "Email is a required field" });
    }

    if (!password || password.trim() === "") {
      return res.status(400).json({ message: "Password is a required field" });
    }

    if (!validator.isStrongPassword(password)) {
      return res.status(400).json({
        message: "Password should be 8+ characters with uppercase, lowercase, numbers, and symbols",
      });
    }

   
    const user = await User.findOne({ emailId });
    if (!user) {
      return res.status(404).json({ message: "No user found with this email" });
    }


    const passwordHash = await bcrypt.hash(password, 10);
    user.password = passwordHash;
    await user.save();

    return res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
 
    return res.status(500).json({
      message: err.message || "Internal Server Error",
    });
  }
});


authRouter.post("/logout", (req, res) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
    sameSite: "strict",
  });
  res.status(204).json({ message: "Logout Successful" });
});

module.exports = authRouter;
