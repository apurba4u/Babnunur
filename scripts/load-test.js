const http = require('http');

const BASE_URL = 'http://localhost:5001';
const CONCURRENT_USERS = 50;
const REQUESTS_PER_USER = 10;

async function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const req = http.get(`${BASE_URL}${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, latency: Date.now() - start, data });
      });
    });
    req.on('error', reject);
    req.setTimeout(5000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

async function runLoadTest() {
  console.log(`Starting load test: ${CONCURRENT_USERS} users, ${REQUESTS_PER_USER} requests each`);
  const results = [];
  const start = Date.now();

  const users = Array.from({ length: CONCURRENT_USERS }, (_, i) =>
    Array.from({ length: REQUESTS_PER_USER }, () => makeRequest('/health'))
  );

  const allResults = await Promise.all(users.flat());
  const duration = Date.now() - start;

  const successCount = allResults.filter(r => r.status === 200).length;
  const errorCount = allResults.filter(r => r.status !== 200).length;
  const latencies = allResults.map(r => r.latency);
  const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  const p95 = latencies.sort((a, b) => a - b)[Math.floor(latencies.length * 0.95)];
  const p99 = latencies.sort((a, b) => a - b)[Math.floor(latencies.length * 0.99)];

  console.log(`\nResults:`);
  console.log(`  Total requests: ${allResults.length}`);
  console.log(`  Success: ${successCount}`);
  console.log(`  Errors: ${errorCount}`);
  console.log(`  Duration: ${duration}ms`);
  console.log(`  Requests/sec: ${(allResults.length / (duration / 1000)).toFixed(1)}`);
  console.log(`  Avg latency: ${avgLatency.toFixed(1)}ms`);
  console.log(`  P95 latency: ${p95}ms`);
  console.log(`  P99 latency: ${p99}ms`);
}

runLoadTest().catch(console.error);
