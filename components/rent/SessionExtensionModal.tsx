'use client';

import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useExtendSession } from '@/hooks/useExtendSession';

/**
 * Session data for extension modal (compatible with RentalStatusCard interface)
 */
interface ExtensionSession {
  id: string;
  price_per_sec?: string;
  pricePerSecond?: string;
  extended_until?: string;
  extendedUntil?: string;
  balance?: string;
}

/**
 * Session extension modal props
 */
export interface SessionExtensionModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Callback when modal closes */
  onClose: () => void;
  /** Session to extend (null when closed) */
  session: ExtensionSession | null;
  /** Optional callback after successful extension */
  onSuccess?: () => void;
}

/**
 * Duration preset option
 */
interface DurationPreset {
  label: string;
  minutes: number;
}

/**
 * Duration presets for quick selection
 */
const DURATION_PRESETS: DurationPreset[] = [
  { label: '1시간', minutes: 60 },
  { label: '2시간', minutes: 120 },
  { label: '4시간', minutes: 240 },
  { label: '8시간', minutes: 480 },
];

/**
 * Calculate extension cost based on price per second and minutes
 *
 * @param pricePerSecond - Price per second in wei (string)
 * @param minutes - Number of minutes to extend
 * @returns Cost in WLC (formatted to 6 decimals)
 */
function calculateExtensionCost(pricePerSecond: string, minutes: number): string {
  const pricePerMin = parseFloat(pricePerSecond) * 60;
  return (pricePerMin * minutes).toFixed(6);
}

/**
 * SessionExtensionModal - Modal for extending active GPU sessions
 *
 * Features:
 * - 4 preset duration buttons (1h, 2h, 4h, 8h) with cost preview
 * - Custom duration input (minimum 30 minutes)
 * - Cost breakdown (extension cost, current balance, remaining after)
 * - Warning if remaining balance < 1 hour runtime
 * - Calls useExtendSession mutation on confirm
 * - Dark theme with purple accent
 * - Korean labels
 *
 * Flow:
 * 1. User selects preset or enters custom duration
 * 2. Modal shows cost calculation and balance preview
 * 3. User clicks "연장하기" to confirm
 * 4. useExtendSession mutation executes
 * 5. On success: onSuccess callback, modal closes
 * 6. On error: error toast shown (handled in hook), modal stays open
 *
 * @example
 * <SessionExtensionModal
 *   isOpen={isExtensionModalOpen}
 *   onClose={() => setIsExtensionModalOpen(false)}
 *   session={currentSession}
 *   onSuccess={() => refetch()}
 * />
 */
export function SessionExtensionModal({
  isOpen,
  onClose,
  session,
  onSuccess,
}: SessionExtensionModalProps) {
  const [selectedMinutes, setSelectedMinutes] = useState<number>(60); // Default 1 hour
  const [customMinutes, setCustomMinutes] = useState<string>('');
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);

  const extendSession = useExtendSession();

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedMinutes(60);
      setCustomMinutes('');
      setIsCustomMode(false);
    }
  }, [isOpen]);

  // Don't render if session is null
  if (!session) return null;

  // Support both naming conventions (snake_case and camelCase)
  const pricePerSecond = session.price_per_sec || session.pricePerSecond || '0';
  const extendedUntil = session.extended_until || session.extendedUntil;

  // Calculate costs
  const extensionCost = calculateExtensionCost(pricePerSecond, selectedMinutes);

  const currentBalance = parseFloat(session.balance || '0');
  const costAmount = parseFloat(extensionCost);
  const remainingBalance = currentBalance - costAmount;

  // Calculate 1-hour runtime cost for warning
  const oneHourCost = parseFloat(calculateExtensionCost(pricePerSecond, 60));
  const showLowBalanceWarning = remainingBalance < oneHourCost;

  /**
   * Handle preset button click
   */
  const handlePresetClick = (minutes: number) => {
    setSelectedMinutes(minutes);
    setIsCustomMode(false);
    setCustomMinutes('');
  };

  /**
   * Handle custom input change
   */
  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomMinutes(value);
    setIsCustomMode(true);

    const parsed = parseInt(value, 10);
    if (!isNaN(parsed) && parsed >= 30) {
      setSelectedMinutes(parsed);
    }
  };

  /**
   * Handle extension confirmation
   */
  const handleConfirm = () => {
    if (selectedMinutes < 30) return;
    if (remainingBalance < 0) return;

    extendSession.mutate(
      {
        sessionId: session.id,
        extensionMinutes: selectedMinutes,
      },
      {
        onSuccess: () => {
          onSuccess?.();
          onClose();
        },
      }
    );
  };

  /**
   * Format expiration time for display
   */
  const formatExpiration = (isoString?: string): string => {
    if (!isoString) return '만료 시간 없음';

    try {
      const date = new Date(isoString);
      return date.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '만료 시간 없음';
    }
  };

  // Button disabled state
  const isConfirmDisabled =
    selectedMinutes < 30 ||
    remainingBalance < 0 ||
    extendSession.isPending;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60" />
        </Transition.Child>

        {/* Modal container */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-xl bg-gray-900 border border-gray-800 p-6 shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title className="text-xl font-bold text-white">
                    세션 연장
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    disabled={extendSession.isPending}
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

                {/* Current expiration */}
                <div className="mb-6 p-4 bg-gray-800/50 rounded-lg">
                  <div className="text-sm text-gray-400 mb-1">현재 만료 시간</div>
                  <div className="text-white font-medium">
                    {formatExpiration(extendedUntil)}
                  </div>
                </div>

                {/* Duration picker */}
                <div className="mb-6">
                  <label className="block text-sm text-gray-400 mb-3">
                    연장 시간 선택
                  </label>

                  {/* Preset buttons */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    {DURATION_PRESETS.map((preset) => {
                      const presetCost = calculateExtensionCost(
                        pricePerSecond,
                        preset.minutes
                      );
                      const isSelected =
                        !isCustomMode && selectedMinutes === preset.minutes;

                      return (
                        <button
                          key={preset.minutes}
                          onClick={() => handlePresetClick(preset.minutes)}
                          className={`
                            p-3 rounded-lg border transition-colors text-left
                            ${isSelected
                              ? 'border-purple-500 bg-purple-500/10 text-white'
                              : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600'
                            }
                          `}
                        >
                          <div className="font-medium">{preset.label}</div>
                          <div className="text-xs mt-1 opacity-70">
                            +{Number(presetCost).toFixed(4)} WLC
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom input */}
                  <div>
                    <label className="block text-xs text-gray-500 mb-2">
                      커스텀 시간 (최소 30분)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min={30}
                        value={customMinutes}
                        onChange={handleCustomInputChange}
                        placeholder="최소 30분"
                        className={`
                          w-full bg-gray-800 border rounded-lg px-4 py-3 pr-12
                          text-white placeholder:text-gray-500
                          focus:outline-none transition-colors
                          ${isCustomMode
                            ? 'border-purple-500'
                            : 'border-gray-700 focus:border-purple-500'
                          }
                        `}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                        분
                      </span>
                    </div>
                  </div>
                </div>

                {/* Cost summary */}
                <div className="mb-6 p-4 bg-gray-800 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">연장 비용</span>
                    <span className="text-white font-medium font-mono">
                      +{Number(extensionCost).toFixed(6)} WLC
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">현재 잔액</span>
                    <span className="text-white font-medium font-mono">
                      {currentBalance.toFixed(6)} WLC
                    </span>
                  </div>

                  <div className="pt-3 border-t border-gray-700 flex items-center justify-between">
                    <span className="text-gray-300 font-medium">연장 후 잔액</span>
                    <span
                      className={`font-medium font-mono ${
                        remainingBalance < 0
                          ? 'text-red-400'
                          : showLowBalanceWarning
                            ? 'text-yellow-400'
                            : 'text-green-400'
                      }`}
                    >
                      {remainingBalance.toFixed(6)} WLC
                    </span>
                  </div>
                </div>

                {/* Low balance warning */}
                {showLowBalanceWarning && remainingBalance >= 0 && (
                  <div className="mb-6 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <div className="flex items-start gap-2 text-yellow-400 text-sm">
                      <svg
                        className="w-5 h-5 flex-shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                      <span>
                        연장 후 잔액이 1시간 미만 사용량입니다. 추가 입금을 권장합니다.
                      </span>
                    </div>
                  </div>
                )}

                {/* Insufficient balance error */}
                {remainingBalance < 0 && (
                  <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <div className="flex items-start gap-2 text-red-400 text-sm">
                      <svg
                        className="w-5 h-5 flex-shrink-0 mt-0.5"
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
                      <span>잔액이 부족합니다. 입금 후 다시 시도해 주세요.</span>
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    disabled={extendSession.isPending}
                    className="flex-1 px-4 py-3 rounded-lg text-white font-medium bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={isConfirmDisabled}
                    className="flex-1 px-4 py-3 rounded-lg text-white font-medium bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {extendSession.isPending ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg
                          className="w-4 h-4 animate-spin"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                        연장 중...
                      </span>
                    ) : (
                      '연장하기'
                    )}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

export default SessionExtensionModal;
