'use client';

import { useAccount, useSwitchChain } from 'wagmi';
import { expectedChainId } from '@/config/chains';

export interface NetworkGuardState {
  isConnected: boolean;
  isCorrectNetwork: boolean;
  isWrongNetwork: boolean;
  currentChainId: number | undefined;
  expectedChainId: number;
  canRead: boolean;
  canWrite: boolean;
  switchToCorrectNetwork: () => void;
  isSwitching: boolean;
  switchError: Error | null;
}

/**
 * Hook for network validation and switching
 *
 * Per CONTEXT.md:
 * - "읽기 가능 / 쓰기 차단" pattern: wrong network allows read, blocks write
 * - Use useAccount().chainId (not useChainId) for reliable network detection
 */
export function useNetworkGuard(): NetworkGuardState {
  // Use chainId from useAccount for reliable detection
  // Per RESEARCH.md pitfall: "useChainId() hook may not update on network change"
  const { isConnected, chainId: currentChainId } = useAccount();
  const { switchChain, isPending: isSwitching, error: switchError } = useSwitchChain();

  const isCorrectNetwork = isConnected && currentChainId === expectedChainId;
  const isWrongNetwork = isConnected && currentChainId !== expectedChainId;

  // Per CONTEXT.md: "읽기 가능 / 쓰기 차단" pattern
  // Read allowed when connected (regardless of network)
  // Write only allowed when connected AND on correct network
  const canRead = isConnected;
  const canWrite = isConnected && isCorrectNetwork;

  const switchToCorrectNetwork = () => {
    if (switchChain) {
      switchChain({ chainId: expectedChainId });
    }
  };

  return {
    isConnected,
    isCorrectNetwork,
    isWrongNetwork,
    currentChainId,
    expectedChainId,
    canRead,
    canWrite,
    switchToCorrectNetwork,
    isSwitching,
    switchError: switchError || null,
  };
}
