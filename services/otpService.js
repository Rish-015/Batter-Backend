const axios = require("axios");

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function normalizePhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");

  if (digits.length === 10) {
    return `91${digits}`;
  }

  if (digits.length === 12 && digits.startsWith("91")) {
    return digits;
  }

  return "";
}

function maskSensitiveValue(value) {
  if (!value) {
    return "[MISSING]";
  }

  return "[REDACTED]";
}

async function sendOtp(phone, otp) {
  const authKey = process.env.MSG91_AUTH_KEY;

  if (!authKey) {
    throw new Error("MSG91_AUTH_KEY is missing from environment");
  }

  const templateId = process.env.MSG91_TEMPLATE_ID;
  const mobile = normalizePhone(phone);

  if (!mobile) {
    throw new Error(
      "Please provide a valid phone number in 91XXXXXXXXXX format"
    );
  }

  if (!templateId) {
    throw new Error("MSG91_TEMPLATE_ID is missing from environment");
  }

  const endpoint = "https://control.msg91.com/api/v5/otp";

  const payload = {
    authkey: authKey,
    mobile,
    otp,
    template_id: templateId,
  };

  console.log("\n========================================");
  console.log("GENERATED OTP:", otp);
  console.log("PHONE:", mobile);
  console.log("========================================\n");

  console.log("=== MSG91 OTP REQUEST ===");
  console.log("URL:", endpoint);

  console.log(
    "Payload:",
    JSON.stringify(
      {
        authkey: maskSensitiveValue(authKey),
        mobile,
        otp,
        template_id: templateId,
      },
      null,
      2
    )
  );

  try {
    const response = await axios.post(endpoint, payload, {
      timeout: 15000,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    console.log("=== MSG91 OTP RESPONSE ===");
    console.log("Status:", response.status);
    console.log("Status Text:", response.statusText);
    console.log(
      "Response Body:",
      JSON.stringify(response.data, null, 2)
    );

    return {
      success: true,
      status: response.status,
      data: response.data,
      request: {
        url: endpoint,
        method: "POST",
        payload: {
          authkey: maskSensitiveValue(authKey),
          mobile,
          otp,
          template_id: templateId,
        },
      },
    };
  } catch (error) {
    console.error("=== MSG91 OTP ERROR ===");
    console.error("Status:", error.response?.status);
    console.error("Status Text:", error.response?.statusText);
    console.error(
      "Response Body:",
      JSON.stringify(error.response?.data || {}, null, 2)
    );
    console.error("Message:", error.message);

    console.error(
      "Request Config:",
      JSON.stringify(
        {
          url: error.config?.url,
          method: error.config?.method,
          params: error.config?.params,
          data: error.config?.data,
        },
        null,
        2
      )
    );

    throw error;
  }
}

module.exports = {
  generateOtp,
  normalizePhone,
  sendOtp,
};