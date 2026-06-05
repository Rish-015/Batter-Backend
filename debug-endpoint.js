// Add this to your auth.routes.js for debugging

// DEBUG ENDPOINT - Add this temporarily
router.post("/debug-send-otp", async (req, res) => {
  console.log("=== DEBUG: Mobile App Request ===");
  console.log("Headers:", JSON.stringify(req.headers, null, 2));
  console.log("Body:", JSON.stringify(req.body, null, 2));
  console.log("Raw Body:", req.body);
  console.log("Content-Type:", req.get('Content-Type'));
  console.log("User-Agent:", req.get('User-Agent'));
  console.log("================================");
  
  // Try to process normally
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ message: "Phone required", debug: "Missing phone field" });
    }

    const smsResult = await sendOtp(phone);
    
    if (!smsResult.success) {
      return res.status(500).json({ message: "Failed to send OTP", debug: smsResult });
    }

    await OTP.create({
      phone,
      otp: smsResult.otp,
      expiresAt: Date.now() + 5 * 60 * 1000
    });

    const response = {
      message: "OTP sent successfully",
      phone,
      sid: smsResult.sid
    };

    if (smsResult.development) {
      response.otp = smsResult.otp;
      response.development = true;
    }

    res.json(response);
  } catch (error) {
    console.error("DEBUG ERROR:", error);
    res.status(500).json({ 
      message: "Failed to send OTP", 
      debug: error.message,
      stack: error.stack 
    });
  }
});

// Add this line to your auth.routes.js exports
module.exports = router;
