'use client';

import { useCallback, useState, useEffect, useRef } from 'react';
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import {
  WorldlandRentalABI,
  RENTAL_CONTRACT_ADDRESS,
} from '@/lib/contracts/WorldlandRental';
import { getErrorMessage } from '@/lib/error-messages';
import type { TransactionStatus } from '@/types/transaction';

/**
 * Parameters for stopping a rental
 */
export interface StopRentalParams {
  /** Rental ID from blockchain */
  rentalId: bigint;
}

/**
 * Return type for useStopRental hook
 */
export interface UseStopRentalReturn {
  /** Execute rental stop (blockchain transaction) */
  stopRental: (params: StopRentalParams) => Promise<void>;
  /** Current transaction status (6-state) */
  status: TransactionStatus;
  /** Transaction hash once available */
  hash: `0x${string}` | undefined;
  /** Settlement amount in wei (returned by contract) */
  settlementAmount: bigint | null;
  /** Error object if transaction failed */
  error: Error | null;
  /** Korean translated error message */
  errorMessage: string | null;
  /** Reset hook state to idle */
  reset: () => void;
}

/**
 * Hook for stopping GPU rental
 *
 * Calls the stopRental function on the contract which:
 * 1. Calculates final settlement amount
 * 2. Transfers tokens from user deposit to provider
 * 3. Emits RentalStopped event (Hub listens for this)
 *
 * Cache invalidation happens immediately after transaction confirmation
 * to ensure UI reflects updated state (sessions, balance).
 *
 * @example
 * const { stopRental, status, hash, settlementAmount, errorMessage, reset } = useStopRental();
 *
 * // Stop rental
 * await stopRental({ rentalId: BigInt(12345) });
 *
 * // Check status for UI feedback
 * if (status === 'wallet') showMessage('지갑에서 서명해 주세요');
 * if (status === 'pending') showMessage('트랜잭션 처리 중...');
 * if (status === 'success') {
 *   showMessage('렌탈 종료 완료!');
 *   showSettlement(settlementAmount);
 * }
 */
export function useStopRental(): UseStopRentalReturn {
  const { address } = useAccount();
  const queryClient = useQueryClient();

  // Track settlement amount (would be extracted from tx logs in real implementation)
  const [settlementAmount, setSettlementAmount] = useState<bigint | null>(null);

  // Track if cache has been invalidated for current transaction
  const cacheInvalidatedRef = useRef(false);

  // Write contract hook
  const {
    data: hash,
    isPending: isWalletPending,
    error: writeError,
    writeContractAsync,
    reset: resetWrite,
  } = useWriteContract();

  // Wait for transaction confirmation
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: confirmError,
  } = useWaitForTransactionReceipt({
    hash,
    query: {
      enabled: !!hash,
    },
  });

  // ROOT CAUSE FIX (Phase 12): Invalidate cache ONLY after blockchain confirmation.
  // Previously, cache was invalidated immediately after tx submission (in stopRental callback).
  // This caused UI to refetch before Hub had processed the RentalStopped event,
  // resulting in stale data. Now we wait for isConfirmed=true before invalidating.
  useEffect(() => {
    if (isConfirmed && address && !cacheInvalidatedRef.current) {
      cacheInvalidatedRef.current = true;
      // Invalidate caches after blockchain confirmation
      queryClient.invalidateQueries({ queryKey: ['rentals', 'user', address] });
      queryClient.invalidateQueries({ queryKey: ['balance', address] });
      queryClient.invalidateQueries({ queryKey: ['rental', 'status'] });
    }
  }, [isConfirmed, address, queryClient]);

  // Reset cache invalidation flag when hash changes (new transaction)
  useEffect(() => {
    if (!hash) {
      cacheInvalidatedRef.current = false;
    }
  }, [hash]);

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
   * Stop rental
   *
   * ROOT CAUSE FIX (Phase 12): Removed cache invalidation from this callback.
   * Cache is now invalidated in useEffect watching isConfirmed.
   * Also removed try-catch - errors are captured by wagmi hook state.
   */
  const stopRental = useCallback(
    async (params: StopRentalParams) => {
      if (!address) {
        throw new Error('지갑이 연결되지 않았습니다');
      }

      setSettlementAmount(null);
      cacheInvalidatedRef.current = false;

      // Call contract stopRental function
      // Errors are captured in writeError state, no try-catch needed
      await writeContractAsync({
        address: RENTAL_CONTRACT_ADDRESS,
        abi: WorldlandRentalABI,
        functionName: 'stopRental',
        args: [params.rentalId],
      });

      // Settlement amount would be extracted from transaction logs
      // For now, this is handled by the blockchain and Hub API will reflect updated state
      // Cache invalidation moved to useEffect watching isConfirmed
    },
    [address, writeContractAsync]
  );

  /**
   * Reset hook state
   */
  const reset = useCallback(() => {
    resetWrite();
    setSettlementAmount(null);
  }, [resetWrite]);

  // Combined error
  const error = writeError || confirmError || null;
  const errorMessage = error ? getErrorMessage(error) : null;

  return {
    stopRental,
    status,
    hash,
    settlementAmount,
    error,
    errorMessage,
    reset,
  };
}
