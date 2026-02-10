'use client';

import React, { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type SortingFn,
} from '@tanstack/react-table';
import type { AvailableGPU } from '@/hooks/useAvailableGPUs';

/**
 * GPUList component props
 */
interface GPUListProps {
  /** Array of available GPUs */
  gpus: AvailableGPU[];
  /** Whether data is loading */
  isLoading: boolean;
  /** Callback when rent button is clicked */
  onRent: (gpu: AvailableGPU) => void;
  /** Additional CSS classes */
  className?: string;
}

const columnHelper = createColumnHelper<AvailableGPU>();

/**
 * Numeric sorting function for price comparison
 * Compares human-readable pricePerHour values
 */
const priceSortingFn: SortingFn<AvailableGPU> = (rowA, rowB) => {
  const priceA = parseFloat(rowA.original.pricePerHour || '0');
  const priceB = parseFloat(rowB.original.pricePerHour || '0');
  return priceA - priceB;
};

/**
 * Loading skeleton row for GPU table
 */
function SkeletonRow() {
  return (
    <tr className="border-b border-gray-800">
      <td className="px-4 py-4">
        <div className="h-5 w-32 bg-gray-700 rounded animate-pulse" />
      </td>
      <td className="px-4 py-4">
        <div className="h-5 w-16 bg-gray-700 rounded animate-pulse" />
      </td>
      <td className="px-4 py-4">
        <div className="h-5 w-12 bg-gray-700 rounded animate-pulse" />
      </td>
      <td className="px-4 py-4">
        <div className="h-5 w-10 bg-gray-700 rounded animate-pulse" />
      </td>
      <td className="px-4 py-4">
        <div className="h-5 w-14 bg-gray-700 rounded animate-pulse" />
      </td>
      <td className="px-4 py-4">
        <div className="h-5 w-24 bg-gray-700 rounded animate-pulse" />
      </td>
      <td className="px-4 py-4">
        <div className="h-5 w-16 bg-gray-700 rounded animate-pulse" />
      </td>
      <td className="px-4 py-4 hidden md:table-cell">
        <div className="h-8 w-20 bg-gray-700 rounded animate-pulse" />
      </td>
    </tr>
  );
}

/**
 * Empty state component when no GPUs match filters
 */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <svg
        className="w-16 h-16 text-gray-600 mb-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
        />
      </svg>
      <h3 className="text-lg font-medium text-gray-300 mb-2">
        No GPUs Available
      </h3>
      <p className="text-sm text-gray-500 text-center max-w-sm">
        No GPUs match your current filters. Try adjusting filters or check back later.
      </p>
    </div>
  );
}

/**
 * GPUList - Sortable GPU table for marketplace
 *
 * Uses TanStack Table for sorting and data management.
 * Displays GPU model, VRAM, per-hour price, region, and rent action.
 *
 * Features:
 * - TanStack Table with useReactTable, getCoreRowModel, getSortedRowModel
 * - Custom sortingFn for BigInt price comparison (Pitfall 3)
 * - Price displayed per hour (converted from per-second storage)
 * - Sortable price column
 * - Loading skeleton state
 * - Empty state for no results
 * - Column headers: "GPU", "VRAM", "Price", "Region", "Rent"
 *
 * @example
 * <GPUList
 *   gpus={availableGPUs}
 *   isLoading={isLoading}
 *   onRent={(gpu) => openRentalModal(gpu)}
 * />
 */
export function GPUList({
  gpus,
  isLoading,
  onRent,
  className = '',
}: GPUListProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);

  // Column definitions
  const columns = useMemo(
    () => [
      columnHelper.accessor('gpuType', {
        id: 'gpu',
        header: 'GPU',
        cell: (info) => (
          <div className="font-medium text-white">
            {info.getValue()}
          </div>
        ),
      }),
      columnHelper.accessor('vramGb', {
        id: 'vram',
        header: 'VRAM',
        cell: (info) => (
          <div className="text-gray-300">
            {info.getValue()} GB
          </div>
        ),
      }),
      columnHelper.accessor('availableGpus', {
        id: 'gpuCount',
        header: 'GPU Count',
        cell: (info) => {
          const row = info.row.original;
          return (
            <div className="text-gray-300">
              {row.availableGpus}/{row.totalGpus}
            </div>
          );
        },
      }),
      columnHelper.accessor('totalCpuCores', {
        id: 'cpu',
        header: 'CPU',
        cell: (info) => (
          <div className="text-gray-300">
            {info.getValue()}c
          </div>
        ),
      }),
      columnHelper.accessor('totalMemoryGb', {
        id: 'memory',
        header: 'Memory',
        cell: (info) => (
          <div className="text-gray-300">
            {info.getValue()} GB
          </div>
        ),
      }),
      columnHelper.accessor('pricePerHour', {
        id: 'price',
        header: 'Price',
        sortingFn: priceSortingFn,
        cell: (info) => {
          const value = info.getValue();
          return (
            <div className="text-gray-300 font-mono">
              {Number(value || '0').toFixed(2)} WLC/hr
            </div>
          );
        },
      }),
      columnHelper.accessor('region', {
        id: 'region',
        header: 'Region',
        cell: (info) => {
          const region = info.getValue();
          const regionLabels: Record<string, string> = {
            asia: 'Asia',
            us: 'North America',
            eu: 'Europe',
          };
          return (
            <div className="text-gray-400">
              {regionLabels[region] || region}
            </div>
          );
        },
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Rent',
        cell: (info) => (
          <button
            onClick={() => onRent(info.row.original)}
            className="
              px-4 py-2 text-sm font-medium rounded-lg
              bg-purple-600 hover:bg-purple-700
              text-white transition-colors
            "
          >
            Rent
          </button>
        ),
      }),
    ],
    [onRent]
  );

  const table = useReactTable({
    data: gpus,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // Loading state
  if (isLoading) {
    return (
      <div className={`overflow-x-auto ${className}`}>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">GPU</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">VRAM</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">GPU Count</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">CPU</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Memory</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Price</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Region</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-400 hidden md:table-cell">Rent</th>
            </tr>
          </thead>
          <tbody>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </tbody>
        </table>
      </div>
    );
  }

  // Empty state
  if (gpus.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b border-gray-700">
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className={`
                    px-4 py-3 text-left text-sm font-medium text-gray-400
                    ${header.id === 'actions' ? 'hidden md:table-cell' : ''}
                  `}
                >
                  {header.isPlaceholder ? null : (
                    <div
                      className={
                        header.column.getCanSort()
                          ? 'cursor-pointer select-none hover:text-white transition-colors flex items-center gap-1'
                          : ''
                      }
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {/* Sort indicator */}
                      {header.column.getCanSort() && (
                        <span className="text-xs">
                          {{
                            asc: ' (low)',
                            desc: ' (high)',
                          }[header.column.getIsSorted() as string] ?? (
                            <svg
                              className="w-4 h-4 opacity-30"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                              />
                            </svg>
                          )}
                        </span>
                      )}
                    </div>
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
            >
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className={`
                    px-4 py-4 text-sm
                    ${cell.column.id === 'actions' ? 'hidden md:table-cell' : ''}
                  `}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile rent button - shows on row tap for mobile */}
      <div className="md:hidden mt-4 text-center text-sm text-gray-500">
        Tap a row to view GPU details
      </div>
    </div>
  );
}

export default GPUList;
