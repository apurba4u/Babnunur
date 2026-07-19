import { betterAuth } from 'better-auth';
import { config } from './index';

export const auth = betterAuth({
  baseURL: config.BETTER_AUTH_URL,
  basePath: '/api/v1/auth',
  secret: config.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  socialProviders: {
    google: {
      clientId: config.GOOGLE_CLIENT_ID || '',
      clientSecret: config.GOOGLE_CLIENT_SECRET || '',
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
});
