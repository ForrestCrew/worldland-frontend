import { mainnet, sepolia, bsc, bscTestnet } from 'wagmi/chains';

// Development: Sepolia testnet
// Production: BSC mainnet
// Mainnet always included for ENS resolution
export const supportedChains = process.env.NODE_ENV === 'production'
  ? [bsc, mainnet] as const
  : [sepolia, mainnet] as const;

// Expected chain ID for the current environment
export const expectedChainId = process.env.NODE_ENV === 'production'
  ? bsc.id       // BSC Mainnet (56)
  : sepolia.id;  // Sepolia Testnet (11155111)

// Chain for ENS resolution (always mainnet)
export const ensChainId = mainnet.id;

// Export individual chains for reference
export { mainnet, sepolia, bsc, bscTestnet };
