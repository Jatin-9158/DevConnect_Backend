const express = require("express");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const User = require("../models/user");
const { validateSignUpData, validationLoginData } = require("../utils/validation");

const authRouter = express.Router();

// LOGIN ROUTE
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

// SIGNUP ROUTE
authRouter.post("/signup", async (req, res) => {
  try {
    const validationResult = validateSignUpData(req);
    if (validationResult) {
      return res.status(validationResult.status).json({ message: validationResult.message });
    }

    const { firstName, lastName, emailId, password, age, gender } = req.body;

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = new User({
      firstName,
      lastName,
      emailId,
      password: passwordHash,
      age,
      gender,
    });

    await newUser.save();

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

// LOGOUT ROUTE
authRouter.post("/logout", (req, res) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
    sameSite: "strict",
  });
  res.status(204).json({ message: "Logout Successful" });
});

module.exports = authRouter;
