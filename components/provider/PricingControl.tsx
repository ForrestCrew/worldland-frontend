'use client';

import { useState, useEffect } from 'react';
import { formatEther, parseEther } from 'viem';
import { useUpdateNodePrice } from '@/hooks';

/**
 * PricingControl component props
 */
interface PricingControlProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Callback when modal closes */
  onClose: () => void;
  /** Node ID to update */
  nodeId: string;
  /** Current price per second in wei */
  currentPricePerSec: string;
}

/**
 * PricingControl - Modal form for updating node pricing
 *
 * Features:
 * - Per-hour price input (converted to per-second for backend)
 * - Uses useUpdateNodePrice hook for mutation
 * - Loading state during mutation (isPending)
 * - Auto-close on success after cache invalidation
 * - Korean labels and messages
 * - Same modal pattern as DepositModal (overlay + card)
 *
 * Price conversion:
 * - Display: per-second (backend) * 3600 = per-hour (UI)
 * - Submit: per-hour (input) / 3600 = per-second (API)
 *
 * Note: "다음 임대부터 새 가격이 적용됩니다" - price changes apply to future rentals
 *
 * @example
 * <PricingControl
 *   isOpen={pricingModalOpen}
 *   onClose={() => setPricingModalOpen(false)}
 *   nodeId="node-123"
 *   currentPricePerSec="1000000000000000"
 * />
 */
export function PricingControl({
  isOpen,
  onClose,
  nodeId,
  currentPricePerSec,
}: PricingControlProps) {
  const [pricePerHour, setPricePerHour] = useState('');
  const { updatePrice, isPending, error, reset } = useUpdateNodePrice();

  // Initialize input with current price (converted to per-hour)
  useEffect(() => {
    if (isOpen && currentPricePerSec) {
      const perSecBigInt = BigInt(currentPricePerSec);
      const perHourBigInt = perSecBigInt * BigInt(3600);
      const formatted = formatEther(perHourBigInt);
      setPricePerHour(Number(formatted).toFixed(4));
    }
  }, [isOpen, currentPricePerSec]);

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!pricePerHour || parseFloat(pricePerHour) <= 0) {
      return;
    }

    try {
      // Convert per-hour input to per-second for backend
      const perHourWei = parseEther(pricePerHour);
      const perSecWei = perHourWei / BigInt(3600);

      updatePrice(
        { nodeId, price_per_sec: perSecWei.toString() },
        {
          onSuccess: () => {
            // Auto-close modal on success
            setTimeout(() => {
              handleClose();
            }, 1000);
          },
        }
      );
    } catch (err) {
      console.error('Price update error:', err);
    }
  };

  // Handle modal close
  const handleClose = () => {
    reset();
    setPricePerHour('');
    onClose();
  };

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
            <h2 className="text-xl font-bold text-white">가격 수정</h2>
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
            {/* Price input */}
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">
                시간당 가격 (WLC)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={pricePerHour}
                  onChange={(e) => setPricePerHour(e.target.value)}
                  placeholder="0.0000"
                  step="0.0001"
                  disabled={isPending}
                  className={`
                    w-full bg-gray-800 border border-gray-700 rounded-lg
                    p-4 pr-20 text-white text-lg font-mono
                    focus:outline-none focus:border-purple-500
                    disabled:opacity-50 disabled:cursor-not-allowed
                    [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
                  `}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                  WLC/hr
                </span>
              </div>
            </div>

            {/* Info note */}
            <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-xs text-blue-400">
                다음 임대부터 새 가격이 적용됩니다
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-sm text-red-400">{error.message}</p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3">
              {/* Cancel button */}
              <button
                type="button"
                onClick={handleClose}
                disabled={isPending}
                className={`
                  flex-1 py-3 rounded-lg text-white font-medium transition-colors
                  ${isPending
                    ? 'bg-gray-700 cursor-not-allowed'
                    : 'bg-gray-700 hover:bg-gray-600'
                  }
                `}
              >
                취소
              </button>

              {/* Save button */}
              <button
                type="submit"
                disabled={isPending || !pricePerHour || parseFloat(pricePerHour) <= 0}
                className={`
                  flex-1 py-3 rounded-lg text-white font-medium transition-colors
                  ${isPending || !pricePerHour || parseFloat(pricePerHour) <= 0
                    ? 'bg-gray-700 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-700'
                  }
                `}
              >
                {isPending ? '저장 중...' : '저장'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default PricingControl;
