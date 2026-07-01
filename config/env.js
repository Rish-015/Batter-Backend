function maskValue(value) {
  if (!value) {
    return "[MISSING]";
  }

  return "[SET]";
}

function logSection(title) {
  console.log(`=== ${title} ===`);
}

function logStartupConfigChecks() {
  const coreVars = ["MONGO_URI", "JWT_SECRET"];
  const paymentVars = [
    "RAZORPAY_KEY_ID",
    "RAZORPAY_KEY_SECRET",
    "RAZORPAY_WEBHOOK_SECRET",
  ];
  const otpVars = ["MSG91_AUTH_KEY", "MSG91_TEMPLATE_ID"];

  logSection("STARTUP CONFIG CHECK");

  coreVars.forEach((name) => {
    console.log(`${name}: ${maskValue(process.env[name])}`);
  });

  paymentVars.forEach((name) => {
    console.log(`${name}: ${maskValue(process.env[name])}`);
  });

  otpVars.forEach((name) => {
    console.log(`${name}: ${maskValue(process.env[name])}`);
  });

  const missingCoreVars = coreVars.filter((name) => !process.env[name]);
  if (missingCoreVars.length > 0) {
    throw new Error(
      `Missing required env vars: ${missingCoreVars.join(", ")}`
    );
  }

  const missingPaymentVars = paymentVars.filter((name) => !process.env[name]);
  if (missingPaymentVars.length > 0) {
    console.warn(
      "Payment API will not work until these vars are set:",
      missingPaymentVars.join(", ")
    );
  }

  const missingOtpVars = otpVars.filter((name) => !process.env[name]);
  if (missingOtpVars.length > 0) {
    console.warn(
      "MSG91 OTP delivery will not work until these vars are set:",
      missingOtpVars.join(", ")
    );
  }

  console.log("========================");
}

module.exports = logStartupConfigChecks;