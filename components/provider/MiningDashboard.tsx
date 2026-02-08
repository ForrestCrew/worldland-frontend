'use client';

import { useState } from 'react';
import { GPUPoolCard } from './GPUPoolCard';
import {
  useMiningStatus,
  useStartMining,
  useStopMining,
  useAllocateMiningGPU,
  useReleaseMiningGPU,
} from '@/hooks/useMining';

interface MiningDashboardProps {
  providerId: string;
  className?: string;
}

/**
 * MiningDashboard - K8s provider mining management
 *
 * Shows mining status, GPU pool, and controls for start/stop/allocate/release.
 */
export function MiningDashboard({ providerId, className = '' }: MiningDashboardProps) {
  const { data, isLoading, error } = useMiningStatus(providerId);
  const startMining = useStartMining();
  const stopMining = useStopMining();
  const allocateGPU = useAllocateMiningGPU();
  const releaseGPU = useReleaseMiningGPU();

  const [gpuInput, setGpuInput] = useState(1);

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="h-48 bg-gray-900 rounded-xl animate-pulse" />
        <div className="h-32 bg-gray-900 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 bg-red-500/10 border border-red-500/20 rounded-xl ${className}`}>
        <p className="text-red-400">채굴 상태 조회 실패: {error.message}</p>
      </div>
    );
  }

  const miningStatus = data?.mining;
  const allocation = data?.allocation || { total: 0, mining: 0, rental: 0, available: 0 };
  const isRunning = miningStatus?.status === 'running';

  return (
    <div className={`space-y-6 ${className}`}>
      {/* GPU Pool */}
      <GPUPoolCard allocation={allocation} />

      {/* Mining Status */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">채굴 상태</h3>
          <span
            className={`
              inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium
              ${isRunning
                ? 'bg-green-500/20 text-green-400'
                : 'bg-gray-500/20 text-gray-400'
              }
            `}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-green-400' : 'bg-gray-400'}`} />
            {isRunning ? '실행 중' : '중지됨'}
          </span>
        </div>

        {/* Mining info */}
        {isRunning && miningStatus && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-3 bg-gray-800 rounded-lg">
              <div className="text-sm text-gray-400">사용 GPU</div>
              <div className="text-lg text-white font-medium">{miningStatus.gpuCount}개</div>
            </div>
            {miningStatus.podName && (
              <div className="p-3 bg-gray-800 rounded-lg">
                <div className="text-sm text-gray-400">Pod</div>
                <div className="text-sm text-white font-mono truncate">{miningStatus.podName}</div>
              </div>
            )}
          </div>
        )}

        {/* Start/Stop buttons */}
        <div className="flex gap-3">
          {isRunning ? (
            <button
              onClick={() => stopMining.mutate(providerId)}
              disabled={stopMining.isPending}
              className="flex-1 px-4 py-3 rounded-lg text-white font-medium bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {stopMining.isPending ? '중지 중...' : '채굴 중지'}
            </button>
          ) : (
            <button
              onClick={() => startMining.mutate({ providerId, gpuCount: gpuInput })}
              disabled={startMining.isPending || allocation.available === 0}
              className="flex-1 px-4 py-3 rounded-lg text-white font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {startMining.isPending ? '시작 중...' : '채굴 시작'}
            </button>
          )}
        </div>
      </div>

      {/* GPU Allocation Control */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">GPU 할당 관리</h3>

        <div className="flex items-center gap-3 mb-4">
          <label className="text-sm text-gray-400">GPU 수량</label>
          <input
            type="number"
            min={1}
            max={allocation.total}
            value={gpuInput}
            onChange={(e) => setGpuInput(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-20 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-center focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => allocateGPU.mutate({ providerId, gpuCount: gpuInput })}
            disabled={allocateGPU.isPending || allocation.available < gpuInput}
            className="flex-1 px-4 py-3 rounded-lg text-white font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {allocateGPU.isPending ? '할당 중...' : `채굴에 ${gpuInput}개 할당`}
          </button>
          <button
            onClick={() => releaseGPU.mutate({ providerId, gpuCount: gpuInput })}
            disabled={releaseGPU.isPending || allocation.mining < gpuInput}
            className="flex-1 px-4 py-3 rounded-lg text-white font-medium bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {releaseGPU.isPending ? '해제 중...' : `채굴에서 ${gpuInput}개 해제`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default MiningDashboard;
