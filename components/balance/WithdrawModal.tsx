'use client';

import { useState, useEffect } from 'react';
import { useWithdraw } from '@/hooks/useWithdraw';
import { useWithdrawGasEstimate } from '@/hooks/useGasEstimate';
import { useContractBalance } from '@/hooks/useContractBalance';
import { GasEstimateDisplay } from './GasEstimateDisplay';
import { TransactionStatus } from './TransactionStatus';

/**
 * WithdrawModal component props
 */
interface WithdrawModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Callback when modal closes */
  onClose: () => void;
}

/**
 * WithdrawModal - Modal for withdrawing tokens from contract
 *
 * Features:
 * - Amount input with validation
 * - Max button to withdraw full balance
 * - Balance validation (cannot withdraw more than available)
 * - Gas estimate preview (crypto + fiat) via useWithdrawGasEstimate
 * - 6-state transaction feedback via TransactionStatus
 * - Korean labels and error messages
 * - Auto-close on success after balance refetch
 *
 * Transaction states shown via button text:
 * - idle: "출금하기" (Withdraw)
 * - wallet: "지갑에서 서명..." (Signing in wallet...)
 * - pending/confirmed: "처리 중..." (Processing...)
 * - success: "완료!" (Complete!)
 * - fail: "다시 시도" (Try again)
 *
 * @example
 * <WithdrawModal
 *   isOpen={withdrawOpen}
 *   onClose={() => setWithdrawOpen(false)}
 * />
 */
export function WithdrawModal({ isOpen, onClose }: WithdrawModalProps) {
  const [amount, setAmount] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Hooks
  const {
    withdraw,
    status,
    hash,
    errorMessage,
    reset,
  } = useWithdraw();
  const gasEstimate = useWithdrawGasEstimate(amount);
  const { formatted: availableBalance, refetch: refetchBalance } = useContractBalance();

  // Validate amount against available balance
  useEffect(() => {
    if (!amount) {
      setValidationError(null);
      return;
    }

    const amountNum = parseFloat(amount);
    const availableNum = parseFloat(availableBalance);

    if (isNaN(amountNum) || amountNum <= 0) {
      setValidationError(null);
      return;
    }

    if (amountNum > availableNum) {
      setValidationError('잔액이 부족합니다');
    } else {
      setValidationError(null);
    }
  }, [amount, availableBalance]);

  // Button text based on transaction status
  const getButtonText = (): string => {
    switch (status) {
      case 'idle':
        return '출금하기';
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
        return '출금하기';
    }
  };

  // Button disabled state
  const isButtonDisabled = (): boolean => {
    // Allow button when idle or failed (to retry)
    if (status === 'idle' || status === 'fail') {
      const amountNum = parseFloat(amount);
      const availableNum = parseFloat(availableBalance);
      return (
        !amount ||
        isNaN(amountNum) ||
        amountNum <= 0 ||
        amountNum > availableNum ||
        !!validationError
      );
    }
    // Disable during transaction processing
    return true;
  };

  // Handle withdraw click
  const handleWithdraw = async () => {
    if (status === 'fail') {
      // Reset and allow retry
      reset();
      return;
    }

    try {
      await withdraw(amount);
    } catch (error) {
      console.error('Withdraw error:', error);
    }
  };

  // Handle max button click
  const handleMax = () => {
    setAmount(availableBalance);
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
    setValidationError(null);
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
              토큰 출금
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

          {/* Available balance */}
          <div className="mb-4 p-3 bg-gray-800/50 rounded-lg">
            <div className="text-sm text-gray-400 mb-1">
              출금 가능 금액
            </div>
            <div className="text-lg font-mono text-white">
              {availableBalance} BNB
            </div>
          </div>

          {/* Amount input */}
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">
              출금할 금액
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                disabled={status !== 'idle' && status !== 'fail'}
                className={`
                  w-full bg-gray-800 border rounded-lg
                  p-4 pr-24 text-white text-lg font-mono
                  focus:outline-none focus:border-purple-500
                  disabled:opacity-50 disabled:cursor-not-allowed
                  [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
                  ${validationError ? 'border-red-500' : 'border-gray-700'}
                `}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <button
                  onClick={handleMax}
                  disabled={status !== 'idle' && status !== 'fail'}
                  className="px-2 py-1 bg-purple-600 hover:bg-purple-700 rounded text-xs font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  최대
                </button>
                <span className="text-gray-400">BNB</span>
              </div>
            </div>
            {/* Validation error */}
            {validationError && (
              <p className="text-sm text-red-400 mt-2">
                {validationError}
              </p>
            )}
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

          {/* Withdraw button */}
          <button
            onClick={handleWithdraw}
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
        </div>
      </div>
    </>
  );
}

export default WithdrawModal;
