const express = require('express');
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const profileRouter = express.Router();
const { userAuth } = require("../middlewares/auth");
const { validateEditProfileData, validateEditPassword } = require("../utils/validation");

profileRouter.get("/profile/view", userAuth, async (req, res) => {
  try {
    const { _id, firstName, lastName, photoURL, age, gender, about, skills, emailId } = req.user;
    return res.status(200).json({ _id, firstName, lastName, photoURL, age, gender, about, skills, emailId });
  } catch (err) {
    return res.status(400).json({ message: err.message || "Bad Request" });
  }
});

profileRouter.patch("/profile/edit", userAuth, async (req, res) => {
  try {
    const isValid = validateEditProfileData(req);
    if (!isValid) {
      return res.status(400).json({ message: "Invalid fields or invalid photo URL" });
    }

    const loggedInUser = req.user;
    const allowedUpdates = ["firstName", "lastName", "photoURL", "about", "gender", "age", "skills"];
     Object.keys(req.body).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        loggedInUser[key] = req.body[key];
      }
    });

    await loggedInUser.save();
    const { firstName, lastName, gender, age, photoURL,about, skills, emailId } = loggedInUser;
    const safeUpdates = { firstName, lastName, emailId, photoURL, gender, age, about, skills };

    return res.status(200).json({ message: "Profile updated successfully", data: safeUpdates });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Something went wrong" });
  }
});

profileRouter.patch("/profile/password", userAuth, async (req, res) => {
  try {
    const validationResult = await validateEditPassword(req, req.user);
    if (validationResult) {
      return res.status(validationResult.status).json({ message: validationResult.message });
    }

    req.user.password = await bcrypt.hash(req.body.updatedPassword.trim(), 10);
    await req.user.save();

    return res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Something went wrong" });
  }
});

module.exports = profileRouter;
