'use client';

import { useQuery } from '@tanstack/react-query';

/**
 * Filter parameters for GPU marketplace search
 */
export interface GPUFilters {
  /** GPU model filter (e.g., "RTX 4090") */
  gpuType?: string;
  /** Maximum price per hour in wei string */
  maxPricePerHour?: string;
  /** Region filter (e.g., "asia", "us", "eu") */
  region?: string;
  /** Minimum VRAM in GB */
  minVram?: number;
}

/**
 * Available GPU data from Hub API
 */
export interface AvailableGPU {
  /** Node unique identifier */
  nodeId: string;
  /** Provider wallet address */
  providerId: string;
  /** GPU model (e.g., "RTX 4090") */
  gpuType: string;
  /** VRAM in GB */
  vramGb: number;
  /** Price per second in wei string */
  pricePerSecond: string;
  /** Geographic region */
  region: string;
  /** Availability status */
  status: 'available' | 'busy';
}

/**
 * Return type for useAvailableGPUs hook
 */
export interface UseAvailableGPUsReturn {
  /** List of available GPUs matching filters */
  gpus: AvailableGPU[];
  /** Whether data is loading */
  isLoading: boolean;
  /** Error if fetch failed */
  error: Error | null;
  /** Manually refetch GPUs */
  refetch: () => void;
}

const HUB_API_URL = process.env.NEXT_PUBLIC_HUB_API_URL || 'http://localhost:8080';

/**
 * Fetch available GPUs from Hub API with filter support
 *
 * Queries GET /api/v1/rentals/providers with optional filter parameters.
 * Returns only available (not currently rented) GPUs for the marketplace.
 *
 * Features:
 * - Auto-refresh every 30 seconds (refetchInterval) per Phase 7 decision
 * - Stale after 10 seconds (staleTime)
 * - Converts per-hour price filter to per-second for API (Pitfall 3)
 * - Filter by GPU type, price, region, VRAM
 * - Only shows available nodes (status filter)
 *
 * @param filters - Optional filter parameters for GPU search
 *
 * @example
 * const { gpus, isLoading, error } = useAvailableGPUs({
 *   gpuType: 'RTX 4090',
 *   maxPricePerHour: parseEther('1.0').toString(), // 1 WLC/hr max
 * });
 *
 * if (isLoading) return <Skeleton />;
 *
 * return (
 *   <ul>
 *     {gpus.map(gpu => (
 *       <li key={gpu.nodeId}>{gpu.gpuType} - {gpu.pricePerSecond}</li>
 *     ))}
 *   </ul>
 * );
 */
export function useAvailableGPUs(filters: GPUFilters = {}): UseAvailableGPUsReturn {
  const {
    data: gpus = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['gpus', 'available', filters],
    queryFn: async (): Promise<AvailableGPU[]> => {
      const params = new URLSearchParams();

      // Apply filter parameters
      if (filters.gpuType) {
        params.set('gpuType', filters.gpuType);
      }

      if (filters.maxPricePerHour) {
        // Convert per-hour to per-second for API (Pitfall 3 from RESEARCH.md)
        // User thinks in per-hour, API expects per-second
        const perSecond = BigInt(filters.maxPricePerHour) / BigInt(3600);
        params.set('maxPricePerSecond', perSecond.toString());
      }

      if (filters.region) {
        params.set('region', filters.region);
      }

      if (filters.minVram) {
        params.set('minVram', filters.minVram.toString());
      }

      // Only fetch available nodes for marketplace
      params.set('status', 'available');
      params.set('limit', '50');

      const response = await fetch(
        `${HUB_API_URL}/api/v1/rentals/providers?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message || errorData.message || 'Failed to fetch available GPUs'
        );
      }

      const data = await response.json();
      // API returns providers array with node info
      return (data.providers ?? data.data ?? []) as AvailableGPU[];
    },
    staleTime: 10000, // 10 seconds
    refetchInterval: 30000, // 30 seconds polling per Phase 7 pattern
  });

  return {
    gpus,
    isLoading,
    error: error as Error | null,
    refetch: () => {
      refetch();
    },
  };
}
