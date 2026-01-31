'use client';

import { useProviderRentals } from '@/hooks/useProviderRentals';
import { useProviderNodes } from '@/hooks/useProviderNodes';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

/**
 * RentalList component - Display active rentals for provider
 *
 * Features:
 * - Shows active rentals with GPU type, user address, start time, and status
 * - Auto-refreshes every 30 seconds via hook
 * - Korean relative time formatting ("2시간 전")
 * - Loading skeleton and empty state
 * - Total active rental count
 *
 * @example
 * <RentalList />
 */
export function RentalList() {
  const { rentals, isLoading, error } = useProviderRentals();
  const { nodes } = useProviderNodes();

  // Helper: Truncate address (0x1234...5678)
  const truncateAddress = (addr: string): string => {
    if (!addr) return '';
    return addr.slice(0, 6) + '...' + addr.slice(-4);
  };

  // Helper: Get GPU type from node association
  const getGpuType = (nodeId: string): string => {
    const node = nodes.find((n) => n.id === nodeId);
    return node?.gpu_type || 'Unknown';
  };

  // Helper: Get status badge
  const getStatusBadge = (status: string) => {
    if (status === 'RUNNING') {
      return (
        <span className="px-2 py-1 bg-green-500/10 text-green-400 rounded text-xs font-medium">
          진행 중
        </span>
      );
    }
    return (
      <span className="px-2 py-1 bg-gray-500/10 text-gray-400 rounded text-xs font-medium">
        {status}
      </span>
    );
  };

  // Loading state with skeleton
  if (isLoading) {
    return (
      <div className="bg-gray-900 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">활성 임대</h2>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg animate-pulse">
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-700 rounded w-24"></div>
                <div className="h-3 bg-gray-700 rounded w-32"></div>
              </div>
              <div className="h-6 bg-gray-700 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-gray-900 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">활성 임대</h2>
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400 text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (rentals.length === 0) {
    return (
      <div className="bg-gray-900 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">활성 임대: 0건</h2>
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
          <p>활성 임대가 없습니다</p>
        </div>
      </div>
    );
  }

  // Rental list with table
  return (
    <div className="bg-gray-900 rounded-xl p-6">
      <h2 className="text-xl font-bold text-white mb-4">
        활성 임대: {rentals.length}건
      </h2>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                GPU
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                사용자
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                시작
              </th>
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">
                상태
              </th>
            </tr>
          </thead>
          <tbody>
            {rentals.map((rental) => (
              <tr
                key={rental.id}
                className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
              >
                {/* GPU Type */}
                <td className="py-4 px-4">
                  <div className="text-white font-medium">
                    {getGpuType(rental.node_id)}
                  </div>
                </td>

                {/* User Address */}
                <td className="py-4 px-4">
                  <div className="text-gray-300 font-mono text-sm">
                    {truncateAddress(rental.renter_address)}
                  </div>
                </td>

                {/* Started (relative time) */}
                <td className="py-4 px-4">
                  <div className="text-gray-400 text-sm">
                    {formatDistanceToNow(new Date(rental.started_at), {
                      addSuffix: true,
                      locale: ko,
                    })}
                  </div>
                </td>

                {/* Status */}
                <td className="py-4 px-4 text-right">
                  {getStatusBadge(rental.status)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default RentalList;
