const http = require('http');

const API_BASE = 'localhost';
const API_PORT = 4000;

function testEndpoint(path, method, data, testName) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : '';
    
    const options = {
      hostname: API_BASE,
      port: API_PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          console.log(`\n${'='.repeat(60)}`);
          console.log(`TEST: ${testName}`);
          console.log(`${'='.repeat(60)}`);
          console.log('Status:', res.statusCode);
          console.log('Response:', JSON.stringify(parsed, null, 2));
          
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log('Result: PASS');
            resolve(parsed);
          } else {
            console.log('Result: FAIL');
            reject(new Error(`Status ${res.statusCode}`));
          }
        } catch (err) {
          console.log('Raw response:', responseData);
          reject(err);
        }
      });
    });

    req.on('error', (err) => {
      console.error(`\nERROR in ${testName}:`, err.message);
      reject(err);
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function runAllTests() {
  console.log('\n' + '='.repeat(60));
  console.log('INTERACTIVE GAMES API TEST SUITE');
  console.log('='.repeat(60));

  try {
    // Test 1: Code Execution
    await testEndpoint(
      '/api/run-code',
      'POST',
      {
        code: 'console.log("Hello from code executor!"); return 2 + 2;',
        language: 'javascript'
      },
      'Code Execution - Simple Math'
    );

    await new Promise(resolve => setTimeout(resolve, 500));

    // Test 2: Code Execution with Error
    await testEndpoint(
      '/api/run-code',
      'POST',
      {
        code: 'throw new Error("Test error");',
        language: 'javascript'
      },
      'Code Execution - Error Handling'
    );

    await new Promise(resolve => setTimeout(resolve, 500));

    // Test 3: Network Builder - Valid Topology
    await testEndpoint(
      '/games/network-builder',
      'POST',
      {
        network: {
          devices: ['Router', 'Switch', 'PC1', 'PC2', 'Server'],
          connections: [
            ['Router', 'Switch'],
            ['Switch', 'PC1'],
            ['Switch', 'PC2'],
            ['Router', 'Server']
          ]
        },
        moduleId: 'test-module-1'
      },
      'Network Builder - Valid Topology'
    );

    await new Promise(resolve => setTimeout(resolve, 500));

    // Test 4: Network Builder - Minimal Topology
    await testEndpoint(
      '/games/network-builder',
      'POST',
      {
        network: {
          devices: ['PC1', 'PC2'],
          connections: [['PC1', 'PC2']]
        },
        moduleId: 'test-module-2'
      },
      'Network Builder - Minimal Topology'
    );

    await new Promise(resolve => setTimeout(resolve, 500));

    // Test 5: Threat Detection - Multiple Threats
    await testEndpoint(
      '/games/threat-detection',
      'POST',
      {
        threats: ['Phishing', 'Malware', 'SQL Injection', 'DDoS Attack'],
        moduleId: 'test-module-3'
      },
      'Threat Detection - Multiple Threats'
    );

    await new Promise(resolve => setTimeout(resolve, 500));

    // Test 6: Threat Detection - Unknown Threats
    await testEndpoint(
      '/games/threat-detection',
      'POST',
      {
        threats: ['Unknown Threat', 'Made Up Attack'],
        moduleId: 'test-module-4'
      },
      'Threat Detection - Unknown Threats'
    );

    await new Promise(resolve => setTimeout(resolve, 500));

    // Test 7: SQL Quiz - Valid Queries
    await testEndpoint(
      '/games/sql-quiz',
      'POST',
      {
        answers: [
          'SELECT * FROM users WHERE age > 18;',
          'SELECT name, email FROM customers ORDER BY name;',
          'SELECT COUNT(*) FROM orders WHERE status = \'completed\';'
        ],
        moduleId: 'test-module-5'
      },
      'SQL Quiz - Valid Queries'
    );

    await new Promise(resolve => setTimeout(resolve, 500));

    // Test 8: SQL Quiz - Invalid Queries
    await testEndpoint(
      '/games/sql-quiz',
      'POST',
      {
        answers: [
          'GET * FROM users',
          'SELECT FROM',
          'invalid query'
        ],
        moduleId: 'test-module-6'
      },
      'SQL Quiz - Invalid Queries'
    );

    await new Promise(resolve => setTimeout(resolve, 500));

    // Test 9: Game Stats
    await testEndpoint(
      '/games/stats',
      'GET',
      null,
      'Game Statistics'
    );

    await new Promise(resolve => setTimeout(resolve, 500));

    // Test 10: Leaderboard
    await testEndpoint(
      '/games/leaderboard/coding',
      'GET',
      null,
      'Leaderboard - Coding Games'
    );

    console.log('\n' + '='.repeat(60));
    console.log('ALL TESTS COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log('\nSummary:');
    console.log('- Code Execution: Working');
    console.log('- Network Builder: Working');
    console.log('- Threat Detection: Working');
    console.log('- SQL Quiz: Working');
    console.log('- Game Stats: Working');
    console.log('- Leaderboard: Working');
    console.log('\nGames system is fully functional!');
    
  } catch (err) {
    console.error('\nTest suite failed:', err.message);
    process.exit(1);
  }
}

// Run the tests
runAllTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
