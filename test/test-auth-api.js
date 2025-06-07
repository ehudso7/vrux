const fetch = require('node-fetch');

async function testAuthEndpoints() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('Testing Vrux Auth API Endpoints...\n');
  
  // Test 1: Health check
  try {
    console.log('1. Testing API health...');
    const healthRes = await fetch(`${baseUrl}/api/health`);
    console.log(`   Status: ${healthRes.status}`);
    console.log(`   Headers: ${healthRes.headers.get('content-type')}`);
    if (healthRes.headers.get('content-type')?.includes('application/json')) {
      const data = await healthRes.json();
      console.log('   Response:', data);
    } else {
      console.log('   ERROR: Not returning JSON!');
      const text = await healthRes.text();
      console.log('   HTML Response:', text.substring(0, 200));
    }
  } catch (error) {
    console.log('   ERROR:', error.message);
  }
  
  // Test 2: Signup endpoint
  try {
    console.log('\n2. Testing signup endpoint...');
    const signupRes = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3000'
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'Test123!',
        name: 'Test User'
      })
    });
    
    console.log(`   Status: ${signupRes.status}`);
    console.log(`   Headers: ${signupRes.headers.get('content-type')}`);
    
    if (signupRes.headers.get('content-type')?.includes('application/json')) {
      const data = await signupRes.json();
      console.log('   Response:', data);
    } else {
      console.log('   ERROR: Not returning JSON!');
      const text = await signupRes.text();
      console.log('   HTML Response:', text.substring(0, 200));
    }
  } catch (error) {
    console.log('   ERROR:', error.message);
  }
  
  // Test 3: Check if server is running
  try {
    console.log('\n3. Testing if Next.js server is running...');
    const homeRes = await fetch(`${baseUrl}/`);
    console.log(`   Status: ${homeRes.status}`);
    console.log('   Server is running!');
  } catch (error) {
    console.log('   ERROR: Server not running!', error.message);
  }
}

testAuthEndpoints().catch(console.error);
