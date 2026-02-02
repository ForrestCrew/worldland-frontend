'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const HUB_API_URL = process.env.NEXT_PUBLIC_HUB_API_URL || 'http://localhost:8080';

interface CancelSessionParams {
  sessionId: string;
}

interface CancelError {
  status: number;
  message: string;
}

/**
 * Cancel pending session mutation
 *
 * Calls DELETE /api/v1/rentals/:id to cancel a pending session.
 * Only works for PENDING sessions (cannot cancel RUNNING).
 */
export function useCancelSession() {
  const queryClient = useQueryClient();

  return useMutation<void, CancelError, CancelSessionParams>({
    mutationFn: async ({ sessionId }) => {
      // Get auth token
      const storedAuth = localStorage.getItem('worldland_auth');
      if (!storedAuth) {
        throw { status: 401, message: '인증이 필요합니다' };
      }

      let token: string | null = null;
      try {
        const parsed = JSON.parse(storedAuth);
        token = parsed.token || null;
      } catch {
        throw { status: 401, message: '인증 정보가 손상되었습니다' };
      }

      const response = await fetch(
        `${HUB_API_URL}/api/v1/rentals/${sessionId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          credentials: 'include',
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw {
          status: response.status,
          message: data.error?.message || data.error || '세션 취소에 실패했습니다',
        };
      }
    },
    onSuccess: () => {
      // Invalidate rental queries to trigger immediate refetch
      queryClient.invalidateQueries({ queryKey: ['rentals'] });

      toast.success('세션 취소됨', {
        description: '대기 중인 세션이 취소되었습니다.',
      });
    },
    onError: (error) => {
      toast.error('세션 취소 실패', {
        description: error.message,
      });
    },
  });
}
