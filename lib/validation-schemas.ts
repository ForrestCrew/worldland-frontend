import { z } from 'zod'
import { isAddress } from 'viem'

/**
 * Validation schemas for form inputs.
 *
 * Per CONTEXT.md decisions:
 * - Trigger: on blur (when user leaves the field)
 * - Wallet address: format check + checksum validation (via viem's isAddress)
 * - All error messages in Korean for consistency with error-messages.ts
 */

/**
 * Ethereum wallet address validation
 * - Required field
 * - Must be 0x-prefixed hex string (42 chars)
 * - Must pass EIP-55 checksum validation
 */
export const walletAddressSchema = z
  .string()
  .min(1, '지갑 주소를 입력해주세요')
  .regex(
    /^0x[a-fA-F0-9]{40}$/,
    '유효하지 않은 주소 형식입니다. 0x로 시작하는 42자리 주소를 입력해주세요'
  )
  .refine(
    (addr) => isAddress(addr),
    '유효하지 않은 체크섬입니다. 주소를 다시 복사해주세요'
  )

/**
 * Positive number amount validation
 * - Required field
 * - Must be a positive number
 * - Supports decimals
 */
export const amountSchema = z
  .string()
  .min(1, '금액을 입력해주세요')
  .refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    '0보다 큰 금액을 입력해주세요'
  )

/**
 * Amount validation with max limit
 * Creates schema with dynamic max validation
 */
export const createAmountSchema = (maxAmount: number, maxMessage?: string) =>
  z
    .string()
    .min(1, '금액을 입력해주세요')
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) > 0,
      '0보다 큰 금액을 입력해주세요'
    )
    .refine(
      (val) => Number(val) <= maxAmount,
      maxMessage || `최대 ${maxAmount}까지 입력 가능합니다`
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
    .min(1, '가격을 입력해주세요')
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) >= 0,
      '0 이상의 가격을 입력해주세요'
    ),
})

// Type exports for form data
export type WithdrawFormData = z.infer<typeof withdrawFormSchema>
export type TransferFormData = z.infer<typeof transferFormSchema>
export type PricingFormData = z.infer<typeof pricingFormSchema>
