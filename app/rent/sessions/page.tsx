'use client';

import Link from 'next/link';
import { SessionList } from '@/components/rent/SessionList';

/**
 * SessionsPage - User rental sessions management page
 *
 * Features:
 * - Back link to GPU marketplace
 * - Page title and description
 * - SessionList component showing active/completed rentals
 * - Responsive layout
 *
 * Route: /rent/sessions
 *
 * @example
 * // Navigate from marketplace
 * <Link href="/rent/sessions">내 임대 보기</Link>
 */
export default function SessionsPage() {
  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back navigation */}
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
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
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          마켓플레이스로 돌아가기
        </Link>

        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">내 임대 세션</h1>
          <p className="text-gray-400">
            활성 임대를 관리하고 임대 내역을 확인하세요
          </p>
        </div>

        {/* Session list */}
        <SessionList />
      </div>
    </div>
  );
}
