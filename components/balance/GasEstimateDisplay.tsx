'use client';

/**
 * GasEstimateDisplay Component
 *
 * Shows estimated gas fees in crypto (BNB) and fiat (USD)
 * Used in deposit/withdraw modals before transaction signing
 */

interface GasEstimateDisplayProps {
  /** Gas cost in crypto format, e.g., "0.00042 BNB" */
  gasCrypto: string;
  /** Gas cost in fiat format, e.g., "$0.21" */
  gasFiat: string;
  /** Show loading skeleton */
  loading?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Loading skeleton for gas estimate
 */
function GasEstimateSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-4 w-20 bg-gray-700 rounded mb-2" />
      <div className="h-5 w-32 bg-gray-700 rounded" />
    </div>
  );
}

/**
 * GasEstimateDisplay - Shows gas fee preview before transactions
 *
 * @example
 * <GasEstimateDisplay
 *   gasCrypto="0.00042 BNB"
 *   gasFiat="$0.21"
 *   loading={false}
 * />
 */
export function GasEstimateDisplay({
  gasCrypto,
  gasFiat,
  loading = false,
  className = '',
}: GasEstimateDisplayProps) {
  // Check if gas estimate is invalid/unavailable
  const isInvalid = !gasCrypto || gasCrypto === '0 WLC' || gasCrypto === '';
  const showSkeleton = loading || isInvalid;

  if (showSkeleton && loading) {
    return (
      <div className={`bg-gray-800/50 rounded-lg p-3 ${className}`}>
        <GasEstimateSkeleton />
      </div>
    );
  }

  // Cannot estimate gas - show error state
  if (isInvalid && !loading) {
    return (
      <div className={`bg-gray-800/50 rounded-lg p-3 ${className}`}>
        <div className="text-sm text-gray-400 mb-1">
          예상 가스비
        </div>
        <div className="text-sm text-yellow-500">
          가스비 추정 불가
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-800/50 rounded-lg p-3 ${className}`}>
      {/* Label */}
      <div className="text-sm text-gray-400 mb-1">
        예상 가스비
      </div>

      {/* Value: crypto + fiat */}
      <div className="flex items-baseline gap-2">
        <span className="text-sm font-mono text-white">
          {gasCrypto}
        </span>
        <span className="text-sm text-gray-400">
          (~{gasFiat})
        </span>
      </div>
    </div>
  );
}

export default GasEstimateDisplay;
