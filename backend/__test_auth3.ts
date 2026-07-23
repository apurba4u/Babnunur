import { betterAuth } from 'better-auth';
import { memoryAdapter } from 'better-auth/adapters/memory';

const auth = betterAuth({
  database: memoryAdapter(),
  baseURL: 'http://localhost:5001',
  basePath: '/api/v1/auth',
  secret: 'this-is-a-test-secret-that-is-at-least-32-chars-long!',
  emailAndPassword: { enabled: true, requireEmailVerification: false },
});

async function test() {
  const url = 'http://localhost:5001/api/v1/auth/sign-up';
  const req = new Request(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test@test.com', password: 'Test123!', name: 'Test' }),
  });
  console.log('Sending request to:', url);
  
  // Inspect auth internals
  const authObj = auth as any;
  console.log('Auth options:', JSON.stringify({
    baseURL: authObj.options?.baseURL,
    basePath: authObj.options?.basePath,
  }));
  console.log('Auth context baseURL:', authObj.$context ? (await authObj.$context).baseURL?.substring(0, 60) : 'N/A');
  
  const res = await auth.handler(req);
  const body = await res.text();
  console.log('Status:', res.status);
  console.log('Body:', body.slice(0, 500));
}

test().catch(console.error);
