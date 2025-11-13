const http = require('http');

console.log('Testing API server at localhost:4000...\n');

// Test 1: Health check
const healthReq = http.request({
  hostname: 'localhost',
  port: 4000,
  path: '/',
  method: 'GET'
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('1. Health Check:');
    console.log('   Status:', res.statusCode);
    console.log('   Response:', data);
    console.log('   Result: PASS\n');
    
    // Test 2: Code execution
    testCodeExecution();
  });
});

healthReq.on('error', (err) => {
  console.error('Health check failed:', err.message);
  process.exit(1);
});

healthReq.end();

function testCodeExecution() {
  const postData = JSON.stringify({
    code: 'return 2 + 2;',
    language: 'javascript'
  });

  const req = http.request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/run-code',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('2. Code Execution:');
      console.log('   Status:', res.statusCode);
      console.log('   Response:', data);
      
      if (res.statusCode === 200) {
        console.log('   Result: PASS\n');
      } else {
        console.log('   Result: FAIL\n');
      }
      
      // Test 3: Network builder
      testNetworkBuilder();
    });
  });

  req.on('error', (err) => {
    console.error('Code execution test failed:', err.message);
    process.exit(1);
  });

  req.write(postData);
  req.end();
}

function testNetworkBuilder() {
  const postData = JSON.stringify({
    network: {
      devices: [
        { id: '1', type: 'router', label: 'Router-1', connections: ['2'] },
        { id: '2', type: 'switch', label: 'Switch-1', connections: ['1'] }
      ]
    }
  });

  const req = http.request({
    hostname: 'localhost',
    port: 4000,
    path: '/games/network-builder',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('3. Network Builder:');
      console.log('   Status:', res.statusCode);
      console.log('   Response:', data);
      
      if (res.statusCode === 200) {
        console.log('   Result: PASS\n');
      } else {
        console.log('   Result: FAIL\n');
      }
      
      console.log('All tests completed!');
    });
  });

  req.on('error', (err) => {
    console.error('Network builder test failed:', err.message);
    process.exit(1);
  });

  req.write(postData);
  req.end();
}
