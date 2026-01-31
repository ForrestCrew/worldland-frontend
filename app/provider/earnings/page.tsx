'use client';

import { EarningsCard } from '@/components/provider/EarningsCard';

/**
 * EarningsPage - Full-page earnings management
 *
 * Features:
 * - Full-page EarningsCard with withdrawal capability
 * - Korean section header: "수익 관리"
 * - Time period selector (Today, Week, Month, All time)
 * - Large display of withdrawable amount
 * - Prominent withdraw button
 * - WithdrawModal integration (reused from Phase 6)
 * - Auto-refresh via hook polling (60s)
 *
 * For MVP: Shows expanded EarningsCard with full functionality.
 * Future: Will add detailed settlement history table when API provides.
 *
 * @example
 * // Route: /provider/earnings
 * // Shows complete earnings management with withdrawal capability
 */
export default function EarningsPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-2">수익 관리</h2>
        <p className="text-gray-400 text-sm">
          총 수익과 출금 가능 금액을 확인하고 관리하세요
        </p>
      </div>

      {/* Earnings card (full width) */}
      <div>
        <EarningsCard />
      </div>

      {/* Future: Settlement history placeholder */}
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <h3 className="text-lg font-semibold text-white mb-4">정산 내역</h3>
        <div className="p-8 text-center text-gray-400">
          <svg
            className="w-12 h-12 mx-auto mb-3 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p>자세한 내역은 추후 업데이트됩니다</p>
          <p className="text-sm text-gray-500 mt-2">
            임대 정산 기록과 출금 히스토리가 여기에 표시됩니다
          </p>
        </div>
      </div>
    </div>
  );
}
