'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { EXTENSION_ERROR_MESSAGES } from '@/lib/error-messages';

const HUB_API_URL = process.env.NEXT_PUBLIC_HUB_API_URL || 'http://localhost:8080';

/**
 * Request parameters for session extension
 */
export interface ExtendSessionParams {
  /** Rental session ID to extend */
  sessionId: string;
  /** Number of minutes to extend */
  extensionMinutes: number;
  /** Optional idempotency key for duplicate request prevention */
  idempotencyKey?: string;
}

/**
 * Response from extension API
 */
export interface ExtendSessionResult {
  /** New expiration timestamp after extension (ISO format) */
  newExpiration: string;
  /** Cost of this extension in USDT */
  extensionCost: string;
  /** Remaining balance after deduction (USDT) */
  remainingBalance: string;
  /** Total number of extensions for this session */
  extensionCount: number;
}

/**
 * Extension API error structure
 */
interface ExtensionError {
  /** HTTP status code */
  status: number;
  /** Error message for display */
  message: string;
  /** Error code from backend (EXT_001-004) */
  code?: string;
}

/**
 * Hook for extending active rental sessions
 *
 * Features:
 * - POST to /api/v1/rentals/:id/extend
 * - Automatic idempotency key generation if not provided
 * - Error code mapping (EXT_001-004) to Korean messages
 * - Success toast notification
 * - Automatic rentals query invalidation on success
 *
 * Backend error codes (from Phase 16-03):
 * - EXT_001: Session not found
 * - EXT_002: Insufficient balance
 * - EXT_003: Session not in RUNNING state
 * - EXT_004: Maximum extensions reached (10)
 *
 * @example
 * const extendSession = useExtendSession();
 *
 * extendSession.mutate({
 *   sessionId: 'abc123',
 *   extensionMinutes: 60,
 * });
 */
export function useExtendSession() {
  const queryClient = useQueryClient();

  return useMutation<ExtendSessionResult, ExtensionError, ExtendSessionParams>({
    mutationFn: async ({ sessionId, extensionMinutes, idempotencyKey }) => {
      // Get auth token
      const storedAuth = localStorage.getItem('worldland_auth');
      if (!storedAuth) {
        throw {
          status: 401,
          message: '인증이 필요합니다',
          code: 'AUTH_MISSING',
        };
      }

      let token: string | null = null;
      try {
        const parsed = JSON.parse(storedAuth);
        token = parsed.token || null;
      } catch {
        throw {
          status: 401,
          message: '인증 정보가 손상되었습니다',
          code: 'AUTH_INVALID',
        };
      }

      // Generate idempotency key if not provided
      const finalIdempotencyKey = idempotencyKey || crypto.randomUUID();

      const response = await fetch(
        `${HUB_API_URL}/api/v1/rentals/${sessionId}/extend`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            extensionMinutes,
            idempotencyKey: finalIdempotencyKey,
          }),
          credentials: 'include',
        }
      );

      const data = await response.json().catch(() => ({}));

      // Success
      if (response.ok) {
        return data as ExtendSessionResult;
      }

      // Extract error code and message
      const errorCode = data.error?.code || data.code;
      const errorMessage = data.error?.message || data.error || data.message;

      // Map known error codes to Korean messages
      let finalMessage = errorMessage;
      if (errorCode && EXTENSION_ERROR_MESSAGES[errorCode]) {
        finalMessage = EXTENSION_ERROR_MESSAGES[errorCode];
      }

      throw {
        status: response.status,
        message: finalMessage || '세션 연장에 실패했습니다',
        code: errorCode,
      };
    },
    onSuccess: () => {
      // Invalidate rentals queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['rentals'] });

      // Show success toast
      toast.success('세션이 연장되었습니다', {
        description: '연장된 시간만큼 세션을 계속 사용할 수 있습니다.',
      });
    },
    onError: (error) => {
      // Show error toast with mapped message
      toast.error('세션 연장 실패', {
        description: error.message,
      });
    },
  });
}
