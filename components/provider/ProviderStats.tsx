'use client';

import type { ProviderNode } from '@/hooks/useProviderNodes';

interface ProviderStatsProps {
  nodes: ProviderNode[];
}

/**
 * ProviderStats - Summary bar showing online/offline node counts
 *
 * Displays:
 * - Total node count
 * - Online nodes (green badge)
 * - Offline nodes (gray badge)
 * - Provider type badge (Docker/K8s) if available
 */
export function ProviderStats({ nodes }: ProviderStatsProps) {
  const total = nodes.length;
  const online = nodes.filter(n => n.status === 'ONLINE' || n.status === 'RENTED').length;
  const offline = nodes.filter(n => n.status === 'OFFLINE').length;

  return (
    <div className="flex items-center gap-4 text-sm text-gray-400">
      <span className="font-medium text-white">
        전체 {total}개 노드
      </span>

      <span>•</span>

      <div className="flex items-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
        <span>온라인 {online}</span>
      </div>

      <div className="flex items-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-gray-500" />
        <span>오프라인 {offline}</span>
      </div>
    </div>
  );
}

export default ProviderStats;
