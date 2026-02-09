'use client';

import Link from 'next/link';

interface SetupGuideProps {
  onRefresh?: () => void;
}

/**
 * SetupGuide - Empty state onboarding for new providers
 *
 * Displayed when provider has 0 registered nodes.
 * Provides guide to register GPU nodes via SDK.
 */
export function SetupGuide({ onRefresh }: SetupGuideProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {/* Header */}
      <div className="text-center mb-12 max-w-2xl">
        <h2 className="text-3xl font-bold text-white mb-3">
          등록된 GPU 노드가 없습니다
        </h2>
        <p className="text-lg text-gray-400">
          GPU 노드를 등록하여 수익을 시작하세요
        </p>
      </div>

      {/* Registration guide */}
      <div className="w-full max-w-xl">
        <div className="p-8 bg-gray-800 border border-gray-700 rounded-xl text-center">
          <div className="text-3xl mb-3">🖥️</div>
          <h3 className="text-xl font-semibold text-white mb-2">GPU 프로바이더 등록</h3>
          <p className="text-gray-400 mb-6 text-sm">
            개인 GPU를 SDK로 등록하세요. NVIDIA 드라이버와 Docker만 설치되어 있으면 됩니다.
          </p>
          <Link
            href="/provider/register"
            className="inline-block px-6 py-3 rounded-lg text-white font-medium bg-purple-600 hover:bg-purple-700 transition-colors"
          >
            등록하기
          </Link>
        </div>
      </div>

      {/* Refresh button */}
      <div className="mt-8">
        <button
          onClick={() => onRefresh ? onRefresh() : window.location.reload()}
          className="px-8 py-3 rounded-lg text-gray-300 font-medium bg-gray-800 hover:bg-gray-700 border border-gray-700 transition-colors"
        >
          새로고침
        </button>
      </div>
    </div>
  );
}

export default SetupGuide;
