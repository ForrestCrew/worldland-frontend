'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * ProviderNav - Tab navigation for provider section
 *
 * Extracted as separate client component to enable usePathname() for active tab detection
 * while keeping parent layout simple.
 */
function ProviderNav() {
  const pathname = usePathname();

  const tabs = [
    { href: '/provider', label: '대시보드', exact: true },
    { href: '/provider/nodes', label: '내 노드', exact: false },
    { href: '/provider/earnings', label: '수익', exact: false },
  ];

  const isActive = (href: string, exact: boolean) => {
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="flex flex-col sm:flex-row gap-2 sm:gap-4 border-b border-gray-800">
      {tabs.map((tab) => {
        const active = isActive(tab.href, tab.exact);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`
              px-4 py-3 font-medium transition-colors text-sm sm:text-base
              ${
                active
                  ? 'text-purple-400 border-b-2 border-purple-400'
                  : 'text-gray-400 hover:text-white'
              }
            `}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * ProviderLayout - Layout for provider dashboard section
 *
 * Features:
 * - Tab navigation (대시보드, 내 노드, 수익)
 * - Active tab highlighting based on pathname
 * - Responsive: tabs stack vertically on mobile, horizontal on desktop
 * - Consistent padding/spacing for all provider pages
 * - Korean title: "Provider 대시보드"
 *
 * @example
 * // Wraps all pages in /provider route
 * // app/provider/page.tsx
 * // app/provider/nodes/page.tsx
 * // app/provider/earnings/page.tsx
 */
export default function ProviderLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Provider 대시보드</h1>
        </div>
        <ProviderNav />
      </header>

      {/* Main content area */}
      <main className="mt-6">{children}</main>
    </div>
  );
}
