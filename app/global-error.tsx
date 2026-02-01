'use client'

/**
 * Root-level error boundary for critical failures.
 *
 * This catches errors that occur in the root layout itself.
 * Unlike error.tsx, global-error.tsx MUST include its own <html> and <body>
 * tags because the root layout may have failed.
 *
 * This is the last resort fallback - if this appears, something went
 * very wrong (e.g., root layout crashed, critical provider failed).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen flex items-center justify-center p-4 bg-gray-100">
        <div className="max-w-md w-full text-center bg-white rounded-lg shadow-lg p-8">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <svg
              className="h-8 w-8 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            심각한 오류가 발생했습니다
          </h2>

          <p className="text-gray-600 mb-6">
            애플리케이션에 심각한 오류가 발생했습니다.
            <br />
            페이지를 새로고침하여 다시 시도해 주세요.
          </p>

          <button
            onClick={reset}
            className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            애플리케이션 다시 로드
          </button>

          {error.digest && (
            <p className="mt-4 text-xs text-gray-400">
              오류 ID: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  )
}
