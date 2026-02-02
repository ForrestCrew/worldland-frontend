'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Request payload for updating node price
 */
interface UpdateNodePriceRequest {
  /** Node ID to update */
  nodeId: string;
  /** New price per second in wei (as string) */
  price_per_sec: string;
}

/**
 * Response from price update mutation
 */
interface UpdateNodePriceResponse {
  /** Updated node data */
  node: {
    id: string;
    price_per_sec: string;
    updated_at: string;
  };
}

/**
 * Return type for useUpdateNodePrice hook
 */
export interface UseUpdateNodePriceReturn {
  /** Mutation function to update node price */
  updatePrice: (params: UpdateNodePriceRequest) => void;
  /** Whether mutation is pending */
  isPending: boolean;
  /** Error if mutation failed */
  error: Error | null;
  /** Reset mutation state */
  reset: () => void;
}

const HUB_API_URL = process.env.NEXT_PUBLIC_HUB_API_URL || 'http://localhost:8080';

/**
 * Mutation hook for updating node price
 *
 * Calls PATCH /api/v1/nodes/:id/price with SIWE session credentials.
 * Invalidates all provider queries on success to refresh node list.
 *
 * Features:
 * - Includes credentials for SIWE session auth
 * - Auto-invalidates provider queries on success
 * - Error handling with detailed messages
 * - Reset capability for clearing mutation state
 *
 * @example
 * const { updatePrice, isPending, error } = useUpdateNodePrice();
 *
 * const handlePriceUpdate = () => {
 *   updatePrice({
 *     nodeId: 'node-123',
 *     price_per_sec: '1000000000000000' // 0.001 BNB/sec in wei
 *   });
 * };
 *
 * return (
 *   <button onClick={handlePriceUpdate} disabled={isPending}>
 *     {isPending ? 'Updating...' : 'Update Price'}
 *   </button>
 * );
 */
export function useUpdateNodePrice(): UseUpdateNodePriceReturn {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (params: UpdateNodePriceRequest): Promise<UpdateNodePriceResponse> => {
      const { nodeId, price_per_sec } = params;

      // Get SIWE token from localStorage
      const storedAuth = localStorage.getItem('worldland_auth');
      const token = storedAuth ? JSON.parse(storedAuth).token : null;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${HUB_API_URL}/api/v1/nodes/${nodeId}/price`, {
        method: 'PATCH',
        credentials: 'include',
        headers,
        body: JSON.stringify({ price_per_sec }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message || errorData.message || 'Failed to update node price'
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
    updatePrice: mutation.mutate,
    isPending: mutation.isPending,
    error: mutation.error as Error | null,
    reset: mutation.reset,
  };
}
