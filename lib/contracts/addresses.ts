/**
 * Contract addresses from environment variables
 *
 * Set these in .env.local:
 *   NEXT_PUBLIC_RENTAL_CONTRACT=0x...
 *   NEXT_PUBLIC_PAYMENT_TOKEN=0x...
 */

/**
 * WorldlandRental contract address
 * Used for deposit/withdraw/rental operations
 */
export const RENTAL_CONTRACT_ADDRESS = process.env
  .NEXT_PUBLIC_RENTAL_CONTRACT as `0x${string}`;

/**
 * ERC20 Payment token address
 * The token used for deposits and payments
 */
export const PAYMENT_TOKEN_ADDRESS = process.env
  .NEXT_PUBLIC_PAYMENT_TOKEN as `0x${string}`;

/**
 * Validate that required environment variables are set
 * Call this on app initialization to catch missing config early
 */
export function validateContractAddresses(): void {
  if (!RENTAL_CONTRACT_ADDRESS) {
    console.warn(
      'NEXT_PUBLIC_RENTAL_CONTRACT is not set. Contract interactions will fail.'
    );
  }
  if (!PAYMENT_TOKEN_ADDRESS) {
    console.warn(
      'NEXT_PUBLIC_PAYMENT_TOKEN is not set. Token operations will fail.'
    );
  }
}
