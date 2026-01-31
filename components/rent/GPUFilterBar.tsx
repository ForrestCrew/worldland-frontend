'use client';

import { useState, useCallback } from 'react';
import { parseEther } from 'viem';
import type { GPUFilters } from '@/hooks/useAvailableGPUs';

/**
 * GPUFilterBar component props
 */
interface GPUFilterBarProps {
  /** Current filter values */
  filters: GPUFilters;
  /** Callback when filters change */
  onFiltersChange: (filters: GPUFilters) => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Available region options
 */
const REGION_OPTIONS = [
  { value: '', label: '전체 지역' },
  { value: 'asia', label: '아시아' },
  { value: 'us', label: '북미' },
  { value: 'eu', label: '유럽' },
];

/**
 * Available VRAM options (in GB)
 */
const VRAM_OPTIONS = [
  { value: 0, label: '전체 VRAM' },
  { value: 8, label: '8 GB 이상' },
  { value: 16, label: '16 GB 이상' },
  { value: 24, label: '24 GB 이상' },
  { value: 48, label: '48 GB 이상' },
];

/**
 * GPUFilterBar - Search and filter controls for GPU marketplace
 *
 * Features:
 * - Search input for GPU model (gpuType)
 * - Max price filter (converted to wei for API)
 * - Min VRAM selector
 * - Region selector
 * - Clear filters button
 * - Korean UI labels
 *
 * Price is entered in WLC/hour and converted to wei per hour for the hook.
 *
 * @example
 * <GPUFilterBar
 *   filters={filters}
 *   onFiltersChange={setFilters}
 * />
 */
export function GPUFilterBar({
  filters,
  onFiltersChange,
  className = '',
}: GPUFilterBarProps) {
  // Local state for price input (user enters per-hour value)
  const [priceInput, setPriceInput] = useState('');

  /**
   * Handle search input change
   */
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const gpuType = e.target.value || undefined;
      onFiltersChange({ ...filters, gpuType });
    },
    [filters, onFiltersChange]
  );

  /**
   * Handle price filter change
   * User enters per-hour price, we convert to wei
   */
  const handlePriceChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setPriceInput(value);

      if (!value || parseFloat(value) <= 0) {
        onFiltersChange({ ...filters, maxPricePerHour: undefined });
        return;
      }

      try {
        // Convert user input (WLC/hour) to wei
        const maxPricePerHour = parseEther(value).toString();
        onFiltersChange({ ...filters, maxPricePerHour });
      } catch {
        // Invalid input, don't update filter
      }
    },
    [filters, onFiltersChange]
  );

  /**
   * Handle VRAM filter change
   */
  const handleVramChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const minVram = parseInt(e.target.value) || undefined;
      onFiltersChange({ ...filters, minVram });
    },
    [filters, onFiltersChange]
  );

  /**
   * Handle region filter change
   */
  const handleRegionChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const region = e.target.value || undefined;
      onFiltersChange({ ...filters, region });
    },
    [filters, onFiltersChange]
  );

  /**
   * Clear all filters
   */
  const handleClearFilters = useCallback(() => {
    setPriceInput('');
    onFiltersChange({});
  }, [onFiltersChange]);

  /**
   * Check if any filters are active
   */
  const hasActiveFilters =
    !!filters.gpuType ||
    !!filters.maxPricePerHour ||
    !!filters.minVram ||
    !!filters.region;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search and filters row */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* GPU model search */}
        <div className="flex-1">
          <label className="block text-sm text-gray-400 mb-2">
            GPU 검색
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="RTX 4090, A100..."
              value={filters.gpuType || ''}
              onChange={handleSearchChange}
              className="
                w-full bg-gray-800 border border-gray-700 rounded-lg
                p-3 pl-10 text-white
                placeholder:text-gray-500
                focus:outline-none focus:border-purple-500
              "
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Max price filter */}
        <div className="w-full md:w-48">
          <label className="block text-sm text-gray-400 mb-2">
            최대 가격 (WLC/시간)
          </label>
          <input
            type="number"
            placeholder="0.00"
            value={priceInput}
            onChange={handlePriceChange}
            min="0"
            step="0.01"
            className="
              w-full bg-gray-800 border border-gray-700 rounded-lg
              p-3 text-white
              placeholder:text-gray-500
              focus:outline-none focus:border-purple-500
              [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
            "
          />
        </div>

        {/* VRAM filter */}
        <div className="w-full md:w-40">
          <label className="block text-sm text-gray-400 mb-2">
            최소 VRAM
          </label>
          <select
            value={filters.minVram || 0}
            onChange={handleVramChange}
            className="
              w-full bg-gray-800 border border-gray-700 rounded-lg
              p-3 text-white
              focus:outline-none focus:border-purple-500
              cursor-pointer
            "
          >
            {VRAM_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Region filter */}
        <div className="w-full md:w-40">
          <label className="block text-sm text-gray-400 mb-2">
            지역
          </label>
          <select
            value={filters.region || ''}
            onChange={handleRegionChange}
            className="
              w-full bg-gray-800 border border-gray-700 rounded-lg
              p-3 text-white
              focus:outline-none focus:border-purple-500
              cursor-pointer
            "
          >
            {REGION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Clear filters button */}
      {hasActiveFilters && (
        <div className="flex justify-end">
          <button
            onClick={handleClearFilters}
            className="
              flex items-center gap-2 px-4 py-2 text-sm
              text-gray-400 hover:text-white
              transition-colors
            "
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            필터 초기화
          </button>
        </div>
      )}
    </div>
  );
}

export default GPUFilterBar;
