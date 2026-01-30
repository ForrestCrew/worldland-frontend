'use client';

import { useState, useEffect } from 'react';
import { useDeposit } from '@/hooks/useDeposit';
import { useDepositGasEstimate } from '@/hooks/useGasEstimate';
import { useContractBalance } from '@/hooks/useContractBalance';
import { GasEstimateDisplay } from './GasEstimateDisplay';
import { TransactionStatus } from './TransactionStatus';

/**
 * DepositModal component props
 */
interface DepositModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Callback when modal closes */
  onClose: () => void;
}

/**
 * DepositModal - Modal for depositing tokens to contract
 *
 * Features:
 * - Amount input with validation
 * - Gas estimate preview (crypto + fiat) via useDepositGasEstimate
 * - ERC20 approval handling (automatic via useDeposit)
 * - 6-state transaction feedback via TransactionStatus
 * - Korean labels and error messages
 * - Auto-close on success after balance refetch
 *
 * Transaction states shown via button text:
 * - idle + needsApproval: "승인 후 입금" (Approve then deposit)
 * - idle + !needsApproval: "입금하기" (Deposit)
 * - wallet: "지갑에서 서명..." (Signing in wallet...)
 * - pending/confirmed: "처리 중..." (Processing...)
 * - success: "완료!" (Complete!)
 * - fail: "다시 시도" (Try again)
 *
 * @example
 * <DepositModal
 *   isOpen={depositOpen}
 *   onClose={() => setDepositOpen(false)}
 * />
 */
export function DepositModal({ isOpen, onClose }: DepositModalProps) {
  const [amount, setAmount] = useState('');

  // Hooks
  const {
    deposit,
    status,
    hash,
    errorMessage,
    needsApproval,
    reset,
  } = useDeposit();
  const gasEstimate = useDepositGasEstimate(amount);
  const { refetch: refetchBalance } = useContractBalance();

  // Button text based on transaction status
  const getButtonText = (): string => {
    switch (status) {
      case 'idle':
        return needsApproval ? '승인 후 입금' : '입금하기';
      case 'wallet':
        return '지갑에서 서명...';
      case 'pending':
      case 'confirmed':
        return '처리 중...';
      case 'success':
        return '완료!';
      case 'fail':
        return '다시 시도';
      default:
        return '입금하기';
    }
  };

  // Button disabled state
  const isButtonDisabled = (): boolean => {
    // Allow button when idle or failed (to retry)
    if (status === 'idle' || status === 'fail') {
      const amountNum = parseFloat(amount);
      return !amount || isNaN(amountNum) || amountNum <= 0;
    }
    // Disable during transaction processing
    return true;
  };

  // Handle deposit click
  const handleDeposit = async () => {
    if (status === 'fail') {
      // Reset and allow retry
      reset();
      return;
    }

    try {
      await deposit(amount);
    } catch (error) {
      console.error('Deposit error:', error);
    }
  };

  // Auto-close on success after balance refetch
  useEffect(() => {
    if (status === 'success') {
      // Refetch balance immediately
      refetchBalance();

      // Auto-close after 2 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [status, refetchBalance]);

  // Handle modal close
  const handleClose = () => {
    // Reset state
    reset();
    setAmount('');
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
            <h2 className="text-xl font-bold text-white">
              토큰 입금
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

          {/* Amount input */}
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">
              입금할 금액
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                disabled={status !== 'idle' && status !== 'fail'}
                className={`
                  w-full bg-gray-800 border border-gray-700 rounded-lg
                  p-4 pr-16 text-white text-lg font-mono
                  focus:outline-none focus:border-purple-500
                  disabled:opacity-50 disabled:cursor-not-allowed
                  [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
                `}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                BNB
              </span>
            </div>
          </div>

          {/* Gas estimate */}
          <div className="mb-4">
            <GasEstimateDisplay
              gasCrypto={gasEstimate.gasCrypto}
              gasFiat={gasEstimate.gasFiat}
              loading={gasEstimate.loading}
            />
          </div>

          {/* Transaction status */}
          {status !== 'idle' && (
            <div className="mb-4">
              <TransactionStatus
                status={status}
                hash={hash}
                error={errorMessage}
              />
            </div>
          )}

          {/* Deposit button */}
          <button
            onClick={handleDeposit}
            disabled={isButtonDisabled()}
            className={`
              w-full py-4 rounded-lg text-white font-medium text-lg transition-colors
              ${isButtonDisabled()
                ? 'bg-gray-700 cursor-not-allowed'
                : status === 'success'
                  ? 'bg-green-600'
                  : status === 'fail'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-purple-600 hover:bg-purple-700'
              }
            `}
          >
            {getButtonText()}
          </button>

          {/* Approval info text */}
          {needsApproval && status === 'idle' && (
            <p className="text-xs text-gray-500 mt-3 text-center">
              첫 입금 시 토큰 승인이 필요합니다. 2단계로 진행됩니다.
            </p>
          )}
        </div>
      </div>
    </>
  );
}

export default DepositModal;
