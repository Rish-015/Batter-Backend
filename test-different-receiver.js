require("dotenv").config();
const { sendOtp } = require("./services/smsService");

async function testDifferentReceiver() {
  console.log("🧪 Testing SMS to different number...\n");
  
  // Try with a different number format
  const result = await sendOtp("8015187334"); // Test number
  
  console.log("\n📤 Result:", JSON.stringify(result, null, 2));
  
  if (result.production) {
    console.log("\n✅ SMS sent successfully!");
    console.log("📱 Check if this number receives SMS");
  }
}

testDifferentReceiver();
