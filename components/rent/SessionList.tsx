'use client';

import { useRentalSessions, type RentalSession } from '@/hooks/useRentalSessions';
import { useStopRental } from '@/hooks/useStopRental';
import { RentalStatusCard, type RentalSession as CardSession } from './RentalStatusCard';
import { SessionHistoryCard, type CompletedSession } from './SessionHistoryCard';
import { RentalEmptyState } from './RentalEmptyState';

/**
 * Convert hook session to RentalStatusCard format
 */
function toCardSession(session: RentalSession): CardSession {
  return {
    id: session.id,
    node_id: session.nodeId,
    gpu_type: session.gpuType,
    vram_gb: 24, // Default VRAM, would come from node data in full implementation
    status: session.state === 'PENDING' ? 'PENDING' : session.state === 'RUNNING' ? 'RUNNING' : 'STOPPED',
    started_at: session.startTime || new Date().toISOString(),
    price_per_sec: session.pricePerSecond,
    ssh_credentials: session.sshHost
      ? {
          host: session.sshHost,
          port: session.sshPort || 22,
          username: session.sshUser || 'user',
          password: session.sshPassword || '',
        }
      : undefined,
  };
}

/**
 * Convert hook session to SessionHistoryCard format
 */
function toCompletedSession(session: RentalSession): CompletedSession {
  return {
    id: session.id,
    gpuType: session.gpuType,
    state: session.state as 'STOPPED' | 'CANCELLED',
    startTime: session.startTime,
    stopTime: session.stopTime,
    settlementAmount: session.settlementAmount,
  };
}

/**
 * Loading skeleton for session list
 */
function SessionListSkeleton() {
  return (
    <div className="space-y-6">
      {/* Active section skeleton */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="h-6 bg-gray-700 rounded w-32 mb-4 animate-pulse" />
        <div className="h-48 bg-gray-800 rounded-lg animate-pulse" />
      </div>

      {/* History section skeleton */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="h-6 bg-gray-700 rounded w-24 mb-4 animate-pulse" />
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-800 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * SessionList - Display user's active and completed rental sessions
 *
 * Features:
 * - Uses useRentalSessions hook for data (pre-separated active/completed)
 * - Uses useStopRental hook for stop action on active rentals
 * - Active section displays RentalStatusCard for PENDING/RUNNING sessions
 * - Completed section displays SessionHistoryCard for STOPPED/CANCELLED sessions
 * - Empty state shown when user has no sessions
 * - Refresh button to manually refetch data
 * - Loading skeleton during data fetch
 *
 * Layout:
 * - Active rentals section (top)
 * - Completed rentals section (bottom, collapsible if many)
 *
 * @example
 * // Basic usage
 * <SessionList />
 *
 * @example
 * // With custom class
 * <SessionList className="max-w-4xl mx-auto" />
 */
export function SessionList({ className = '' }: { className?: string }) {
  const {
    active,
    completed,
    isLoading,
    error,
    refetch,
  } = useRentalSessions();

  const { stopRental, status: stopStatus } = useStopRental();

  // Handle stop rental action
  const handleStopRental = async (sessionId: string) => {
    // In real implementation, we'd need the blockchain rental ID
    // For now, parse it from the session ID or call Hub API to get it
    // Assuming session ID format includes the rental ID
    try {
      // Parse rental ID from session (format: "rental-{rentalId}" or just use session ID)
      const rentalId = BigInt(sessionId.replace(/\D/g, '') || '0');
      await stopRental({ rentalId });
    } catch (err) {
      console.error('Failed to stop rental:', err);
    }
  };

  // Loading state
  if (isLoading) {
    return <SessionListSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <div className={`bg-gray-900 border border-gray-800 rounded-xl p-6 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">내 임대 세션</h2>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            새로고침
          </button>
        </div>
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400 text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  // Empty state: No sessions at all
  if (active.length === 0 && completed.length === 0) {
    return (
      <div className={className}>
        <RentalEmptyState
          title="임대 내역 없음"
          description="아직 GPU를 임대한 적이 없습니다. 마켓플레이스에서 GPU를 찾아보세요."
        />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">내 임대 세션</h2>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          새로고침
        </button>
      </div>

      {/* Active rentals section */}
      {active.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <h3 className="text-lg font-semibold text-white">
              활성 임대
            </h3>
            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-sm font-medium">
              {active.length}
            </span>
          </div>

          <div className="space-y-4">
            {active.map((session) => (
              <RentalStatusCard
                key={session.id}
                rental={toCardSession(session)}
                onStop={handleStopRental}
              />
            ))}
          </div>

          {/* Show stop transaction status */}
          {stopStatus !== 'idle' && (
            <div className="mt-4 p-3 bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                {stopStatus === 'wallet' && (
                  <>
                    <svg className="w-4 h-4 text-yellow-400 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    <span className="text-yellow-400">지갑에서 서명해 주세요</span>
                  </>
                )}
                {stopStatus === 'pending' && (
                  <>
                    <svg className="w-4 h-4 text-blue-400 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span className="text-blue-400">트랜잭션 처리 중...</span>
                  </>
                )}
                {stopStatus === 'confirmed' && (
                  <>
                    <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-blue-400">트랜잭션 확인됨</span>
                  </>
                )}
                {stopStatus === 'success' && (
                  <>
                    <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-green-400">임대 종료 완료</span>
                  </>
                )}
                {stopStatus === 'fail' && (
                  <>
                    <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span className="text-red-400">종료 실패</span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty active state (when only completed exists) */}
      {active.length === 0 && completed.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">활성 임대</h3>
          <div className="p-6 text-center text-gray-400">
            <svg
              className="w-10 h-10 mx-auto mb-3 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm">현재 활성 임대가 없습니다</p>
          </div>
        </div>
      )}

      {/* Completed rentals section */}
      {completed.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <h3 className="text-lg font-semibold text-white">
              임대 내역
            </h3>
            <span className="px-2 py-0.5 bg-gray-500/20 text-gray-400 rounded text-sm font-medium">
              {completed.length}
            </span>
          </div>

          <div className="space-y-3">
            {completed.map((session) => (
              <SessionHistoryCard
                key={session.id}
                session={toCompletedSession(session)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default SessionList;
