import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import {
  metaMaskWallet,
  walletConnectWallet,
  coinbaseWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { supportedChains, sepolia, mainnet } from './chains';
import { http } from 'wagmi';

// WalletConnect project ID - required for WalletConnect v2
// User should set this in .env.local: NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
// For development, you can get a free project ID at https://cloud.walletconnect.com/
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'development-placeholder';

if (projectId === 'development-placeholder' && typeof window !== 'undefined') {
  console.warn(
    '[Worldland] WalletConnect Project ID not set. WalletConnect may not work.\n' +
    'Get a free project ID at https://cloud.walletconnect.com/ and set NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID in .env.local'
  );
}

// Create wagmi config using RainbowKit's getDefaultConfig
// This handles SSR edge cases and provides sensible defaults
export const wagmiConfig = getDefaultConfig({
  appName: 'Worldland',
  projectId,
  chains: supportedChains,
  transports: {
    // Sepolia Testnet RPC (development)
    [sepolia.id]: http('https://rpc.sepolia.org'),
    // Ethereum Mainnet RPC (for ENS resolution and production)
    [mainnet.id]: http('https://eth.llamarpc.com'),
  },
  // Custom wallet list: MetaMask first (recommended), others below
  // Per CONTEXT.md: "Wallet modal shows MetaMask as recommended first, other wallets below"
  wallets: [
    {
      groupName: '추천',  // Korean: "Recommended"
      wallets: [metaMaskWallet],
    },
    {
      groupName: '기타 지갑',  // Korean: "Other Wallets"
      wallets: [walletConnectWallet, coinbaseWallet],
    },
  ],
  ssr: true, // Enable SSR-safe mode
});

// TypeScript: Register wagmi config for type inference
declare module 'wagmi' {
  interface Register {
    config: typeof wagmiConfig;
  }
}
