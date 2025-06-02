import logger from './logger';

export enum AIErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  API_ERROR = 'API_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  MALICIOUS_CONTENT = 'MALICIOUS_CONTENT',
  GENERATION_FAILED = 'GENERATION_FAILED',
  INVALID_OUTPUT = 'INVALID_OUTPUT'
}

export class AIGenerationError extends Error {
  constructor(
    public type: AIErrorType,
    message: string,
    public details?: unknown,
    public isRetryable: boolean = false
  ) {
    super(message);
    this.name = 'AIGenerationError';
  }
}

export interface ErrorRecoveryStrategy {
  maxRetries: number;
  retryDelay: number;
  backoffMultiplier: number;
  shouldRetry: (error: AIGenerationError, attempt: number) => boolean;
  onRetry?: (error: AIGenerationError, attempt: number) => void;
}

const defaultRecoveryStrategy: ErrorRecoveryStrategy = {
  maxRetries: 3,
  retryDelay: 1000,
  backoffMultiplier: 2,
  shouldRetry: (error, attempt) => {
    return error.isRetryable && attempt < 3;
  }
};

export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context: string,
  strategy: Partial<ErrorRecoveryStrategy> = {}
): Promise<T> {
  const recoveryStrategy = { ...defaultRecoveryStrategy, ...strategy };
  let lastError: AIGenerationError | null = null;
  
  for (let attempt = 0; attempt <= recoveryStrategy.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = normalizeError(error, context);
      
      logger.error(`AI operation failed: ${context}`, error instanceof Error ? error : null, {
        attempt,
        errorType: lastError.type,
        isRetryable: lastError.isRetryable
      });
      
      if (!recoveryStrategy.shouldRetry(lastError, attempt)) {
        break;
      }
      
      if (recoveryStrategy.onRetry) {
        recoveryStrategy.onRetry(lastError, attempt);
      }
      
      // Exponential backoff
      const delay = recoveryStrategy.retryDelay * Math.pow(recoveryStrategy.backoffMultiplier, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError || new AIGenerationError(
    AIErrorType.GENERATION_FAILED,
    'Operation failed after all retry attempts'
  );
}

function normalizeError(error: unknown, context: string): AIGenerationError {
  if (error instanceof AIGenerationError) {
    return error;
  }
  
  // Type guard to check if error has expected properties
  const errorObj = error as { status?: number; code?: string; response?: { status?: number }; message?: string };
  
  // OpenAI specific errors
  if (errorObj?.status === 429 || errorObj?.code === 'rate_limit_exceeded') {
    return new AIGenerationError(
      AIErrorType.RATE_LIMIT_ERROR,
      'Rate limit exceeded. Please try again later.',
      { originalError: error },
      true
    );
  }
  
  if (errorObj?.status === 401 || errorObj?.code === 'invalid_api_key') {
    return new AIGenerationError(
      AIErrorType.API_ERROR,
      'Authentication failed. Please check API credentials.',
      { originalError: error },
      false
    );
  }
  
  if (errorObj?.code === 'ETIMEDOUT' || errorObj?.code === 'ECONNABORTED') {
    return new AIGenerationError(
      AIErrorType.TIMEOUT_ERROR,
      'Request timed out. Please try again.',
      { originalError: error },
      true
    );
  }
  
  if (errorObj?.response?.status && errorObj.response.status >= 500) {
    return new AIGenerationError(
      AIErrorType.API_ERROR,
      'AI service temporarily unavailable.',
      { originalError: error },
      true
    );
  }
  
  // Default error
  const message = errorObj?.message || `Unknown error in ${context}`;
  return new AIGenerationError(
    AIErrorType.GENERATION_FAILED,
    message,
    { originalError: error },
    false
  );
}

// Circuit breaker implementation
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime: number | null = null;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  constructor(
    private threshold: number = 5,
    private timeout: number = 60000, // 1 minute
    private resetTimeout: number = 300000 // 5 minutes
  ) {}
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - (this.lastFailureTime || 0) > this.timeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new AIGenerationError(
          AIErrorType.API_ERROR,
          'Service temporarily unavailable due to repeated failures',
          { circuitState: this.state },
          false
        );
      }
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
    this.lastFailureTime = null;
  }
  
  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
      logger.error('Circuit breaker opened due to repeated failures', null, {
        failures: this.failures,
        threshold: this.threshold
      });
    }
  }
  
  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime
    };
  }
}