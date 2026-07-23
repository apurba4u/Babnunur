import { betterAuth } from 'better-auth';
import { memoryAdapter } from 'better-auth/adapters/memory';

async function test() {
  // Test 1: baseURL without path
  const auth1 = betterAuth({
    database: memoryAdapter(),
    baseURL: 'http://localhost:5001',
    basePath: '/api/v1/auth',
    secret: 'this-is-a-test-secret-that-is-at-least-32-chars-long!',
    emailAndPassword: { enabled: true, requireEmailVerification: false },
  });

  // Test 1a: URL with full path matching basePath
  let url = 'http://localhost:5001/api/v1/auth/sign-up';
  let req = new Request(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test@test.com', password: 'Test123!', name: 'Test' }),
  });
  console.log('Test 1a: baseURL=origin, URL includes basePath');
  let res = await auth1.handler(req);
  let body = await res.text();
  console.log('Status:', res.status, 'Body:', body.slice(0, 200));

  // Test 2: baseURL with path
  const auth2 = betterAuth({
    database: memoryAdapter(),
    baseURL: 'http://localhost:5001/api/v1/auth',
    basePath: '/api/v1/auth',
    secret: 'this-is-a-test-secret-that-is-at-least-32-chars-long!',
    emailAndPassword: { enabled: true, requireEmailVerification: false },
  });

  // Test 2a: URL with full path matching basePath
  url = 'http://localhost:5001/api/v1/auth/sign-up';
  req = new Request(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test@test.com', password: 'Test123!', name: 'Test' }),
  });
  console.log('\nTest 2a: baseURL=origin+path, URL includes basePath');
  res = await auth2.handler(req);
  body = await res.text();
  console.log('Status:', res.status, 'Body:', body.slice(0, 200));

  // Test 3: URL without path (starts with /)
  url = 'http://localhost:5001/sign-up';
  req = new Request(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test@test.com', password: 'Test123!', name: 'Test' }),
  });
  console.log('\nTest 3: URL without basePath prefix');
  res = await auth2.handler(req);
  body = await res.text();
  console.log('Status:', res.status, 'Body:', body.slice(0, 200));

  // Test 4: URL with just origin + path
  url = 'http://localhost:5001/api/auth/sign-up';
  req = new Request(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test@test.com', password: 'Test123!', name: 'Test' }),
  });
  console.log('\nTest 4: URL with default basePath (/api/auth)');
  res = await auth1.handler(req);
  body = await res.text();
  console.log('Status:', res.status, 'Body:', body.slice(0, 200));
}

test().catch(console.error);
