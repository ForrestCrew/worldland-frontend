'use client';

import { useCallback } from 'react';
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi';
import { parseEther } from 'viem';
import {
  WorldlandRentalABI,
  RENTAL_CONTRACT_ADDRESS,
} from '@/lib/contracts/WorldlandRental';
import { getErrorMessage } from '@/lib/error-messages';
import type { TransactionStatus } from '@/types/transaction';

/**
 * Return type for useWithdraw hook
 */
export interface UseWithdrawReturn {
  /** Execute withdraw transaction */
  withdraw: (amount: string) => Promise<void>;
  /** Current transaction status (6-state) */
  status: TransactionStatus;
  /** Transaction hash once available */
  hash: `0x${string}` | undefined;
  /** Error object if transaction failed */
  error: Error | null;
  /** Korean translated error message */
  errorMessage: string | null;
  /** Reset hook state to idle */
  reset: () => void;
}

/**
 * Hook for withdrawing tokens from WorldlandRental contract
 *
 * Implements 6-state transaction feedback per RESEARCH.md Pattern 1:
 * idle → wallet → pending → confirmed → success → fail
 *
 * Simpler than useDeposit - no ERC20 approve step needed.
 *
 * Features:
 * - Direct withdraw call to contract
 * - 6-state feedback for UI
 * - Korean error messages via getErrorMessage
 *
 * @example
 * const { withdraw, status, hash, errorMessage, reset } = useWithdraw();
 *
 * // Withdraw 1.5 tokens
 * await withdraw("1.5");
 *
 * // Check status for UI feedback
 * if (status === 'wallet') showMessage('지갑에서 서명해 주세요');
 * if (status === 'pending') showMessage('트랜잭션 처리 중...');
 * if (status === 'success') showMessage('출금 완료!');
 */
export function useWithdraw(): UseWithdrawReturn {
  const { address } = useAccount();

  // Write contract hook
  const {
    data: hash,
    isPending: isWalletPending,
    error: writeError,
    writeContract,
    reset: resetWrite,
  } = useWriteContract();

  // Wait for transaction confirmation
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: confirmError,
  } = useWaitForTransactionReceipt({ hash });

  // Derive 6-state status
  const getStatus = (): TransactionStatus => {
    if (writeError || confirmError) return 'fail';
    if (isConfirmed) return 'success';
    if (isConfirming) return 'confirmed';
    if (hash) return 'pending';
    if (isWalletPending) return 'wallet';
    return 'idle';
  };

  const status = getStatus();

  /**
   * Withdraw tokens from contract
   */
  const withdraw = useCallback(
    async (amount: string) => {
      if (!address) {
        throw new Error('지갑이 연결되지 않았습니다');
      }

      const amountWei = parseEther(amount);

      writeContract({
        address: RENTAL_CONTRACT_ADDRESS,
        abi: WorldlandRentalABI,
        functionName: 'withdraw',
        args: [amountWei],
      });
    },
    [address, writeContract]
  );

  /**
   * Reset hook state
   */
  const reset = useCallback(() => {
    resetWrite();
  }, [resetWrite]);

  // Combined error
  const error = writeError || confirmError || null;
  const errorMessage = error ? getErrorMessage(error) : null;

  return {
    withdraw,
    status,
    hash,
    error,
    errorMessage,
    reset,
  };
}
