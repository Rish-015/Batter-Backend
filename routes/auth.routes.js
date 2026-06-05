const express = require("express");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const OTP = require("../models/OTP");
const User = require("../models/User");
const auth = require("../middleware/auth");
const {
  generateOtp,
  sendOtp,
  normalizePhone,
} = require("../services/otpService");

const router = express.Router();
const OTP_VALIDITY_MS = 5 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = Number(process.env.OTP_RESEND_COOLDOWN_MS || 60 * 1000);

const otpRateLimitStore = new Map();
const OTP_RATE_WINDOW_MS = Number(process.env.OTP_RATE_WINDOW_MS || 15 * 60 * 1000);
const OTP_MAX_SEND_PER_WINDOW = Number(process.env.OTP_MAX_SEND_PER_WINDOW || 5);

function hashOtp(otp) {
  return crypto.createHash("sha256").update(String(otp)).digest("hex");
}

function isExpired(createdAt) {
  if (!createdAt) {
    return true;
  }

  return Date.now() - new Date(createdAt).getTime() > OTP_VALIDITY_MS;
}

function isOtpSendRateLimited(key) {
  const now = Date.now();
  const state = otpRateLimitStore.get(key);

  if (!state) {
    otpRateLimitStore.set(key, { count: 1, windowStart: now });
    return false;
  }

  if (now - state.windowStart > OTP_RATE_WINDOW_MS) {
    otpRateLimitStore.set(key, { count: 1, windowStart: now });
    return false;
  }

  if (state.count >= OTP_MAX_SEND_PER_WINDOW) {
    return true;
  }

  state.count += 1;
  otpRateLimitStore.set(key, state);
  return false;
}

async function sendOtpFlow(phone) {
  const mobile = normalizePhone(phone);

  if (!mobile) {
    return {
      status: 400,
      payload: {
        success: false,
        message: "Please provide a valid phone number",
      },
    };
  }

  const rateLimitKey = mobile;
  if (isOtpSendRateLimited(rateLimitKey)) {
    return {
      status: 429,
      payload: {
        success: false,
        message: "Too many OTP requests. Please try again later",
      },
    };
  }

  const latestRecord = await OTP.findOne({ phone: mobile }).sort({ createdAt: -1 });
  if (
    latestRecord?.createdAt &&
    Date.now() - new Date(latestRecord.createdAt).getTime() < OTP_RESEND_COOLDOWN_MS
  ) {
    return {
      status: 429,
      payload: {
        success: false,
        message: "Please wait before requesting OTP again",
      },
    };
  }

  const otp = generateOtp();
  const providerResult = await sendOtp(mobile, otp);

  await OTP.deleteMany({ phone: mobile });
  await OTP.create({
    phone: mobile,
    otp: hashOtp(otp),
  });

  return {
    status: 200,
    payload: {
      success: true,
      message: "OTP sent successfully",
      phone: mobile,
      provider: providerResult?.data?.type || "msg91",
    },
  };
}

// 🔐 ADMIN LOGIN (Traditional Password)
router.post("/login-admin", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password required" });
    }

    // Find admin by email or phone (using email as username for admin)
    const user = await User.findOne({ 
      $or: [{ email: username }, { phone: username }],
      role: 'admin' 
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid admin credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid admin credentials" });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ 
      token, 
      user: { id: user._id, name: user.name, role: user.role } 
    });

  } catch (err) {
    res.status(500).json({ message: "Server error during login" });
  }
});

// 🔐 REGISTER ADMIN (Initial Setup - Should be disabled in production)
router.post("/register-admin-internal", async (req, res) => {
  try {
    const { name, email, phone, password, secret } = req.body;
    const adminInitSecret = process.env.ADMIN_REGISTRATION_SECRET;

    if (!adminInitSecret) {
      return res.status(503).json({
        message: "Admin registration is disabled",
      });
    }

    if (secret !== adminInitSecret) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const admin = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role: 'admin'
    });

    res.status(201).json({ message: "Admin created successfully", admin: { id: admin._id, email: admin.email } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- EXISTING OTP LOGIC ---

// SEND OTP
router.post("/send-otp", async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone required",
      });
    }

    const result = await sendOtpFlow(phone);
    return res.status(result.status).json(result.payload);
  } catch (error) {
    console.error("Send OTP Error:", error);
    return res.status(500).json({
      success: false,
      message: error.response?.data?.message || error.message || "Failed to send OTP",
    });
  }
});

router.post("/resend-otp", async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone required",
      });
    }

    const result = await sendOtpFlow(phone);
    return res.status(result.status).json(result.payload);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to resend OTP",
    });
  }
});

// VERIFY OTP
router.post("/verify-otp", async (req, res) => {
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

    const record = await OTP.findOne({ phone: mobile }).sort({ createdAt: -1 });

    if (!record) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    if (isExpired(record.createdAt)) {
      await OTP.deleteMany({ phone: mobile });

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
    const isNewUser = !user;

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

    await OTP.deleteMany({ phone: mobile });

    const token = jwt.sign(
      { userId: user._id, phone: user.phone, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      success: true,
      token,
      role: user.role,
      isNewUser,
      user: {
        _id: user._id,
        phone: user.phone,
        name: user.name,
        email: user.email,
        addresses: user.addresses || [],
      },
      navigateTo: isNewUser ? "profile" : "dashboard",
    });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to verify OTP",
    });
  }
});

// 🔐 CHANGE PASSWORD
router.post("/change-password", auth, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Old password is incorrect" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error during password update" });
  }
});

router.post("/logout", auth, async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Logged out successfully. Clear token on client side.",
  });
});

module.exports = router;
