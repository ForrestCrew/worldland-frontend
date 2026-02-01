'use client'

import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react'
import { XCircle, ChevronDown, ChevronRight } from 'lucide-react'
import { Fragment, useState } from 'react'

export interface ErrorModalProps {
  isOpen: boolean
  onClose: () => void
  onRetry?: () => void
  title: string
  message: string
  technicalDetails?: string
}

/**
 * Error modal for critical errors requiring user action.
 *
 * Features per CONTEXT.md:
 * - Blocking modal with dark overlay (no click-outside dismiss)
 * - Retry and Dismiss buttons
 * - Collapsible "Show details" section for technical info
 * - Friendly & helpful tone
 */
export function ErrorModal({
  isOpen,
  onClose,
  onRetry,
  title,
  message,
  technicalDetails,
}: ErrorModalProps) {
  const [showDetails, setShowDetails] = useState(false)

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog
        onClose={() => {}} // Disable click-outside dismiss for critical errors
        className="relative z-50"
      >
        {/* Backdrop */}
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
        </TransitionChild>

        {/* Panel */}
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0 scale-95"
          enterTo="opacity-100 scale-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100 scale-100"
          leaveTo="opacity-0 scale-95"
        >
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <DialogPanel className="max-w-md w-full rounded-lg bg-white p-6 shadow-xl">
              <div className="flex items-start gap-3">
                <XCircle className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <DialogTitle className="text-lg font-semibold text-gray-900">
                    {title}
                  </DialogTitle>
                  <p className="mt-2 text-sm text-gray-600">
                    {message}
                  </p>

                  {technicalDetails && (
                    <div className="mt-4">
                      <button
                        onClick={() => setShowDetails(!showDetails)}
                        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        {showDetails ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        기술 세부정보 보기
                      </button>
                      {showDetails && (
                        <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto max-h-32 text-gray-700">
                          {technicalDetails}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex gap-3 justify-end">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  닫기
                </button>
                {onRetry && (
                  <button
                    onClick={() => {
                      onClose()
                      onRetry()
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    다시 시도
                  </button>
                )}
              </div>
            </DialogPanel>
          </div>
        </TransitionChild>
      </Dialog>
    </Transition>
  )
}
