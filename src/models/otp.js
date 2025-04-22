const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  emailId: String,
  otp: String,
  context: String,
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300
  }
});

module.exports = mongoose.model('Otp', otpSchema);
