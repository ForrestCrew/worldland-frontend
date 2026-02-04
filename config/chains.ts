import { mainnet, sepolia, bsc, bscTestnet } from 'wagmi/chains';

// Network selection via environment variable
// Set NEXT_PUBLIC_NETWORK=bsc for BSC mainnet, otherwise Sepolia testnet
// Mainnet always included for ENS resolution
const useBSC = process.env.NEXT_PUBLIC_NETWORK === 'bsc';

export const supportedChains = useBSC
  ? [bsc, mainnet] as const
  : [sepolia, mainnet] as const;

// Expected chain ID for the current environment
export const expectedChainId = useBSC
  ? bsc.id       // BSC Mainnet (56)
  : sepolia.id;  // Sepolia Testnet (11155111)

// Chain for ENS resolution (always mainnet)
export const ensChainId = mainnet.id;

// Export individual chains for reference
export { mainnet, sepolia, bsc, bscTestnet };
