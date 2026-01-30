'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  ReactNode,
} from 'react';
import { useAccount, useAccountEffect } from 'wagmi';
import { signMessage } from 'wagmi/actions';
import { hubApi, ApiError } from '@/lib/api';
import { wagmiConfig } from '@/config/wagmi.config';

type AuthRole = 'user' | 'provider';

interface AuthState {
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  address: string | null;
  providerId: string | null;
  role: AuthRole | null;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  /** Request SIWE signature for authentication */
  requestSignature: (role: AuthRole) => Promise<boolean>;
  /** Logout - invalidate session */
  logout: () => Promise<void>;
  /** Clear error state */
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = 'worldland_auth';

interface StoredAuth {
  token: string;
  address: string;
  providerId?: string;
  role: AuthRole;
  expiry: number; // Unix timestamp
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { address, isConnected, chainId } = useAccount();
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isAuthenticating: false,
    address: null,
    providerId: null,
    role: null,
    error: null,
  });

  // Track previous chainId for network change detection
  const prevChainIdRef = useRef<number | undefined>(chainId);

  // Load persisted auth on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const auth: StoredAuth = JSON.parse(stored);

        // Check if expired
        if (auth.expiry < Date.now()) {
          localStorage.removeItem(STORAGE_KEY);
          return;
        }

        // Check if address matches current wallet
        if (address && auth.address.toLowerCase() !== address.toLowerCase()) {
          localStorage.removeItem(STORAGE_KEY);
          return;
        }

        // Restore session
        hubApi.setToken(auth.token);
        setState({
          isAuthenticated: true,
          isAuthenticating: false,
          address: auth.address,
          providerId: auth.providerId || null,
          role: auth.role,
          error: null,
        });
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, [address]);

  const invalidateSession = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    hubApi.setToken(null);
    setState({
      isAuthenticated: false,
      isAuthenticating: false,
      address: null,
      providerId: null,
      role: null,
      error: null,
    });
  }, []);

  // Invalidate session on disconnect
  // Per CONTEXT.md: "Session duration: 7 days, invalidated immediately on wallet disconnect or network change"
  useAccountEffect({
    onDisconnect() {
      invalidateSession();
    },
  });

  // Watch for network changes
  useEffect(() => {
    const prevChainId = prevChainIdRef.current;
    if (prevChainId && chainId && prevChainId !== chainId && state.isAuthenticated) {
      console.log('Network changed, invalidating session');
      invalidateSession();
    }
    prevChainIdRef.current = chainId;
  }, [chainId, state.isAuthenticated, invalidateSession]);

  const requestSignature = useCallback(
    async (role: AuthRole): Promise<boolean> => {
      if (!isConnected || !address || !chainId) {
        setState((prev) => ({
          ...prev,
          error: '지갑을 먼저 연결해주세요',
        }));
        return false;
      }

      setState((prev) => ({
        ...prev,
        isAuthenticating: true,
        error: null,
      }));

      try {
        // 1. Get nonce from Hub
        const nonceResponse = await hubApi.getNonce();
        const nonce = nonceResponse.nonce;

        // 2. Create SIWE message
        // Per CONTEXT.md: "Different SIWE messages for providers vs users"
        const statement =
          role === 'provider'
            ? 'Worldland Provider로 로그인합니다. GPU 노드를 등록하고 임대를 관리할 수 있습니다.'
            : 'Worldland User로 로그인합니다. GPU 자원을 임대하고 사용할 수 있습니다.';

        const message = createSiweMessage({
          domain: window.location.host,
          address,
          statement,
          uri: window.location.origin,
          version: '1',
          chainId,
          nonce,
        });

        // 3. Request signature from wallet
        const signature = await signMessage(wagmiConfig, {
          message,
        });

        // 4. Verify with Hub
        const result = await hubApi.login({
          message,
          signature,
        });

        // 5. Store session (7 days expiry per CONTEXT.md)
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        const storedAuth: StoredAuth = {
          token: result.token,
          address: address,
          providerId: result.provider_id,
          role,
          expiry: Date.now() + sevenDays,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(storedAuth));
        hubApi.setToken(result.token);

        setState({
          isAuthenticated: true,
          isAuthenticating: false,
          address: address,
          providerId: result.provider_id || null,
          role,
          error: null,
        });

        return true;
      } catch (err) {
        console.error('SIWE auth error:', err);

        // Per CONTEXT.md: "User rejection: Toast message, stay on page"
        // Per CONTEXT.md: "Signature failure does NOT disconnect wallet"
        let errorMessage = '인증에 실패했습니다. 다시 시도해주세요.';

        if (err instanceof Error) {
          // User rejected signature (error code 4001 for most wallets)
          if (
            err.message.includes('rejected') ||
            err.message.includes('denied') ||
            err.message.includes('User rejected')
          ) {
            errorMessage = '서명이 취소됐어요.';
          } else if (err instanceof ApiError) {
            errorMessage = err.message;
          }
        }

        setState((prev) => ({
          ...prev,
          isAuthenticating: false,
          error: errorMessage,
        }));

        return false;
      }
    },
    [isConnected, address, chainId]
  );

  const logout = useCallback(async () => {
    try {
      await hubApi.logout();
    } catch {
      // Ignore logout API errors
    }
    invalidateSession();
  }, [invalidateSession]);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        requestSignature,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Create SIWE message string
 * Using manual creation instead of siwe library for smaller bundle
 */
function createSiweMessage(params: {
  domain: string;
  address: string;
  statement: string;
  uri: string;
  version: string;
  chainId: number;
  nonce: string;
}): string {
  const now = new Date();
  const issuedAt = now.toISOString();
  // 10 minute expiry for the message (not the session)
  const expirationTime = new Date(now.getTime() + 10 * 60 * 1000).toISOString();

  return `${params.domain} wants you to sign in with your Ethereum account:
${params.address}

${params.statement}

URI: ${params.uri}
Version: ${params.version}
Chain ID: ${params.chainId}
Nonce: ${params.nonce}
Issued At: ${issuedAt}
Expiration Time: ${expirationTime}`;
}
