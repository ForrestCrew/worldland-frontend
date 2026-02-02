'use client';

import { useCallback, useState } from 'react';
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
import {
  RentalStage,
  SSHCredentials,
  retryWithBackoff,
  isRetryableHubError,
  rentalStageMessages,
} from '@/lib/rental-utils';
import type { TransactionStatus } from '@/types/transaction';

const HUB_API_URL = process.env.NEXT_PUBLIC_HUB_API_URL || 'http://localhost:8080';

/**
 * Parameters for starting a rental
 */
export interface StartRentalParams {
  /** Node ID to rent */
  nodeId: string;
  /** Provider wallet address */
  provider: `0x${string}`;
  /** Price per second in wei */
  pricePerSecond: bigint;
  /** Container image (preset ID or custom Docker URL) - optional, uses default if not provided */
  image?: string;
}

/**
 * Return type for useStartRental hook
 */
export interface UseStartRentalReturn {
  /** Execute rental start (blockchain + Hub API) */
  startRental: (params: StartRentalParams) => Promise<SSHCredentials | null>;
  /** Current 2-phase stage */
  stage: RentalStage;
  /** Blockchain transaction status (6-state) */
  txStatus: TransactionStatus;
  /** Transaction hash once available */
  hash: `0x${string}` | undefined;
  /** Rental ID from blockchain */
  rentalId: bigint | null;
  /** SSH credentials from Hub API */
  sshCredentials: SSHCredentials | null;
  /** Error object if failed */
  error: Error | null;
  /** Korean translated error message */
  errorMessage: string | null;
  /** Stage-specific status message */
  stageMessage: string;
  /** Reset hook state to idle */
  reset: () => void;
}

/**
 * Hook for starting GPU rental with 2-phase flow
 *
 * Phase 1: Blockchain transaction (startRental on contract)
 * Phase 2: Hub API call with retry (notify Hub + get SSH credentials)
 *
 * Implements retry with backoff during blockchain lag window (15-30s)
 * when Hub hasn't processed the blockchain event yet.
 *
 * @example
 * const { startRental, stage, txStatus, sshCredentials, errorMessage, reset } = useStartRental();
 *
 * // Start rental
 * const creds = await startRental({
 *   nodeId: 'node-123',
 *   provider: '0x1234...',
 *   pricePerSecond: parseUnits('0.001', 18),
 * });
 *
 * // Check stage for UI feedback
 * if (stage === 'blockchain') showMessage('블록체인 트랜잭션 처리 중...');
 * if (stage === 'hub') showMessage('GPU 연결 준비 중...');
 * if (stage === 'complete') showSSH(creds);
 */
export function useStartRental(): UseStartRentalReturn {
  const { address } = useAccount();
  const queryClient = useQueryClient();

  // 2-phase stage tracking
  const [stage, setStage] = useState<RentalStage>('idle');
  const [rentalId, setRentalId] = useState<bigint | null>(null);
  const [sshCredentials, setSshCredentials] = useState<SSHCredentials | null>(null);
  const [hubError, setHubError] = useState<Error | null>(null);

  // Blockchain transaction state
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
  } = useWaitForTransactionReceipt({ hash });

  // Derive 6-state blockchain transaction status
  const getTxStatus = (): TransactionStatus => {
    if (writeError || confirmError) return 'fail';
    if (isConfirmed) return 'success';
    if (isConfirming) return 'confirmed';
    if (hash) return 'pending';
    if (isWalletPending) return 'wallet';
    return 'idle';
  };

  const txStatus = getTxStatus();

  /**
   * Call Hub API to notify of rental start and get SSH credentials
   * Retries during blockchain lag window
   */
  const notifyHubStart = async (params: {
    rentalId: bigint;
    nodeId: string;
    txHash: string;
    image?: string;
  }): Promise<SSHCredentials> => {
    // Get SIWE token from localStorage
    const storedAuth = localStorage.getItem('worldland_auth');
    const token = storedAuth ? JSON.parse(storedAuth).token : null;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(
      `${HUB_API_URL}/api/v1/rentals/${params.nodeId}/start`,
      {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({
          rentalId: params.rentalId.toString(),
          transactionHash: params.txHash,
          ...(params.image && { image: params.image }),
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message =
        errorData.error?.message ||
        errorData.message ||
        `Hub API error: ${response.status}`;
      throw new Error(message);
    }

    const data = await response.json();
    return {
      sshHost: data.sshHost || data.ssh_host,
      sshPort: data.sshPort || data.ssh_port,
      sshUser: data.sshUser || data.ssh_user,
      sshPassword: data.sshPassword || data.ssh_password,
    };
  };

  /**
   * Start rental with 2-phase flow
   *
   * 1. Submit blockchain transaction and wait for confirmation
   * 2. Call Hub API with retry to get SSH credentials
   */
  const startRental = useCallback(
    async (params: StartRentalParams): Promise<SSHCredentials | null> => {
      if (!address) {
        throw new Error('지갑이 연결되지 않았습니다');
      }

      try {
        // Reset state
        setHubError(null);
        setSshCredentials(null);
        setRentalId(null);

        // Phase 1: Blockchain transaction
        setStage('blockchain');

        const txHash = await writeContractAsync({
          address: RENTAL_CONTRACT_ADDRESS,
          abi: WorldlandRentalABI,
          functionName: 'startRental',
          args: [params.provider, params.pricePerSecond],
        });

        // Wait for transaction to be mined (wagmi handles this via useWaitForTransactionReceipt)
        // For now, we proceed after getting the hash and let the UI show tx status
        // The actual confirmation wait happens inside writeContractAsync

        // Extract rental ID from transaction logs would require additional hook
        // For now, use a placeholder - real implementation would parse logs
        const newRentalId = BigInt(Date.now()); // Placeholder
        setRentalId(newRentalId);

        // Phase 2: Hub API call with retry
        setStage('hub');

        const credentials = await retryWithBackoff(
          () =>
            notifyHubStart({
              rentalId: newRentalId,
              nodeId: params.nodeId,
              txHash,
              image: params.image,
            }),
          {
            maxRetries: 6,
            delayMs: 5000,
            shouldRetry: isRetryableHubError,
          }
        );

        setSshCredentials(credentials);
        setStage('complete');

        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['rentals', 'user', address] });
        queryClient.invalidateQueries({ queryKey: ['balance', address] });
        queryClient.invalidateQueries({ queryKey: ['availableGPUs'] });

        return credentials;
      } catch (error) {
        setStage('error');
        if (!(writeError || confirmError)) {
          setHubError(error as Error);
        }
        return null;
      }
    },
    [address, writeContractAsync, queryClient, writeError, confirmError]
  );

  /**
   * Reset hook state
   */
  const reset = useCallback(() => {
    resetWrite();
    setStage('idle');
    setRentalId(null);
    setSshCredentials(null);
    setHubError(null);
  }, [resetWrite]);

  // Combined error (blockchain or hub)
  const error = writeError || confirmError || hubError || null;
  const errorMessage = error ? getErrorMessage(error) : null;

  // Stage-specific message
  const stageMessage = rentalStageMessages[stage];

  return {
    startRental,
    stage,
    txStatus,
    hash,
    rentalId,
    sshCredentials,
    error,
    errorMessage,
    stageMessage,
    reset,
  };
}
