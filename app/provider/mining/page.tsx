'use client';

import { useAccount } from 'wagmi';
import { useProviderNodes } from '@/hooks/useProviderNodes';
import { useProviderInfo } from '@/hooks/useProviderInfo';
import { useMiningStatus } from '@/hooks/useMining';
import { MiningDashboard } from '@/components/provider/MiningDashboard';
import type { SDKNodeMiningStatus } from '@/lib/api';

function miningStateLabel(state: string): string {
  switch (state) {
    case 'running': return '채굴 중';
    case 'paused': return '일시정지';
    case 'stopped': return '중지됨';
    default: return state;
  }
}

function miningStateColor(state: string): string {
  switch (state) {
    case 'running': return 'text-green-400';
    case 'paused': return 'text-yellow-400';
    case 'stopped': return 'text-gray-400';
    default: return 'text-gray-400';
  }
}

function miningStateDot(state: string): string {
  switch (state) {
    case 'running': return 'bg-green-400';
    case 'paused': return 'bg-yellow-400';
    case 'stopped': return 'bg-gray-500';
    default: return 'bg-gray-500';
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}초 전`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  return `${Math.floor(hr / 24)}일 전`;
}

/**
 * Mining Management Page
 *
 * Shows all provider nodes with mining-related info.
 * - SDK (Docker) nodes: Mining status from heartbeat
 * - K8s nodes: Mining managed via Hub API (K8s pod orchestration)
 */
export default function MiningPage() {
  const { address } = useAccount();
  const { nodes, isLoading: nodesLoading, refetch: refetchNodes } = useProviderNodes();
  const { provider, isK8s } = useProviderInfo();

  // Get provider ID from auth
  let providerId: string | undefined;
  if (typeof window !== 'undefined') {
    try {
      const storedAuth = localStorage.getItem('worldland_auth');
      if (storedAuth) {
        const parsed = JSON.parse(storedAuth);
        providerId = parsed.providerId || parsed.provider_id;
      }
    } catch {
      // ignore
    }
  }

  // Fetch mining status (includes sdkNodes from heartbeat)
  const { data: miningData, isLoading: miningLoading } = useMiningStatus(providerId);
  const sdkNodes: SDKNodeMiningStatus[] = miningData?.sdkNodes ?? [];

  if (!address) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <h2 className="text-2xl font-bold text-white mb-4">지갑 연결 필요</h2>
        <p className="text-gray-400">채굴 관리를 위해 지갑을 먼저 연결해 주세요.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">채굴 관리</h2>
        <button
          onClick={() => refetchNodes()}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors text-sm"
        >
          새로고침
        </button>
      </div>

      {/* K8s Mining Dashboard (only for K8s providers) */}
      {isK8s && providerId && (
        <MiningDashboard providerId={providerId} />
      )}

      {/* SDK Node Mining Status (from heartbeat) */}
      {sdkNodes.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white">SDK 노드 채굴 현황</h3>
            <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 ml-auto">
              실시간
            </span>
          </div>

          <div className="space-y-3">
            {sdkNodes.map((sdkNode) => (
              <div
                key={sdkNode.nodeId}
                className="flex items-center justify-between p-4 bg-gray-800 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${miningStateDot(sdkNode.state)}`} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium font-mono text-sm">
                        {sdkNode.nodeId.slice(0, 10)}...{sdkNode.nodeId.slice(-4)}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400">
                        SDK
                      </span>
                    </div>
                    {sdkNode.containerId && (
                      <div className="text-xs text-gray-500 mt-1 font-mono">
                        컨테이너: {sdkNode.containerId.slice(0, 12)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className={`text-sm font-medium flex items-center gap-2 justify-end ${miningStateColor(sdkNode.state)}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${miningStateDot(sdkNode.state)} ${sdkNode.state === 'running' ? 'animate-pulse' : ''}`} />
                    {miningStateLabel(sdkNode.state)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    GPU {sdkNode.gpuCount}개
                    {sdkNode.lastSeen && ` · ${timeAgo(sdkNode.lastSeen)}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Node Mining Status List */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">노드 상태</h3>

        {nodesLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 bg-gray-800 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : nodes.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">
              <svg className="w-12 h-12 mx-auto text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-gray-400 mb-4">등록된 노드가 없습니다</p>
            <p className="text-gray-500 text-sm mb-6">
              SDK를 설치하거나 K8s 클러스터를 등록하면 노드가 표시됩니다.
            </p>
            <a
              href="/provider/register"
              className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
            >
              프로바이더 등록하기
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            {nodes.map((node) => {
              const isOnline = node.status === 'ONLINE';
              const isRented = node.status === 'RENTED';
              const isSDKNode = !node.provider_type || node.provider_type === 'docker';

              // Find matching SDK mining status from heartbeat
              const sdkMining = sdkNodes.find(s =>
                s.nodeId === node.id || s.nodeId === node.provider_address
              );

              return (
                <div
                  key={node.id}
                  className="flex items-center justify-between p-4 bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    {/* Status indicator */}
                    <div className={`w-3 h-3 rounded-full ${
                      isRented ? 'bg-yellow-400' :
                      (sdkMining?.state === 'running') ? 'bg-green-400 animate-pulse' :
                      isOnline ? 'bg-green-400' : 'bg-gray-500'
                    }`} />

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{node.gpu_type}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-gray-700 text-gray-400">
                          {node.vram_gb} GB
                        </span>
                        {isSDKNode ? (
                          <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400">
                            SDK
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">
                            K8s
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 font-mono mt-1">
                        {node.id.slice(0, 8)}...
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={`text-sm font-medium ${
                      isRented ? 'text-yellow-400' :
                      (sdkMining?.state === 'running') ? 'text-green-400' :
                      isOnline ? 'text-green-400' : 'text-gray-500'
                    }`}>
                      {isRented ? '임대 중' :
                       sdkMining ? miningStateLabel(sdkMining.state) :
                       isOnline ? '온라인' : '오프라인'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {isSDKNode ? '로컬 채굴 관리' : 'K8s 채굴 관리'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SDK Mining Info */}
      {nodes.some(n => !n.provider_type || n.provider_type === 'docker') && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-3">SDK 노드 채굴 안내</h3>
          <p className="text-gray-400 text-sm">
            SDK 노드의 채굴은 노드 데몬에서 자동 관리됩니다.
            임대가 없을 때 유휴 GPU로 자동 채굴이 시작되며,
            임대가 시작되면 자동으로 채굴이 중단됩니다.
          </p>
          <div className="mt-4 p-3 bg-gray-800 rounded-lg">
            <code className="text-xs text-gray-400">
              # 채굴 활성화: SDK 실행 시 -enable-mining=true (기본값)
              <br />
              # 채굴 비활성화: -enable-mining=false
            </code>
          </div>
        </div>
      )}
    </div>
  );
}
