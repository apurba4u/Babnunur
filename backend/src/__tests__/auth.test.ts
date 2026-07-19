import { describe, it, expect } from 'vitest';
import { config } from '../config';

describe('Config Validation', () => {
  it('should have required environment variables', () => {
    expect(config.MONGODB_URI).toBeDefined();
    expect(config.BETTER_AUTH_URL).toBeDefined();
    expect(config.BETTER_AUTH_SECRET).toBeDefined();
    expect(config.JWT_SECRET).toBeDefined();
  });

  it('should have default values', () => {
    expect(config.PORT).toBeDefined();
    expect(config.DATABASE_NAME).toBeDefined();
    expect(config.CORS_ORIGIN).toBeDefined();
  });
});
