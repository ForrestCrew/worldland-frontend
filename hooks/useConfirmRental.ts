'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getConfirmationErrorMessage } from '@/lib/error-messages';

const HUB_API_URL = process.env.NEXT_PUBLIC_HUB_API_URL || 'http://localhost:8080';

interface ConfirmRentalParams {
  sessionId: string;
  txHash: string;
}

interface ConfirmRentalResponse {
  sessionId: string;
  state: string;
  message: string;
  sshHost?: string;
  sshPort?: number;
  sshUser?: string;
}

interface ConfirmError {
  status: number;
  message: string;
  shouldRetry: boolean;
}

/**
 * Confirm rental mutation with idempotent retry logic
 *
 * Phase 14 backend guarantees idempotency - safe to retry with same txHash.
 *
 * Retry strategy:
 * - 202 Accepted: Retry with exponential backoff (tx not yet on chain)
 * - 400/403/409: Don't retry (validation error)
 * - 500: Retry with backoff (server error)
 */
export function useConfirmRental() {
  const queryClient = useQueryClient();

  return useMutation<ConfirmRentalResponse, ConfirmError, ConfirmRentalParams>({
    mutationFn: async ({ sessionId, txHash }) => {
      // Get auth token
      const storedAuth = localStorage.getItem('worldland_auth');
      if (!storedAuth) {
        throw { status: 401, message: '인증이 필요합니다', shouldRetry: false };
      }

      let token: string | null = null;
      try {
        const parsed = JSON.parse(storedAuth);
        token = parsed.token || null;
      } catch {
        throw { status: 401, message: '인증 정보가 손상되었습니다', shouldRetry: false };
      }

      const response = await fetch(
        `${HUB_API_URL}/api/v1/rentals/${sessionId}/confirm`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ txHash }),
          credentials: 'include',
        }
      );

      const data = await response.json().catch(() => ({}));

      // 200 OK: Session already RUNNING (idempotent response)
      if (response.status === 200 && data.state === 'RUNNING') {
        return data;
      }

      // 202 Accepted: Transaction verification in progress
      if (response.status === 202) {
        const errorInfo = getConfirmationErrorMessage(202);
        throw {
          status: 202,
          message: errorInfo.message,
          shouldRetry: true,
        };
      }

      // 400/403/409: Validation errors (don't retry)
      if ([400, 403, 409].includes(response.status)) {
        const errorInfo = getConfirmationErrorMessage(response.status);
        throw {
          status: response.status,
          message: data.error?.message || data.error || errorInfo.message,
          shouldRetry: false,
        };
      }

      // 500+: Server errors (retry)
      if (!response.ok) {
        const errorInfo = getConfirmationErrorMessage(response.status);
        throw {
          status: response.status,
          message: data.error?.message || data.error || errorInfo.message,
          shouldRetry: response.status >= 500,
        };
      }

      return data;
    },
    retry: (failureCount, error) => {
      // Don't retry validation errors
      if (!error.shouldRetry) return false;
      // Retry up to 10 times for 202/500 errors
      return failureCount < 10;
    },
    retryDelay: (attemptIndex) => {
      // Exponential backoff: 2s, 4s, 8s, 16s, max 30s
      return Math.min(2000 * (2 ** attemptIndex), 30000);
    },
    onSuccess: () => {
      // Invalidate rental queries to trigger immediate refetch
      queryClient.invalidateQueries({ queryKey: ['rentals'] });

      toast.success('임대 확인 완료', {
        description: 'SSH 접속 정보가 준비되었습니다.',
      });
    },
    onError: (error) => {
      // 202 is expected during retry - don't show error toast
      if (error.status === 202) {
        // Show info toast instead of error
        toast.info('트랜잭션 확인 중', {
          description: error.message,
        });
        return;
      }

      const errorInfo = getConfirmationErrorMessage(error.status);
      toast.error(errorInfo.title, {
        description: error.message,
      });
    },
  });
}
