import { betterAuth } from 'better-auth';
import { memoryAdapter } from 'better-auth/adapters/memory';
import { betterAuth as betterAuthFull } from 'better-auth';
import { getEndpoints } from 'better-auth/dist/api/index.mjs';

const auth = betterAuthFull({
  database: memoryAdapter(),
  baseURL: 'http://localhost:5001',
  basePath: '/api/v1/auth',
  secret: 'this-is-a-test-secret-that-is-at-least-32-chars-long!',
  emailAndPassword: { enabled: true, requireEmailVerification: false },
});

async function test() {
  const ctx = await auth.$context;
  
  // Check the API endpoints
  const endpoints = getEndpoints(ctx, auth.options);
  console.log('Available endpoints:');
  for (const [key, ep] of Object.entries(endpoints.api)) {
    if (ep && typeof ep === 'object' && 'path' in ep) {
      console.log(`  ${key}: path="${(ep as any).path}", method="${JSON.stringify((ep as any).options?.method)}"`);
    }
  }
  console.log('Api keys:', Object.keys(endpoints.api).join(', '));
  
  // Also check the options base path
  console.log('\nContext checks:');
  console.log('options.baseURL:', ctx.options.baseURL);
  console.log('options.basePath:', ctx.options.basePath);
  console.log('ctx.baseURL:', ctx.baseURL);
}

test().catch(console.error);
