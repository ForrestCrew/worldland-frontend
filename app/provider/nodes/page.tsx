'use client';

import { useState } from 'react';
import { useProviderNodes } from '@/hooks/useProviderNodes';
import { NodeList } from '@/components/provider/NodeList';
import { PricingControl } from '@/components/provider/PricingControl';

/**
 * NodesPage - Full-page node list and management
 *
 * Features:
 * - Full node list with NodeList component (no truncation)
 * - PricingControl modal for price editing
 * - Manual refresh button
 * - Auto-refresh via hook polling (30s)
 * - Loading and error states
 * - Korean section header: "노드 개요"
 *
 * @example
 * // Route: /provider/nodes
 * // Shows complete node list with detail view capability
 */
export default function NodesPage() {
  const { nodes, isLoading, error, refetch } = useProviderNodes();

  const [pricingModal, setPricingModal] = useState<{
    isOpen: boolean;
    nodeId: string;
    currentPricePerSec: string;
  }>({
    isOpen: false,
    nodeId: '',
    currentPricePerSec: '0',
  });

  // Handle edit price callback
  const handleEditPrice = (nodeId: string, currentPricePerSec: string) => {
    setPricingModal({
      isOpen: true,
      nodeId,
      currentPricePerSec,
    });
  };

  // Handle manual refresh
  const handleRefresh = () => {
    refetch();
  };

  // Loading state with skeleton
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-800 rounded w-32 animate-pulse"></div>
          <div className="h-10 bg-gray-800 rounded w-24 animate-pulse"></div>
        </div>
        <div className="bg-gray-900 rounded-xl p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-800 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">노드 개요</h2>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
          >
            새로고침
          </button>
        </div>

        <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400">{error.message}</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (nodes.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">노드 개요</h2>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
          >
            새로고침
          </button>
        </div>

        <div className="p-12 text-center text-gray-400 bg-gray-900 rounded-xl">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-gray-600"
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
          <p className="text-lg">등록된 노드가 없습니다</p>
          <p className="text-sm text-gray-500 mt-2">
            대시보드에서 노드를 등록하세요
          </p>
        </div>
      </div>
    );
  }

  // Main nodes page with full list
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">
          노드 개요 ({nodes.length}개)
        </h2>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
        >
          새로고침
        </button>
      </div>

      {/* Node list */}
      <div className="bg-gray-900 rounded-xl p-6">
        <NodeList nodes={nodes} onEditPrice={handleEditPrice} />
      </div>

      {/* PricingControl modal */}
      <PricingControl
        isOpen={pricingModal.isOpen}
        onClose={() =>
          setPricingModal({
            isOpen: false,
            nodeId: '',
            currentPricePerSec: '0',
          })
        }
        nodeId={pricingModal.nodeId}
        currentPricePerSec={pricingModal.currentPricePerSec}
      />
    </div>
  );
}
