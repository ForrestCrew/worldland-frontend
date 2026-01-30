'use client';

import { useCallback } from 'react';
import { useAccount } from 'wagmi';
import { useAuth } from '@/contexts/AuthContext';
import { useNetworkGuard } from './useNetworkGuard';

type AuthRole = 'user' | 'provider';

interface ProtectedActionOptions {
  /** Role required for this action */
  role?: AuthRole;
  /** Whether to prompt for signature if not authenticated */
  promptIfNeeded?: boolean;
}

interface UseWalletAuthReturn {
  /** Whether user can execute protected actions */
  canExecute: boolean;
  /** Whether user is authenticated */
  isAuthenticated: boolean;
  /** Whether signature is in progress */
  isAuthenticating: boolean;
  /** Current auth role */
  role: AuthRole | null;
  /** Auth error message */
  error: string | null;
  /** Execute a protected action - prompts for signature if needed */
  executeProtectedAction: <T>(
    action: () => Promise<T>,
    options?: ProtectedActionOptions
  ) => Promise<T>;
  /** Manually request signature */
  requestSignature: (role: AuthRole) => Promise<boolean>;
  /** Logout */
  logout: () => Promise<void>;
}

/**
 * Hook for wallet authentication and protected actions
 *
 * Per CONTEXT.md:
 * - "Prompt for SIWE signature on first protected action (not immediately after connect)"
 * - "읽기 가능 / 쓰기 차단" pattern applies to both wrong network and unauthenticated states
 */
export function useWalletAuth(): UseWalletAuthReturn {
  const { isConnected } = useAccount();
  const { canWrite, isWrongNetwork } = useNetworkGuard();
  const {
    isAuthenticated,
    isAuthenticating,
    role,
    error,
    requestSignature,
    logout,
  } = useAuth();

  // Can execute = connected + correct network + authenticated
  const canExecute = isConnected && canWrite && isAuthenticated;

  const executeProtectedAction = useCallback(
    async <T>(
      action: () => Promise<T>,
      options: ProtectedActionOptions = {}
    ): Promise<T> => {
      const { role: requiredRole = 'user', promptIfNeeded = true } = options;

      // Check connection
      if (!isConnected) {
        throw new Error('지갑을 먼저 연결해주세요');
      }

      // Check network
      if (isWrongNetwork) {
        throw new Error('올바른 네트워크로 전환해주세요');
      }

      // Check authentication
      if (!isAuthenticated) {
        if (promptIfNeeded) {
          // Per CONTEXT.md: prompt on first protected action
          const success = await requestSignature(requiredRole);
          if (!success) {
            throw new Error('인증이 필요합니다');
          }
        } else {
          throw new Error('인증이 필요합니다');
        }
      }

      // Execute the action
      return action();
    },
    [isConnected, isWrongNetwork, isAuthenticated, requestSignature]
  );

  return {
    canExecute,
    isAuthenticated,
    isAuthenticating,
    role,
    error,
    executeProtectedAction,
    requestSignature,
    logout,
  };
}
