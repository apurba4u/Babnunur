import app from './app';
import { config } from './config';
import { connectDatabase } from './config/database';
import { ProviderFactory } from './features/ai/providers/factory';

const startServer = async (): Promise<void> => {
  try {
    // Database
    await connectDatabase();
    console.log('✓ MongoDB Connected');

    // Better Auth
    console.log('✓ Better Auth Initialized');

    // AI Providers
    const providers = ProviderFactory.getAvailableProviders();
    if (providers.length > 0) {
      console.log(`✓ AI Providers Loaded: ${providers.map(p => p.name).join(', ')}`);
    } else {
      console.log('⚠ No AI providers configured (missing API keys)');
    }

    // Server
    app.listen(config.PORT, () => {
      console.log(`✓ Server Running on port ${config.PORT}`);
      console.log(`✓ Environment: ${config.NODE_ENV}`);
      console.log(`✓ API Base URL: ${config.BETTER_AUTH_URL}/api/v1`);
    });
  } catch (error) {
    console.error('✗ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
