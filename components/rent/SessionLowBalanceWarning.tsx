'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

interface SessionLowBalanceWarningProps {
  /** Current deposit balance in USDT */
  balance: string;
  /** Price per second for cost calculation */
  pricePerSecond: string;
  /** Callback when extend button clicked */
  onExtend: () => void;
  /** Callback when deposit button clicked */
  onDeposit: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * SessionLowBalanceWarning - Low balance alert banner for sessions
 *
 * Displays warning when deposit balance is insufficient for 1 hour of runtime.
 * Offers quick actions to extend session or deposit more funds.
 *
 * Warning threshold: < 1 hour of remaining runtime
 *
 * Features:
 * - Calculates remaining runtime from balance and hourly rate
 * - Shows estimated minutes remaining
 * - Action buttons: Extend session, Deposit funds
 * - Dismissible with session state tracking (resets when balance changes)
 *
 * Banner is yellow-themed to indicate caution without alarm.
 *
 * @example
 * <SessionLowBalanceWarning
 *   balance="5.50"
 *   pricePerSecond="0.00055"
 *   onExtend={() => setIsExtensionModalOpen(true)}
 *   onDeposit={() => router.push('/balance')}
 * />
 */
export function SessionLowBalanceWarning({
  balance,
  pricePerSecond,
  onExtend,
  onDeposit,
  className = '',
}: SessionLowBalanceWarningProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  // Calculate remaining runtime
  const balanceNum = parseFloat(balance);
  const pricePerSecNum = parseFloat(pricePerSecond);
  const hourlyRate = pricePerSecNum * 3600; // Convert to per-hour cost
  const remainingHours = balanceNum / hourlyRate;
  const remainingMinutes = remainingHours * 60;

  // Determine if low balance (< 1 hour runtime)
  const isLowBalance = remainingHours < 1;

  // Reset dismissal state when balance changes (user may have deposited)
  useEffect(() => {
    setIsDismissed(false);
  }, [balance]);

  // Don't show if not low balance or user dismissed
  if (!isLowBalance || isDismissed) {
    return null;
  }

  return (
    <div className={`bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        {/* Warning triangle icon */}
        <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />

        <div className="flex-1">
          <h4 className="text-yellow-400 font-medium mb-1">잔액 부족 경고</h4>
          <p className="text-sm text-gray-300 mb-3">
            현재 잔액으로 약 {Math.floor(remainingMinutes)}분 동안만 실행 가능합니다.
            세션이 종료되기 전에 연장하거나 입금하세요.
          </p>
          <div className="flex gap-2">
            <button
              onClick={onExtend}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors"
            >
              세션 연장
            </button>
            <button
              onClick={onDeposit}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg text-sm hover:bg-gray-600 transition-colors"
            >
              입금하기
            </button>
            <button
              onClick={() => setIsDismissed(true)}
              className="px-4 py-2 text-gray-400 text-sm hover:text-gray-300 transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
