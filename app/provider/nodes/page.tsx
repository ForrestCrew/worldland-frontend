'use client';

import { useState } from 'react';
import { useProviderNodes } from '@/hooks/useProviderNodes';
import { useProviderInfo, K8sNodeInfo } from '@/hooks/useProviderInfo';
import { NodeList } from '@/components/provider/NodeList';
import { PricingControl } from '@/components/provider/PricingControl';

function formatMemory(memStr: string): string {
  const ki = parseInt(memStr.replace('Ki', ''));
  if (isNaN(ki)) return memStr;
  return `${(ki / 1024 / 1024).toFixed(1)} GB`;
}

function K8sClusterCard({
  clusterHost,
  k8sNodes,
}: {
  clusterHost: string | null;
  k8sNodes: K8sNodeInfo[];
}) {
  const readyCount = k8sNodes.filter((n) => n.status === 'Ready').length;

  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-blue-500/30">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
          <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Kubernetes Cluster</h3>
          {clusterHost && (
            <p className="text-sm text-gray-400">{clusterHost}</p>
          )}
        </div>
        <div className="ml-auto">
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-500/20 text-blue-400">
            K8s
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-gray-800/50 rounded-lg p-3">
          <p className="text-xs text-gray-500">Total Nodes</p>
          <p className="text-xl font-bold text-white">{k8sNodes.length}</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3">
          <p className="text-xs text-gray-500">Ready</p>
          <p className="text-xl font-bold text-green-400">{readyCount}</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3">
          <p className="text-xs text-gray-500">Not Ready</p>
          <p className="text-xl font-bold text-red-400">{k8sNodes.length - readyCount}</p>
        </div>
      </div>

      {k8sNodes.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 border-b border-gray-800">
                <th className="text-left py-2 px-3">Name</th>
                <th className="text-left py-2 px-3">Status</th>
                <th className="text-left py-2 px-3">Roles</th>
                <th className="text-left py-2 px-3">Version</th>
                <th className="text-left py-2 px-3">CPU</th>
                <th className="text-left py-2 px-3">Memory</th>
                <th className="text-left py-2 px-3">Arch</th>
              </tr>
            </thead>
            <tbody>
              {k8sNodes.map((node) => (
                <tr key={node.name} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="py-2 px-3 text-white font-medium">{node.name}</td>
                  <td className="py-2 px-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      node.status === 'Ready'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {node.status}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-gray-400">{node.roles.join(', ')}</td>
                  <td className="py-2 px-3 text-gray-400">{node.kubeletVersion}</td>
                  <td className="py-2 px-3 text-gray-300">{node.cpus} cores</td>
                  <td className="py-2 px-3 text-gray-300">{formatMemory(node.memory)}</td>
                  <td className="py-2 px-3 text-gray-400">{node.arch}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function NodesPage() {
  const { nodes, isLoading, error, refetch } = useProviderNodes();
  const { isK8s, k8sNodes, clusterHost, refetch: refetchProvider } = useProviderInfo();

  const [pricingModal, setPricingModal] = useState<{
    isOpen: boolean;
    nodeId: string;
    currentPricePerSec: string;
  }>({
    isOpen: false,
    nodeId: '',
    currentPricePerSec: '0',
  });

  const handleEditPrice = (nodeId: string, currentPricePerSec: string) => {
    setPricingModal({ isOpen: true, nodeId, currentPricePerSec });
  };

  const handleRefresh = () => {
    refetch();
    refetchProvider();
  };

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

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">노드 개요</h2>
          <button onClick={handleRefresh}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors">
            새로고침
          </button>
        </div>
        <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400">{error.message}</p>
        </div>
      </div>
    );
  }

  const hasContent = nodes.length > 0 || isK8s;

  if (!hasContent) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">노드 개요</h2>
          <button onClick={handleRefresh}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors">
            새로고침
          </button>
        </div>
        <div className="p-12 text-center text-gray-400 bg-gray-900 rounded-xl">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
          </svg>
          <p className="text-lg">등록된 노드가 없습니다</p>
          <p className="text-sm text-gray-500 mt-2">대시보드에서 노드를 등록하세요</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">
          노드 개요 ({nodes.length}개)
        </h2>
        <button onClick={handleRefresh}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors">
          새로고침
        </button>
      </div>

      {isK8s && (
        <K8sClusterCard clusterHost={clusterHost} k8sNodes={k8sNodes} />
      )}

      {nodes.length > 0 && (
        <div className="bg-gray-900 rounded-xl p-6">
          <NodeList nodes={nodes} onEditPrice={handleEditPrice} />
        </div>
      )}

      <PricingControl
        isOpen={pricingModal.isOpen}
        onClose={() => setPricingModal({ isOpen: false, nodeId: '', currentPricePerSec: '0' })}
        nodeId={pricingModal.nodeId}
        currentPricePerSec={pricingModal.currentPricePerSec}
      />
    </div>
  );
}
