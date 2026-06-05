const twilio = require('twilio');

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

/**
 * Generate 6-digit OTP
 */
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Format phone number for Twilio (India)
 */
function formatPhoneForTwilio(phone) {
  // Remove any non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Add India country code if not present
  if (cleanPhone.length === 10) {
    return `+91${cleanPhone}`;
  }
  
  // If already has country code, ensure it starts with +
  if (!cleanPhone.startsWith('+')) {
    return `+${cleanPhone}`;
  }
  
  return cleanPhone;
}

/**
 * Send OTP via SMS using Twilio
 */
async function sendOtp(phone) {
  // Debug environment variables
  console.log('=== TWILIO DEBUG ===');
  console.log('Account SID:', process.env.TWILIO_ACCOUNT_SID ? 'SET' : 'MISSING');
  console.log('Auth Token:', process.env.TWILIO_AUTH_TOKEN ? 'SET' : 'MISSING');
  console.log('Phone Number:', process.env.TWILIO_PHONE_NUMBER);
  
  try {
    const otp = generateOtp();
    const formattedPhone = formatPhoneForTwilio(phone);
    
    console.log(`Attempting to send OTP ${otp} to ${formattedPhone}`);
    console.log('From:', process.env.TWILIO_PHONE_NUMBER);
    console.log('To:', formattedPhone);
    
    // Send SMS via Twilio
    const message = await client.messages.create({
      body: `Your BatterHub verification code is: ${otp}. Valid for 5 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone
    });
    
    console.log('✅ Twilio SMS sent successfully!');
    console.log('Message SID:', message.sid);
    console.log('Status:', message.status);
    console.log('===================');
    
    const response = {
      message: 'OTP sent successfully',
      sid: message.sid,
      production: true
    };
    
    return response;
  } catch (error) {
    console.error('❌ TWILIO ERROR DETAILS:');
    console.error('Error Code:', error.code);
    console.error('Error Message:', error.message);
    console.error('Error Status:', error.status);
    console.error('More Info:', error.moreInfo);
    console.log('========================');
    
    // Production fallback - no debug OTPs
    return { 
      success: false, 
      message: 'SMS service temporarily unavailable',
      error: error.message
    };
  }
}

module.exports = {
  generateOtp,
  formatPhoneForTwilio,
  sendOtp
};
