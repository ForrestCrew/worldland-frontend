'use client';

import { useAccount } from 'wagmi';
import { MiningDashboard } from '@/components/provider/MiningDashboard';

/**
 * Mining Management Page
 *
 * K8s provider mining dashboard with GPU allocation controls.
 * Uses provider_id from localStorage auth.
 */
export default function MiningPage() {
  const { address } = useAccount();

  // Get provider ID from auth
  let providerId: string | undefined;
  if (typeof window !== 'undefined') {
    try {
      const storedAuth = localStorage.getItem('worldland_auth');
      if (storedAuth) {
        const parsed = JSON.parse(storedAuth);
        providerId = parsed.provider_id;
      }
    } catch {
      // ignore
    }
  }

  if (!address) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <h2 className="text-2xl font-bold text-white mb-4">지갑 연결 필요</h2>
        <p className="text-gray-400">채굴 관리를 위해 지갑을 먼저 연결해 주세요.</p>
      </div>
    );
  }

  if (!providerId) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <h2 className="text-2xl font-bold text-white mb-4">프로바이더 등록 필요</h2>
        <p className="text-gray-400 mb-6">채굴 관리를 위해 먼저 프로바이더로 등록하세요.</p>
        <a
          href="/provider/register"
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
        >
          프로바이더 등록하기
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-3xl font-bold text-white mb-2">채굴 관리</h1>
      <p className="text-gray-400 mb-8">
        GPU를 채굴에 할당하고 관리합니다. K8s 프로바이더 전용 기능입니다.
      </p>

      <MiningDashboard providerId={providerId} />
    </div>
  );
}
