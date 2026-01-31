'use client';

import { useState } from 'react';
import { NodeRegistrationForm } from './NodeRegistrationForm';

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
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'cli' | 'web'>('cli');

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

      {/* Registration method selector */}
      <div className="w-full max-w-3xl mb-8">
        <h3 className="text-xl font-semibold text-white mb-4 text-center">
          노드 등록 방법 선택
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {/* CLI option */}
          <button
            onClick={() => setSelectedMethod('cli')}
            className={`
              p-6 rounded-lg border-2 transition-all text-left
              ${selectedMethod === 'cli'
                ? 'border-purple-600 bg-purple-600/10'
                : 'border-gray-700 bg-gray-800 hover:border-gray-600'
              }
            `}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                selectedMethod === 'cli' ? 'border-purple-600' : 'border-gray-600'
              }`}>
                {selectedMethod === 'cli' && (
                  <div className="w-2 h-2 rounded-full bg-purple-600" />
                )}
              </div>
              <h4 className="text-lg font-semibold text-white">CLI로 등록</h4>
            </div>
            <p className="text-sm text-gray-400">
              GPU 자동 감지 지원
            </p>
          </button>

          {/* Web option */}
          <button
            onClick={() => setSelectedMethod('web')}
            className={`
              p-6 rounded-lg border-2 transition-all text-left
              ${selectedMethod === 'web'
                ? 'border-purple-600 bg-purple-600/10'
                : 'border-gray-700 bg-gray-800 hover:border-gray-600'
              }
            `}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                selectedMethod === 'web' ? 'border-purple-600' : 'border-gray-600'
              }`}>
                {selectedMethod === 'web' && (
                  <div className="w-2 h-2 rounded-full bg-purple-600" />
                )}
              </div>
              <h4 className="text-lg font-semibold text-white">웹에서 등록</h4>
            </div>
            <p className="text-sm text-gray-400">
              GPU 정보를 직접 입력하여 등록
            </p>
          </button>
        </div>
      </div>

      {/* CLI Setup steps */}
      {selectedMethod === 'cli' && (
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
      )}

      {/* Web registration option */}
      {selectedMethod === 'web' && (
        <div className="w-full max-w-3xl space-y-8">
          {/* Web registration info */}
          <div className="space-y-4">
            <div className="p-6 bg-gray-800 border border-gray-700 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-3">
                웹에서 GPU 노드 등록
              </h3>
              <p className="text-gray-400 mb-4">
                아래 버튼을 클릭하여 GPU 모델, VRAM, 가격 정보를 입력하고 노드를 등록하세요.
              </p>
              <button
                onClick={() => setShowRegistrationForm(true)}
                className="
                  w-full px-6 py-3 rounded-lg text-white font-medium
                  bg-purple-600 hover:bg-purple-700
                  transition-colors
                "
              >
                노드 등록
              </button>
            </div>

            {/* Daemon setup note */}
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-blue-400 mb-2">
                <strong>중요:</strong> Node 데몬은 별도로 실행 필요
              </p>
              <p className="text-xs text-gray-400">
                노드를 등록한 후에는 실제 GPU를 제공하기 위해 Node 데몬을 설치하고 실행해야 합니다.
              </p>
            </div>

            {/* Quick daemon setup */}
            <div className="space-y-3">
              <h4 className="text-md font-semibold text-white">
                Node 데몬 설치 및 실행
              </h4>
              <CodeBlock code="npm install -g worldland-node" />
              <CodeBlock code="worldland-node init && worldland-node start" />
              <p className="text-sm text-gray-500">
                등록한 노드 ID로 데몬이 자동 연결됩니다.
              </p>
            </div>
          </div>
        </div>
      )}

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

      {/* Node registration modal */}
      <NodeRegistrationForm
        isOpen={showRegistrationForm}
        onClose={() => setShowRegistrationForm(false)}
        onSuccess={() => {
          setShowRegistrationForm(false);
          // Trigger node list refresh
          if (onRefresh) {
            onRefresh();
          }
        }}
      />
    </div>
  );
}

export default SetupGuide;
