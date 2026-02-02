'use client';

import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';

/**
 * Node status from Hub API
 */
export type NodeStatus = 'ONLINE' | 'OFFLINE' | 'RENTED';

/**
 * Node data from Hub API
 */
export interface ProviderNode {
  /** Node unique identifier */
  id: string;
  /** Provider wallet address */
  provider_address: string;
  /** GPU model (e.g., "RTX 4090") */
  gpu_type: string;
  /** VRAM in GB */
  vram_gb: number;
  /** Price per second in wei */
  price_per_sec: string;
  /** Current node status */
  status: NodeStatus;
  /** When node was registered */
  created_at: string;
  /** Last status update */
  updated_at: string;
}

/**
 * Return type for useProviderNodes hook
 */
export interface UseProviderNodesReturn {
  /** List of provider's nodes */
  nodes: ProviderNode[];
  /** Whether data is loading */
  isLoading: boolean;
  /** Error if fetch failed */
  error: Error | null;
  /** Manually refetch nodes */
  refetch: () => void;
}

const HUB_API_URL = process.env.NEXT_PUBLIC_HUB_API_URL || 'http://localhost:8080';

/**
 * Fetch provider's registered nodes from Hub API
 *
 * Queries GET /api/v1/nodes with SIWE session credentials.
 * Returns all nodes registered by the current wallet address.
 *
 * Features:
 * - Auto-refresh every 30 seconds (refetchInterval)
 * - Stale after 25 seconds (staleTime)
 * - Address-scoped query key prevents cross-user data leaks
 * - Only enabled when wallet is connected
 * - Includes credentials for SIWE session auth
 *
 * @example
 * const { nodes, isLoading, error, refetch } = useProviderNodes();
 *
 * if (isLoading) return <Skeleton />;
 * if (error) return <Error message={error.message} />;
 *
 * return (
 *   <ul>
 *     {nodes.map(node => (
 *       <li key={node.id}>{node.gpu_type}: {node.status}</li>
 *     ))}
 *   </ul>
 * );
 */
export function useProviderNodes(): UseProviderNodesReturn {
  const { address } = useAccount();

  const {
    data: nodes = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['provider', address, 'nodes'],
    queryFn: async (): Promise<ProviderNode[]> => {
      if (!address) {
        return [];
      }

      // Get SIWE token from localStorage
      const storedAuth = localStorage.getItem('worldland_auth');
      const token = storedAuth ? JSON.parse(storedAuth).token : null;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${HUB_API_URL}/api/v1/nodes`, {
        method: 'GET',
        credentials: 'include',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message || errorData.message || 'Failed to fetch nodes'
        );
      }

      const data = await response.json();
      return data.data ?? data;
    },
    enabled: !!address,
    staleTime: 25000, // 25 seconds
    refetchInterval: 30000, // 30 seconds background refresh
  });

  return {
    nodes,
    isLoading,
    error: error as Error | null,
    refetch: () => {
      refetch();
    },
  };
}
