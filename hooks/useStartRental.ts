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
  /** SSH public key for container access */
  sshPublicKey: string;
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
  /** Session ID from Hub */
  sessionId: string | null;
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
 * Get auth headers from localStorage
 */
function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const storedAuth = localStorage.getItem('worldland_auth');
  if (storedAuth) {
    try {
      const { token } = JSON.parse(storedAuth);
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch {
      // Ignore parse errors
    }
  }

  return headers;
}

/**
 * Hook for starting GPU rental with proper 4-step flow
 *
 * Step 1: Create session on Hub (POST /rentals)
 * Step 2: Blockchain transaction (startRental on contract)
 * Step 3: Confirm session on Hub (POST /rentals/:sessionId/confirm)
 * Step 4: Start rental on Hub (POST /rentals/:sessionId/start)
 *
 * @example
 * const { startRental, stage, txStatus, sshCredentials, errorMessage, reset } = useStartRental();
 *
 * const creds = await startRental({
 *   nodeId: 'node-123',
 *   provider: '0x1234...',
 *   pricePerSecond: parseUnits('0.001', 18),
 *   sshPublicKey: 'ssh-ed25519 AAAA...',
 * });
 */
export function useStartRental(): UseStartRentalReturn {
  const { address } = useAccount();
  const queryClient = useQueryClient();

  // Stage tracking
  const [stage, setStage] = useState<RentalStage>('idle');
  const [sessionId, setSessionId] = useState<string | null>(null);
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
   * Step 1: Create session on Hub
   */
  const createSession = async (params: {
    nodeId: string;
    pricePerSecond: string;
    image?: string;
  }): Promise<string> => {
    const requestBody = {
      nodeId: params.nodeId,
      pricePerSecond: params.pricePerSecond,
      ...(params.image && { image: params.image }),
    };
    console.log('[createSession] Request:', requestBody);
    console.log('[createSession] Auth headers:', getAuthHeaders());

    const response = await fetch(`${HUB_API_URL}/api/v1/rentals`, {
      method: 'POST',
      credentials: 'include',
      headers: getAuthHeaders(),
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[createSession] Error response:', response.status, errorData);
      throw new Error(errorData.error || `세션 생성 실패: ${response.status}`);
    }

    const data = await response.json();
    console.log('[createSession] Success:', data);
    return data.sessionId;
  };

  /**
   * Step 3: Confirm session with txHash
   */
  const confirmSession = async (sessionId: string, txHash: string): Promise<void> => {
    const response = await fetch(`${HUB_API_URL}/api/v1/rentals/${sessionId}/confirm`, {
      method: 'POST',
      credentials: 'include',
      headers: getAuthHeaders(),
      body: JSON.stringify({ txHash }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `세션 확인 실패: ${response.status}`);
    }
  };

  /**
   * Step 4: Start rental and get SSH credentials
   */
  const startRentalOnHub = async (sessionId: string, sshPublicKey: string): Promise<SSHCredentials> => {
    const response = await fetch(`${HUB_API_URL}/api/v1/rentals/${sessionId}/start`, {
      method: 'POST',
      credentials: 'include',
      headers: getAuthHeaders(),
      body: JSON.stringify({ sshPublicKey }),
    });

    // 202 means pod is still being provisioned - treat as retryable error
    if (response.status === 202) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || 'Pod가 준비 중입니다. 잠시 후 다시 시도해주세요.');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `렌탈 시작 실패: ${response.status}`);
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
   * Execute full rental flow
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
        setSessionId(null);

        // Step 1: Create session on Hub
        setStage('hub');
        const newSessionId = await createSession({
          nodeId: params.nodeId,
          pricePerSecond: params.pricePerSecond.toString(),
          image: params.image,
        });
        setSessionId(newSessionId);

        // Step 2: Blockchain transaction
        setStage('blockchain');
        const txHash = await writeContractAsync({
          address: RENTAL_CONTRACT_ADDRESS,
          abi: WorldlandRentalABI,
          functionName: 'startRental',
          args: [params.provider, params.pricePerSecond],
        });

        // Step 3: Confirm session with retry (Hub may need time to see the tx)
        setStage('hub');
        await retryWithBackoff(
          () => confirmSession(newSessionId, txHash),
          {
            maxRetries: 6,
            delayMs: 3000,
            shouldRetry: isRetryableHubError,
          }
        );

        // Step 4: Start rental and get SSH credentials
        // Large images (CUDA) can take 1-2 minutes to pull, so retry longer
        const credentials = await retryWithBackoff(
          () => startRentalOnHub(newSessionId, params.sshPublicKey),
          {
            maxRetries: 20,
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
    setSessionId(null);
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
    sessionId,
    sshCredentials,
    error,
    errorMessage,
    stageMessage,
    reset,
  };
}
