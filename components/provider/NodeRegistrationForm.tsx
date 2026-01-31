'use client';

import { useState, useEffect } from 'react';
import { parseEther } from 'viem';
import { useRegisterNode } from '@/hooks';

/**
 * NodeRegistrationForm component props
 */
interface NodeRegistrationFormProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Callback when modal closes */
  onClose: () => void;
  /** Callback when registration succeeds */
  onSuccess?: () => void;
}

/**
 * NodeRegistrationForm - Modal form for web-based GPU node registration
 *
 * Allows providers to register GPU nodes directly from the web interface
 * without requiring CLI tools. Converts per-hour pricing to per-second
 * before submitting to the API.
 *
 * Features:
 * - GPU model input (min 2 chars)
 * - VRAM input (1-128 GB)
 * - Price per hour input (min 0.0001 WLC/hr)
 * - Auto-converts per-hour price to per-second wei string
 * - Uses useRegisterNode hook from Plan 07-01
 * - Success message and auto-close on success
 * - Error handling with Korean messages
 *
 * @example
 * <NodeRegistrationForm
 *   isOpen={showForm}
 *   onClose={() => setShowForm(false)}
 *   onSuccess={() => {
 *     setShowForm(false);
 *     // Node list auto-refreshes via cache invalidation
 *   }}
 * />
 */
export function NodeRegistrationForm({
  isOpen,
  onClose,
  onSuccess,
}: NodeRegistrationFormProps) {
  const [gpuModel, setGpuModel] = useState('');
  const [vram, setVram] = useState('');
  const [pricePerHour, setPricePerHour] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Hook for node registration mutation
  const { registerNode, isPending, isSuccess, error, reset } = useRegisterNode();

  // Validate form inputs
  const validateForm = (): boolean => {
    if (!gpuModel || gpuModel.trim().length < 2) {
      setErrorMessage('GPU 모델은 최소 2자 이상이어야 합니다');
      return false;
    }

    const vramNum = parseInt(vram);
    if (!vram || isNaN(vramNum) || vramNum < 1 || vramNum > 128) {
      setErrorMessage('VRAM은 1-128 GB 사이여야 합니다');
      return false;
    }

    const priceNum = parseFloat(pricePerHour);
    if (!pricePerHour || isNaN(priceNum) || priceNum < 0.0001) {
      setErrorMessage('가격은 최소 0.0001 WLC/hr 이상이어야 합니다');
      return false;
    }

    setErrorMessage('');
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      // Convert per-hour price to per-second
      // parseEther converts to wei, then divide by 3600 seconds
      const pricePerHourWei = parseEther(pricePerHour);
      const pricePerSecWei = pricePerHourWei / BigInt(3600);

      // Call mutation
      registerNode({
        gpu_type: gpuModel.trim(),
        vram_gb: parseInt(vram),
        price_per_sec: pricePerSecWei.toString(),
      });
    } catch (err) {
      setErrorMessage('가격 변환 중 오류가 발생했습니다');
      console.error('Price conversion error:', err);
    }
  };

  // Handle modal close
  const handleClose = () => {
    // Reset form state
    setGpuModel('');
    setVram('');
    setPricePerHour('');
    setErrorMessage('');
    reset();
    onClose();
  };

  // Handle successful registration
  useEffect(() => {
    if (isSuccess) {
      // Show success message (could use toast library in future)
      setErrorMessage('');

      // Call success callback
      if (onSuccess) {
        onSuccess();
      }

      // Auto-close after showing success
      const timer = setTimeout(() => {
        handleClose();
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [isSuccess, onSuccess]);

  // Update error message when mutation fails
  useEffect(() => {
    if (error) {
      setErrorMessage(error.message || '등록에 실패했습니다');
    }
  }, [error]);

  // Don't render if not open
  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
        onClick={handleClose}
      >
        {/* Modal card */}
        <div
          className="bg-gray-900 rounded-xl p-6 w-full max-w-md mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">
              GPU 노드 등록
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white transition-colors"
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

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* GPU Model input */}
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">
                GPU 모델
              </label>
              <input
                type="text"
                value={gpuModel}
                onChange={(e) => setGpuModel(e.target.value)}
                placeholder="예: RTX 4090, A100"
                disabled={isPending || isSuccess}
                className={`
                  w-full bg-gray-800 border border-gray-700 rounded-lg
                  p-3 text-white
                  focus:outline-none focus:border-purple-500
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
                required
                minLength={2}
              />
            </div>

            {/* VRAM input */}
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">
                VRAM (GB)
              </label>
              <input
                type="number"
                value={vram}
                onChange={(e) => setVram(e.target.value)}
                placeholder="24"
                disabled={isPending || isSuccess}
                className={`
                  w-full bg-gray-800 border border-gray-700 rounded-lg
                  p-3 text-white
                  focus:outline-none focus:border-purple-500
                  disabled:opacity-50 disabled:cursor-not-allowed
                  [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
                `}
                required
                min={1}
                max={128}
              />
            </div>

            {/* Price per hour input */}
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">
                시간당 가격 (WLC)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={pricePerHour}
                  onChange={(e) => setPricePerHour(e.target.value)}
                  placeholder="0.5"
                  step="0.0001"
                  disabled={isPending || isSuccess}
                  className={`
                    w-full bg-gray-800 border border-gray-700 rounded-lg
                    p-3 pr-20 text-white
                    focus:outline-none focus:border-purple-500
                    disabled:opacity-50 disabled:cursor-not-allowed
                    [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
                  `}
                  required
                  min={0.0001}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  WLC/hr
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                최소 가격: 0.0001 WLC/hr
              </p>
            </div>

            {/* Error message */}
            {errorMessage && !isSuccess && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-sm text-red-400">{errorMessage}</p>
              </div>
            )}

            {/* Success message */}
            {isSuccess && (
              <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-sm text-green-400">노드가 등록되었습니다</p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={isPending}
                className={`
                  flex-1 py-3 rounded-lg font-medium transition-colors
                  ${isPending
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }
                `}
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isPending || isSuccess}
                className={`
                  flex-1 py-3 rounded-lg font-medium transition-colors
                  ${isPending
                    ? 'bg-purple-600/50 text-white cursor-wait'
                    : isSuccess
                      ? 'bg-green-600 text-white'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }
                `}
              >
                {isPending ? '등록 중...' : isSuccess ? '완료!' : '등록'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default NodeRegistrationForm;
