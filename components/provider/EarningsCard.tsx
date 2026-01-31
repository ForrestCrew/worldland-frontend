'use client';

import { useState } from 'react';
import { useProviderEarnings } from '@/hooks/useProviderEarnings';
import { WithdrawModal } from '@/components/balance';
import { formatEther } from 'viem';

/**
 * Time period for earnings filtering
 */
type TimePeriod = 'today' | 'week' | 'month' | 'all';

/**
 * EarningsCard component - Display provider earnings with withdrawal
 *
 * Features:
 * - Total earned, withdrawable, and pending settlement breakdown
 * - Time period selector (Today / This week / This month / All time)
 * - Withdraw button opens existing WithdrawModal from Phase 6
 * - Loading skeleton state
 * - Korean labels and formatting
 * - Auto-refresh via useProviderEarnings hook (60s)
 *
 * Note: Period filtering is UI-only placeholder for MVP.
 * Backend filtering will be added in future iteration.
 *
 * @example
 * <EarningsCard />
 */
export function EarningsCard() {
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('all');

  const { earnings, isLoading, error } = useProviderEarnings();

  // Period button config
  const periods: { value: TimePeriod; label: string }[] = [
    { value: 'today', label: '오늘' },
    { value: 'week', label: '이번 주' },
    { value: 'month', label: '이번 달' },
    { value: 'all', label: '전체' },
  ];

  // Helper: Format number with thousands separator
  const formatNumber = (value: string): string => {
    const num = parseFloat(value);
    if (isNaN(num)) return '0.0000';
    return num.toLocaleString('ko-KR', {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    });
  };

  // Loading state with skeleton
  if (isLoading) {
    return (
      <div className="bg-gray-900 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">수익 관리</h2>
          <div className="h-8 bg-gray-800 rounded w-64 animate-pulse"></div>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-4 bg-gray-800/50 rounded-lg">
              <div className="h-3 bg-gray-700 rounded w-20 mb-2 animate-pulse"></div>
              <div className="h-6 bg-gray-700 rounded w-32 animate-pulse"></div>
            </div>
          ))}
        </div>
        <div className="mt-6 h-12 bg-gray-800 rounded animate-pulse"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-gray-900 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">수익 관리</h2>
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400 text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  // Format earnings values
  const totalEarnedFormatted = formatNumber(formatEther(earnings.totalEarned));
  const withdrawableFormatted = formatNumber(formatEther(earnings.withdrawable));
  const pendingFormatted = formatNumber(formatEther(earnings.pendingSettlement));

  return (
    <>
      <div className="bg-gray-900 rounded-xl p-6">
        {/* Header with time period selector */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <h2 className="text-xl font-bold text-white">수익 관리</h2>

          {/* Time period selector */}
          <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-1">
            {periods.map((period) => (
              <button
                key={period.value}
                onClick={() => setSelectedPeriod(period.value)}
                className={`
                  px-4 py-2 rounded text-sm font-medium transition-colors
                  ${
                    selectedPeriod === period.value
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }
                `}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>

        {/* Earnings breakdown */}
        <div className="space-y-4 mb-6">
          {/* Total Earned */}
          <div className="p-4 bg-gray-800/50 rounded-lg">
            <div className="text-sm text-gray-400 mb-1">총 수익</div>
            <div className="text-2xl font-bold text-white font-mono">
              {totalEarnedFormatted} <span className="text-lg text-gray-400">BNB</span>
            </div>
          </div>

          {/* Withdrawable */}
          <div className="p-4 bg-gray-800/50 rounded-lg border-2 border-purple-500/20">
            <div className="text-sm text-gray-400 mb-1">출금 가능</div>
            <div className="text-2xl font-bold text-purple-400 font-mono">
              {withdrawableFormatted} <span className="text-lg text-gray-400">BNB</span>
            </div>
          </div>

          {/* Pending Settlement */}
          <div className="p-4 bg-gray-800/50 rounded-lg">
            <div className="text-sm text-gray-400 mb-1">정산 대기</div>
            <div className="text-2xl font-bold text-white font-mono">
              {pendingFormatted} <span className="text-lg text-gray-400">BNB</span>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              정산은 매시간 자동으로 처리됩니다
            </div>
          </div>
        </div>

        {/* Withdraw button */}
        <button
          onClick={() => setWithdrawOpen(true)}
          disabled={earnings.withdrawable === BigInt(0)}
          className={`
            w-full py-4 rounded-lg font-medium text-lg transition-colors
            ${
              earnings.withdrawable === BigInt(0)
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }
          `}
        >
          출금
        </button>
      </div>

      {/* Withdraw Modal from Phase 6 */}
      <WithdrawModal isOpen={withdrawOpen} onClose={() => setWithdrawOpen(false)} />
    </>
  );
}

export default EarningsCard;
