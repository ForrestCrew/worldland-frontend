import { mainnet, bscTestnet, bsc } from 'wagmi/chains';

// Worldland uses BNB Chain for production, BSC Testnet for development
// Mainnet is always included for ENS resolution
// Per RESEARCH.md: "ENS always resolves on mainnet regardless of user's current network"
export const supportedChains = process.env.NODE_ENV === 'production'
  ? [bsc, mainnet] as const
  : [bscTestnet, mainnet] as const;

// Expected chain ID for the current environment (the "correct" network for app operations)
// Note: Mainnet is supported for ENS but not the expected app network
export const expectedChainId = process.env.NODE_ENV === 'production'
  ? bsc.id
  : bscTestnet.id;

// Chain for ENS resolution (always mainnet regardless of app network)
export const ensChainId = mainnet.id;

// Export individual chains for reference
export { mainnet, bscTestnet, bsc };
