const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      index: true,
    },
    otp: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 300,
    },
  },
  {
    versionKey: false,
    collection: "otps",
  }
);

otpSchema.index({ phone: 1, createdAt: -1 });

module.exports = mongoose.model("OtpVerification", otpSchema);