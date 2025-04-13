const validator = require('validator');

const validateSignUpData = (req) => {
   const { firstName = "", emailId = "", password = "" , age = ""} = req.body;

   if (!firstName.trim()) {
      return { status: 400, message: "First Name is required" };
   }

   if (!validator.isEmail(emailId)) {
      return { status: 400, message: "Please enter a valid Email" };
   }

   if (!validator.isStrongPassword(password)) {
      return { status: 400, message: "Password should contain length of 8 characters with uppercase , lowercase , symbols" };
   }
   if (age < 18) {
      return { status: 400, message: "User should be minimum 18 years old" };
   }
   return null;
};

const validationLoginData = (req) => {
   const { emailId = "", password = "" } = req.body;

   if (!emailId.trim()) {
      return { status: 400, message: "Email is required" };
   }

   if (!validator.isEmail(emailId)) {
      return { status: 400, message: "Please enter a valid Email" };
   }

   if (!password.trim()) {
      return { status: 400, message: "Password is required" };
   }

   return null;
};

const validateEditProfileData = (req) => {
   const user = req.body;
   const ALLOWED_UPDATES = ["firstName", "lastName", "photoURL", "about", "gender", "age", "skills"];

   const isUpdateAllowed = Object.keys(user).every((k) => ALLOWED_UPDATES.includes(k));
   if (!isUpdateAllowed) return false;

   if (user.photoURL && !validator.isURL(user.photoURL)) return false;

   return true;
};

const validateEditPassword = async (req, user) => {
   const { currentPassword = "", updatedPassword = "", confirmUpdatedPassword = "" } = req.body;

   const isPasswordValid = await user.validatePassword(currentPassword.trim());
   if (!isPasswordValid) {
      return { status: 401, message: "Current Password is not valid" };
   }

   if (!updatedPassword.trim()) {
      return { status: 400, message: "New Password is required" };
   }

   if (!confirmUpdatedPassword.trim()) {
      return { status: 400, message: "Confirm Password is required" };
   }

   if (updatedPassword.trim() !== confirmUpdatedPassword.trim()) {
      return { status: 400, message: "Password and Confirm Password mismatch" };
   }

   if (!validator.isStrongPassword(updatedPassword)) {
      return {
         status: 400,
         message: "Password should be 8+ characters with uppercase, lowercase, numbers, and symbols"
      };
   }

   return null;
};

module.exports = {
   validateSignUpData,
   validationLoginData,
   validateEditProfileData,
   validateEditPassword
};
