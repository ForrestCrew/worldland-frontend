'use client'

import { useState, useCallback } from 'react'
import { getErrorMessage } from '@/lib/error-messages'

export interface ErrorModalState {
  isOpen: boolean
  title: string
  message: string
  technicalDetails?: string
  onRetry?: () => void
}

const initialState: ErrorModalState = {
  isOpen: false,
  title: '',
  message: '',
  technicalDetails: undefined,
  onRetry: undefined,
}

/**
 * Hook for managing error modal state.
 *
 * @example
 * const { errorModal, showError, hideError } = useErrorModal()
 *
 * // Show error from caught exception
 * try {
 *   await sendTransaction()
 * } catch (error) {
 *   showError(error, '트랜잭션 실패', () => sendTransaction())
 * }
 *
 * // In component
 * <ErrorModal {...errorModal} onClose={hideError} />
 */
export function useErrorModal() {
  const [state, setState] = useState<ErrorModalState>(initialState)

  const showError = useCallback((
    error: unknown,
    title: string = '오류가 발생했습니다',
    onRetry?: () => void
  ) => {
    const message = getErrorMessage(error)
    const technicalDetails = error instanceof Error ? error.message : String(error)

    setState({
      isOpen: true,
      title,
      message,
      technicalDetails: technicalDetails !== message ? technicalDetails : undefined,
      onRetry,
    })
  }, [])

  const showCustomError = useCallback((
    title: string,
    message: string,
    technicalDetails?: string,
    onRetry?: () => void
  ) => {
    setState({
      isOpen: true,
      title,
      message,
      technicalDetails,
      onRetry,
    })
  }, [])

  const hideError = useCallback(() => {
    setState(initialState)
  }, [])

  return {
    errorModal: state,
    showError,
    showCustomError,
    hideError,
  }
}
