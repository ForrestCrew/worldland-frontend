'use client';

import { useState } from 'react';

/**
 * SetupGuide component props
 */
interface SetupGuideProps {
  /** Callback to refetch nodes (optional) */
  onRefresh?: () => void;
}

/**
 * CodeBlock sub-component with copy button
 */
function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="relative group">
      <pre className="bg-gray-800 border border-gray-700 rounded-lg p-4 overflow-x-auto">
        <code className="text-sm text-green-400 font-mono">{code}</code>
      </pre>
      <button
        onClick={handleCopy}
        className="
          absolute top-2 right-2 px-3 py-1 text-xs font-medium
          bg-gray-700 hover:bg-gray-600 text-white rounded
          opacity-0 group-hover:opacity-100 transition-opacity
        "
      >
        {copied ? '복사됨!' : '복사'}
      </button>
    </div>
  );
}

/**
 * SetupGuide - Empty state onboarding for new providers
 *
 * Displayed when provider has 0 registered nodes.
 * Guides new providers through GPU node registration process.
 *
 * Features:
 * - Step-by-step setup instructions (3 steps)
 * - Copy-paste code blocks with copy button (clipboard API)
 * - Refresh button to check for new nodes
 * - Centered layout with generous padding
 * - Korean content throughout
 *
 * Steps:
 * 1. Install node daemon: npm install -g worldland-node
 * 2. Initialize and start: worldland-node init && worldland-node start --price 0.001
 * 3. Wait for node to appear (30s refresh suggestion)
 *
 * @example
 * // Show when provider has no nodes
 * {nodes.length === 0 ? (
 *   <SetupGuide onRefresh={() => refetch()} />
 * ) : (
 *   <NodeList nodes={nodes} />
 * )}
 */
export function SetupGuide({ onRefresh }: SetupGuideProps) {
  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      window.location.reload();
    }
  };

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

      {/* Setup steps */}
      <div className="w-full max-w-3xl space-y-8">
        {/* Step 1: Install daemon */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-600 text-white font-bold text-sm">
              1
            </div>
            <h3 className="text-xl font-semibold text-white">
              Node 데몬 설치
            </h3>
          </div>
          <CodeBlock code="npm install -g worldland-node" />
        </div>

        {/* Step 2: Initialize and start */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-600 text-white font-bold text-sm">
              2
            </div>
            <h3 className="text-xl font-semibold text-white">
              초기화 및 시작
            </h3>
          </div>
          <CodeBlock code="worldland-node init && worldland-node start --price 0.001" />
          <p className="text-sm text-gray-500 ml-11">
            --price는 시간당 가격 (WLC)입니다. 나중에 변경할 수 있습니다.
          </p>
        </div>

        {/* Step 3: Wait for registration */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-600 text-white font-bold text-sm">
              3
            </div>
            <h3 className="text-xl font-semibold text-white">
              노드가 자동으로 여기에 표시됩니다
            </h3>
          </div>
          <div className="ml-11 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-sm text-blue-400">
              노드 등록에는 30초 정도 걸립니다. 아래 버튼을 클릭하여 새로고침하세요.
            </p>
          </div>
        </div>
      </div>

      {/* Refresh button */}
      <div className="mt-12">
        <button
          onClick={handleRefresh}
          className="
            px-8 py-3 rounded-lg text-white font-medium
            bg-purple-600 hover:bg-purple-700
            transition-colors
          "
        >
          새로고침
        </button>
      </div>

      {/* Additional help */}
      <div className="mt-12 text-center text-sm text-gray-500 max-w-xl">
        <p>
          문제가 있으신가요?{' '}
          <a
            href="https://docs.worldland.io/provider-setup"
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-400 hover:text-purple-300 underline"
          >
            설정 가이드 문서
          </a>
          를 확인하세요.
        </p>
      </div>
    </div>
  );
}

export default SetupGuide;
