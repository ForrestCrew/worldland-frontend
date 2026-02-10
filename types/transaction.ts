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
  idle: 'Waiting for transaction',
  wallet: 'Waiting for wallet signature...',
  pending: 'Transaction submitted, waiting for block confirmation...',
  confirmed: 'Confirming on blockchain...',
  success: 'Complete!',
  fail: 'Transaction failed',
};

/**
 * Deposit-specific status messages
 */
export const depositStatusMessages: StatusMessages = {
  idle: 'Ready to deposit',
  wallet: 'Waiting for wallet signature...',
  pending: 'Processing deposit transaction...',
  confirmed: 'Confirming on blockchain...',
  success: 'Deposit complete!',
  fail: 'Deposit failed',
};

/**
 * Withdraw-specific status messages
 */
export const withdrawStatusMessages: StatusMessages = {
  idle: 'Ready to withdraw',
  wallet: 'Waiting for wallet signature...',
  pending: 'Processing withdrawal transaction...',
  confirmed: 'Confirming on blockchain...',
  success: 'Withdrawal complete!',
  fail: 'Withdrawal failed',
};

/**
 * Approval-specific status messages (for ERC20 approve)
 */
export const approvalStatusMessages: StatusMessages = {
  idle: 'Ready for approval',
  wallet: 'Please sign the token approval in your wallet...',
  pending: 'Processing approval transaction...',
  confirmed: 'Confirming on blockchain...',
  success: 'Token approval complete!',
  fail: 'Token approval failed',
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
