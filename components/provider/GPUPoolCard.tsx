'use client';

import type { GPUAllocation } from '@/lib/api';

interface GPUPoolCardProps {
  allocation: GPUAllocation;
  className?: string;
}

/**
 * GPUPoolCard - GPU allocation progress bar display
 *
 * Shows Total / Mining / Rental / Available GPU counts
 * with a colored progress bar visualization.
 */
export function GPUPoolCard({ allocation, className = '' }: GPUPoolCardProps) {
  const { total, mining, rental, available } = allocation;
  const miningPct = total > 0 ? (mining / total) * 100 : 0;
  const rentalPct = total > 0 ? (rental / total) * 100 : 0;
  const availablePct = total > 0 ? (available / total) * 100 : 0;

  return (
    <div className={`bg-gray-900 border border-gray-800 rounded-xl p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-white mb-4">GPU 풀 현황</h3>

      {/* Progress bar */}
      <div className="w-full h-4 bg-gray-800 rounded-full overflow-hidden mb-4 flex">
        {miningPct > 0 && (
          <div
            className="h-full bg-blue-500 transition-all"
            style={{ width: `${miningPct}%` }}
            title={`채굴: ${mining}`}
          />
        )}
        {rentalPct > 0 && (
          <div
            className="h-full bg-purple-500 transition-all"
            style={{ width: `${rentalPct}%` }}
            title={`임대: ${rental}`}
          />
        )}
        {availablePct > 0 && (
          <div
            className="h-full bg-green-500 transition-all"
            style={{ width: `${availablePct}%` }}
            title={`가용: ${available}`}
          />
        )}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-gray-600" />
          <span className="text-sm text-gray-400">전체</span>
          <span className="text-sm text-white font-medium ml-auto">{total}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-sm text-gray-400">채굴</span>
          <span className="text-sm text-white font-medium ml-auto">{mining}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-purple-500" />
          <span className="text-sm text-gray-400">임대</span>
          <span className="text-sm text-white font-medium ml-auto">{rental}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-sm text-gray-400">가용</span>
          <span className="text-sm text-white font-medium ml-auto">{available}</span>
        </div>
      </div>
    </div>
  );
}

export default GPUPoolCard;
