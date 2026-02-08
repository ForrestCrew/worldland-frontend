'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { useRegisterK8sProvider } from '@/hooks/useRegisterK8sProvider';

type ProviderTypeOption = 'docker' | 'k8s';

/**
 * Provider Registration Page
 *
 * Allows providers to choose between Docker (SDK) and K8s (kubeconfig) registration.
 * - Docker: Redirects to SDK setup guide
 * - K8s: Upload kubeconfig file → validate → register
 */
export default function ProviderRegisterPage() {
  const router = useRouter();
  const { address } = useAccount();
  const registerK8s = useRegisterK8sProvider();

  const [providerType, setProviderType] = useState<ProviderTypeOption>('docker');
  const [kubeconfig, setKubeconfig] = useState('');
  const [kubeconfigError, setKubeconfigError] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setKubeconfig(content);
      setKubeconfigError(null);

      // Basic validation
      if (!content.includes('apiVersion') || !content.includes('clusters')) {
        setKubeconfigError('유효하지 않은 kubeconfig 파일입니다');
      }
    };
    reader.readAsText(file);
  };

  const handleRegister = async () => {
    if (!address) return;

    if (providerType === 'k8s') {
      if (!kubeconfig) {
        setKubeconfigError('kubeconfig 파일을 업로드해 주세요');
        return;
      }

      registerK8s.mutate(
        { walletAddress: address, kubeconfig },
        {
          onSuccess: () => {
            router.push('/provider');
          },
        }
      );
    }
  };

  if (!address) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <h2 className="text-2xl font-bold text-white mb-4">지갑 연결 필요</h2>
        <p className="text-gray-400">프로바이더 등록을 위해 지갑을 먼저 연결해 주세요.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-3xl font-bold text-white mb-2">프로바이더 등록</h1>
      <p className="text-gray-400 mb-8">
        GPU를 제공하여 수익을 얻으세요. 프로바이더 유형을 선택하세요.
      </p>

      {/* Provider Type Selection */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <button
          onClick={() => setProviderType('docker')}
          className={`
            p-6 rounded-xl border-2 text-left transition-all
            ${providerType === 'docker'
              ? 'border-purple-500 bg-purple-500/10'
              : 'border-gray-700 bg-gray-900 hover:border-gray-600'
            }
          `}
        >
          <div className="text-2xl mb-2">🐳</div>
          <div className="text-lg font-semibold text-white mb-1">Docker</div>
          <div className="text-sm text-gray-400">
            개인 GPU를 SDK로 등록합니다. 간편한 설치 과정을 따르세요.
          </div>
        </button>

        <button
          onClick={() => setProviderType('k8s')}
          className={`
            p-6 rounded-xl border-2 text-left transition-all
            ${providerType === 'k8s'
              ? 'border-purple-500 bg-purple-500/10'
              : 'border-gray-700 bg-gray-900 hover:border-gray-600'
            }
          `}
        >
          <div className="text-2xl mb-2">☸️</div>
          <div className="text-lg font-semibold text-white mb-1">Kubernetes</div>
          <div className="text-sm text-gray-400">
            데이터센터 K8s 클러스터를 kubeconfig로 등록합니다.
          </div>
        </button>
      </div>

      {/* Docker: SDK Guide */}
      {providerType === 'docker' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
          <h3 className="text-xl font-semibold text-white mb-4">
            Worldland SDK 설치
          </h3>
          <p className="text-gray-400 mb-6">
            Docker 프로바이더는 Worldland SDK를 통해 등록됩니다.
            아래 가이드를 따라 GPU 노드를 설정하세요.
          </p>

          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-3 p-4 bg-gray-800 rounded-lg">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-500 text-white text-sm font-medium flex-shrink-0">1</span>
              <div>
                <div className="text-white font-medium">SDK 다운로드</div>
                <div className="text-sm text-gray-400">GitHub에서 최신 SDK를 다운로드합니다</div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-gray-800 rounded-lg">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-500 text-white text-sm font-medium flex-shrink-0">2</span>
              <div>
                <div className="text-white font-medium">노드 설정</div>
                <div className="text-sm text-gray-400">GPU 정보와 가격을 설정합니다</div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-gray-800 rounded-lg">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-500 text-white text-sm font-medium flex-shrink-0">3</span>
              <div>
                <div className="text-white font-medium">노드 실행</div>
                <div className="text-sm text-gray-400">SDK를 실행하면 자동으로 Hub에 연결됩니다</div>
              </div>
            </div>
          </div>

          <a
            href="https://github.com/ForrestCrew/worldland-sdk"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full px-6 py-4 rounded-lg text-white font-medium text-lg bg-purple-600 hover:bg-purple-700 transition-colors text-center"
          >
            Worldland SDK 바로가기
          </a>
        </div>
      )}

      {/* K8s: Kubeconfig Upload */}
      {providerType === 'k8s' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
          <h3 className="text-xl font-semibold text-white mb-4">
            Kubeconfig 업로드
          </h3>
          <p className="text-gray-400 mb-6">
            K8s 클러스터의 kubeconfig 파일을 업로드하여 등록합니다.
            클러스터에 GPU 노드가 포함되어 있어야 합니다.
          </p>

          {/* File upload */}
          <div className="mb-6">
            <label className="block text-sm text-gray-400 mb-2">
              Kubeconfig 파일 <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type="file"
                accept=".yaml,.yml,.conf"
                onChange={handleFileUpload}
                className="hidden"
                id="kubeconfig-upload"
              />
              <label
                htmlFor="kubeconfig-upload"
                className={`
                  block w-full p-4 border-2 border-dashed rounded-lg cursor-pointer
                  text-center transition-colors
                  ${kubeconfig
                    ? 'border-green-500/50 bg-green-500/5'
                    : 'border-gray-700 hover:border-gray-600 bg-gray-800'
                  }
                `}
              >
                {kubeconfig ? (
                  <div className="text-green-400">
                    <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    kubeconfig 파일 로드됨
                  </div>
                ) : (
                  <div className="text-gray-400">
                    <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    클릭하여 kubeconfig 파일을 선택하세요
                  </div>
                )}
              </label>
            </div>
            {kubeconfigError && (
              <p className="text-sm text-red-400 mt-2">{kubeconfigError}</p>
            )}
          </div>

          {/* Wallet address (read-only) */}
          <div className="mb-6">
            <label className="block text-sm text-gray-400 mb-2">지갑 주소</label>
            <div className="p-3 bg-gray-800 border border-gray-700 rounded-lg text-white font-mono text-sm break-all">
              {address}
            </div>
          </div>

          {/* Register button */}
          <button
            onClick={handleRegister}
            disabled={!kubeconfig || !!kubeconfigError || registerK8s.isPending}
            className={`
              w-full py-4 rounded-lg text-white font-medium text-lg transition-colors
              ${!kubeconfig || !!kubeconfigError || registerK8s.isPending
                ? 'bg-gray-700 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-700'
              }
            `}
          >
            {registerK8s.isPending ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                등록 중...
              </span>
            ) : (
              '프로바이더 등록'
            )}
          </button>

          {/* Error display */}
          {registerK8s.isError && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{registerK8s.error?.message}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
