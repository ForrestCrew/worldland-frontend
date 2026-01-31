'use client';

import { useState, useCallback } from 'react';
import { useAvailableGPUs, type GPUFilters, type AvailableGPU } from '@/hooks/useAvailableGPUs';
import {
  GPUFilterBar,
  GPUList,
  RentalStartModal,
} from '@/components/rent';

/**
 * GPU Marketplace Page
 *
 * Features:
 * - Search and filter GPUs via GPUFilterBar
 * - Sortable GPU list via GPUList (TanStack Table)
 * - Rental start modal with gas preview
 * - Auto-refresh every 30 seconds (via useAvailableGPUs)
 * - Korean UI labels
 *
 * User Flow:
 * 1. Browse available GPUs with search/filter/sort
 * 2. Click "임대하기" on desired GPU
 * 3. Enter SSH public key in modal
 * 4. Review gas estimate
 * 5. Confirm rental start
 * 6. Receive SSH credentials on success
 *
 * @route /rent
 */
export default function RentPage() {
  // Filter state
  const [filters, setFilters] = useState<GPUFilters>({});

  // Selected GPU for rental modal
  const [selectedGPU, setSelectedGPU] = useState<AvailableGPU | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch available GPUs with current filters
  const { gpus, isLoading, error, refetch } = useAvailableGPUs(filters);

  /**
   * Handle rent button click
   */
  const handleRent = useCallback((gpu: AvailableGPU) => {
    setSelectedGPU(gpu);
    setIsModalOpen(true);
  }, []);

  /**
   * Handle modal close
   */
  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setSelectedGPU(null);
    // Refetch GPUs after rental to update availability
    refetch();
  }, [refetch]);

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-white">GPU 마켓플레이스</h1>
          <p className="text-gray-400 mt-2">
            사용 가능한 GPU를 검색하고 임대하세요
          </p>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filter bar */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
          <GPUFilterBar
            filters={filters}
            onFiltersChange={setFilters}
          />
        </div>

        {/* GPU list */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl">
          {/* List header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-800">
            <div>
              <h2 className="text-lg font-medium text-white">
                사용 가능한 GPU
              </h2>
              {!isLoading && (
                <p className="text-sm text-gray-400">
                  {gpus.length}개의 GPU 발견
                </p>
              )}
            </div>
            <button
              onClick={() => refetch()}
              disabled={isLoading}
              className="
                flex items-center gap-2 px-4 py-2 text-sm
                text-gray-400 hover:text-white
                transition-colors disabled:opacity-50
              "
            >
              <svg
                className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              새로고침
            </button>
          </div>

          {/* Error state */}
          {error && (
            <div className="p-6">
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-400">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="font-medium">데이터를 불러올 수 없습니다</span>
                </div>
                <p className="text-sm text-red-300 mt-2">
                  {error.message}
                </p>
                <button
                  onClick={() => refetch()}
                  className="mt-3 px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  다시 시도
                </button>
              </div>
            </div>
          )}

          {/* GPU table */}
          {!error && (
            <GPUList
              gpus={gpus}
              isLoading={isLoading}
              onRent={handleRent}
              className="p-4"
            />
          )}
        </div>

        {/* Info section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-5 h-5 text-purple-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">
              즉시 사용 가능
            </h3>
            <p className="text-sm text-gray-400">
              임대 시작 즉시 SSH로 접속 가능. 복잡한 설정 없이 바로 GPU를 사용하세요.
            </p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-5 h-5 text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">
              사용한 만큼만
            </h3>
            <p className="text-sm text-gray-400">
              초 단위로 정산. 필요한 만큼만 사용하고 언제든 종료할 수 있습니다.
            </p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-5 h-5 text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">
              블록체인 보장
            </h3>
            <p className="text-sm text-gray-400">
              모든 거래가 블록체인에 기록되어 투명하고 안전하게 보호됩니다.
            </p>
          </div>
        </div>
      </div>

      {/* Rental start modal */}
      <RentalStartModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        gpu={selectedGPU}
      />
    </div>
  );
}
