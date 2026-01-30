'use client';

import { ReactNode, useState, useEffect } from 'react';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { wagmiConfig } from '@/config/wagmi.config';
import { AuthProvider } from '@/contexts/AuthContext';

// Import RainbowKit styles
import '@rainbow-me/rainbowkit/styles.css';

interface Web3ProviderProps {
  children: ReactNode;
}

export function Web3Provider({ children }: Web3ProviderProps) {
  // Create QueryClient instance - must be stable across renders
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Stale time for blockchain data (5 seconds)
            staleTime: 5 * 1000,
            // Retry failed queries
            retry: 2,
          },
        },
      })
  );

  // Prevent hydration mismatch - only render after mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#7b3fe4', // Worldland brand color (adjust as needed)
            accentColorForeground: 'white',
            borderRadius: 'medium',
            fontStack: 'system',
            overlayBlur: 'small',
          })}
          locale="ko" // Korean localization
          modalSize="compact"
        >
          {/* AuthProvider must be inside WagmiProvider to use wagmi hooks */}
          <AuthProvider>
            {/* Only render children after mount to prevent hydration issues */}
            {mounted ? children : null}
          </AuthProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
