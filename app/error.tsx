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
          앗! 문제가 발생했습니다
        </h2>

        <p className="text-gray-600 mb-6">
          예기치 않은 오류가 발생했습니다.
          <br />
          걱정하지 마세요, 데이터는 안전합니다.
          <br />
          페이지를 새로고침하거나 홈으로 돌아가 주세요.
        </p>

        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            다시 시도
          </button>
          <a
            href="/"
            className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors"
          >
            홈으로 돌아가기
          </a>
        </div>

        {error.digest && (
          <p className="mt-6 text-xs text-gray-400">
            오류 ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  )
}
