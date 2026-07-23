import mongoose from 'mongoose';
import { config } from './index';

const AUTH_BASE_PATH = '/api/v1/auth';

let _auth: any = null;

export async function getAuth() {
  if (!_auth) {
    const [betterAuthModule, mongodbAdapterModule] = await Promise.all([
      import('better-auth'),
      import('better-auth/adapters/mongodb'),
    ]);
    const db = mongoose.connection.getClient().db(config.DATABASE_NAME);
    _auth = betterAuthModule.betterAuth({
      database: mongodbAdapterModule.mongodbAdapter(db),
      baseURL: `${config.BETTER_AUTH_URL}${AUTH_BASE_PATH}`,
      basePath: AUTH_BASE_PATH,
          trustedOrigins: [
            ...config.CORS_ORIGIN.split(',').map(o => o.trim()),
            config.BETTER_AUTH_URL,
          ],
      secret: config.BETTER_AUTH_SECRET,
      account: {
        storeStateStrategy: 'cookie',
      },
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
        expiresIn: 60 * 60 * 24 * 7,
        updateAge: 60 * 60 * 24,
      },
    } as any);
  }
  return _auth!;
}
