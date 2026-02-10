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
  /** Container image (preset ID) - optional, uses default if not provided */
  image?: string;
  /** GPU count (default 1) */
  gpuCount: number;
  /** CPU cores (default 4) */
  cpuCores: number;
  /** Memory in GB (default 16) */
  memoryGB: number;
  /** Storage in GB (default 50) */
  storageGB: number;
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
  /** Whether session has been detected as FAILED after completion */
  sessionFailed: boolean;
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
  const [sessionFailed, setSessionFailed] = useState(false);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  /**
   * Poll session status after completion to detect FAILED state.
   *
   * After TX confirms and Hub acknowledge is complete, the backend may still
   * fail to create the container (quota exceeded, insufficient resources, etc).
   * This effect polls every 5 seconds for up to 2 minutes to detect FAILED state.
   * On detection, sets sessionFailed=true which triggers error UI in the modal.
   */
  useEffect(() => {
    // Only poll when stage is 'complete' and we have a session ID
    if (stage !== 'complete' || !sessionId) {
      // Clear any existing timer when not in complete stage
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      return;
    }

    let pollCount = 0;
    const maxPolls = 24; // 24 * 5s = 2 minutes

    const checkSessionStatus = async () => {
      try {
        const storedAuth = localStorage.getItem('worldland_auth');
        const token = storedAuth ? JSON.parse(storedAuth).token : null;

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(
          `${HUB_API_URL}/api/v1/rentals/${sessionId}`,
          { method: 'GET', credentials: 'include', headers }
        );

        if (response.ok) {
          const data = await response.json();
          const session = data.data ?? data;

          if (session.state === 'FAILED') {
            setSessionFailed(true);
            // Stop polling
            if (pollTimerRef.current) {
              clearInterval(pollTimerRef.current);
              pollTimerRef.current = null;
            }
            // Invalidate rental list to show FAILED in session list
            queryClient.invalidateQueries({ queryKey: ['rentals', 'user', address] });
            return;
          }

          if (session.state === 'RUNNING') {
            // Session is healthy, stop polling
            if (pollTimerRef.current) {
              clearInterval(pollTimerRef.current);
              pollTimerRef.current = null;
            }
            return;
          }
        }
      } catch {
        // Ignore individual poll errors, will retry
      }

      pollCount++;
      if (pollCount >= maxPolls && pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };

    // Start polling
    pollTimerRef.current = setInterval(checkSessionStatus, 5000);
    // Also check immediately
    checkSessionStatus();

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [stage, sessionId, queryClient, address]);

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
    gpuCount: number;
    cpuCores: number;
    memoryGB: number;
    storageGB: number;
  }): Promise<string> => {
    const requestBody = {
      nodeId: params.nodeId,
      pricePerSecond: params.pricePerSecond,
      ...(params.image && { image: params.image }),
      gpuCount: params.gpuCount,
      cpuCores: params.cpuCores,
      memoryGB: params.memoryGB,
      storageGB: params.storageGB,
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

      // 409: Already have an active rental
      if (response.status === 409) {
        throw new Error('You already have an active rental. Please stop it before starting a new one.');
      }
      throw new Error(errorData.error || `Session creation failed: ${response.status}`);
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
      throw new Error(errorData.error || `Session confirmation failed: ${response.status}`);
    }
  };

  /**
   * Step 4: Start rental and get SSH credentials
   */
  const startRentalOnHub = async (sessionId: string): Promise<SSHCredentials> => {
    const response = await fetch(`${HUB_API_URL}/api/v1/rentals/${sessionId}/start`, {
      method: 'POST',
      credentials: 'include',
      headers: getAuthHeaders(),
      body: JSON.stringify({}),
    });

    // 202 means pod is still being provisioned - treat as retryable error
    if (response.status === 202) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || 'Pod is being provisioned. Please try again shortly.');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Rental start failed: ${response.status}`);
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
        throw new Error('Wallet not connected');
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
          gpuCount: params.gpuCount,
          cpuCores: params.cpuCores,
          memoryGB: params.memoryGB,
          storageGB: params.storageGB,
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

        // Step 4: Try to get SSH credentials (non-blocking)
        // Large images (pytorch, CUDA) can take 3-5 minutes to pull.
        // Try with short timeout — if container isn't ready yet, show success
        // without SSH credentials. User can see SSH info in the session list.
        try {
          const credentials = await retryWithBackoff(
            () => startRentalOnHub(newSessionId),
            {
              maxRetries: 6,
              delayMs: 5000,
              shouldRetry: isRetryableHubError,
            }
          );
          setSshCredentials(credentials);
        } catch {
          // Container still provisioning — SSH info will appear in session list
          console.log('[useStartRental] Container still provisioning, SSH will be available in session list');
        }

        setStage('complete');

        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['rentals', 'user', address] });
        queryClient.invalidateQueries({ queryKey: ['balance', address] });
        queryClient.invalidateQueries({ queryKey: ['availableGPUs'] });

        return null;
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
    setSessionFailed(false);
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
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
    sessionFailed,
    reset,
  };
}
