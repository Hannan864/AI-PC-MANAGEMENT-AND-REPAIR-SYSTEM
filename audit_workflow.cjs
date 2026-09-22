
const http = require('http');

async function testEndpoint(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          contentType: res.headers['content-type'],
          data: data.length > 100 ? data.substring(0, 100) + '...' : data
        });
      });
    }).on('error', (err) => {
      resolve({ error: err.message });
    });
  });
}

async function runAudit() {
  console.log('--- Workflow Audit Start ---');

  console.log('\n[1] Testing Backend Services...');
  const backendHealth = await testEndpoint('http://localhost:5000/api/v1/health');
  console.log('Backend /health:', backendHealth);

  const backendPerformance = await testEndpoint('http://localhost:5000/api/v1/performance');
  console.log('Backend /performance:', backendPerformance);

  const backendHardware = await testEndpoint('http://localhost:5000/api/v1/hardware');
  console.log('Backend /hardware:', backendHardware);

  console.log('\n[2] Testing Frontend Server...');
  const frontendIndex = await testEndpoint('http://localhost:3000/');
  console.log('Frontend /:', frontendIndex);

  console.log('\n--- Workflow Audit Complete ---');
}

runAudit();
