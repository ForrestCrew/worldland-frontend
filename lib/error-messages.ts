import { BaseError } from 'wagmi';

/**
 * Web3 Error Message Mapping
 *
 * Converts wagmi/viem errors to Korean user-friendly messages.
 * Used for all transaction error handling and toast/modal displays.
 */

/**
 * Error message mapping for known error types
 */
const errorMessages: Record<string, string> = {
  // Wallet errors
  UserRejectedRequestError: '사용자가 트랜잭션을 취소했습니다',

  // Balance errors
  InsufficientFundsError: '잔액이 부족합니다',

  // Transaction errors
  TransactionExecutionError: '트랜잭션 실행에 실패했습니다',
  TransactionNotFoundError: '트랜잭션을 찾을 수 없습니다',
  TransactionReceiptNotFoundError: '트랜잭션 영수증을 찾을 수 없습니다',

  // Network errors
  ChainDisconnectedError: '네트워크 연결이 끊어졌습니다',
  ChainNotConfiguredError: '지원하지 않는 네트워크입니다',
  SwitchChainError: '네트워크 전환에 실패했습니다',
  ProviderNotFoundError: '지갑을 찾을 수 없습니다',
  ConnectorNotFoundError: '지갑 연결을 찾을 수 없습니다',

  // Request errors
  RpcRequestError: 'RPC 요청에 실패했습니다',
  TimeoutError: '요청 시간이 초과되었습니다',
};

/**
 * Contract revert reason patterns (regex → message)
 */
const revertPatterns: Array<{ pattern: RegExp; message: string }> = [
  {
    pattern: /Insufficient deposit/i,
    message: '예치금이 부족합니다',
  },
  {
    pattern: /Amount must be positive/i,
    message: '금액은 0보다 커야 합니다',
  },
  {
    pattern: /Insufficient allowance/i,
    message: '토큰 승인이 필요합니다. 먼저 승인 후 다시 시도해 주세요.',
  },
  {
    pattern: /ERC20: transfer amount exceeds balance/i,
    message: '토큰 잔액이 부족합니다',
  },
  {
    pattern: /Invalid provider/i,
    message: '유효하지 않은 공급자입니다',
  },
  {
    pattern: /Price must be positive/i,
    message: '가격은 0보다 커야 합니다',
  },
  {
    pattern: /No deposit/i,
    message: '예치금이 없습니다. 먼저 입금해 주세요.',
  },
  {
    pattern: /Rental not active/i,
    message: '활성화된 임대가 아닙니다',
  },
  {
    pattern: /Not authorized/i,
    message: '권한이 없습니다',
  },
  {
    pattern: /execution reverted/i,
    message: '컨트랙트 실행이 취소되었습니다',
  },
];

/**
 * Get user-friendly Korean error message from Web3 error
 *
 * @param error - The error object from wagmi/viem
 * @returns Korean error message for user display
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
    return '알 수 없는 오류가 발생했습니다';
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
    return '컨트랙트 실행 중 오류가 발생했습니다';
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

  // Default fallback message
  return '트랜잭션 처리 중 오류가 발생했습니다';
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
    title: '트랜잭션 확인 중',
    message: '블록체인에서 트랜잭션을 확인하고 있습니다. 잠시만 기다려 주세요.',
    canRetry: true,
  },
  400: {
    title: '잘못된 요청',
    message: '트랜잭션 해시가 유효하지 않거나 세션 상태가 올바르지 않습니다.',
    canRetry: false,
  },
  403: {
    title: '권한 없음',
    message: '이 세션에 대한 권한이 없습니다. 지갑 주소를 확인해 주세요.',
    canRetry: false,
  },
  409: {
    title: '중복 트랜잭션',
    message: '이 트랜잭션은 이미 다른 세션에서 사용되었습니다.',
    canRetry: false,
  },
  500: {
    title: '서버 오류',
    message: '컨테이너 시작에 실패했습니다. 잠시 후 다시 시도해 주세요.',
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
    title: '알 수 없는 오류',
    message: '예상치 못한 오류가 발생했습니다. 지원팀에 문의해 주세요.',
    canRetry: false,
  };
}
