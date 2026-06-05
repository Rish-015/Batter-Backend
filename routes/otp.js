const express = require("express");
const crypto = require("crypto");
const Otp = require("../models/otpVerification");
const {
  generateOtp,
  sendOtp,
  normalizePhone,
} = require("../services/otpService");

const router = express.Router();

const OTP_VALIDITY_MS = 5 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = Number(process.env.OTP_RESEND_COOLDOWN_MS || 60 * 1000);
const OTP_RATE_WINDOW_MS = Number(process.env.OTP_RATE_WINDOW_MS || 15 * 60 * 1000);
const OTP_MAX_SEND_PER_WINDOW = Number(process.env.OTP_MAX_SEND_PER_WINDOW || 5);
const otpRateLimitStore = new Map();

function hashOtp(otp) {
  return crypto.createHash("sha256").update(String(otp)).digest("hex");
}

function isOtpExpired(createdAt) {
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
        message: "Please provide a valid phone number in 91XXXXXXXXXX format",
      },
    };
  }

  if (isOtpSendRateLimited(mobile)) {
    return {
      status: 429,
      payload: {
        success: false,
        message: "Too many OTP requests. Please try again later",
      },
    };
  }

  const latestRecord = await Otp.findOne({ phone: mobile }).sort({ createdAt: -1 });
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
  const msg91Response = await sendOtp(mobile, otp);

  await Otp.deleteMany({ phone: mobile });
  await Otp.create({
    phone: mobile,
    otp: hashOtp(otp),
  });

  return {
    status: 200,
    payload: {
      success: true,
      message: "OTP sent successfully",
      data: {
        mobile,
        msg91: msg91Response,
      },
    },
  };
}

router.post("/send-otp", async (req, res) => {
  try {
    const { phone } = req.body;

    console.log("=== OTP SEND REQUEST ===");
    console.log("Incoming payload:", JSON.stringify(req.body || {}, null, 2));

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    const result = await sendOtpFlow(phone);
    return res.status(result.status).json(result.payload);
  } catch (error) {
    console.error("OTP send error status:", error.response?.status);
    console.error(
      "OTP send error response:",
      JSON.stringify(error.response?.data || {}, null, 2)
    );
    console.error("OTP send error message:", error.message || error);

    return res.status(500).json({
      success: false,
      message:
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Failed to send OTP",
    });
  }
});

router.post("/resend-otp", async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
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

router.post("/verify-otp", async (req, res) => {
  try {
    const { phone, otp } = req.body;

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

    if (isOtpExpired(record.createdAt)) {
      await Otp.deleteMany({ phone: mobile });

      return res.status(400).json({
        success: false,
        message: "OTP expired",
      });
    }

    const submittedOtpHash = hashOtp(otp);

    if (record.otp !== submittedOtpHash) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    await Otp.deleteMany({ phone: mobile });

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (error) {
    console.error(
      "OTP verify error:",
      error.response?.data || error.message || error
    );

    return res.status(500).json({
      success: false,
      message:
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Failed to verify OTP",
    });
  }
});

module.exports = router;