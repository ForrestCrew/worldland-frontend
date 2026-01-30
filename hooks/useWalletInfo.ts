'use client';

import { useAccount, useBalance, useEnsName, useEnsAvatar } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { useNetworkGuard } from './useNetworkGuard';
import { useAuth } from '@/contexts/AuthContext';

export interface WalletInfo {
  // Connection state
  isConnected: boolean;
  isCorrectNetwork: boolean;
  isAuthenticated: boolean;

  // Address info
  address: `0x${string}` | undefined;
  displayName: string | undefined;
  truncatedAddress: string | undefined;
  ensName: string | null;
  ensAvatar: string | null;

  // Balance
  balance: string | undefined;
  balanceSymbol: string | undefined;
  balanceFormatted: string | undefined;

  // Network
  chainId: number | undefined;
  chainName: string | undefined;

  // Connection status indicator color
  statusColor: 'green' | 'orange' | 'gray';
  statusText: string;
}

/**
 * Combined wallet info hook for header display
 *
 * Per CONTEXT.md:
 * - "Address format: ENS name if available, fallback to truncated address (0x1234...5678)"
 * - "Connection state indicators: Both text changes AND color dots"
 *   - Green dot: Connected, correct network, authenticated
 *   - Orange dot: Connected but wrong network
 */
export function useWalletInfo(): WalletInfo {
  const { address, isConnected, chain } = useAccount();
  const { isCorrectNetwork, isWrongNetwork } = useNetworkGuard();
  const { isAuthenticated } = useAuth();

  // ENS resolution - always on mainnet
  // Per RESEARCH.md pitfall: "ENS always resolves on mainnet regardless of user's current network"
  const { data: ensName } = useEnsName({
    address,
    chainId: mainnet.id,
  });

  const { data: ensAvatar } = useEnsAvatar({
    name: ensName || undefined,
    chainId: mainnet.id,
  });

  // Native token balance
  const { data: balanceData } = useBalance({
    address,
  });

  // Truncate address: 0x1234...5678
  const truncatedAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : undefined;

  // Display name: ENS first, then truncated address
  // Per CONTEXT.md: "ENS name if available, fallback to truncated address"
  const displayName = ensName || truncatedAddress;

  // Format balance
  const balanceFormatted = balanceData
    ? `${parseFloat(balanceData.formatted).toFixed(4)} ${balanceData.symbol}`
    : undefined;

  // Determine status color and text
  // Per CONTEXT.md decision on connection state indicators
  let statusColor: 'green' | 'orange' | 'gray';
  let statusText: string;

  if (!isConnected) {
    statusColor = 'gray';
    statusText = '연결되지 않음';
  } else if (isWrongNetwork) {
    statusColor = 'orange';
    statusText = '잘못된 네트워크';
  } else if (!isAuthenticated) {
    statusColor = 'orange';
    statusText = '인증 필요';
  } else {
    statusColor = 'green';
    statusText = '연결됨';
  }

  return {
    isConnected,
    isCorrectNetwork,
    isAuthenticated,
    address,
    displayName,
    truncatedAddress,
    ensName: ensName || null,
    ensAvatar: ensAvatar || null,
    balance: balanceData?.formatted,
    balanceSymbol: balanceData?.symbol,
    balanceFormatted,
    chainId: chain?.id,
    chainName: chain?.name,
    statusColor,
    statusText,
  };
}
