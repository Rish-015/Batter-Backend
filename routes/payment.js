const express = require("express");
const crypto = require("crypto");
const Razorpay = require("razorpay");
const auth = require("../middleware/auth");
const Payment = require("../models/Payment");

const router = express.Router();

function getRazorpayClient() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are missing from environment");
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

function isValidAmount(amount) {
  return Number.isFinite(amount) && amount > 0;
}

function getRazorpayErrorMessage(error) {
  return (
    error.response?.data?.error?.description ||
    error.response?.data?.error?.message ||
    error.response?.data?.message ||
    error.message ||
    "Razorpay request failed"
  );
}

function getCallbackPayload(req) {
  if (Buffer.isBuffer(req.body)) {
    const rawBody = req.body.toString("utf8");

    if (!rawBody) {
      return { body: {}, rawBody: "" };
    }

    try {
      return { body: JSON.parse(rawBody), rawBody };
    } catch {
      return { body: {}, rawBody };
    }
  }

  return {
    body: req.body || {},
    rawBody: JSON.stringify(req.body || {}),
  };
}

function verifyPaymentSignature(orderId, paymentId, signature) {
  if (!process.env.RAZORPAY_KEY_SECRET) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  return expectedSignature === signature;
}

function verifyWebhookSignature(rawBody, signature) {
  if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");

  return expectedSignature === signature;
}

async function markPaymentFailed(orderId, reason) {
  return Payment.findOneAndUpdate(
    { orderId },
    { status: "failed", failureReason: reason || "Payment failed" },
    { new: true }
  );
}

router.post("/create-order", auth, async (req, res) => {
  try {
    const { amount } = req.body;
    const amountValue = Number(amount);
    const razorpay = getRazorpayClient();

    if (!isValidAmount(amountValue)) {
      return res.status(400).json({
        success: false,
        message: "A valid amount greater than 0 is required",
      });
    }

    const order = await razorpay.orders.create({
      amount: Math.round(amountValue * 100),
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
      payment_capture: 1,
    });

    await Payment.create({
      userId: req.user.userId,
      amount: amountValue,
      orderId: order.id,
      status: "created",
    });

    console.log("Razorpay order created:", JSON.stringify(order, null, 2));

    return res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error("Create order error status:", error.response?.status);
    console.error(
      "Create order error response:",
      JSON.stringify(error.response?.data || {}, null, 2)
    );
    console.error("Create order error message:", error.message || error);

    return res.status(500).json({
      success: false,
      message: getRazorpayErrorMessage(error),
    });
  }
});

async function verifyPaymentHandler(req, res) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "razorpay_order_id, razorpay_payment_id, and razorpay_signature are required",
      });
    }

    const existingPayment = await Payment.findOne({ orderId: razorpay_order_id });

    if (!existingPayment) {
      return res.status(404).json({
        success: false,
        message: "Payment order not found",
      });
    }

    if (String(existingPayment.userId) !== String(req.user.userId)) {
      return res.status(403).json({
        success: false,
        message: "This payment order does not belong to the authenticated user",
      });
    }

    if (existingPayment.status === "success") {
      return res.status(200).json({
        success: true,
        message: "Payment already verified",
        payment: existingPayment,
      });
    }

    if (!process.env.RAZORPAY_KEY_SECRET) {
      return res.status(503).json({
        success: false,
        message: "RAZORPAY_KEY_SECRET is missing from environment",
      });
    }

    if (!verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
      await markPaymentFailed(razorpay_order_id, "Invalid payment signature");

      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    const payment = await Payment.findOneAndUpdate(
      { orderId: razorpay_order_id },
      {
        paymentId: razorpay_payment_id,
        status: "success",
      },
      { new: true }
    );

    console.log("Payment verified:", JSON.stringify(payment, null, 2));

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      payment,
    });
  } catch (error) {
    console.error("Verify payment error status:", error.response?.status);
    console.error(
      "Verify payment error response:",
      JSON.stringify(error.response?.data || {}, null, 2)
    );
    console.error("Verify payment error message:", error.message || error);

    return res.status(500).json({
      success: false,
      message: getRazorpayErrorMessage(error) || "Failed to verify payment",
    });
  }
}

router.post("/verify-payment", auth, verifyPaymentHandler);

router.post("/callback/success", async (req, res) => {
  try {
    const { body, rawBody } = getCallbackPayload(req);
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id) {
      return res.status(400).json({
        success: false,
        message: "razorpay_order_id and razorpay_payment_id are required",
      });
    }

    const signatureValid = req.get("x-razorpay-signature")
      ? verifyWebhookSignature(rawBody, req.get("x-razorpay-signature"))
      : verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);

    if (!signatureValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid Razorpay signature",
      });
    }

    const existingPayment = await Payment.findOne({ orderId: razorpay_order_id });

    if (!existingPayment) {
      return res.status(404).json({
        success: false,
        message: "Payment order not found",
      });
    }

    if (existingPayment.status === "success") {
      return res.status(200).json({
        success: true,
        message: "Payment already verified",
        payment: existingPayment,
      });
    }

    const payment = await Payment.findOneAndUpdate(
      { orderId: razorpay_order_id },
      {
        paymentId: razorpay_payment_id || existingPayment.paymentId,
        status: "success",
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      payment,
    });
  } catch (error) {
    console.error("Callback success error:", error.message || error);

    return res.status(500).json({
      success: false,
      message: "Failed to process payment callback",
    });
  }
});

router.post("/callback/failure", async (req, res) => {
  try {
    const { body, rawBody } = getCallbackPayload(req);
    const { razorpay_order_id, reason, razorpay_payment_id, razorpay_signature } = body;

    if (!razorpay_order_id) {
      return res.status(400).json({
        success: false,
        message: "razorpay_order_id is required",
      });
    }

    if (req.get("x-razorpay-signature") && !verifyWebhookSignature(rawBody, req.get("x-razorpay-signature"))) {
      return res.status(400).json({
        success: false,
        message: "Invalid Razorpay signature",
      });
    }

    if (razorpay_signature && razorpay_payment_id && !verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Razorpay signature",
      });
    }

    const existingPayment = await Payment.findOne({ orderId: razorpay_order_id });

    if (!existingPayment) {
      return res.status(404).json({
        success: false,
        message: "Payment order not found",
      });
    }

    const payment = await Payment.findOneAndUpdate(
      { orderId: razorpay_order_id },
      {
        paymentId: razorpay_payment_id || existingPayment.paymentId,
        status: "failed",
        failureReason: reason || "Payment failed by gateway callback",
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Payment marked as failed",
      payment,
    });
  } catch (error) {
    console.error("Failure callback error:", error.message || error);

    return res.status(500).json({
      success: false,
      message: "Failed to process payment failure callback",
    });
  }
});

module.exports = router;