'use client';

import Link from 'next/link';

/**
 * RentalEmptyState component props
 */
interface RentalEmptyStateProps {
  /** Custom title text */
  title?: string;
  /** Custom description text */
  description?: string;
  /** Custom button text */
  buttonText?: string;
  /** Custom link URL */
  linkUrl?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * RentalEmptyState - Empty state component for when user has no active rentals
 *
 * Guides users to the GPU marketplace to start renting.
 *
 * Features:
 * - Friendly empty state illustration
 * - Clear call-to-action button
 * - Customizable text and link
 * - Korean text by default
 *
 * @example
 * <RentalEmptyState />
 *
 * @example
 * <RentalEmptyState
 *   title="활성 임대 없음"
 *   buttonText="GPU 둘러보기"
 *   linkUrl="/rent"
 * />
 */
export function RentalEmptyState({
  title = '활성 임대 없음',
  description = 'GPU 마켓플레이스에서 필요한 리소스를 찾아보세요',
  buttonText = 'GPU 마켓플레이스 보기',
  linkUrl = '/rent',
  className = '',
}: RentalEmptyStateProps) {
  return (
    <div className={`bg-gray-900 border border-gray-800 rounded-xl p-8 ${className}`}>
      <div className="text-center">
        {/* Empty state illustration */}
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
          <svg
            className="w-8 h-8 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
            />
          </svg>
        </div>

        {/* Title */}
        <h3 className="text-lg font-medium text-white mb-2">{title}</h3>

        {/* Description */}
        <p className="text-gray-400 mb-6 max-w-sm mx-auto">{description}</p>

        {/* CTA button */}
        <Link
          href={linkUrl}
          className="
            inline-flex items-center gap-2 px-6 py-3 rounded-lg
            bg-purple-600 hover:bg-purple-700 text-white font-medium
            transition-colors
          "
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          {buttonText}
        </Link>

        {/* Helpful tips */}
        <div className="mt-8 pt-6 border-t border-gray-800">
          <div className="text-sm text-gray-500 mb-3">빠른 시작 가이드</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-5 h-5 rounded-full bg-purple-600/30 text-purple-400 text-xs flex items-center justify-center font-medium">
                  1
                </span>
                <span className="text-sm text-gray-300">GPU 선택</span>
              </div>
              <p className="text-xs text-gray-500 pl-7">
                원하는 GPU와 VRAM을 선택하세요
              </p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-5 h-5 rounded-full bg-purple-600/30 text-purple-400 text-xs flex items-center justify-center font-medium">
                  2
                </span>
                <span className="text-sm text-gray-300">임대 시작</span>
              </div>
              <p className="text-xs text-gray-500 pl-7">
                트랜잭션을 승인하여 임대를 시작하세요
              </p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-5 h-5 rounded-full bg-purple-600/30 text-purple-400 text-xs flex items-center justify-center font-medium">
                  3
                </span>
                <span className="text-sm text-gray-300">SSH 접속</span>
              </div>
              <p className="text-xs text-gray-500 pl-7">
                제공된 SSH 정보로 접속하세요
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RentalEmptyState;
