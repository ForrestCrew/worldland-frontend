import { mainnet, bscTestnet, bsc } from 'wagmi/chains';

// Worldland uses BNB Chain for production, BSC Testnet for development
// Environment-based: dev shows testnet, prod shows mainnet only
export const supportedChains = process.env.NODE_ENV === 'production'
  ? [bsc] as const
  : [bscTestnet] as const;

// Expected chain ID for the current environment
export const expectedChainId = process.env.NODE_ENV === 'production'
  ? bsc.id
  : bscTestnet.id;

// Chain for ENS resolution (always mainnet regardless of app network)
export const ensChainId = mainnet.id;

// Export individual chains for reference
export { mainnet, bscTestnet, bsc };
