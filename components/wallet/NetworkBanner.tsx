'use client';

import { useNetworkGuard } from '@/hooks/useNetworkGuard';
import { sepolia, mainnet, bsc } from '@/config/chains';

/**
 * Persistent warning banner for wrong network
 *
 * Per CONTEXT.md:
 * - "Wrong network: Persistent top banner warning (not blocking modal)"
 * - Shows "Switch Network" button (user-initiated)
 * - Allows read-only access, blocks write actions
 */
export function NetworkBanner() {
  const {
    isWrongNetwork,
    currentChainId,
    expectedChainId,
    switchToCorrectNetwork,
    isSwitching,
  } = useNetworkGuard();

  // Don't render if on correct network or not connected
  if (!isWrongNetwork) {
    return null;
  }

  // Get expected network name for display
  // Dev: Sepolia, Prod: BSC
  const expectedNetworkName =
    expectedChainId === bsc.id ? 'BNB Chain' :
    expectedChainId === sepolia.id ? 'Sepolia Testnet' : 'Ethereum Mainnet';

  // Get current network name (if known)
  const currentNetworkName = currentChainId
    ? getNetworkName(currentChainId)
    : 'Unknown Network';

  return (
    <div className="sticky top-0 z-50 bg-orange-500 text-white px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Warning icon */}
          <svg
            className="w-5 h-5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span className="text-sm sm:text-base">
            <span className="font-medium">Wrong Network:</span>{' '}
            Currently connected to {currentNetworkName}.{' '}
            <span className="hidden sm:inline">
              Please switch to {expectedNetworkName}. Write operations are blocked.
            </span>
          </span>
        </div>
        <button
          onClick={switchToCorrectNetwork}
          disabled={isSwitching}
          className="ml-4 px-4 py-1 bg-white text-orange-600 rounded font-medium text-sm hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
        >
          {isSwitching ? 'Switching...' : 'Switch Network'}
        </button>
      </div>
    </div>
  );
}

/**
 * Get human-readable network name from chain ID
 */
function getNetworkName(chainId: number): string {
  const networks: Record<number, string> = {
    1: 'Ethereum Mainnet',
    11155111: 'Sepolia Testnet',
    56: 'BNB Chain',
    97: 'BSC Testnet',
    137: 'Polygon',
    42161: 'Arbitrum',
    10: 'Optimism',
    43114: 'Avalanche',
    250: 'Fantom',
  };
  return networks[chainId] || `Chain ${chainId}`;
}
