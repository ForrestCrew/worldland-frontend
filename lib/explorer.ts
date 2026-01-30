/**
 * Block Explorer URL Utilities
 *
 * Generates URLs for block explorers based on chain ID.
 * Supports BSC Mainnet, BSC Testnet, and Sepolia for development.
 */

import { expectedChainId } from '@/config/chains';

/**
 * Block explorer base URLs by chain ID
 */
const EXPLORERS: Record<number, string> = {
  56: 'https://bscscan.com', // BSC Mainnet
  97: 'https://testnet.bscscan.com', // BSC Testnet
  11155111: 'https://sepolia.etherscan.io', // Sepolia (dev)
  1: 'https://etherscan.io', // Ethereum Mainnet (for reference)
};

/**
 * Get base explorer URL for current or specified chain
 *
 * @param chainId - Optional chain ID, defaults to expectedChainId from config
 * @returns Block explorer base URL
 *
 * @example
 * getExplorerUrl() // Returns explorer for current environment
 * getExplorerUrl(56) // Returns 'https://bscscan.com'
 */
export function getExplorerUrl(chainId?: number): string {
  const id = chainId ?? expectedChainId;
  return EXPLORERS[id] || EXPLORERS[97]; // Default to BSC Testnet
}

/**
 * Get transaction URL for block explorer
 *
 * @param hash - Transaction hash (0x prefixed)
 * @param chainId - Optional chain ID, defaults to expectedChainId
 * @returns Full URL to transaction on block explorer
 *
 * @example
 * getExplorerTxUrl('0x123...abc')
 * // Returns 'https://sepolia.etherscan.io/tx/0x123...abc' in dev
 */
export function getExplorerTxUrl(hash: string, chainId?: number): string {
  return `${getExplorerUrl(chainId)}/tx/${hash}`;
}

/**
 * Get address URL for block explorer
 *
 * @param address - Wallet or contract address (0x prefixed)
 * @param chainId - Optional chain ID, defaults to expectedChainId
 * @returns Full URL to address on block explorer
 *
 * @example
 * getExplorerAddressUrl('0xabc...123')
 * // Returns 'https://bscscan.com/address/0xabc...123' in production
 */
export function getExplorerAddressUrl(
  address: string,
  chainId?: number
): string {
  return `${getExplorerUrl(chainId)}/address/${address}`;
}

/**
 * Get block URL for block explorer
 *
 * @param blockNumber - Block number
 * @param chainId - Optional chain ID, defaults to expectedChainId
 * @returns Full URL to block on block explorer
 *
 * @example
 * getExplorerBlockUrl(12345678)
 * // Returns 'https://bscscan.com/block/12345678'
 */
export function getExplorerBlockUrl(
  blockNumber: number | bigint,
  chainId?: number
): string {
  return `${getExplorerUrl(chainId)}/block/${blockNumber.toString()}`;
}
