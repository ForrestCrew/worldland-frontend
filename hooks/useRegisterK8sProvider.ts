'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { hubApi } from '@/lib/api';
import { toast } from 'sonner';

interface RegisterK8sParams {
  walletAddress: string;
  kubeconfig: string;
}

interface RegisterK8sResult {
  providerId: string;
  clusterHost: string;
  message: string;
}

/**
 * Hook for registering a K8s data center provider
 *
 * Calls POST /api/v1/providers/k8s with wallet address and kubeconfig.
 * On success, invalidates provider queries and shows toast.
 */
export function useRegisterK8sProvider() {
  const queryClient = useQueryClient();

  return useMutation<RegisterK8sResult, Error, RegisterK8sParams>({
    mutationFn: async (params) => {
      return hubApi.registerK8sProvider(params);
    },
    onSuccess: (data) => {
      toast.success('K8s 프로바이더 등록 완료', {
        description: `클러스터: ${data.clusterHost || 'N/A'}`,
      });
      queryClient.invalidateQueries({ queryKey: ['provider'] });
    },
    onError: (error) => {
      toast.error('등록 실패', {
        description: error.message,
      });
    },
  });
}
