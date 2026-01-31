'use client';

import React, { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from '@tanstack/react-table';
import { formatEther } from 'viem';
import type { ProviderNode } from '@/hooks/useProviderNodes';

/**
 * NodeList component props
 */
interface NodeListProps {
  /** Array of provider nodes */
  nodes: ProviderNode[];
  /** Callback when edit price button is clicked */
  onEditPrice?: (nodeId: string, currentPricePerSec: string) => void;
}

const columnHelper = createColumnHelper<ProviderNode>();

/**
 * NodeList - Sortable table of provider's GPU nodes
 *
 * Uses TanStack Table for sorting and data management.
 * Displays GPU type, status badge, per-hour pricing, and edit button.
 *
 * Features:
 * - Sortable columns
 * - Status badges (green for online, gray for offline)
 * - Price conversion from per-second to per-hour
 * - Responsive: hides actions column on mobile (md:table-cell)
 * - Returns null when no nodes (parent should show SetupGuide)
 *
 * Korean column headers: "GPU", "상태", "가격", "관리"
 *
 * @example
 * <NodeList
 *   nodes={providerNodes}
 *   onEditPrice={(nodeId, currentPrice) => {
 *     setPricingModal({ isOpen: true, nodeId, currentPrice });
 *   }}
 * />
 */
export function NodeList({ nodes, onEditPrice }: NodeListProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);

  // Column definitions
  const columns = useMemo(
    () => [
      columnHelper.accessor('gpu_type', {
        id: 'gpu',
        header: 'GPU',
        cell: (info) => (
          <div className="font-medium text-white">
            {info.getValue()}
          </div>
        ),
      }),
      columnHelper.accessor('status', {
        id: 'status',
        header: '상태',
        cell: (info) => {
          const status = info.getValue();
          const isOnline = status === 'ONLINE' || status === 'RENTED';
          return (
            <span
              className={`
                inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium
                ${isOnline
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-gray-500/20 text-gray-400'
                }
              `}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-400' : 'bg-gray-400'}`} />
              {isOnline ? '온라인' : '오프라인'}
            </span>
          );
        },
      }),
      columnHelper.accessor('price_per_sec', {
        id: 'price',
        header: '가격',
        cell: (info) => {
          // Convert per-second to per-hour for display
          const pricePerSec = BigInt(info.getValue());
          const pricePerHour = pricePerSec * BigInt(3600);
          const formatted = formatEther(pricePerHour);
          return (
            <div className="text-gray-300">
              {Number(formatted).toFixed(4)} WLC/hr
            </div>
          );
        },
      }),
      columnHelper.display({
        id: 'actions',
        header: '관리',
        cell: (info) => (
          <button
            onClick={() => {
              if (onEditPrice) {
                onEditPrice(info.row.original.id, info.row.original.price_per_sec);
              }
            }}
            className="
              px-3 py-1 text-sm font-medium text-purple-400 hover:text-purple-300
              transition-colors
            "
          >
            가격 수정
          </button>
        ),
      }),
    ],
    [onEditPrice]
  );

  const table = useReactTable({
    data: nodes,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // Return null if no nodes (parent should show SetupGuide instead)
  if (nodes.length === 0) {
    return null;
  }

  return (
    <div className="overflow-x-auto">
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
                          ? 'cursor-pointer select-none hover:text-white transition-colors'
                          : ''
                      }
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {{
                        asc: ' 🔼',
                        desc: ' 🔽',
                      }[header.column.getIsSorted() as string] ?? null}
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
    </div>
  );
}

export default NodeList;
