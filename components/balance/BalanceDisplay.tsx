'use client';

import { useContractBalance } from '@/hooks/useContractBalance';
import { useNetworkGuard } from '@/hooks/useNetworkGuard';
import { useChainId } from 'wagmi';
import { sepolia } from 'wagmi/chains';

/**
 * BalanceDisplay component props
 */
interface BalanceDisplayProps {
  /** Show deposit/withdraw action buttons */
  showActions?: boolean;
  /** Callback when deposit button clicked */
  onDepositClick?: () => void;
  /** Callback when withdraw button clicked */
  onWithdrawClick?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Loading skeleton for balance display
 */
function BalanceSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-4 w-20 bg-gray-700 rounded mb-2" />
      <div className="h-8 w-28 bg-gray-700 rounded mb-1" />
      <div className="h-4 w-24 bg-gray-700 rounded" />
    </div>
  );
}

/**
 * BalanceDisplay - Shows contract deposit balance with fiat conversion
 *
 * Displays user's deposit balance in the WorldlandRental contract.
 * Includes crypto amount (BNB) and fiat equivalent (USD).
 * Optional action buttons for deposit/withdraw operations.
 *
 * Features:
 * - Uses useContractBalance for on-chain balance query
 * - Uses useNetworkGuard to disable actions on wrong network
 * - Korean labels for UI
 * - Loading skeleton state
 * - Tooltip on disabled buttons
 *
 * @example
 * // Header display with actions
 * <BalanceDisplay
 *   showActions
 *   onDepositClick={() => setDepositOpen(true)}
 *   onWithdrawClick={() => setWithdrawOpen(true)}
 * />
 *
 * @example
 * // Read-only balance display
 * <BalanceDisplay />
 */
export function BalanceDisplay({
  showActions = false,
  onDepositClick,
  onWithdrawClick,
  className = '',
}: BalanceDisplayProps) {
  const { formatted, fiat, loading } = useContractBalance();
  const { canWrite, isWrongNetwork } = useNetworkGuard();
  const chainId = useChainId();

  // Token symbol
  const tokenSymbol = 'WLC';

  // Button disabled state: wrong network or loading
  const buttonsDisabled = !canWrite || loading;
  const tooltipText = isWrongNetwork
    ? '올바른 네트워크에 연결하세요'
    : '';

  if (loading) {
    return (
      <div className={`${className}`}>
        <BalanceSkeleton />
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {/* Label */}
      <div className="text-sm text-gray-400 mb-1">
        예치금 잔액
      </div>

      {/* Balance value: crypto */}
      <div className="text-2xl font-bold text-white">
        {formatted} {tokenSymbol}
      </div>

      {/* Balance value: fiat */}
      <div className="text-sm text-gray-400">
        (~{fiat})
      </div>

      {/* Action buttons */}
      {showActions && (
        <div className="flex gap-2 mt-4">
          {/* Deposit button */}
          <button
            onClick={onDepositClick}
            disabled={buttonsDisabled}
            title={buttonsDisabled ? tooltipText : undefined}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${buttonsDisabled
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-700 text-white'
              }
            `}
          >
            입금
          </button>

          {/* Withdraw button */}
          <button
            onClick={onWithdrawClick}
            disabled={buttonsDisabled}
            title={buttonsDisabled ? tooltipText : undefined}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${buttonsDisabled
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-700 text-white'
              }
            `}
          >
            출금
          </button>
        </div>
      )}
    </div>
  );
}

export default BalanceDisplay;
