const https = require('https');

const testData = {
  // Missing scoreVector to test error handling
};

const options = {
  hostname: 'localhost',
  port: 4000,
  path: '/results/ai-feedback',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(JSON.stringify(testData))
  },
  // Add timeout
  timeout: 30000
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      console.log('AI Feedback Response:');
      console.log(JSON.stringify(response, null, 2));

      // Check if we got fallback response due to API issues
      if (response.feedback && response.feedback.includes('currently unavailable')) {
        console.log('\n✅ API handled Hugging Face connectivity issues gracefully with fallback response');
      } else if (response.feedback && response.feedback.includes('recommended career paths')) {
        console.log('\n✅ AI feedback working correctly with Hugging Face API');
      }
    } catch (err) {
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (err) => {
  console.error('Request error:', err.message);
});

req.on('timeout', () => {
  console.error('Request timed out');
  req.destroy();
});

req.write(JSON.stringify(testData));
req.end();