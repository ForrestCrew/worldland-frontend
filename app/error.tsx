'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'

/**
 * App-level error boundary for unhandled React errors.
 *
 * Features per CONTEXT.md:
 * - Friendly & helpful tone ("Oops! Something went wrong" style)
 * - Option to reload (reset) or return home
 * - Error ID displayed for support reference
 *
 * Note: Error boundaries only catch errors during rendering, lifecycle methods,
 * and constructors. They do NOT catch:
 * - Event handlers (use try/catch)
 * - Async code (use try/catch and setState)
 * - Server-side rendering errors
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error for debugging/monitoring
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="h-8 w-8 text-yellow-600" />
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Oops! Something went wrong
        </h2>

        <p className="text-gray-600 mb-6">
          An unexpected error occurred.
          <br />
          Don&apos;t worry, your data is safe.
          <br />
          Please refresh the page or go back to the homepage.
        </p>

        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
          <a
            href="/"
            className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors"
          >
            Go Home
          </a>
        </div>

        {error.digest && (
          <p className="mt-6 text-xs text-gray-400">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  )
}
