'use client';

import { useState, useRef, useEffect } from 'react';
import { useDisconnect } from 'wagmi';
import { useWalletInfo } from '@/hooks/useWalletInfo';
import { useWalletAuth } from '@/hooks/useWalletAuth';
import { WalletButton } from './WalletButton';

/**
 * Header wallet display component
 *
 * Per CONTEXT.md:
 * - "Balance: Brief display in header + detailed view in dropdown"
 * - "Dropdown content: Token balance, current network, link to transaction history, disconnect button"
 * - "Connection state indicators: Both text changes AND color dots"
 */
export function WalletHeader() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { disconnect } = useDisconnect();

  const {
    isConnected,
    displayName,
    ensAvatar,
    balanceFormatted,
    chainName,
    statusColor,
    statusText,
    address,
    isAuthenticated,
  } = useWalletInfo();

  const { requestSignature, logout, isAuthenticating } = useWalletAuth();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Not connected - show connect button
  if (!isConnected) {
    return <WalletButton />;
  }

  // Status dot color classes
  const dotColorClass = {
    green: 'bg-green-500',
    orange: 'bg-orange-500',
    gray: 'bg-gray-500',
  }[statusColor];

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Header button */}
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
      >
        {/* Status dot */}
        <div className={`w-2 h-2 rounded-full ${dotColorClass}`} />

        {/* Avatar or default icon */}
        {ensAvatar ? (
          <img
            src={ensAvatar}
            alt=""
            className="w-6 h-6 rounded-full"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500" />
        )}

        {/* Display name */}
        <span className="text-white font-medium text-sm">
          {displayName}
        </span>

        {/* Brief balance in header */}
        {balanceFormatted && (
          <span className="text-gray-400 text-xs hidden sm:block">
            {balanceFormatted}
          </span>
        )}

        {/* Dropdown arrow */}
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-gray-800 rounded-lg shadow-xl border border-gray-700 z-50">
          {/* Status section */}
          <div className="px-4 py-3 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${dotColorClass}`} />
              <span className="text-sm text-gray-300">{statusText}</span>
            </div>
          </div>

          {/* Account info */}
          <div className="px-4 py-3 border-b border-gray-700">
            <div className="text-xs text-gray-500 mb-1">지갑 주소</div>
            <div className="flex items-center gap-2">
              <span className="text-white font-mono text-sm truncate">
                {address}
              </span>
              <button
                onClick={() => navigator.clipboard.writeText(address || '')}
                className="text-gray-400 hover:text-white"
                title="주소 복사"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
              </button>
            </div>
          </div>

          {/* Balance section */}
          <div className="px-4 py-3 border-b border-gray-700">
            <div className="text-xs text-gray-500 mb-1">잔액</div>
            <div className="text-white text-lg font-medium">
              {balanceFormatted || '0.0000'}
            </div>
          </div>

          {/* Network section */}
          <div className="px-4 py-3 border-b border-gray-700">
            <div className="text-xs text-gray-500 mb-1">네트워크</div>
            <div className="text-white text-sm">{chainName || '알 수 없음'}</div>
          </div>

          {/* Auth section */}
          {!isAuthenticated && (
            <div className="px-4 py-3 border-b border-gray-700">
              <button
                onClick={() => requestSignature('user')}
                disabled={isAuthenticating}
                className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAuthenticating ? '서명 중...' : '로그인 (SIWE)'}
              </button>
            </div>
          )}

          {/* Actions */}
          <div className="px-4 py-3 space-y-2">
            {/* Transaction history link (placeholder - will be implemented in Phase 9) */}
            <button
              className="w-full text-left text-sm text-gray-400 hover:text-white py-1"
              onClick={() => {
                // Will link to transaction history
                setIsDropdownOpen(false);
              }}
            >
              거래 내역 보기
            </button>

            {/* Logout (if authenticated) */}
            {isAuthenticated && (
              <button
                onClick={async () => {
                  await logout();
                  setIsDropdownOpen(false);
                }}
                className="w-full text-left text-sm text-gray-400 hover:text-white py-1"
              >
                로그아웃
              </button>
            )}

            {/* Disconnect wallet */}
            <button
              onClick={() => {
                disconnect();
                setIsDropdownOpen(false);
              }}
              className="w-full text-left text-sm text-red-400 hover:text-red-300 py-1"
            >
              지갑 연결 해제
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
