/**
 * Transaction State Types for 6-State Feedback UI
 *
 * Tracks the lifecycle of Web3 transactions through distinct states
 * for clear user feedback during deposit/withdraw/rental operations.
 */

/**
 * 6-state transaction status
 *
 * Lifecycle:
 * 1. idle     - Initial state, waiting for user to initiate
 * 2. wallet   - Transaction submitted to wallet, awaiting signature
 * 3. pending  - Signed and submitted to network, in mempool
 * 4. confirmed - Transaction mined, waiting for confirmations
 * 5. success  - Fully confirmed, action completed successfully
 * 6. fail     - Transaction failed or was rejected
 */
export type TransactionStatus =
  | 'idle'
  | 'wallet'
  | 'pending'
  | 'confirmed'
  | 'success'
  | 'fail';

/**
 * Transaction state with hash and error information
 */
export interface TransactionState {
  /** Current transaction status */
  status: TransactionStatus;
  /** Transaction hash once available (after wallet signs) */
  hash: `0x${string}` | undefined;
  /** Error object if transaction failed */
  error: Error | null;
}

/**
 * Status message mapping type
 */
export type StatusMessages = Record<TransactionStatus, string>;

/**
 * Default Korean status messages for transaction feedback
 *
 * Used in TransactionStatus component and modals
 */
export const defaultStatusMessages: StatusMessages = {
  idle: '거래 대기 중',
  wallet: '지갑에서 서명을 기다리는 중...',
  pending: '트랜잭션 제출됨, 블록 확인 대기 중...',
  confirmed: '블록 확인 중...',
  success: '완료!',
  fail: '트랜잭션 실패',
};

/**
 * Deposit-specific status messages
 */
export const depositStatusMessages: StatusMessages = {
  idle: '입금 준비 중',
  wallet: '지갑에서 서명을 기다리는 중...',
  pending: '입금 트랜잭션 처리 중...',
  confirmed: '블록 확인 중...',
  success: '입금 완료!',
  fail: '입금 실패',
};

/**
 * Withdraw-specific status messages
 */
export const withdrawStatusMessages: StatusMessages = {
  idle: '출금 준비 중',
  wallet: '지갑에서 서명을 기다리는 중...',
  pending: '출금 트랜잭션 처리 중...',
  confirmed: '블록 확인 중...',
  success: '출금 완료!',
  fail: '출금 실패',
};

/**
 * Approval-specific status messages (for ERC20 approve)
 */
export const approvalStatusMessages: StatusMessages = {
  idle: '승인 준비 중',
  wallet: '토큰 승인을 위해 지갑에서 서명해 주세요...',
  pending: '승인 트랜잭션 처리 중...',
  confirmed: '블록 확인 중...',
  success: '토큰 승인 완료!',
  fail: '토큰 승인 실패',
};

/**
 * Initial transaction state
 */
export const initialTransactionState: TransactionState = {
  status: 'idle',
  hash: undefined,
  error: null,
};

/**
 * Check if transaction is in a terminal state
 */
export function isTerminalStatus(status: TransactionStatus): boolean {
  return status === 'success' || status === 'fail';
}

/**
 * Check if transaction is in progress (not idle or terminal)
 */
export function isInProgress(status: TransactionStatus): boolean {
  return status !== 'idle' && !isTerminalStatus(status);
}
