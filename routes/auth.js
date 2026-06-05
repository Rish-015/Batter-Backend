const express = require("express");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Otp = require("../models/otpVerification");
const { normalizePhone } = require("../services/otpService");

const router = express.Router();

const OTP_VALIDITY_MS = 5 * 60 * 1000;

function hashOtp(otp) {
  return crypto.createHash("sha256").update(String(otp)).digest("hex");
}

function isExpired(createdAt) {
  if (!createdAt) {
    return true;
  }

  return Date.now() - new Date(createdAt).getTime() > OTP_VALIDITY_MS;
}

router.post("/login", async (req, res) => {
  try {
    const { phone, otp, name } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: "Phone and OTP are required",
      });
    }

    const mobile = normalizePhone(phone);

    if (!mobile) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid phone number",
      });
    }

    const record = await Otp.findOne({ phone: mobile }).sort({ createdAt: -1 });

    if (!record) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    if (isExpired(record.createdAt)) {
      await Otp.deleteMany({ phone: mobile });

      return res.status(400).json({
        success: false,
        message: "OTP expired",
      });
    }

    if (record.otp !== hashOtp(otp)) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    let user = await User.findOne({ phone: mobile });

    if (!user) {
      user = await User.create({
        phone: mobile,
        name: name?.trim() || undefined,
        role: "customer",
      });
    } else if (name?.trim() && !user.name) {
      user.name = name.trim();
      await user.save();
    }

    await Otp.deleteMany({ phone: mobile });

    const token = jwt.sign(
      {
        userId: user._id,
        phone: user.phone,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("OTP login error:", error.response?.data || error.message || error);

    return res.status(500).json({
      success: false,
      message: error.response?.data?.message || error.message || "Failed to login",
    });
  }
});

module.exports = router;