require("dotenv").config();
const { sendOtp } = require("./services/smsService");

async function testTwilio() {
  console.log("🧪 Testing Twilio SMS Service...\n");
  
  try {
    const result = await sendOtp("8015187334");
    console.log("\n📤 Result:", JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("\n❌ Test Failed:", error);
  }
}

testTwilio();
