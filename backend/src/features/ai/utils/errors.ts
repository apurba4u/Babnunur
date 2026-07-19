export class AIProviderError extends Error {
  constructor(
    message: string,
    public provider: string,
    public code: string,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'AIProviderError';
  }
}

export class AITimeoutError extends AIProviderError {
  constructor(provider: string) {
    super('Request timed out', provider, 'TIMEOUT', true);
    this.name = 'AITimeoutError';
  }
}

export class AIRateLimitError extends AIProviderError {
  constructor(provider: string) {
    super('Rate limit exceeded', provider, 'RATE_LIMITED', true);
    this.name = 'AIRateLimitError';
  }
}

export class AIConfigError extends AIProviderError {
  constructor(provider: string, message: string) {
    super(message, provider, 'CONFIG_ERROR', false);
    this.name = 'AIConfigError';
  }
}
