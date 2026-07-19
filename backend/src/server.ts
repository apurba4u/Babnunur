import app from './app';
import { config } from './config';
import { connectDatabase } from './config/database';
import { ProviderFactory } from './features/ai/providers/factory';

const startServer = async (): Promise<void> => {
  try {
    // Database
    await connectDatabase();
    console.info('✓ MongoDB Connected');

    // Better Auth
    console.info('✓ Better Auth Initialized');

    // AI Providers
    const providers = ProviderFactory.getAvailableProviders();
    if (providers.length > 0) {
      console.info(`✓ AI Providers Loaded: ${providers.map(p => p.name).join(', ')}`);
    } else {
      console.warn('⚠ No AI providers configured (missing API keys)');
    }

    // Server
    app.listen(config.PORT, () => {
      console.info(`✓ Server Running on port ${config.PORT}`);
      console.info(`✓ Environment: ${config.NODE_ENV}`);
      console.info(`✓ API Base URL: ${config.BETTER_AUTH_URL}/api/v1`);
    });
  } catch (error) {
    console.error('✗ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
