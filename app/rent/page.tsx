'use client';

import { useState, useMemo, useCallback } from 'react';
import { useGPUTypes, type GPUTypeInfo } from '@/hooks/useGPUTypes';
import { GPUTypeCard, GPUDeployPanel, GPUFilterBar } from '@/components/rent';
import type { GPUFilters } from '@/hooks/useAvailableGPUs';

/**
 * GPU Marketplace Page - RunPod-style
 *
 * 2-stage flow:
 * 1. GPU type card grid (useGPUTypes) with search/filter
 * 2. GPU deploy panel (selected GPU type) with node selection + rental
 *
 * @route /rent
 */
export default function RentPage() {
  const { gpuTypes, isLoading, error, refetch } = useGPUTypes();
  const [selectedType, setSelectedType] = useState<GPUTypeInfo | null>(null);
  const [filters, setFilters] = useState<GPUFilters>({});

  // Client-side filtering of GPU types
  const filteredTypes = useMemo(() => {
    return gpuTypes.filter((gpu) => {
      // Search by model name
      if (filters.gpuType) {
        const search = filters.gpuType.toLowerCase();
        if (!gpu.gpuModel.toLowerCase().includes(search)) {
          return false;
        }
      }
      // Min VRAM
      if (filters.minVram && gpu.vramGb < filters.minVram) {
        return false;
      }
      // Max price (compare float values, filters.maxPricePerHour is in wei)
      if (filters.maxPricePerHour) {
        const maxWeiPerHour = BigInt(filters.maxPricePerHour);
        const gpuPriceWeiPerHour = BigInt(Math.floor(parseFloat(gpu.pricePerHour) * 1e18));
        if (gpuPriceWeiPerHour > maxWeiPerHour) {
          return false;
        }
      }
      return true;
    });
  }, [gpuTypes, filters]);

  const handleBack = useCallback(() => {
    setSelectedType(null);
  }, []);

  // Stage 2: Deploy panel
  if (selectedType) {
    return (
      <div className="min-h-screen bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <GPUDeployPanel gpu={selectedType} onBack={handleBack} />
        </div>
      </div>
    );
  }

  // Stage 1: GPU type card grid
  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-white">GPU Marketplace</h1>
          <p className="text-gray-400 mt-2">
            Browse available GPUs and deploy in seconds
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

        {/* Results header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-medium text-white">
              Available GPUs
            </h2>
            {!isLoading && (
              <p className="text-sm text-gray-400">
                {filteredTypes.length} GPU {filteredTypes.length === 1 ? 'type' : 'types'}
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
            Refresh
          </button>
        </div>

        {/* Error state */}
        {error && (
          <div className="mb-8">
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">Failed to load data</span>
              </div>
              <p className="text-sm text-red-300 mt-2">{error.message}</p>
              <button
                onClick={() => refetch()}
                className="mt-3 px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-52 bg-gray-900 border border-gray-800 rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && filteredTypes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <svg className="w-16 h-16 text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-300 mb-2">
              No GPUs Available
            </h3>
            <p className="text-sm text-gray-500 text-center max-w-sm">
              Try adjusting your filters or check back later.
            </p>
          </div>
        )}

        {/* GPU type card grid */}
        {!isLoading && !error && filteredTypes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTypes.map((gpu) => (
              <GPUTypeCard
                key={gpu.gpuModel}
                gpu={gpu}
                onClick={() => setSelectedType(gpu)}
              />
            ))}
          </div>
        )}

        {/* Info section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Lightning Fast</h3>
            <p className="text-sm text-gray-400">
              Deploy GPU instances in seconds. Instant SSH access with no complex setup required.
            </p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Enterprise Security</h3>
            <p className="text-sm text-gray-400">
              All transactions recorded on blockchain. Transparent and secure by design.
            </p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Infinite Scale</h3>
            <p className="text-sm text-gray-400">
              Pay per second. Scale up or down instantly, stop anytime you want.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
