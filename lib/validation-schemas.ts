import { z } from 'zod'
import { isAddress } from 'viem'

/**
 * Validation schemas for form inputs.
 *
 * Per CONTEXT.md decisions:
 * - Trigger: on blur (when user leaves the field)
 * - Wallet address: format check + checksum validation (via viem's isAddress)
 */

/**
 * Ethereum wallet address validation
 * - Required field
 * - Must be 0x-prefixed hex string (42 chars)
 * - Must pass EIP-55 checksum validation
 */
export const walletAddressSchema = z
  .string()
  .min(1, 'Please enter a wallet address')
  .regex(
    /^0x[a-fA-F0-9]{40}$/,
    'Invalid address format. Enter a 42-character address starting with 0x'
  )
  .refine(
    (addr) => isAddress(addr),
    'Invalid checksum. Please copy the address again'
  )

/**
 * Positive number amount validation
 * - Required field
 * - Must be a positive number
 * - Supports decimals
 */
export const amountSchema = z
  .string()
  .min(1, 'Please enter an amount')
  .refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    'Amount must be greater than 0'
  )

/**
 * Amount validation with max limit
 * Creates schema with dynamic max validation
 */
export const createAmountSchema = (maxAmount: number, maxMessage?: string) =>
  z
    .string()
    .min(1, 'Please enter an amount')
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) > 0,
      'Amount must be greater than 0'
    )
    .refine(
      (val) => Number(val) <= maxAmount,
      maxMessage || `Maximum amount is ${maxAmount}`
    )

/**
 * Withdraw form schema
 * Used by WithdrawModal component
 */
export const withdrawFormSchema = z.object({
  amount: amountSchema,
})

/**
 * Transfer form schema
 * Used for sending tokens to another address
 */
export const transferFormSchema = z.object({
  address: walletAddressSchema,
  amount: amountSchema,
})

/**
 * GPU pricing form schema
 * Used by PricingControl component
 */
export const pricingFormSchema = z.object({
  pricePerSecond: z
    .string()
    .min(1, 'Please enter a price')
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) >= 0,
      'Price must be 0 or greater'
    ),
})

// Type exports for form data
export type WithdrawFormData = z.infer<typeof withdrawFormSchema>
export type TransferFormData = z.infer<typeof transferFormSchema>
export type PricingFormData = z.infer<typeof pricingFormSchema>
