'use client';

import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';

/**
 * Rental status from Hub API
 */
export type RentalStatus = 'RUNNING' | 'STOPPED' | 'COMPLETED';

/**
 * Rental data from Hub API
 */
export interface ProviderRental {
  /** Rental unique identifier */
  id: string;
  /** Node ID being rented */
  node_id: string;
  /** Renter wallet address */
  renter_address: string;
  /** Provider wallet address */
  provider_address: string;
  /** When rental started */
  started_at: string;
  /** When rental ended (null if still running) */
  ended_at: string | null;
  /** Current rental status */
  status: RentalStatus;
  /** Total cost in wei */
  total_cost: string;
  /** SSH connection info (if available) */
  ssh_info?: {
    host: string;
    port: number;
    username: string;
  };
}

/**
 * Return type for useProviderRentals hook
 */
export interface UseProviderRentalsReturn {
  /** List of active rentals (status === 'RUNNING') */
  rentals: ProviderRental[];
  /** Whether data is loading */
  isLoading: boolean;
  /** Error if fetch failed */
  error: Error | null;
  /** Manually refetch rentals */
  refetch: () => void;
}

const HUB_API_URL = process.env.NEXT_PUBLIC_HUB_API_URL || 'http://localhost:8080';

/**
 * Fetch provider's active rentals from Hub API
 *
 * Queries GET /api/v1/rentals with SIWE session credentials.
 * Returns only active rentals (status === 'RUNNING') for the current provider.
 *
 * Features:
 * - Auto-refresh every 30 seconds (refetchInterval)
 * - Stale after 25 seconds (staleTime)
 * - Address-scoped query key prevents cross-user data leaks
 * - Only enabled when wallet is connected
 * - Filters to active rentals only
 * - Includes credentials for SIWE session auth
 *
 * @example
 * const { rentals, isLoading, error, refetch } = useProviderRentals();
 *
 * if (isLoading) return <Skeleton />;
 * if (error) return <Error message={error.message} />;
 *
 * return (
 *   <div>
 *     <h2>Active Rentals: {rentals.length}</h2>
 *     <ul>
 *       {rentals.map(rental => (
 *         <li key={rental.id}>
 *           Node {rental.node_id} - Renter: {rental.renter_address}
 *         </li>
 *       ))}
 *     </ul>
 *   </div>
 * );
 */
export function useProviderRentals(): UseProviderRentalsReturn {
  const { address } = useAccount();

  const {
    data: allRentals = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['provider', address, 'rentals'],
    queryFn: async (): Promise<ProviderRental[]> => {
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

      const response = await fetch(`${HUB_API_URL}/api/v1/rentals`, {
        method: 'GET',
        credentials: 'include',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message || errorData.message || 'Failed to fetch rentals'
        );
      }

      const data = await response.json();
      console.log('[useProviderRentals] API response:', JSON.stringify(data, null, 2));
      const rentals = data.sessions ?? data.data ?? [];

      // Filter to only active rentals
      return rentals.filter((rental: ProviderRental) => rental.status === 'RUNNING');
    },
    enabled: !!address,
    staleTime: 25000, // 25 seconds
    refetchInterval: 30000, // 30 seconds background refresh
  });

  return {
    rentals: allRentals,
    isLoading,
    error: error as Error | null,
    refetch: () => {
      refetch();
    },
  };
}
