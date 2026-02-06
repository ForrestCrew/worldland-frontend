'use client';

/**
 * SetupGuide component props
 */
interface SetupGuideProps {
  /** Callback to refetch nodes (optional) */
  onRefresh?: () => void;
}

const SDK_URL = 'https://github.com/ForrestCrew/worldland-sdk';

/**
 * SetupGuide - Empty state onboarding for new providers
 *
 * Displayed when provider has 0 registered nodes.
 * Directs providers to the worldland-sdk for GPU node registration.
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

      {/* SDK guide */}
      <div className="w-full max-w-3xl">
        <div className="p-8 bg-gray-800 border border-gray-700 rounded-xl">
          <h3 className="text-xl font-semibold text-white mb-3">
            GPU 노드 등록 방법
          </h3>
          <p className="text-gray-400 mb-6">
            GPU 노드 등록은 Worldland SDK를 통해 진행됩니다.
            아래 링크에서 설치 및 등록 방법을 확인하세요.
          </p>
          <a
            href={SDK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="
              block w-full px-6 py-4 rounded-lg text-white font-medium text-lg
              bg-purple-600 hover:bg-purple-700
              transition-colors text-center
            "
          >
            Worldland SDK 바로가기
          </a>
        </div>
      </div>

      {/* Refresh button */}
      <div className="mt-8">
        <button
          onClick={() => onRefresh ? onRefresh() : window.location.reload()}
          className="
            px-8 py-3 rounded-lg text-gray-300 font-medium
            bg-gray-800 hover:bg-gray-700 border border-gray-700
            transition-colors
          "
        >
          새로고침
        </button>
      </div>
    </div>
  );
}

export default SetupGuide;
