'use client';

import { useEstimateGas, useEstimateFeesPerGas, useAccount } from 'wagmi';
import { formatEther, parseEther, encodeFunctionData } from 'viem';
import { useFiatConversion, formatUSD } from '@/lib/fiat-conversion';
import { WorldlandRentalABI } from '@/lib/contracts/abis';
import { RENTAL_CONTRACT_ADDRESS } from '@/lib/contracts/addresses';

/**
 * Parameters for gas estimation
 */
export interface UseGasEstimateParams {
  /** Target contract address */
  to: `0x${string}`;
  /** Encoded function data */
  data?: `0x${string}`;
  /** Value to send (native token) */
  value?: bigint;
  /** Enable/disable estimation */
  enabled?: boolean;
}

/**
 * Gas estimation result
 */
export interface GasEstimateResult {
  /** Gas cost in crypto with symbol, e.g., "0.00042 BNB" */
  gasCrypto: string;
  /** Gas cost in fiat, e.g., "$0.21" */
  gasFiat: string;
  /** Raw gas cost in wei */
  gasWei: bigint;
  /** Gas units estimate (with 10% buffer) */
  gasEstimate: bigint;
  /** Whether estimation is loading */
  loading: boolean;
  /** Error if estimation failed */
  error: Error | null;
}

/**
 * Hook for estimating gas costs with fiat conversion
 *
 * Features:
 * - Estimates gas units using wagmi's useEstimateGas
 * - Fetches current gas prices using useEstimateFeesPerGas
 * - Adds 10% buffer to gas estimate for network volatility
 * - Converts gas cost to fiat using CoinGecko rates
 *
 * @param params - Transaction parameters for gas estimation
 * @returns Gas estimate in crypto and fiat
 *
 * @example
 * const { gasCrypto, gasFiat, loading } = useGasEstimate({
 *   to: '0x...',
 *   data: encodeFunctionData({ abi, functionName: 'deposit', args: [amount] }),
 *   enabled: !!amount,
 * });
 */
export function useGasEstimate(params: UseGasEstimateParams): GasEstimateResult {
  const { to, data, value, enabled = true } = params;
  const { isConnected } = useAccount();

  // Estimate gas units
  const {
    data: gasEstimate,
    isLoading: estimateLoading,
    error: estimateError,
  } = useEstimateGas({
    to,
    data,
    value,
    query: {
      enabled: enabled && isConnected && !!to,
    },
  });

  // Get current gas prices (EIP-1559)
  const {
    data: feeData,
    isLoading: feeLoading,
    error: feeError,
  } = useEstimateFeesPerGas({
    query: {
      enabled: enabled && isConnected,
    },
  });

  // Fiat conversion
  const { convertToFiat, loading: fiatLoading } = useFiatConversion();

  // Calculate gas cost with 10% buffer (per RESEARCH.md Open Question 1)
  const gasWithBuffer = gasEstimate ? (gasEstimate * BigInt(110)) / BigInt(100) : BigInt(0);
  const gasCostWei =
    gasWithBuffer && feeData?.maxFeePerGas
      ? gasWithBuffer * feeData.maxFeePerGas
      : BigInt(0);

  // Format gas cost
  const gasCostEth = formatEther(gasCostWei);
  const gasCostNumber = parseFloat(gasCostEth);
  const gasFiatValue = convertToFiat(gasCostNumber);

  // Build result
  const loading = estimateLoading || feeLoading || fiatLoading;
  const error = estimateError || feeError || null;

  // Format display values
  const gasCrypto =
    gasCostWei > BigInt(0)
      ? `${Number(gasCostEth).toFixed(6)} BNB`
      : '0 BNB';
  const gasFiat = gasFiatValue > 0 ? formatUSD(gasFiatValue) : '$0.00';

  return {
    gasCrypto,
    gasFiat,
    gasWei: gasCostWei,
    gasEstimate: gasWithBuffer,
    loading,
    error,
  };
}

/**
 * Pre-configured hook for deposit gas estimation
 *
 * @param amount - Deposit amount in human-readable format (e.g., "1.5")
 * @returns Gas estimate for deposit transaction
 *
 * @example
 * const { gasCrypto, gasFiat, loading } = useDepositGasEstimate("1.5");
 */
export function useDepositGasEstimate(amount: string): GasEstimateResult {
  const amountWei = amount && parseFloat(amount) > 0 ? parseEther(amount) : BigInt(0);

  // Encode deposit function call
  const data =
    amountWei > BigInt(0)
      ? encodeFunctionData({
          abi: WorldlandRentalABI,
          functionName: 'deposit',
          args: [amountWei],
        })
      : undefined;

  return useGasEstimate({
    to: RENTAL_CONTRACT_ADDRESS,
    data,
    enabled: !!amount && amountWei > BigInt(0),
  });
}

/**
 * Pre-configured hook for withdraw gas estimation
 *
 * @param amount - Withdraw amount in human-readable format (e.g., "1.5")
 * @returns Gas estimate for withdraw transaction
 *
 * @example
 * const { gasCrypto, gasFiat, loading } = useWithdrawGasEstimate("1.5");
 */
export function useWithdrawGasEstimate(amount: string): GasEstimateResult {
  const amountWei = amount && parseFloat(amount) > 0 ? parseEther(amount) : BigInt(0);

  // Encode withdraw function call
  const data =
    amountWei > BigInt(0)
      ? encodeFunctionData({
          abi: WorldlandRentalABI,
          functionName: 'withdraw',
          args: [amountWei],
        })
      : undefined;

  return useGasEstimate({
    to: RENTAL_CONTRACT_ADDRESS,
    data,
    enabled: !!amount && amountWei > BigInt(0),
  });
}
