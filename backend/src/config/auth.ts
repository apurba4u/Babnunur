import { betterAuth } from 'better-auth';
import { config } from './index';

export const auth = betterAuth({
  baseURL: config.BETTER_AUTH_URL,
  secret: config.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  socialProviders: {
    google: {
      clientId: config.GOOGLE_OAUTH_CLIENT_ID || '',
      clientSecret: config.GOOGLE_OAUTH_CLIENT_SECRET || '',
    },
  },
});
