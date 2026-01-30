'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { WalletHeader } from './wallet/WalletHeader';
import { useAuth as useLegacyAuth } from '@/hooks/useAuth';
import { BalanceDisplay, DepositModal, WithdrawModal } from '@/components/balance';

/**
 * AuthHeader component
 *
 * This component serves as a bridge between:
 * 1. New Web3 wallet-based authentication (WalletHeader)
 * 2. Legacy email-based authentication (preserved for existing users)
 *
 * Per CONTEXT.md:
 * - Wallet connection is the primary authentication method
 * - Wallet address and network visible in header at all times when connected
 */
export default function AuthHeader() {
    const { isConnected } = useAccount();
    const { user, isLoading, logout } = useLegacyAuth();

    // Modal state for deposit/withdraw
    const [isDepositOpen, setIsDepositOpen] = useState(false);
    const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);

    // If wallet is connected, show WalletHeader (Web3 auth)
    // This takes precedence over legacy email auth
    if (isConnected) {
        return (
            <>
                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard"
                        className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                        Dashboard
                    </Link>
                    <Link
                        href="/account"
                        className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                        내 계정
                    </Link>

                    {/* Balance display - full on md+, compact on mobile */}
                    <div className="hidden md:block">
                        <BalanceDisplay
                            showActions={true}
                            onDepositClick={() => setIsDepositOpen(true)}
                            onWithdrawClick={() => setIsWithdrawOpen(true)}
                        />
                    </div>
                    <div className="block md:hidden">
                        <BalanceDisplay
                            showActions={false}
                            className="text-right"
                        />
                    </div>

                    <WalletHeader />
                </div>

                {/* Deposit/Withdraw modals */}
                <DepositModal
                    isOpen={isDepositOpen}
                    onClose={() => setIsDepositOpen(false)}
                />
                <WithdrawModal
                    isOpen={isWithdrawOpen}
                    onClose={() => setIsWithdrawOpen(false)}
                />
            </>
        );
    }

    // Legacy email-based auth flow below (for backwards compatibility)

    // 로딩 중일 때는 빈 상태 표시 (깜빡임 방지)
    if (isLoading) {
        return (
            <div className="flex items-center gap-4">
                <div className="w-16 h-4 bg-[#222] rounded animate-pulse" />
            </div>
        );
    }

    // 로그인된 경우 (legacy email auth)
    if (user) {
        return (
            <div className="flex items-center gap-4">
                <Link
                    href="/dashboard"
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                    Dashboard
                </Link>
                <span className="text-sm text-gray-500">{user.email || user.name}</span>
                <button
                    onClick={logout}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                    Logout
                </button>
            </div>
        );
    }

    // 로그인되지 않은 경우 - show wallet connect button
    // Per CONTEXT.md: Wallet connection is primary auth method
    return (
        <div className="flex items-center gap-4">
            <WalletHeader />
        </div>
    );
}
