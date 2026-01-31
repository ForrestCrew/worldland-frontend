'use client';

import { useState } from 'react';
import { useProviderNodes } from '@/hooks/useProviderNodes';
import { useProviderRentals } from '@/hooks/useProviderRentals';
import { ProviderStats } from '@/components/provider/ProviderStats';
import { SetupGuide } from '@/components/provider/SetupGuide';
import { NodeList } from '@/components/provider/NodeList';
import { RentalList } from '@/components/provider/RentalList';
import { EarningsCard } from '@/components/provider/EarningsCard';
import { PricingControl } from '@/components/provider/PricingControl';

/**
 * ProviderDashboardPage - Main provider dashboard page
 *
 * Features:
 * - ProviderStats bar showing online/offline node counts
 * - Empty state (SetupGuide) when no nodes registered
 * - Node list and earnings card in 2/3 + 1/3 grid layout when nodes exist
 * - Active rentals list below
 * - Manual refresh button for all data
 * - PricingControl modal for updating node prices
 * - Auto-refresh via hook polling (30s for nodes/rentals)
 * - Mobile responsive: single column layout
 *
 * Layout:
 * - If nodes.length === 0: Show SetupGuide (empty state onboarding)
 * - If nodes.length > 0:
 *   - ProviderStats bar at top
 *   - Grid: 2/3 NodeList + 1/3 EarningsCard (desktop)
 *   - RentalList below (full width)
 *
 * @example
 * // Route: /provider
 * // Renders complete provider dashboard with all components
 */
export default function ProviderDashboardPage() {
  const { nodes, isLoading: nodesLoading, error: nodesError, refetch: refetchNodes } = useProviderNodes();
  const { rentals, refetch: refetchRentals } = useProviderRentals();

  const [pricingModal, setPricingModal] = useState<{
    isOpen: boolean;
    nodeId: string;
    currentPricePerSec: string;
  }>({
    isOpen: false,
    nodeId: '',
    currentPricePerSec: '0',
  });

  // Handle manual refresh
  const handleRefresh = () => {
    refetchNodes();
    refetchRentals();
  };

  // Handle edit price callback from NodeList
  const handleEditPrice = (nodeId: string, currentPricePerSec: string) => {
    setPricingModal({
      isOpen: true,
      nodeId,
      currentPricePerSec,
    });
  };

  // Loading state with skeleton
  if (nodesLoading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="h-6 bg-gray-800 rounded w-48 animate-pulse"></div>
          <div className="h-10 bg-gray-800 rounded w-24 animate-pulse"></div>
        </div>

        {/* Content skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-64 bg-gray-900 rounded-xl animate-pulse"></div>
          <div className="lg:col-span-1 h-64 bg-gray-900 rounded-xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (nodesError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">대시보드</h2>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
          >
            새로고침
          </button>
        </div>

        <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400">{nodesError.message}</p>
        </div>
      </div>
    );
  }

  // Empty state: No nodes registered yet
  if (nodes.length === 0) {
    return (
      <div>
        <SetupGuide onRefresh={handleRefresh} />
      </div>
    );
  }

  // Main dashboard: Has nodes
  return (
    <div className="space-y-6">
      {/* Header with stats and refresh button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <ProviderStats nodes={nodes} />
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
        >
          새로고침
        </button>
      </div>

      {/* Main grid: NodeList + EarningsCard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* NodeList (2/3 width on desktop) */}
        <div className="lg:col-span-2 bg-gray-900 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">내 노드</h2>
          <NodeList nodes={nodes} onEditPrice={handleEditPrice} />
        </div>

        {/* EarningsCard (1/3 width on desktop) */}
        <div className="lg:col-span-1">
          <EarningsCard />
        </div>
      </div>

      {/* RentalList (full width, only if rentals exist) */}
      {rentals.length > 0 && (
        <div>
          <RentalList />
        </div>
      )}

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
