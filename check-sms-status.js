require("dotenv").config();
const twilio = require('twilio');

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

async function checkSmsStatus() {
  try {
    console.log("🔍 Checking recent SMS messages...\n");
    
    // Get recent messages
    const messages = await client.messages.list({
      limit: 5,
      to: '+918015187334'
    });
    
    messages.forEach(message => {
      console.log(`📱 Message SID: ${message.sid}`);
      console.log(`📊 Status: ${message.status}`);
      console.log(`📝 Body: ${message.body}`);
      console.log(`📅 Date: ${message.dateCreated}`);
      console.log(`📞 From: ${message.from}`);
      console.log(`📞 To: ${message.to}`);
      console.log(`💰 Price: ${message.price || 'N/A'}`);
      console.log(`🚨 Error Code: ${message.errorCode || 'None'}`);
      console.log(`📄 Error Message: ${message.errorMessage || 'None'}`);
      console.log('---');
    });
    
  } catch (error) {
    console.error('❌ Error checking SMS status:', error);
  }
}

checkSmsStatus();
