'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
} from 'wagmi';
import { parseEther, maxUint256, erc20Abi } from 'viem';
import {
  WorldlandRentalABI,
  RENTAL_CONTRACT_ADDRESS,
  PAYMENT_TOKEN_ADDRESS,
} from '@/lib/contracts/WorldlandRental';
import { getErrorMessage } from '@/lib/error-messages';
import type { TransactionStatus } from '@/types/transaction';

/**
 * Return type for useDeposit hook
 */
export interface UseDepositReturn {
  /** Execute deposit transaction (handles approve if needed) */
  deposit: (amount: string) => Promise<void>;
  /** Current transaction status (6-state) */
  status: TransactionStatus;
  /** Transaction hash once available */
  hash: `0x${string}` | undefined;
  /** Error object if transaction failed */
  error: Error | null;
  /** Korean translated error message */
  errorMessage: string | null;
  /** Whether ERC20 approval is needed */
  needsApproval: boolean;
  /** Whether currently in approval phase */
  isApproving: boolean;
  /** Reset hook state to idle */
  reset: () => void;
}

/**
 * Hook for depositing tokens to WorldlandRental contract
 *
 * Implements 6-state transaction feedback per RESEARCH.md Pattern 1:
 * idle → wallet → pending → confirmed → success → fail
 *
 * Features:
 * - Checks ERC20 allowance before deposit
 * - Automatically handles approve step if needed
 * - Uses maxUint256 approval to avoid repeated approvals
 * - Korean error messages via getErrorMessage
 *
 * @example
 * const { deposit, status, hash, errorMessage, needsApproval, reset } = useDeposit();
 *
 * // Deposit 1.5 tokens (handles approve if needed)
 * await deposit("1.5");
 *
 * // Check status for UI feedback
 * if (status === 'wallet') showMessage('지갑에서 서명해 주세요');
 * if (status === 'pending') showMessage('트랜잭션 처리 중...');
 * if (status === 'success') showMessage('입금 완료!');
 */
export function useDeposit(): UseDepositReturn {
  const { address } = useAccount();
  const [isApproving, setIsApproving] = useState(false);
  const [pendingAmount, setPendingAmount] = useState<string | null>(null);

  // Check current allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: PAYMENT_TOKEN_ADDRESS,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [address!, RENTAL_CONTRACT_ADDRESS],
    query: {
      enabled: !!address,
    },
  });

  // Write contract hook for both approve and deposit
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

  // Check if approval is needed for a given amount
  const checkNeedsApproval = (amount: string): boolean => {
    if (!allowance) return true;
    try {
      const amountWei = parseEther(amount);
      return allowance < amountWei;
    } catch {
      return true;
    }
  };

  // Current approval status (based on pending amount or default check)
  const needsApproval = pendingAmount
    ? checkNeedsApproval(pendingAmount)
    : !allowance || allowance === BigInt(0);

  // When approval succeeds, proceed with deposit
  useEffect(() => {
    if (isApproving && isConfirmed && pendingAmount) {
      // Approval confirmed, now do deposit
      setIsApproving(false);
      resetWrite();

      // Small delay to let state settle, then call deposit
      const doDeposit = async () => {
        await refetchAllowance();
        const amountWei = parseEther(pendingAmount);
        writeContract({
          address: RENTAL_CONTRACT_ADDRESS,
          abi: WorldlandRentalABI,
          functionName: 'deposit',
          args: [amountWei],
        });
      };

      doDeposit();
    }
  }, [isApproving, isConfirmed, pendingAmount, resetWrite, writeContract, refetchAllowance]);

  /**
   * Deposit tokens
   * Automatically handles ERC20 approve if allowance is insufficient
   */
  const deposit = useCallback(
    async (amount: string) => {
      if (!address) {
        throw new Error('지갑이 연결되지 않았습니다');
      }

      const amountWei = parseEther(amount);
      setPendingAmount(amount);

      // Check allowance
      const currentAllowance = allowance ?? BigInt(0);

      if (currentAllowance < amountWei) {
        // Step 1: Approve (use maxUint256 to avoid repeated approvals)
        setIsApproving(true);
        writeContract({
          address: PAYMENT_TOKEN_ADDRESS,
          abi: erc20Abi,
          functionName: 'approve',
          args: [RENTAL_CONTRACT_ADDRESS, maxUint256],
        });
      } else {
        // Already approved, proceed with deposit
        setIsApproving(false);
        writeContract({
          address: RENTAL_CONTRACT_ADDRESS,
          abi: WorldlandRentalABI,
          functionName: 'deposit',
          args: [amountWei],
        });
      }
    },
    [address, allowance, writeContract]
  );

  /**
   * Reset hook state
   */
  const reset = useCallback(() => {
    resetWrite();
    setIsApproving(false);
    setPendingAmount(null);
  }, [resetWrite]);

  // Combined error
  const error = writeError || confirmError || null;
  const errorMessage = error ? getErrorMessage(error) : null;

  return {
    deposit,
    status,
    hash,
    error,
    errorMessage,
    needsApproval,
    isApproving,
    reset,
  };
}
