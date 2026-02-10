'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hubApi, type MiningStatusResponse } from '@/lib/api';
import { toast } from 'sonner';

/**
 * Fetch mining status and GPU allocation for a provider
 */
export function useMiningStatus(providerId: string | undefined) {
  return useQuery<MiningStatusResponse>({
    queryKey: ['mining', providerId],
    queryFn: async () => {
      if (!providerId) throw new Error('Provider ID required');
      return hubApi.getMiningStatus(providerId);
    },
    enabled: !!providerId,
    staleTime: 10000,
    refetchInterval: 15000,
  });
}

/**
 * Start mining for a provider
 */
export function useStartMining() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { providerId: string; gpuCount?: number; image?: string }) => {
      return hubApi.startMining(params.providerId, {
        gpuCount: params.gpuCount,
        image: params.image,
      });
    },
    onSuccess: (_data, variables) => {
      toast.success('Mining started');
      queryClient.invalidateQueries({ queryKey: ['mining', variables.providerId] });
    },
    onError: (error: Error) => {
      toast.error('Failed to start mining', { description: error.message });
    },
  });
}

/**
 * Stop mining for a provider
 */
export function useStopMining() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (providerId: string) => {
      return hubApi.stopMining(providerId);
    },
    onSuccess: (_data, providerId) => {
      toast.success('Mining stopped');
      queryClient.invalidateQueries({ queryKey: ['mining', providerId] });
    },
    onError: (error: Error) => {
      toast.error('Failed to stop mining', { description: error.message });
    },
  });
}

/**
 * Allocate GPUs for mining
 */
export function useAllocateMiningGPU() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { providerId: string; gpuCount: number }) => {
      return hubApi.allocateMiningGPU(params.providerId, params.gpuCount);
    },
    onSuccess: (_data, variables) => {
      toast.success(`${variables.gpuCount} GPU(s) allocated for mining`);
      queryClient.invalidateQueries({ queryKey: ['mining', variables.providerId] });
    },
    onError: (error: Error) => {
      toast.error('GPU allocation failed', { description: error.message });
    },
  });
}

/**
 * Release GPUs from mining
 */
export function useReleaseMiningGPU() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { providerId: string; gpuCount: number }) => {
      return hubApi.releaseMiningGPU(params.providerId, params.gpuCount);
    },
    onSuccess: (_data, variables) => {
      toast.success(`${variables.gpuCount} GPU(s) released from mining`);
      queryClient.invalidateQueries({ queryKey: ['mining', variables.providerId] });
    },
    onError: (error: Error) => {
      toast.error('GPU release failed', { description: error.message });
    },
  });
}
