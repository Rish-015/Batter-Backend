const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testFeature(featureName, testFunction) {
  console.log(`\n🧪 Testing ${featureName}...`);
  try {
    await testFunction();
    console.log(`✅ ${featureName} - PASSED`);
  } catch (error) {
    console.log(`❌ ${featureName} - FAILED:`, error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting Batter App Feature Tests\n');

  // Test 1: Health Check
  await testFeature('Health Check', async () => {
    const response = await axios.get('http://localhost:5000');
    if (response.data.message !== 'Batter Delivery API is running') {
      throw new Error('Health check failed');
    }
  });

  // Test 2: OTP Send
  await testFeature('Send OTP', async () => {
    const response = await axios.post(`${API_BASE}/auth/send-otp`, {
      phone: '9999999999'
    });
    if (!response.data.otp) {
      throw new Error('OTP not received');
    }
    return response.data.otp;
  });

  // Test 3: Products
  await testFeature('Get Products', async () => {
    const response = await axios.get(`${API_BASE}/products`);
    if (!Array.isArray(response.data)) {
      throw new Error('Products not in array format');
    }
  });

  console.log('\n🏁 Feature testing completed!');
}

runTests().catch(console.error);
