'use client';

/**
 * Rental Utility Functions
 *
 * Provides retry logic and types for the 2-phase rental flow:
 * 1. Blockchain transaction (contract startRental/stopRental)
 * 2. Hub API call (notify Hub of blockchain event)
 *
 * The Hub API call may fail during the 15-30s blockchain lag window
 * (Hub hasn't processed the blockchain event yet). Retry with backoff
 * handles this gracefully.
 */

/**
 * Rental stages for 2-phase start flow
 *
 * Lifecycle:
 * 1. idle       - Initial state, waiting for user action
 * 2. blockchain - Contract transaction in progress (wallet → pending → confirmed)
 * 3. hub        - Calling Hub API with retry
 * 4. complete   - Both phases successful
 * 5. error      - Something failed
 */
export type RentalStage = 'idle' | 'blockchain' | 'hub' | 'complete' | 'error';

/**
 * SSH credentials returned from Hub API after successful rental start
 */
export interface SSHCredentials {
  /** SSH server hostname or IP */
  sshHost: string;
  /** SSH port number */
  sshPort: number;
  /** SSH username for login */
  sshUser: string;
  /** SSH password for authentication */
  sshPassword: string;
}

/**
 * Options for retryWithBackoff
 */
export interface RetryOptions {
  /** Maximum number of retry attempts (default: 6) */
  maxRetries?: number;
  /** Delay between retries in milliseconds (default: 5000) */
  delayMs?: number;
  /** Function to determine if error is retryable */
  shouldRetry?: (error: Error) => boolean;
}

/**
 * Retry a function with fixed delay backoff
 *
 * Default configuration: 6 retries * 5s = 30s max wait
 * This covers the expected blockchain lag window (15-30s).
 *
 * @param fn - Async function to retry
 * @param options - Retry configuration
 * @returns Result of successful function call
 * @throws Last error if all retries exhausted
 *
 * @example
 * const session = await retryWithBackoff(
 *   () => hubApi.startRental(rentalId),
 *   { shouldRetry: isRetryableHubError }
 * );
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 6,
    delayMs = 5000,
    shouldRetry = () => true,
  } = options;

  let lastError: Error = new Error('Retry failed');

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err as Error;

      // Don't retry if error is not retryable or we're out of retries
      if (!shouldRetry(lastError) || i === maxRetries - 1) {
        throw lastError;
      }

      // Wait before next retry
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError;
}

/**
 * Check if a Hub API error is retryable
 *
 * Retryable errors indicate the Hub hasn't processed the blockchain
 * event yet (typically 404 or specific retry indicators).
 *
 * @param error - Error from Hub API call
 * @returns true if should retry, false if terminal error
 *
 * @example
 * const session = await retryWithBackoff(
 *   () => hubApi.startRental(rentalId),
 *   { shouldRetry: isRetryableHubError }
 * );
 */
export function isRetryableHubError(error: Error): boolean {
  const message = error.message.toLowerCase();

  // 404 means Hub hasn't processed blockchain event yet
  if (message.includes('404') || message.includes('not found')) {
    return true;
  }

  // Explicit retry indicator from Hub
  if (message.includes('retry') || message.includes('not ready')) {
    return true;
  }

  // Network errors are retryable
  if (message.includes('network') || message.includes('timeout')) {
    return true;
  }

  // Server errors (5xx) are retryable
  if (message.includes('500') || message.includes('502') || message.includes('503')) {
    return true;
  }

  // All other errors are terminal
  return false;
}

/**
 * Stage-specific status messages (Korean)
 */
export const rentalStageMessages: Record<RentalStage, string> = {
  idle: '대기 중',
  blockchain: '블록체인 트랜잭션 처리 중...',
  hub: 'GPU 연결 준비 중...',
  complete: '완료!',
  error: '오류 발생',
};

/**
 * Check if rental stage is terminal (complete or error)
 */
export function isTerminalStage(stage: RentalStage): boolean {
  return stage === 'complete' || stage === 'error';
}

/**
 * Check if rental stage is in progress (not idle or terminal)
 */
export function isStageInProgress(stage: RentalStage): boolean {
  return stage !== 'idle' && !isTerminalStage(stage);
}
