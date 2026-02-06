'use client';

import { useContractBalance } from './useContractBalance';

/**
 * Earnings breakdown for provider
 */
export interface ProviderEarnings {
  /** Total earned from all settlements (in wei) */
  totalEarned: bigint;
  /** Amount withdrawable from contract (on-chain balance in wei) */
  withdrawable: bigint;
  /** Amount pending settlement (always 0 for providers - settled on-chain) */
  pendingSettlement: bigint;
}

/**
 * Return type for useProviderEarnings hook
 */
export interface UseProviderEarningsReturn {
  /** Earnings breakdown */
  earnings: ProviderEarnings;
  /** Whether data is loading */
  isLoading: boolean;
  /** Error if fetch failed */
  error: Error | null;
  /** Manually refetch earnings */
  refetch: () => void;
}

/**
 * Fetch provider's earnings from contract
 *
 * Provider earnings come from the WorldlandRental contract's deposits mapping.
 * When rentals are settled, payment goes from user's deposit to provider's deposit.
 *
 * Features:
 * - Uses on-chain contract balance as the source of truth
 * - Auto-refresh every 30 seconds via useContractBalance
 * - totalEarned = withdrawable (all earnings are in contract)
 * - pendingSettlement = 0 (settlement happens on-chain atomically)
 *
 * @example
 * const { earnings, isLoading, error } = useProviderEarnings();
 *
 * if (isLoading) return <Skeleton />;
 *
 * return (
 *   <div>
 *     <p>Total Earned: {formatEther(earnings.totalEarned)} WLC</p>
 *     <p>Withdrawable: {formatEther(earnings.withdrawable)} WLC</p>
 *   </div>
 * );
 */
export function useProviderEarnings(): UseProviderEarningsReturn {
  const { balance: withdrawable, loading: contractLoading, refetch: refetchBalance } = useContractBalance();

  // For providers, all earnings are in the contract (settled atomically on-chain)
  // totalEarned = withdrawable (what's available in contract)
  // pendingSettlement = 0 (no off-chain pending for providers)
  const earnings: ProviderEarnings = {
    totalEarned: withdrawable,
    withdrawable,
    pendingSettlement: BigInt(0),
  };

  return {
    earnings,
    isLoading: contractLoading,
    error: null,
    refetch: () => {
      refetchBalance();
    },
  };
}
