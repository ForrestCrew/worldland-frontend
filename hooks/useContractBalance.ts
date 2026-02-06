'use client';

import { useAccount, useReadContract } from 'wagmi';
import { formatEther } from 'viem';
import {
  WorldlandRentalABI,
  RENTAL_CONTRACT_ADDRESS,
} from '@/lib/contracts/WorldlandRental';
import { useFiatConversion, formatUSD } from '@/lib/fiat-conversion';

/**
 * Contract balance state interface
 */
export interface ContractBalanceState {
  /** Raw balance in wei */
  balance: bigint;
  /** Formatted balance (e.g., "100.5") */
  formatted: string;
  /** USD value formatted (e.g., "$302.50") */
  fiat: string;
  /** Token symbol */
  symbol: string;
  /** Whether balance is loading */
  loading: boolean;
  /** Refetch balance */
  refetch: () => void;
}

/**
 * Hook for reading on-chain deposit balance from WorldlandRental contract
 *
 * Queries the deposits(address) view function to get user's deposited balance.
 * Includes fiat conversion using CoinGecko API.
 *
 * Features:
 * - Auto-refresh every 30 seconds (refetchInterval)
 * - Stale after 10 seconds (staleTime)
 * - Fiat conversion to USD
 * - Manual refetch capability
 *
 * @example
 * const { balance, formatted, fiat, loading, refetch } = useContractBalance();
 * // After successful deposit:
 * refetch();
 */
export function useContractBalance(): ContractBalanceState {
  const { address } = useAccount();
  const { convertToFiat, loading: fiatLoading } = useFiatConversion();

  // Query deposits(address) from contract
  const {
    data: balance,
    refetch,
    isLoading,
    isFetching,
  } = useReadContract({
    address: RENTAL_CONTRACT_ADDRESS,
    abi: WorldlandRentalABI,
    functionName: 'deposits',
    args: [address!],
    query: {
      enabled: !!address,
      staleTime: 10000, // 10 seconds
      refetchInterval: 30000, // 30 seconds background refresh
    },
  });

  // Format balance
  const balanceValue = balance ?? BigInt(0);
  const balanceFormatted = formatEther(balanceValue);

  // Convert to fiat
  const balanceNumber = parseFloat(balanceFormatted);
  const balanceFiatValue = convertToFiat(balanceNumber);
  const balanceFiat = formatUSD(balanceFiatValue);

  return {
    balance: balanceValue,
    formatted: balanceFormatted,
    fiat: balanceFiat,
    symbol: 'WLC',
    loading: isLoading || isFetching || fiatLoading,
    refetch: () => {
      refetch();
    },
  };
}
