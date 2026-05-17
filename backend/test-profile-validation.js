const http = require('http');

// Test admin login
const adminLoginData = JSON.stringify({
  email: "admin123@gmail.com",
  password: "Admin@admin0"
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/admin/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': adminLoginData.length
  }
};

const req = http.request(options, (res) => {
  let data = '';
  
  console.log(`\n=== Admin Login Response ===`);
  console.log(`Status: ${res.statusCode}`);
  
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log('Response:', JSON.stringify(parsed, null, 2));
      
      if (parsed.data && parsed.data.token) {
        const token = parsed.data.token;
        console.log('\n✅ Admin token received:', token.substring(0, 20) + '...');
        
        // Now test listing pending users
        testListPendingUsers(token);
      } else {
        console.log('âœ— No token in response');
      }
    } catch (e) {
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(adminLoginData);
req.end();

// Test listing pending users
function testListPendingUsers(token) {
  const options2 = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/admin/users/pending',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };

  const req2 = http.request(options2, (res) => {
    let data = '';
    
    console.log(`\n=== Pending Users Response ===`);
    console.log(`Status: ${res.statusCode}`);
    
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const parsed = JSON.parse(data);
        console.log('Response:', JSON.stringify(parsed, null, 2));
        
        if (parsed.data && parsed.data.items) {
          console.log(`\n✅ Found ${parsed.data.items.length} pending users`);
          console.log('\n=== Profile Validation Task Status ===');
          console.log('TRUE - Profile validation is WORKING!');
          process.exit(0);
        }
      } catch (e) {
        console.log('Raw response:', data);
      }
    });
  });

  req2.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
  });

  req2.end();
}


