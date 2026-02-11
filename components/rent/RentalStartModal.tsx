'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { encodeFunctionData } from 'viem';
import { useStartRental } from '@/hooks/useStartRental';
import { useGasEstimate } from '@/hooks/useGasEstimate';
import { GasEstimateDisplay } from '@/components/balance/GasEstimateDisplay';
import { TransactionStatus } from '@/components/balance/TransactionStatus';
import { ImageSelector } from './ImageSelector';
import { ResourceSelector, type ResourceSelection } from './ResourceSelector';
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
 * Stage indicator component
 */
function StageIndicator({ stage }: { stage: RentalStage }) {
  const stages: { key: RentalStage; label: string }[] = [
    { key: 'blockchain', label: 'Blockchain' },
    { key: 'hub', label: 'GPU Connect' },
    { key: 'complete', label: 'Complete' },
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
 * - Gas estimate display (via useGasEstimate)
 * - 2-phase rental start flow (blockchain + Hub API)
 * - Transaction status display with 6-state feedback
 * - Stage indicator for 2-phase flow
 * - SSH credentials displayed on success (password-based auth)
 * - Korean labels and error messages
 *
 * Flow:
 * 1. User selects container image and reviews gas estimate
 * 2. User clicks "임대 시작"
 * 3. Blockchain transaction executes (wallet -> pending -> confirmed)
 * 4. Hub API called with retry (may take 15-30s during blockchain lag)
 * 5. SSH credentials displayed on success
 * 6. User copies credentials and closes modal
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
  const router = useRouter();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [resources, setResources] = useState<ResourceSelection>({
    gpuCount: 1,
    cpuCores: 4,
    memoryGB: 16,
    storageGB: 20,
  });

  // Auto-adjust defaults to fit within node capacity when GPU changes
  // Must snap to valid dropdown options to prevent hidden mismatches
  useEffect(() => {
    if (!gpu) return;

    const CPU_OPTIONS = [1, 2, 4, 8, 16, 32, 64];
    const MEMORY_OPTIONS = [4, 8, 16, 32, 64, 128, 256];

    const availCpu = gpu.availableCpuCores > 0 ? gpu.availableCpuCores : gpu.totalCpuCores;
    const availMem = gpu.availableMemoryGb > 0 ? gpu.availableMemoryGb : gpu.totalMemoryGb;
    const validCpu = CPU_OPTIONS.filter(c => availCpu <= 0 || c <= availCpu);
    const validMem = MEMORY_OPTIONS.filter(m => availMem <= 0 || m <= availMem);

    setResources((prev) => ({
      gpuCount: Math.min(prev.gpuCount, gpu.availableGpus || 1),
      cpuCores: validCpu.includes(prev.cpuCores)
        ? prev.cpuCores
        : (validCpu[validCpu.length - 1] || 4),
      memoryGB: validMem.includes(prev.memoryGB)
        ? prev.memoryGB
        : (validMem[validMem.length - 1] || 8),
      storageGB: prev.storageGB,
    }));
  }, [gpu]);

  // Rental hook
  const {
    startRental,
    stage,
    txStatus,
    hash,
    sshCredentials,
    errorMessage,
    stageMessage,
    sessionFailed,
    reset,
  } = useStartRental();

  // Gas estimate for startRental call
  // Only calculate gas data when gpu and providerAddress are valid
  let gasData: `0x${string}` | undefined = undefined;
  if (gpu && gpu.providerAddress && gpu.providerAddress.startsWith('0x') && gpu.providerAddress.length === 42) {
    try {
      gasData = encodeFunctionData({
        abi: WorldlandRentalABI,
        functionName: 'startRental',
        args: [gpu.providerAddress as `0x${string}`, BigInt(gpu.pricePerSecond.split('.')[0] || '0')],
      });
    } catch {
      // Silently fail - gas estimate will show as loading
    }
  }

  const gasEstimate = useGasEstimate({
    to: RENTAL_CONTRACT_ADDRESS,
    data: gasData,
    enabled: isOpen && !!gpu && !!gasData,
  });

  // Use backend-provided human-readable price per hour for display
  const pricePerHourDisplay = gpu?.pricePerHour || '0.00';

  /**
   * Handle rental start
   */
  const handleStartRental = useCallback(async () => {
    if (!gpu) return;

    if (!gpu.providerAddress) {
      return;
    }

    await startRental({
      nodeId: gpu.nodeId,
      provider: gpu.providerAddress as `0x${string}`,
      pricePerSecond: BigInt(gpu.pricePerSecond.split('.')[0] || '0'),
      image: selectedImage || undefined,
      gpuCount: resources.gpuCount,
      cpuCores: resources.cpuCores,
      memoryGB: resources.memoryGB,
      storageGB: resources.storageGB,
    });
  }, [gpu, selectedImage, resources, startRental]);

  /**
   * Handle modal close
   */
  const handleClose = useCallback(() => {
    // Don't allow close during transaction
    if (stage !== 'idle' && stage !== 'complete' && stage !== 'error') {
      return;
    }

    reset();
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

  // Button text based on stage
  const getButtonText = (): string => {
    if (stage === 'complete' && sessionFailed) {
      return 'Close';
    }
    switch (stage) {
      case 'idle':
        return 'Start Rental';
      case 'blockchain':
        return 'Processing on blockchain...';
      case 'hub':
        return 'Connecting GPU...';
      case 'complete':
        return 'Complete';
      case 'error':
        return 'Retry';
      default:
        return 'Start Rental';
    }
  };

  // Button disabled state
  const isButtonDisabled = (): boolean => {
    if (stage === 'idle' || stage === 'error') {
      return false;
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
              <h2 className="text-xl font-bold text-white">Start GPU Rental</h2>
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
                <div className="text-sm text-gray-400">Region</div>
                <div className="text-white font-medium">
                  {gpu.region === 'asia' ? 'Asia' : gpu.region === 'us' ? 'North America' : gpu.region === 'eu' ? 'Europe' : gpu.region}
                </div>
              </div>
              <div className="col-span-2">
                <div className="text-sm text-gray-400">Price</div>
                <div className="text-white font-medium font-mono">
                  {Number(pricePerHourDisplay).toFixed(2)} WLC/hr
                </div>
              </div>
            </div>

            {/* Resource selection (hidden after rental starts) */}
            {(stage === 'idle' || stage === 'error') && (
              <ResourceSelector
                gpu={gpu}
                value={resources}
                onChange={setResources}
              />
            )}

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

            {/* Session FAILED state (detected after completion via polling) */}
            {stage === 'complete' && sessionFailed && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 text-red-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span className="font-semibold text-base">GPU Rental Failed</span>
                </div>
                <p className="text-sm text-red-300">
                  Container creation failed due to insufficient resources. The blockchain transaction was completed, but a refund may be needed.
                </p>
                <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 rounded text-xs text-yellow-400">
                  Refunds are processed automatically during settlement or contact support.
                </div>
                {hash && (
                  <div className="p-2 bg-black/20 rounded font-mono text-xs break-all text-red-300/60">
                    <span className="opacity-50">tx: </span>
                    {hash}
                  </div>
                )}
              </div>
            )}

            {/* Container provisioning notice (complete but SSH not ready yet, NOT failed) */}
            {stage === 'complete' && !sshCredentials && !sessionFailed && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 text-blue-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-medium">Rental has started!</span>
                </div>
                <p className="text-sm text-gray-300">
                  Downloading container image. Large images (PyTorch, CUDA, etc.) may take a few minutes.
                </p>
                <p className="text-sm text-gray-400">
                  SSH credentials will appear in your <span className="text-purple-400 font-medium">Active Rentals</span> list.
                </p>
              </div>
            )}

            {/* SSH credentials (shown on success, hidden when failed) */}
            {stage === 'complete' && sshCredentials && !sessionFailed && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 space-y-4">
                <div className="flex items-center gap-2 text-green-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-medium">Rental has started!</span>
                </div>

                <div className="text-sm text-gray-300">
                  Use the following SSH credentials to connect:
                </div>

                <div className="space-y-3 font-mono text-sm">
                  <div className="flex items-center justify-between p-2 bg-gray-800 rounded">
                    <div>
                      <div className="text-gray-400 text-xs">Host</div>
                      <div className="text-white">{sshCredentials.sshHost}:{sshCredentials.sshPort}</div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(`${sshCredentials.sshHost}:${sshCredentials.sshPort}`, 'host')}
                      className="text-purple-400 hover:text-purple-300"
                    >
                      {copiedField === 'host' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-2 bg-gray-800 rounded">
                    <div>
                      <div className="text-gray-400 text-xs">User</div>
                      <div className="text-white">{sshCredentials.sshUser}</div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(sshCredentials.sshUser, 'user')}
                      className="text-purple-400 hover:text-purple-300"
                    >
                      {copiedField === 'user' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-2 bg-gray-800 rounded">
                    <div>
                      <div className="text-gray-400 text-xs">Password</div>
                      <div className="text-white">{sshCredentials.sshPassword}</div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(sshCredentials.sshPassword, 'password')}
                      className="text-purple-400 hover:text-purple-300"
                    >
                      {copiedField === 'password' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-2 bg-gray-800 rounded">
                    <div>
                      <div className="text-gray-400 text-xs">SSH Command</div>
                      <div className="text-white break-all">
                        ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null {sshCredentials.sshUser}@{sshCredentials.sshHost} -p {sshCredentials.sshPort}
                      </div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(
                        `ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ${sshCredentials.sshUser}@${sshCredentials.sshHost} -p ${sshCredentials.sshPort}`,
                        'command'
                      )}
                      className="text-purple-400 hover:text-purple-300 whitespace-nowrap ml-2"
                    >
                      {copiedField === 'command' ? 'Copied!' : 'Copy'}
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
                  <span className="font-medium">Error</span>
                </div>
                <p className="text-sm text-red-300 mt-2">{errorMessage}</p>
              </div>
            )}

            {/* Action button */}
            <button
              onClick={
                stage === 'complete' && sessionFailed
                  ? handleClose
                  : stage === 'complete'
                    ? () => { reset(); onClose(); router.push('/rent/sessions'); }
                    : stage === 'error'
                      ? reset
                      : handleStartRental
              }
              disabled={isButtonDisabled() && !(stage === 'complete' && sessionFailed) && stage !== 'complete'}
              className={`
                w-full py-4 rounded-lg text-white font-medium text-lg transition-colors
                ${isButtonDisabled() && !(stage === 'complete' && sessionFailed) && stage !== 'complete'
                  ? 'bg-gray-700 cursor-not-allowed'
                  : stage === 'complete' && sessionFailed
                    ? 'bg-red-600 hover:bg-red-700'
                    : stage === 'complete'
                      ? 'bg-green-600 hover:bg-green-700'
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
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default RentalStartModal;
