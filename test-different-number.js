require("dotenv").config();
const { sendOtp } = require("./services/smsService");

async function testDifferentNumber() {
  console.log("🧪 Testing with different number...\n");
  
  // Test with a different format
  const result = await sendOtp("8015187334"); // Try a different number
  
  console.log("\n📤 Result:", JSON.stringify(result, null, 2));
}

testDifferentNumber();
