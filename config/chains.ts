import { mainnet, sepolia } from 'wagmi/chains';

// Worldland uses Mainnet for production, Sepolia for development
// Mainnet is always included for ENS resolution
export const supportedChains = process.env.NODE_ENV === 'production'
  ? [mainnet] as const
  : [sepolia, mainnet] as const;

// Expected chain ID for the current environment (the "correct" network for app operations)
export const expectedChainId = process.env.NODE_ENV === 'production'
  ? mainnet.id
  : sepolia.id;

// Chain for ENS resolution (always mainnet regardless of app network)
export const ensChainId = mainnet.id;

// Export individual chains for reference
export { mainnet, sepolia };
