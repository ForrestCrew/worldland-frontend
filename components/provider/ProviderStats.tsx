'use client';

import type { ProviderNode } from '@/hooks/useProviderNodes';

/**
 * ProviderStats component props
 */
interface ProviderStatsProps {
  /** Array of provider nodes */
  nodes: ProviderNode[];
}

/**
 * ProviderStats - Summary bar showing online/offline node counts
 *
 * Displays provider's node status at a glance:
 * - Total node count
 * - Online nodes (green badge)
 * - Offline nodes (gray badge)
 *
 * Korean labels for UI.
 *
 * @example
 * <ProviderStats nodes={nodes} />
 * // Shows: "전체 4개 노드 • 온라인 3 • 오프라인 1"
 */
export function ProviderStats({ nodes }: ProviderStatsProps) {
  const total = nodes.length;
  const online = nodes.filter(n => n.status === 'ONLINE' || n.status === 'RENTED').length;
  const offline = nodes.filter(n => n.status === 'OFFLINE').length;

  return (
    <div className="flex items-center gap-4 text-sm text-gray-400">
      {/* Total count */}
      <span className="font-medium text-white">
        전체 {total}개 노드
      </span>

      {/* Separator */}
      <span>•</span>

      {/* Online badge */}
      <div className="flex items-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
        <span>온라인 {online}</span>
      </div>

      {/* Offline badge */}
      <div className="flex items-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-gray-500" />
        <span>오프라인 {offline}</span>
      </div>
    </div>
  );
}

export default ProviderStats;
