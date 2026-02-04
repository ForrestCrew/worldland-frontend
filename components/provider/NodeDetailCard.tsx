'use client';

import { formatDistanceToNow } from 'date-fns';
import { formatEther } from 'viem';
import type { ProviderNode } from '@/hooks/useProviderNodes';

/**
 * Active rental data (if any)
 */
export interface ActiveRental {
  /** Rental session ID */
  id: string;
  /** Renter wallet address */
  renter_address: string;
  /** When rental started */
  started_at: string;
  /** Rental status */
  status: string;
}

/**
 * NodeDetailCard component props
 */
interface NodeDetailCardProps {
  /** Node data */
  node: ProviderNode;
  /** Active rental if node is currently rented */
  activeRental?: ActiveRental | null;
  /** Callback when edit price button clicked */
  onEditPrice?: (nodeId: string, currentPricePerSec: string) => void;
}

/**
 * NodeDetailCard - Detailed node view with specs and rental status
 *
 * Split layout:
 * - Left side: GPU model, VRAM, UUID (truncated)
 * - Right side: Current rental status or "사용 가능" (Available)
 *
 * Features:
 * - Displays GPU specs (model, VRAM)
 * - Shows node UUID (truncated for display)
 * - Shows per-hour price (converted from per-second)
 * - Active rental info with relative timestamp ("Started 2h ago")
 * - Uses date-fns formatDistanceToNow for static timestamps (no live countdown)
 * - Edit price button
 *
 * Korean labels throughout.
 *
 * @example
 * <NodeDetailCard
 *   node={providerNode}
 *   activeRental={currentRental}
 *   onEditPrice={(nodeId, currentPrice) => setPricingModal({ ... })}
 * />
 */
export function NodeDetailCard({
  node,
  activeRental,
  onEditPrice,
}: NodeDetailCardProps) {
  // Convert per-second price to per-hour for display
  // Remove decimal part since BigInt doesn't accept decimals
  const pricePerSecStr = node.price_per_sec.split('.')[0] || '0';
  const pricePerSec = BigInt(pricePerSecStr);
  const pricePerHour = pricePerSec * BigInt(3600);
  const priceFormatted = formatEther(pricePerHour);

  // Truncate UUID for display
  const truncatedId = node.id.length > 16
    ? `${node.id.slice(0, 8)}...${node.id.slice(-8)}`
    : node.id;

  // Rental started time (static, per CONTEXT.md)
  const rentalStartedAgo = activeRental
    ? formatDistanceToNow(new Date(activeRental.started_at), { addSuffix: true })
    : null;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      {/* Card header with status badge */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white">{node.gpu_type}</h3>
        <span
          className={`
            inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium
            ${node.status === 'ONLINE' || node.status === 'RENTED'
              ? 'bg-green-500/20 text-green-400'
              : 'bg-gray-500/20 text-gray-400'
            }
          `}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              node.status === 'ONLINE' || node.status === 'RENTED'
                ? 'bg-green-400'
                : 'bg-gray-400'
            }`}
          />
          {node.status === 'ONLINE' || node.status === 'RENTED' ? '온라인' : '오프라인'}
        </span>
      </div>

      {/* Split layout: specs on left, rental info on right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left side: Node specs */}
        <div className="space-y-4">
          <div>
            <div className="text-sm text-gray-400 mb-1">GPU 모델</div>
            <div className="text-white font-medium">{node.gpu_type}</div>
          </div>

          <div>
            <div className="text-sm text-gray-400 mb-1">VRAM</div>
            <div className="text-white font-medium">{node.vram_gb} GB</div>
          </div>

          <div>
            <div className="text-sm text-gray-400 mb-1">노드 ID</div>
            <div className="text-white font-mono text-sm">{truncatedId}</div>
          </div>

          <div>
            <div className="text-sm text-gray-400 mb-1">시간당 가격</div>
            <div className="text-white font-medium">
              {Number(priceFormatted).toFixed(4)} WLC/hr
            </div>
          </div>

          {/* Edit price button */}
          {onEditPrice && (
            <button
              onClick={() => onEditPrice(node.id, node.price_per_sec)}
              className="
                px-4 py-2 rounded-lg text-sm font-medium
                bg-purple-600 hover:bg-purple-700 text-white
                transition-colors
              "
            >
              가격 수정
            </button>
          )}
        </div>

        {/* Right side: Rental status */}
        <div className="space-y-4">
          <div>
            <div className="text-sm text-gray-400 mb-1">임대 상태</div>
            {activeRental ? (
              <div className="space-y-2">
                <div className="text-white font-medium">임대 중</div>
                <div className="text-sm text-gray-300">
                  시작: {rentalStartedAgo}
                </div>
                <div className="text-xs text-gray-500 font-mono">
                  Renter: {activeRental.renter_address.slice(0, 10)}...{activeRental.renter_address.slice(-8)}
                </div>
              </div>
            ) : (
              <div className="text-white font-medium">사용 가능</div>
            )}
          </div>

          {/* Registration time */}
          <div>
            <div className="text-sm text-gray-400 mb-1">등록 일시</div>
            <div className="text-sm text-gray-300">
              {formatDistanceToNow(new Date(node.created_at), { addSuffix: true })}
            </div>
          </div>

          {/* Last update */}
          <div>
            <div className="text-sm text-gray-400 mb-1">최근 업데이트</div>
            <div className="text-sm text-gray-300">
              {formatDistanceToNow(new Date(node.updated_at), { addSuffix: true })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NodeDetailCard;
