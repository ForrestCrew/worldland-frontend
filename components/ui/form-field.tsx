'use client'

import { ReactNode } from 'react'
import { FieldError } from 'react-hook-form'
import { Check, X } from 'lucide-react'
import { clsx } from 'clsx'

export interface FormFieldProps {
  /** Unique field identifier */
  id: string
  /** Field label */
  label: string
  /** Error from react-hook-form */
  error?: FieldError
  /** Whether field has been touched/modified */
  isDirty?: boolean
  /** Optional helper text shown below field */
  helperText?: string
  /** Child input element */
  children: ReactNode
  /** Additional class names for container */
  className?: string
}

/**
 * Form field wrapper with inline validation display.
 *
 * Features per CONTEXT.md:
 * - Success: green border + checkmark icon for valid fields
 * - Error: red border + error text below the field
 * - Trigger: designed for onBlur validation (mode: 'onBlur' in useForm)
 *
 * @example
 * const { register, formState: { errors, dirtyFields } } = useForm({
 *   resolver: zodResolver(schema),
 *   mode: 'onBlur'
 * })
 *
 * <FormField
 *   id="address"
 *   label="지갑 주소"
 *   error={errors.address}
 *   isDirty={dirtyFields.address}
 * >
 *   <input {...register('address')} />
 * </FormField>
 */
export function FormField({
  id,
  label,
  error,
  isDirty,
  helperText,
  children,
  className,
}: FormFieldProps) {
  const isValid = isDirty && !error
  const isInvalid = !!error

  return (
    <div className={clsx('space-y-1', className)}>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
      </label>

      <div className="relative">
        {children}

        {/* Success indicator */}
        {isValid && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <Check className="h-5 w-5 text-green-500" />
          </div>
        )}

        {/* Error indicator */}
        {isInvalid && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <X className="h-5 w-5 text-red-500" />
          </div>
        )}
      </div>

      {/* Error message */}
      {error?.message && (
        <p className="text-sm text-red-600" role="alert">
          {error.message}
        </p>
      )}

      {/* Helper text (hidden when error shown) */}
      {helperText && !error && (
        <p className="text-sm text-gray-500">
          {helperText}
        </p>
      )}
    </div>
  )
}

/**
 * Input style classes for use with FormField.
 * Apply these to input elements for consistent styling.
 */
export const inputStyles = {
  base: 'w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 transition-colors',
  default: 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20',
  success: 'border-green-500 focus:border-green-500 focus:ring-green-500/20',
  error: 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
}

/**
 * Get input class names based on validation state.
 * Use with clsx for conditional styling.
 *
 * @example
 * <input
 *   className={clsx(
 *     inputStyles.base,
 *     getInputStateClass(errors.address, dirtyFields.address)
 *   )}
 *   {...register('address')}
 * />
 */
export function getInputStateClass(
  error?: FieldError,
  isDirty?: boolean
): string {
  if (error) return inputStyles.error
  if (isDirty && !error) return inputStyles.success
  return inputStyles.default
}
