import { BaseError } from 'wagmi';

/**
 * Web3 Error Message Mapping
 *
 * Converts wagmi/viem errors to user-friendly messages.
 * Used for all transaction error handling and toast/modal displays.
 */

/**
 * Error message mapping for known error types
 */
const errorMessages: Record<string, string> = {
  // Wallet errors
  UserRejectedRequestError: 'Transaction was cancelled by user',

  // Balance errors
  InsufficientFundsError: 'Insufficient balance',

  // Transaction errors
  TransactionExecutionError: 'Transaction execution failed',
  TransactionNotFoundError: 'Transaction not found',
  TransactionReceiptNotFoundError: 'Transaction receipt not found',

  // Network errors
  ChainDisconnectedError: 'Network connection lost',
  ChainNotConfiguredError: 'Unsupported network',
  SwitchChainError: 'Failed to switch network',
  ProviderNotFoundError: 'Wallet not found',
  ConnectorNotFoundError: 'Wallet connection not found',

  // Request errors
  RpcRequestError: 'RPC request failed',
  TimeoutError: 'Request timed out',
};

/**
 * Contract revert reason patterns (regex → message)
 */
const revertPatterns: Array<{ pattern: RegExp; message: string }> = [
  {
    pattern: /Insufficient deposit/i,
    message: 'Insufficient deposit',
  },
  {
    pattern: /Amount must be positive/i,
    message: 'Amount must be greater than 0',
  },
  {
    pattern: /Insufficient allowance/i,
    message: 'Token approval required. Please approve first and try again.',
  },
  {
    pattern: /ERC20: transfer amount exceeds balance/i,
    message: 'Insufficient token balance',
  },
  {
    pattern: /Invalid provider/i,
    message: 'Invalid provider',
  },
  {
    pattern: /Price must be positive/i,
    message: 'Price must be greater than 0',
  },
  {
    pattern: /No deposit/i,
    message: 'No deposit found. Please deposit first.',
  },
  {
    pattern: /Rental not active/i,
    message: 'Rental is not active',
  },
  {
    pattern: /Not authorized/i,
    message: 'Not authorized',
  },
  {
    pattern: /execution reverted/i,
    message: 'Contract execution reverted',
  },
];

/**
 * Get user-friendly error message from Web3 error
 *
 * @param error - The error object from wagmi/viem
 * @returns Error message for user display
 *
 * @example
 * try {
 *   await writeContract(...);
 * } catch (error) {
 *   toast.error(getErrorMessage(error));
 * }
 */
export function getErrorMessage(error: unknown): string {
  if (!error) {
    return 'An unknown error occurred';
  }

  // Cast to BaseError for type safety
  const baseError = error as BaseError;

  // Check by error name first
  if (baseError.name && errorMessages[baseError.name]) {
    return errorMessages[baseError.name];
  }

  // For ContractFunctionExecutionError, check revert reasons in message
  if (
    baseError.name === 'ContractFunctionExecutionError' ||
    baseError.name === 'ContractFunctionRevertedError'
  ) {
    const errorMessage = baseError.message || '';

    for (const { pattern, message } of revertPatterns) {
      if (pattern.test(errorMessage)) {
        return message;
      }
    }

    // Default contract error message
    return 'Contract execution error';
  }

  // Try to use shortMessage if available
  if (baseError.shortMessage) {
    // Check if shortMessage matches any known pattern
    for (const { pattern, message } of revertPatterns) {
      if (pattern.test(baseError.shortMessage)) {
        return message;
      }
    }
    // Return shortMessage if it looks user-friendly (not too technical)
    if (
      baseError.shortMessage.length < 100 &&
      !baseError.shortMessage.includes('0x')
    ) {
      return baseError.shortMessage;
    }
  }

  // For plain Error objects (e.g., Hub API errors like 409),
  // use message directly if it looks user-friendly
  if (error instanceof Error && error.message) {
    const msg = error.message;
    if (msg.length < 200 && !msg.includes('0x') && !msg.includes('stack')) {
      return msg;
    }
  }

  // Default fallback message
  return 'An error occurred while processing the transaction';
}

/**
 * Check if error is a user rejection (not a failure)
 *
 * @param error - The error object
 * @returns true if user explicitly rejected the transaction
 */
export function isUserRejection(error: unknown): boolean {
  if (!error) return false;
  const baseError = error as BaseError;
  return baseError.name === 'UserRejectedRequestError';
}

/**
 * Check if error is due to insufficient funds
 *
 * @param error - The error object
 * @returns true if error is related to insufficient balance
 */
export function isInsufficientFunds(error: unknown): boolean {
  if (!error) return false;
  const baseError = error as BaseError;

  if (baseError.name === 'InsufficientFundsError') {
    return true;
  }

  const message = baseError.message || '';
  return (
    /insufficient/i.test(message) ||
    /exceeds balance/i.test(message)
  );
}

/**
 * Check if error is a network error that might be temporary
 *
 * @param error - The error object
 * @returns true if error is network-related and might resolve with retry
 */
export function isNetworkError(error: unknown): boolean {
  if (!error) return false;
  const baseError = error as BaseError;

  return [
    'ChainDisconnectedError',
    'RpcRequestError',
    'TimeoutError',
    'ProviderNotFoundError',
  ].includes(baseError.name || '');
}

/**
 * ADR-001 confirmation error mapping
 * Maps backend error responses to user-friendly messages with actionable guidance
 *
 * Status codes from Phase 14 backend:
 * - 202: Transaction verification in progress (retry expected)
 * - 400: Invalid txHash format or session not in PENDING state
 * - 403: User not authorized for session
 * - 409: txHash already used by another session
 * - 500: Server/container provisioning error
 */
export const confirmationErrorMessages: Record<number, {
  title: string;
  message: string;
  canRetry: boolean;
}> = {
  202: {
    title: 'Verifying Transaction',
    message: 'Verifying transaction on blockchain. Please wait.',
    canRetry: true,
  },
  400: {
    title: 'Invalid Request',
    message: 'Transaction hash is invalid or session state is incorrect.',
    canRetry: false,
  },
  403: {
    title: 'Unauthorized',
    message: 'You do not have permission for this session. Please check your wallet address.',
    canRetry: false,
  },
  409: {
    title: 'Duplicate Transaction',
    message: 'This transaction has already been used by another session.',
    canRetry: false,
  },
  500: {
    title: 'Server Error',
    message: 'Failed to start container. Please try again later.',
    canRetry: true,
  },
};

/**
 * Get user-friendly error message for confirmation status
 */
export function getConfirmationErrorMessage(status: number): {
  title: string;
  message: string;
  canRetry: boolean;
} {
  return confirmationErrorMessages[status] || {
    title: 'Unknown Error',
    message: 'An unexpected error occurred. Please contact support.',
    canRetry: false,
  };
}

/**
 * Session extension error mapping
 * Maps backend error codes to user-friendly messages
 *
 * Error codes:
 * - EXT_001: Session not found
 * - EXT_002: Insufficient balance
 * - EXT_003: Session not in RUNNING state
 * - EXT_004: Maximum extensions reached (10)
 */
export const EXTENSION_ERROR_MESSAGES: Record<string, string> = {
  EXT_001: 'Session not found',
  EXT_002: 'Insufficient balance. Please deposit more and try again.',
  EXT_003: 'Only running sessions can be extended',
  EXT_004: 'Maximum extensions reached (10)',
};
