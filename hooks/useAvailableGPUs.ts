'use client';

import { useQuery } from '@tanstack/react-query';
import { hubApi } from '@/lib/api';

/**
 * Filter parameters for GPU marketplace search
 */
export interface GPUFilters {
  /** GPU type filter (legacy, e.g., "GPU x1") */
  gpuType?: string;
  /** GPU model filter (NVML name, e.g., "Tesla T4") */
  gpuModel?: string;
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
  /** Provider UUID (internal identifier) */
  providerId: string;
  /** Provider wallet address (for smart contract calls) */
  providerAddress: string;
  /** GPU type string (e.g., "RTX 4090", "GPU x1") */
  gpuType: string;
  /** NVML GPU model name (e.g., "Tesla T4") */
  gpuModel: string;
  /** VRAM in GB */
  vramGb: number;
  /** VRAM in MB (precise) */
  vramMb: number;
  /** Total GPU count on this node */
  totalGpus: number;
  /** Available (unrented) GPU count */
  availableGpus: number;
  /** Total CPU cores on this node */
  totalCpuCores: number;
  /** Available CPU cores (after other sessions) */
  availableCpuCores: number;
  /** Total memory in GB on this node */
  totalMemoryGb: number;
  /** Available memory in GB (after other sessions) */
  availableMemoryGb: number;
  /** Max ephemeral storage in GB available on this node */
  maxStorageGb: number;
  /** Price per second in wei string */
  pricePerSecond: string;
  /** Price per hour in human-readable WLC (e.g., "1.50") */
  pricePerHour: string;
  /** Geographic region */
  region: string;
  /** Availability status */
  status: 'available' | 'busy';
  /** Provider type */
  providerType?: 'docker' | 'k8s';
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


/**
 * Fetch available GPUs from Hub API with filter support
 *
 * Queries POST /api/v1/rentals/providers with filter parameters in request body.
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
      // Build request body for POST endpoint
      const requestBody: {
        gpuType?: string;
        gpuModel?: string;
        minMemoryGB?: number;
        maxPricePerSecond?: string;
        region?: string;
        limit: number;
      } = {
        limit: 50,
      };

      if (filters.gpuModel) {
        requestBody.gpuModel = filters.gpuModel;
      } else if (filters.gpuType) {
        requestBody.gpuType = filters.gpuType;
      }

      if (filters.maxPricePerHour) {
        // Convert per-hour to per-second for API (Pitfall 3 from RESEARCH.md)
        // User thinks in per-hour, API expects per-second
        const perSecond = BigInt(filters.maxPricePerHour) / BigInt(3600);
        requestBody.maxPricePerSecond = perSecond.toString();
      }

      if (filters.region) {
        requestBody.region = filters.region;
      }

      if (filters.minVram) {
        requestBody.minMemoryGB = filters.minVram;
      }

      // Use hubApi client which includes auth token automatically
      const data = await hubApi.findProviders(requestBody);
      // API returns { providers: [...], totalCount: N }
      return (Array.isArray(data) ? data : (data as { providers?: AvailableGPU[] }).providers ?? []) as AvailableGPU[];
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
