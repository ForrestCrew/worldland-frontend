'use client';

import { useState, useEffect } from 'react';
import { useProviderNodes } from '@/hooks/useProviderNodes';
import { useProviderRentals } from '@/hooks/useProviderRentals';
import { ProviderStats } from '@/components/provider/ProviderStats';
import { SetupGuide } from '@/components/provider/SetupGuide';
import { NodeList } from '@/components/provider/NodeList';
import { RentalList } from '@/components/provider/RentalList';
import { EarningsCard } from '@/components/provider/EarningsCard';
import { PricingControl } from '@/components/provider/PricingControl';
import { MiningDashboard } from '@/components/provider/MiningDashboard';
import type { ProviderType } from '@/lib/api';

/**
 * ProviderDashboardPage - Main provider dashboard page
 *
 * Features:
 * - provider_type branching: docker vs k8s
 * - Docker: NodeList + EarningsCard + RentalList
 * - K8s: Cluster info + GPU Pool + Mining status + RentalList
 * - Empty state: SetupGuide → /provider/register link
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

  // Detect provider type from nodes or auth
  const [providerType, setProviderType] = useState<ProviderType | null>(null);
  const [providerId, setProviderId] = useState<string | undefined>();

  useEffect(() => {
    // Check provider_type from nodes
    if (nodes.length > 0 && nodes[0].provider_type) {
      setProviderType(nodes[0].provider_type);
    }
    // Get provider ID from auth
    try {
      const storedAuth = localStorage.getItem('worldland_auth');
      if (storedAuth) {
        const parsed = JSON.parse(storedAuth);
        setProviderId(parsed.provider_id);
      }
    } catch {
      // ignore
    }
  }, [nodes]);

  const handleRefresh = () => {
    refetchNodes();
    refetchRentals();
  };

  const handleEditPrice = (nodeId: string, currentPricePerSec: string) => {
    setPricingModal({ isOpen: true, nodeId, currentPricePerSec });
  };

  // Loading state
  if (nodesLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-6 bg-gray-800 rounded w-48 animate-pulse"></div>
          <div className="h-10 bg-gray-800 rounded w-24 animate-pulse"></div>
        </div>
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
          <button onClick={handleRefresh} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors">
            새로고침
          </button>
        </div>
        <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400">{nodesError.message}</p>
        </div>
      </div>
    );
  }

  // Empty state: No nodes registered
  if (nodes.length === 0) {
    return <SetupGuide onRefresh={handleRefresh} />;
  }

  // K8s provider dashboard
  if (providerType === 'k8s') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ProviderStats nodes={nodes} />
            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-500/20 text-blue-400">
              ☸️ K8s
            </span>
          </div>
          <button onClick={handleRefresh} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors">
            새로고침
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* GPU Pool + Mining Status */}
          <div className="lg:col-span-2">
            {providerId && <MiningDashboard providerId={providerId} />}
          </div>

          {/* Earnings */}
          <div className="lg:col-span-1">
            <EarningsCard />
          </div>
        </div>

        {/* Node list */}
        <div className="bg-gray-900 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">내 노드</h2>
          <NodeList nodes={nodes} onEditPrice={handleEditPrice} />
        </div>

        {/* Rental list */}
        {rentals.length > 0 && <RentalList />}

        <PricingControl
          isOpen={pricingModal.isOpen}
          onClose={() => setPricingModal({ isOpen: false, nodeId: '', currentPricePerSec: '0' })}
          nodeId={pricingModal.nodeId}
          currentPricePerSec={pricingModal.currentPricePerSec}
        />
      </div>
    );
  }

  // Docker provider dashboard (default)
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ProviderStats nodes={nodes} />
          {providerType === 'docker' && (
            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-cyan-500/20 text-cyan-400">
              🐳 Docker
            </span>
          )}
        </div>
        <button onClick={handleRefresh} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors">
          새로고침
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gray-900 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">내 노드</h2>
          <NodeList nodes={nodes} onEditPrice={handleEditPrice} />
        </div>
        <div className="lg:col-span-1">
          <EarningsCard />
        </div>
      </div>

      {rentals.length > 0 && <RentalList />}

      <PricingControl
        isOpen={pricingModal.isOpen}
        onClose={() => setPricingModal({ isOpen: false, nodeId: '', currentPricePerSec: '0' })}
        nodeId={pricingModal.nodeId}
        currentPricePerSec={pricingModal.currentPricePerSec}
      />
    </div>
  );
}
