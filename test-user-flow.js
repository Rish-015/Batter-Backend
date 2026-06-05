require("dotenv").config();
const axios = require("axios");

const API_BASE = "http://localhost:5000/api/auth";

async function testUserFlow() {
  console.log("🧪 Testing Smart User Flow Logic");
  console.log("===================================");
  
  const testPhone = "8015187334";
  
  try {
    // Step 1: Send OTP
    console.log("\n1️⃣ Sending OTP...");
    const otpResponse = await axios.post(`${API_BASE}/send-otp`, {
      phone: testPhone
    });
    console.log("✅ OTP sent successfully");
    console.log("📱 Phone:", testPhone);
    
    // Step 2: Get OTP from logs (for testing)
    console.log("\n2️⃣ Check console for OTP...");
    console.log("🔍 Look for: DEBUG - OTP for testing: XXXXXX");
    
    // Step 3: Verify OTP
    console.log("\n3️⃣ Testing OTP Verification...");
    console.log("📝 Expected Response Format:");
    console.log(JSON.stringify({
      token: "jwt_token_here",
      role: "customer",
      isNewUser: true,  // or false for existing users
      user: {
        _id: "user_id",
        phone: testPhone,
        name: "User Name",
        email: "user@email.com",
        addresses: []
      },
      navigateTo: "profile"  // or "dashboard" for existing users
    }, null, 2));
    
    console.log("\n🎯 User Flow Logic:");
    console.log("🆕 New User → isNewUser: true → navigateTo: 'profile' → ProfilePage");
    console.log("👤 Existing User → isNewUser: false → navigateTo: 'dashboard' → HomePage");
    
    console.log("\n📱 Frontend Implementation:");
    console.log("Check response.navigateTo field to decide navigation:");
    console.log("if (response.navigateTo === 'profile') → Navigate to ProfilePage");
    console.log("if (response.navigateTo === 'dashboard') → Navigate to HomePage");
    
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
  }
}

testUserFlow();
