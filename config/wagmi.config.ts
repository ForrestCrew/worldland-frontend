import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import {
  metaMaskWallet,
  walletConnectWallet,
  coinbaseWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { createConfig, http } from 'wagmi';
import { supportedChains, bscTestnet, bsc, mainnet } from './chains';

// WalletConnect project ID - required for WalletConnect v2
// User should set this in .env.local: NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '';

if (!projectId && typeof window !== 'undefined') {
  console.warn(
    'WalletConnect Project ID not set. Set NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID in .env.local'
  );
}

// Custom wallet list: MetaMask first (recommended), others below
// Per CONTEXT.md: "Wallet modal shows MetaMask as recommended first, other wallets below"
const connectors = connectorsForWallets(
  [
    {
      groupName: '추천',  // Korean: "Recommended"
      wallets: [metaMaskWallet],
    },
    {
      groupName: '기타 지갑',  // Korean: "Other Wallets"
      wallets: [walletConnectWallet, coinbaseWallet],
    },
  ],
  {
    appName: 'Worldland',
    projectId,
  }
);

// Create wagmi config
export const wagmiConfig = createConfig({
  chains: supportedChains,
  connectors,
  transports: {
    // BSC Testnet RPC
    [bscTestnet.id]: http('https://data-seed-prebsc-1-s1.binance.org:8545/'),
    // BSC Mainnet RPC
    [bsc.id]: http('https://bsc-dataseed.binance.org/'),
    // Mainnet for ENS resolution
    [mainnet.id]: http('https://eth.llamarpc.com'),
  },
  // Remember last wallet choice but require click to reconnect (pre-select only)
  // Per CONTEXT.md: "Remember last wallet choice but require click to reconnect"
  // This is default wagmi behavior - no reconnectOnMount
});

// TypeScript: Register wagmi config for type inference
declare module 'wagmi' {
  interface Register {
    config: typeof wagmiConfig;
  }
}
