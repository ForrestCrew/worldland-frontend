'use client';

import Link from 'next/link';

interface SetupGuideProps {
  onRefresh?: () => void;
}

/**
 * SetupGuide - Empty state onboarding for new providers
 *
 * Displayed when provider has 0 registered nodes.
 * Provides links to Docker SDK and K8s registration.
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

      {/* Registration options */}
      <div className="w-full max-w-3xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Docker option */}
          <div className="p-8 bg-gray-800 border border-gray-700 rounded-xl">
            <div className="text-3xl mb-3">🐳</div>
            <h3 className="text-xl font-semibold text-white mb-2">Docker 프로바이더</h3>
            <p className="text-gray-400 mb-6 text-sm">
              개인 GPU를 SDK로 간편하게 등록하세요. Docker만 설치되어 있으면 됩니다.
            </p>
            <Link
              href="/provider/register"
              className="block w-full px-6 py-3 rounded-lg text-white font-medium bg-purple-600 hover:bg-purple-700 transition-colors text-center"
            >
              등록하기
            </Link>
          </div>

          {/* K8s option */}
          <div className="p-8 bg-gray-800 border border-gray-700 rounded-xl">
            <div className="text-3xl mb-3">☸️</div>
            <h3 className="text-xl font-semibold text-white mb-2">K8s 프로바이더</h3>
            <p className="text-gray-400 mb-6 text-sm">
              데이터센터 K8s 클러스터를 kubeconfig로 등록하세요. 대규모 GPU 풀을 관리합니다.
            </p>
            <Link
              href="/provider/register"
              className="block w-full px-6 py-3 rounded-lg text-white font-medium bg-blue-600 hover:bg-blue-700 transition-colors text-center"
            >
              등록하기
            </Link>
          </div>
        </div>
      </div>

      {/* Refresh button */}
      <div className="mt-4">
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
