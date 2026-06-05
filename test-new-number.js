require("dotenv").config();
const { sendOtp } = require("./services/smsService");

async function testNewNumber() {
  console.log("🧪 Testing with different number format...\n");
  
  // Test with the exact format your mobile app uses
  const result = await sendOtp("8015187334");
  
  console.log("\n📤 Result:", JSON.stringify(result, null, 2));
  console.log("\n💡 Latest OTP for testing:", result.otp);
}

testNewNumber();
