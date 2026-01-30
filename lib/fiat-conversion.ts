'use client';

import { useState, useEffect } from 'react';

/**
 * Fiat conversion hook return type
 */
export interface FiatConversionHook {
  /** Convert crypto amount to fiat. Returns 0 if rate is unavailable. */
  convertToFiat: (cryptoAmount: number) => number;
  /** Current exchange rate (crypto to fiat). Null if not yet fetched. */
  rate: number | null;
  /** Whether the rate is currently being fetched */
  loading: boolean;
  /** Error message if fetch failed */
  error: string | null;
}

/**
 * Cache configuration
 * 30 second TTL to respect CoinGecko free tier rate limits (30 calls/min)
 */
const CACHE_TTL = 30000;

// Module-level cache for rate data
let cachedRate: number | null = null;
let cacheTimestamp = 0;
let fetchPromise: Promise<number | null> | null = null;

/**
 * CoinGecko API endpoint for BNB price
 * Free tier: 30 calls/minute with Demo account
 */
const COINGECKO_API_URL =
  'https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=usd';

/**
 * Fetch BNB/USD rate from CoinGecko
 * Uses centralized cache to avoid duplicate requests
 */
async function fetchRate(): Promise<number | null> {
  const now = Date.now();

  // Return cached rate if fresh
  if (cachedRate !== null && now - cacheTimestamp < CACHE_TTL) {
    return cachedRate;
  }

  // If a fetch is already in progress, wait for it
  if (fetchPromise) {
    return fetchPromise;
  }

  // Start new fetch
  fetchPromise = (async () => {
    try {
      const response = await fetch(COINGECKO_API_URL);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const newRate = data?.binancecoin?.usd;

      if (typeof newRate !== 'number') {
        throw new Error('Invalid response format');
      }

      // Update cache
      cachedRate = newRate;
      cacheTimestamp = Date.now();

      return newRate;
    } catch (err) {
      console.error('CoinGecko API error:', err);
      // Return stale cache on error (graceful degradation)
      return cachedRate;
    } finally {
      fetchPromise = null;
    }
  })();

  return fetchPromise;
}

/**
 * Hook for converting crypto amounts to fiat (USD)
 *
 * Features:
 * - Fetches BNB/USD rate from CoinGecko API
 * - 30-second cache to respect rate limits
 * - Graceful fallback on API errors
 * - Module-level cache shared across components
 *
 * @example
 * const { convertToFiat, rate, loading, error } = useFiatConversion();
 * const usdValue = convertToFiat(0.5); // Convert 0.5 BNB to USD
 */
export function useFiatConversion(): FiatConversionHook {
  const [rate, setRate] = useState<number | null>(cachedRate);
  const [loading, setLoading] = useState<boolean>(cachedRate === null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadRate = async () => {
      const now = Date.now();

      // Use cached rate if fresh
      if (cachedRate !== null && now - cacheTimestamp < CACHE_TTL) {
        if (mounted) {
          setRate(cachedRate);
          setLoading(false);
        }
        return;
      }

      // Fetch new rate
      if (mounted) {
        setLoading(true);
      }

      const newRate = await fetchRate();

      if (mounted) {
        if (newRate !== null) {
          setRate(newRate);
          setError(null);
        } else {
          setError('Failed to fetch exchange rate');
        }
        setLoading(false);
      }
    };

    loadRate();

    // Set up periodic refresh
    const intervalId = setInterval(loadRate, CACHE_TTL);

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, []);

  /**
   * Convert crypto amount to fiat
   * Returns 0 if rate is not available
   */
  const convertToFiat = (cryptoAmount: number): number => {
    if (rate === null || isNaN(cryptoAmount)) {
      return 0;
    }
    return cryptoAmount * rate;
  };

  return {
    convertToFiat,
    rate,
    loading,
    error,
  };
}

/**
 * Format a number as USD currency string
 *
 * @example
 * formatUSD(1234.56) // "$1,234.56"
 * formatUSD(0.001)   // "$0.00"
 */
export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
