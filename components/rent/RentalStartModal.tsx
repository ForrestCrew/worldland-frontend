'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatEther, encodeFunctionData } from 'viem';
import { useStartRental } from '@/hooks/useStartRental';
import { useGasEstimate } from '@/hooks/useGasEstimate';
import { GasEstimateDisplay } from '@/components/balance/GasEstimateDisplay';
import { TransactionStatus } from '@/components/balance/TransactionStatus';
import { ImageSelector } from './ImageSelector';
import {
  WorldlandRentalABI,
  RENTAL_CONTRACT_ADDRESS,
} from '@/lib/contracts/WorldlandRental';
import type { AvailableGPU } from '@/hooks/useAvailableGPUs';
import type { RentalStage } from '@/lib/rental-utils';

/**
 * RentalStartModal component props
 */
interface RentalStartModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Callback when modal closes */
  onClose: () => void;
  /** GPU to rent (null when modal is closed) */
  gpu: AvailableGPU | null;
}

/**
 * SSH public key validation
 * Validates common SSH key formats: ssh-rsa, ssh-ed25519, ecdsa-sha2-*
 */
function isValidSSHPublicKey(key: string): boolean {
  if (!key || key.trim().length === 0) return false;

  const trimmed = key.trim();

  // Check for common SSH key prefixes
  const validPrefixes = [
    'ssh-rsa',
    'ssh-ed25519',
    'ssh-dss',
    'ecdsa-sha2-nistp256',
    'ecdsa-sha2-nistp384',
    'ecdsa-sha2-nistp521',
  ];

  return validPrefixes.some((prefix) => trimmed.startsWith(prefix));
}

/**
 * Stage indicator component
 */
function StageIndicator({ stage }: { stage: RentalStage }) {
  const stages: { key: RentalStage; label: string }[] = [
    { key: 'blockchain', label: '블록체인' },
    { key: 'hub', label: 'GPU 연결' },
    { key: 'complete', label: '완료' },
  ];

  return (
    <div className="flex items-center gap-2">
      {stages.map((s, idx) => {
        const isActive = stage === s.key;
        // Determine if this step is complete based on current stage
        const stageIdx = stages.findIndex((st) => st.key === stage);
        const thisIdx = idx;
        const isComplete = stageIdx > thisIdx || (stage === 'complete' && s.key === 'complete');

        const isPastOrActive = stageIdx >= thisIdx;

        return (
          <div key={s.key} className="flex items-center">
            <div
              className={`
                flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium
                ${isComplete
                  ? 'bg-green-500 text-white'
                  : isActive
                    ? 'bg-purple-500 text-white animate-pulse'
                    : 'bg-gray-700 text-gray-400'
                }
              `}
            >
              {isComplete ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                idx + 1
              )}
            </div>
            <span
              className={`ml-2 text-sm ${
                isPastOrActive ? 'text-white' : 'text-gray-500'
              }`}
            >
              {s.label}
            </span>
            {idx < stages.length - 1 && (
              <div
                className={`w-8 h-0.5 mx-2 ${
                  isComplete ? 'bg-green-500' : 'bg-gray-700'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * RentalStartModal - Modal for starting GPU rental with gas preview
 *
 * Features:
 * - SSH public key input with validation
 * - Gas estimate display (via useGasEstimate)
 * - 2-phase rental start flow (blockchain + Hub API)
 * - Transaction status display with 6-state feedback
 * - Stage indicator for 2-phase flow
 * - Auto-close on success after showing SSH credentials
 * - Korean labels and error messages
 *
 * Flow:
 * 1. User enters SSH public key
 * 2. User reviews gas estimate
 * 3. User clicks "임대 시작"
 * 4. Blockchain transaction executes (wallet -> pending -> confirmed)
 * 5. Hub API called with retry (may take 15-30s during blockchain lag)
 * 6. SSH credentials displayed on success
 * 7. Modal auto-closes after user copies credentials
 *
 * @example
 * <RentalStartModal
 *   isOpen={rentalModalOpen}
 *   onClose={() => setRentalModalOpen(false)}
 *   gpu={selectedGPU}
 * />
 */
export function RentalStartModal({
  isOpen,
  onClose,
  gpu,
}: RentalStartModalProps) {
  const [sshPublicKey, setSSHPublicKey] = useState('');
  const [sshError, setSSHError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Rental hook
  const {
    startRental,
    stage,
    txStatus,
    hash,
    sshCredentials,
    errorMessage,
    stageMessage,
    reset,
  } = useStartRental();

  // Gas estimate for startRental call
  const gasData = gpu
    ? encodeFunctionData({
        abi: WorldlandRentalABI,
        functionName: 'startRental',
        args: [gpu.providerId as `0x${string}`, BigInt(gpu.pricePerSecond)],
      })
    : undefined;

  const gasEstimate = useGasEstimate({
    to: RENTAL_CONTRACT_ADDRESS,
    data: gasData,
    enabled: isOpen && !!gpu,
  });

  // Calculate price per hour for display
  const pricePerHour = gpu
    ? formatEther(BigInt(gpu.pricePerSecond) * BigInt(3600))
    : '0';

  /**
   * Handle SSH key input change
   */
  const handleSSHKeyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setSSHPublicKey(value);

    if (value && !isValidSSHPublicKey(value)) {
      setSSHError('유효한 SSH 공개키를 입력해 주세요 (ssh-rsa, ssh-ed25519 등)');
    } else {
      setSSHError(null);
    }
  };

  /**
   * Handle rental start
   */
  const handleStartRental = useCallback(async () => {
    if (!gpu) return;

    // Validate SSH key
    if (!isValidSSHPublicKey(sshPublicKey)) {
      setSSHError('SSH 공개키를 입력해 주세요');
      return;
    }

    await startRental({
      nodeId: gpu.nodeId,
      provider: gpu.providerId as `0x${string}`,
      pricePerSecond: BigInt(gpu.pricePerSecond),
      image: selectedImage || undefined, // Send image if selected (preset ID or custom URL)
    });
  }, [gpu, sshPublicKey, selectedImage, startRental]);

  /**
   * Handle modal close
   */
  const handleClose = useCallback(() => {
    // Don't allow close during transaction
    if (stage !== 'idle' && stage !== 'complete' && stage !== 'error') {
      return;
    }

    reset();
    setSSHPublicKey('');
    setSSHError(null);
    setCopiedField(null);
    setSelectedImage(null);
    onClose();
  }, [stage, reset, onClose]);

  /**
   * Copy SSH credential to clipboard
   */
  const copyToClipboard = useCallback(async (value: string, field: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      console.error('Failed to copy to clipboard');
    }
  }, []);

  /**
   * Auto-close on success after delay
   */
  useEffect(() => {
    if (stage === 'complete' && sshCredentials) {
      // Don't auto-close - let user copy credentials first
      // User must close manually
    }
  }, [stage, sshCredentials]);

  // Button text based on stage
  const getButtonText = (): string => {
    switch (stage) {
      case 'idle':
        return '임대 시작';
      case 'blockchain':
        return '블록체인 처리 중...';
      case 'hub':
        return 'GPU 연결 중...';
      case 'complete':
        return '완료!';
      case 'error':
        return '다시 시도';
      default:
        return '임대 시작';
    }
  };

  // Button disabled state
  const isButtonDisabled = (): boolean => {
    if (stage === 'idle' || stage === 'error') {
      return !sshPublicKey || !!sshError;
    }
    return true;
  };

  // Don't render if not open
  if (!isOpen || !gpu) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
        onClick={handleClose}
      >
        {/* Modal card */}
        <div
          className="bg-gray-900 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-800">
            <div>
              <h2 className="text-xl font-bold text-white">GPU 임대 시작</h2>
              <p className="text-sm text-gray-400 mt-1">{gpu.gpuType}</p>
            </div>
            <button
              onClick={handleClose}
              disabled={stage !== 'idle' && stage !== 'complete' && stage !== 'error'}
              className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* GPU details */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-800/50 rounded-lg">
              <div>
                <div className="text-sm text-gray-400">VRAM</div>
                <div className="text-white font-medium">{gpu.vramGb} GB</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">지역</div>
                <div className="text-white font-medium">
                  {gpu.region === 'asia' ? '아시아' : gpu.region === 'us' ? '북미' : gpu.region === 'eu' ? '유럽' : gpu.region}
                </div>
              </div>
              <div className="col-span-2">
                <div className="text-sm text-gray-400">시간당 비용</div>
                <div className="text-white font-medium font-mono">
                  {Number(pricePerHour).toFixed(4)} WLC/hr
                </div>
              </div>
            </div>

            {/* Stage indicator (shown when in progress) */}
            {stage !== 'idle' && stage !== 'error' && (
              <div className="py-4 border-y border-gray-800">
                <StageIndicator stage={stage} />
                <p className="text-sm text-gray-400 mt-3">{stageMessage}</p>
              </div>
            )}

            {/* Image selection (hidden after rental starts) */}
            {(stage === 'idle' || stage === 'error') && (
              <ImageSelector
                value={selectedImage}
                onChange={setSelectedImage}
                disabled={stage !== 'idle' && stage !== 'error'}
              />
            )}

            {/* SSH key input (hidden after rental starts) */}
            {(stage === 'idle' || stage === 'error') && (
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  SSH 공개키 <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={sshPublicKey}
                  onChange={handleSSHKeyChange}
                  placeholder="ssh-rsa AAAAB3... 또는 ssh-ed25519 AAAAC3..."
                  rows={3}
                  className={`
                    w-full bg-gray-800 border rounded-lg
                    p-3 text-white font-mono text-sm
                    placeholder:text-gray-500
                    focus:outline-none resize-none
                    ${sshError
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-gray-700 focus:border-purple-500'
                    }
                  `}
                />
                {sshError && (
                  <p className="text-sm text-red-400 mt-1">{sshError}</p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  이 공개키로 GPU 인스턴스에 SSH 접속합니다.
                </p>
              </div>
            )}

            {/* Gas estimate */}
            {(stage === 'idle' || stage === 'error') && (
              <GasEstimateDisplay
                gasCrypto={gasEstimate.gasCrypto}
                gasFiat={gasEstimate.gasFiat}
                loading={gasEstimate.loading}
              />
            )}

            {/* Transaction status (shown during/after blockchain phase) */}
            {stage === 'blockchain' && (
              <TransactionStatus
                status={txStatus}
                hash={hash}
                error={errorMessage}
              />
            )}

            {/* SSH credentials (shown on success) */}
            {stage === 'complete' && sshCredentials && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 space-y-4">
                <div className="flex items-center gap-2 text-green-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-medium">임대가 시작되었습니다!</span>
                </div>

                <div className="text-sm text-gray-300">
                  아래 정보로 SSH 접속하세요:
                </div>

                <div className="space-y-3 font-mono text-sm">
                  <div className="flex items-center justify-between p-2 bg-gray-800 rounded">
                    <div>
                      <div className="text-gray-400 text-xs">호스트</div>
                      <div className="text-white">{sshCredentials.sshHost}:{sshCredentials.sshPort}</div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(`${sshCredentials.sshHost}:${sshCredentials.sshPort}`, 'host')}
                      className="text-purple-400 hover:text-purple-300"
                    >
                      {copiedField === 'host' ? '복사됨!' : '복사'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-2 bg-gray-800 rounded">
                    <div>
                      <div className="text-gray-400 text-xs">사용자</div>
                      <div className="text-white">{sshCredentials.sshUser}</div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(sshCredentials.sshUser, 'user')}
                      className="text-purple-400 hover:text-purple-300"
                    >
                      {copiedField === 'user' ? '복사됨!' : '복사'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-2 bg-gray-800 rounded">
                    <div>
                      <div className="text-gray-400 text-xs">비밀번호</div>
                      <div className="text-white">{sshCredentials.sshPassword}</div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(sshCredentials.sshPassword, 'password')}
                      className="text-purple-400 hover:text-purple-300"
                    >
                      {copiedField === 'password' ? '복사됨!' : '복사'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-2 bg-gray-800 rounded">
                    <div>
                      <div className="text-gray-400 text-xs">SSH 명령어</div>
                      <div className="text-white break-all">
                        ssh {sshCredentials.sshUser}@{sshCredentials.sshHost} -p {sshCredentials.sshPort}
                      </div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(
                        `ssh ${sshCredentials.sshUser}@${sshCredentials.sshHost} -p ${sshCredentials.sshPort}`,
                        'command'
                      )}
                      className="text-purple-400 hover:text-purple-300 whitespace-nowrap ml-2"
                    >
                      {copiedField === 'command' ? '복사됨!' : '복사'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Error state */}
            {stage === 'error' && errorMessage && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="font-medium">오류 발생</span>
                </div>
                <p className="text-sm text-red-300 mt-2">{errorMessage}</p>
              </div>
            )}

            {/* Action button */}
            <button
              onClick={stage === 'error' ? reset : handleStartRental}
              disabled={isButtonDisabled()}
              className={`
                w-full py-4 rounded-lg text-white font-medium text-lg transition-colors
                ${isButtonDisabled()
                  ? 'bg-gray-700 cursor-not-allowed'
                  : stage === 'complete'
                    ? 'bg-green-600'
                    : stage === 'error'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-purple-600 hover:bg-purple-700'
                }
              `}
            >
              {getButtonText()}
            </button>

            {/* Close button (shown on complete) */}
            {stage === 'complete' && (
              <button
                onClick={handleClose}
                className="w-full py-3 rounded-lg text-gray-400 hover:text-white transition-colors text-sm"
              >
                닫기
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default RentalStartModal;
