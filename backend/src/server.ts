import mongoose from 'mongoose';
import app from './app';
import { config } from './config';
import { connectDatabase } from './config/database';
import { getAuth } from './config/auth';
import { ProviderFactory } from './features/ai/providers/factory';
import { EmbeddingFactory } from './features/embeddings/providers/factory';
import { User } from './features/users/models/user.model';
import { PlanModel } from './features/billing/models/billing.model';

const startServer = async (): Promise<void> => {
  try {
    await connectDatabase();
    console.log('✓ MongoDB Connected');

    await getAuth();
    console.log('✓ Better Auth Initialized');

    ProviderFactory.initialize();
    const providers = ProviderFactory.getAvailableProviders();
    if (providers.length > 0) {
      console.log(`✓ AI Providers Loaded: ${providers.map(p => p.name).join(', ')}`);
    } else {
      console.log('⚠ No AI providers configured (missing API keys)');
    }

    EmbeddingFactory.initialize();
    const embeddingProviders = EmbeddingFactory.getAvailableProviders();
    console.log(`✓ Embedding Providers Loaded: ${embeddingProviders.join(', ')}`);

    // Seed default admin account
    try {
      const existingAdmin = await User.findOne({ email: 'admin@babnunur.com' });
      if (!existingAdmin) {
        const adminPassword = 'Admin@123456';
        const auth = await getAuth();
        await auth.api.signUpEmail({
          body: { name: 'Admin', email: 'admin@babnunur.com', password: adminPassword },
        });
        const adminUser = await User.findOne({ email: 'admin@babnunur.com' });
        if (adminUser) {
          adminUser.role = 'admin';
          await adminUser.save();
        }
        console.log('✓ Default admin account created (admin@babnunur.com / Admin@123456)');
      } else if (existingAdmin.role !== 'admin') {
        existingAdmin.role = 'admin';
        await existingAdmin.save();
        console.log('✓ Existing user promoted to admin role');
      } else {
        console.log('✓ Admin account exists');
      }
    } catch (seedError) {
      console.warn('⚠ Could not seed admin account:', (seedError as Error).message);
    }

    // Seed default billing plans
    try {
      const existingPlans = await PlanModel.countDocuments();
      if (existingPlans === 0) {
        await PlanModel.insertMany([
          { id: 'free', name: 'Free', description: 'Get started with basic AI features', price: 0, currency: 'USD', interval: 'monthly', features: ['Basic AI chat', 'Standard response speed', 'Community support'], limits: { requests: 100, tokens: 50000, documents: 5 } },
          { id: 'basic', name: 'Basic', description: 'For casual users who need more', price: 9.99, currency: 'USD', interval: 'monthly', features: ['Enhanced AI chat', 'Faster response speed', 'Email support', 'File uploads'], limits: { requests: 1000, tokens: 500000, documents: 20 } },
          { id: 'pro', name: 'Pro', description: 'For power users and small teams', price: 29.99, currency: 'USD', interval: 'monthly', features: ['Priority AI access', 'Advanced models', 'Priority support', 'File & image uploads', 'Extended context window'], limits: { requests: 10000, tokens: 5000000, documents: 100 } },
          { id: 'enterprise', name: 'Enterprise', description: 'For organizations with advanced needs', price: 99.99, currency: 'USD', interval: 'monthly', features: ['All Pro features', 'Custom AI models', 'Dedicated support', 'API access', 'Custom integrations', 'SLA guarantee'], limits: { requests: 0, tokens: 0, documents: 0 } },
        ]);
        console.log('✓ Default billing plans seeded');
      } else {
        console.log(`✓ ${existingPlans} billing plans exist`);
      }
    } catch (planError) {
      console.warn('⚠ Could not seed plans:', (planError as Error).message);
    }

    if (process.env.VERCEL !== '1') {
      const server = app.listen(config.PORT, () => {
        console.log(`✓ Server Running on port ${config.PORT}`);
        console.log(`✓ Environment: ${config.NODE_ENV}`);
        console.log(`✓ API Base URL: ${config.BETTER_AUTH_URL}/api/v1`);
      });

      server.on('error', (err: NodeJS.ErrnoException) => {
        console.error('Server error:', err);
      });

      const gracefulShutdown = async (signal: string) => {
        console.log(`\n${signal} received. Starting graceful shutdown...`);
        server.close(() => {
          console.log('✓ HTTP server closed.');
        });
        await mongoose.disconnect();
        console.log('✓ MongoDB disconnected.');
      };

      process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
      process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    } else {
      console.log('✓ Running on Vercel — serverless mode');
    }
  } catch (error) {
    console.error('Failed to start server:', error);
  }
};

startServer();
