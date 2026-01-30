'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';

interface WalletButtonProps {
  /** Custom class for the button container */
  className?: string;
  /** Show balance (default: false in header, true in detailed view) */
  showBalance?: boolean;
}

/**
 * Wallet connection button using RainbowKit
 *
 * Per CONTEXT.md:
 * - MetaMask as recommended first (configured in wagmi.config.ts)
 * - Remember last wallet choice but require click to reconnect
 * - No auto-reconnect (default wagmi behavior)
 */
export function WalletButton({ className, showBalance = false }: WalletButtonProps) {
  return (
    <div className={className}>
      <ConnectButton.Custom>
        {({
          account,
          chain,
          openAccountModal,
          openChainModal,
          openConnectModal,
          authenticationStatus,
          mounted,
        }) => {
          // Handle hydration
          const ready = mounted && authenticationStatus !== 'loading';
          const connected =
            ready &&
            account &&
            chain &&
            (!authenticationStatus || authenticationStatus === 'authenticated');

          return (
            <div
              {...(!ready && {
                'aria-hidden': true,
                style: {
                  opacity: 0,
                  pointerEvents: 'none',
                  userSelect: 'none',
                },
              })}
            >
              {(() => {
                // Not connected - show connect button
                if (!connected) {
                  return (
                    <button
                      onClick={openConnectModal}
                      type="button"
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                    >
                      지갑 연결
                    </button>
                  );
                }

                // Wrong network - show chain switcher
                if (chain.unsupported) {
                  return (
                    <button
                      onClick={openChainModal}
                      type="button"
                      className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
                    >
                      네트워크 전환
                    </button>
                  );
                }

                // Connected - show account info
                return (
                  <div className="flex items-center gap-2">
                    {/* Chain button (optional) */}
                    <button
                      onClick={openChainModal}
                      type="button"
                      className="flex items-center gap-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm"
                    >
                      {chain.hasIcon && chain.iconUrl && (
                        <img
                          alt={chain.name ?? 'Chain icon'}
                          src={chain.iconUrl}
                          className="w-4 h-4"
                        />
                      )}
                      <span className="text-gray-300">{chain.name}</span>
                    </button>

                    {/* Account button */}
                    <button
                      onClick={openAccountModal}
                      type="button"
                      className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      {showBalance && account.displayBalance && (
                        <span className="text-gray-400 text-sm">
                          {account.displayBalance}
                        </span>
                      )}
                      <span className="text-white font-medium">
                        {account.displayName}
                      </span>
                    </button>
                  </div>
                );
              })()}
            </div>
          );
        }}
      </ConnectButton.Custom>
    </div>
  );
}

// Also export default ConnectButton for simpler use cases
export { ConnectButton } from '@rainbow-me/rainbowkit';
