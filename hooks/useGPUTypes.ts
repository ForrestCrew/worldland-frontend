'use client';

import { useQuery } from '@tanstack/react-query';
import { hubApi, type GPUTypeInfo } from '@/lib/api';

export type { GPUTypeInfo };

export interface UseGPUTypesReturn {
  gpuTypes: GPUTypeInfo[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Fetch GPU types grouped for RunPod-style marketplace display.
 * Queries GET /api/v1/gpu-types (public, no auth required).
 * Auto-refreshes every 30 seconds.
 */
export function useGPUTypes(): UseGPUTypesReturn {
  const {
    data: gpuTypes = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['gpuTypes'],
    queryFn: async (): Promise<GPUTypeInfo[]> => {
      const data = await hubApi.getGPUTypes();
      return data.gpuTypes ?? [];
    },
    staleTime: 10000,
    refetchInterval: 30000,
  });

  return {
    gpuTypes,
    isLoading,
    error: error as Error | null,
    refetch: () => { refetch(); },
  };
}
