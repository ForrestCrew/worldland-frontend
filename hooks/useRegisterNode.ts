'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Request payload for registering a new node
 */
export interface RegisterNodeRequest {
  /** GPU model (e.g., "RTX 4090", "RTX 3090") */
  gpu_type: string;
  /** VRAM in GB (e.g., 24 for RTX 4090) */
  vram_gb: number;
  /** Price per second in wei (as string) */
  price_per_sec: string;
}

/**
 * Response from node registration mutation
 */
interface RegisterNodeResponse {
  /** Newly created node data */
  node: {
    id: string;
    provider_address: string;
    gpu_type: string;
    vram_gb: number;
    price_per_sec: string;
    status: string;
    created_at: string;
  };
}

/**
 * Return type for useRegisterNode hook
 */
export interface UseRegisterNodeReturn {
  /** Mutation function to register a new node */
  registerNode: (params: RegisterNodeRequest) => void;
  /** Whether mutation is pending */
  isPending: boolean;
  /** Error if mutation failed */
  error: Error | null;
  /** Whether mutation was successful */
  isSuccess: boolean;
  /** Reset mutation state */
  reset: () => void;
}

const HUB_API_URL = process.env.NEXT_PUBLIC_HUB_API_URL || 'http://localhost:8080';

/**
 * Mutation hook for registering a new GPU node
 *
 * Calls POST /api/v1/nodes with SIWE session credentials to register
 * a new GPU node for the current provider. Invalidates all provider
 * queries on success to refresh node list.
 *
 * Features:
 * - Includes credentials for SIWE session auth
 * - Auto-invalidates provider queries on success
 * - Error handling with detailed messages
 * - Success state tracking
 * - Reset capability for clearing mutation state
 *
 * @example
 * const { registerNode, isPending, isSuccess, error } = useRegisterNode();
 *
 * const handleRegister = () => {
 *   registerNode({
 *     gpu_type: 'RTX 4090',
 *     vram_gb: 24,
 *     price_per_sec: '1000000000000000' // 0.001 BNB/sec in wei
 *   });
 * };
 *
 * return (
 *   <div>
 *     <button onClick={handleRegister} disabled={isPending}>
 *       {isPending ? 'Registering...' : 'Register Node'}
 *     </button>
 *     {isSuccess && <p>Node registered successfully!</p>}
 *     {error && <p>Error: {error.message}</p>}
 *   </div>
 * );
 */
export function useRegisterNode(): UseRegisterNodeReturn {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (params: RegisterNodeRequest): Promise<RegisterNodeResponse> => {
      const response = await fetch(`${HUB_API_URL}/api/v1/nodes`, {
        method: 'POST',
        credentials: 'include', // Include SIWE session cookie
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message || errorData.message || 'Failed to register node'
        );
      }

      const data = await response.json();
      return data.data ?? data;
    },
    onSuccess: () => {
      // Invalidate all provider queries to refresh node list
      queryClient.invalidateQueries({ queryKey: ['provider'] });
    },
  });

  return {
    registerNode: mutation.mutate,
    isPending: mutation.isPending,
    error: mutation.error as Error | null,
    isSuccess: mutation.isSuccess,
    reset: mutation.reset,
  };
}
