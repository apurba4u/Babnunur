import app from './app';
import { config } from './config';
import { connectDatabase } from './config/database';
import { ProviderFactory } from './features/ai/providers/factory';

const startServer = async (): Promise<void> => {
  try {
    await connectDatabase();
    console.log('✓ MongoDB Connected');
    console.log('✓ Better Auth Initialized');
    const providers = ProviderFactory.getAvailableProviders();
    if (providers.length > 0) {
      console.log(`✓ AI Providers Loaded: ${providers.map(p => p.name).join(', ')}`);
    } else {
      console.log('⚠ No AI providers configured (missing API keys)');
    }
    const server = app.listen(config.PORT, () => {
      console.log(`✓ Server Running on port ${config.PORT}`);
      console.log(`✓ Environment: ${config.NODE_ENV}`);
      console.log(`✓ API Base URL: ${config.BETTER_AUTH_URL}/api/v1`);
    });

    const gracefulShutdown = (signal: string) => {
      console.log(`\n${signal} received. Starting graceful shutdown...`);
      server.close(() => {
        console.log('HTTP server closed.');
        process.exit(0);
      });
      setTimeout(() => {
        console.error('Forced shutdown after timeout.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
