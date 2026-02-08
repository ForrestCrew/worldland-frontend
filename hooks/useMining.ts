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
      toast.success('채굴 시작됨');
      queryClient.invalidateQueries({ queryKey: ['mining', variables.providerId] });
    },
    onError: (error: Error) => {
      toast.error('채굴 시작 실패', { description: error.message });
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
      toast.success('채굴 중지됨');
      queryClient.invalidateQueries({ queryKey: ['mining', providerId] });
    },
    onError: (error: Error) => {
      toast.error('채굴 중지 실패', { description: error.message });
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
      toast.success(`GPU ${variables.gpuCount}개 채굴 할당 완료`);
      queryClient.invalidateQueries({ queryKey: ['mining', variables.providerId] });
    },
    onError: (error: Error) => {
      toast.error('GPU 할당 실패', { description: error.message });
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
      toast.success(`GPU ${variables.gpuCount}개 채굴 해제 완료`);
      queryClient.invalidateQueries({ queryKey: ['mining', variables.providerId] });
    },
    onError: (error: Error) => {
      toast.error('GPU 해제 실패', { description: error.message });
    },
  });
}
