'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { BalanceDisplay, DepositModal, WithdrawModal, TransactionHistory } from '@/components/balance';
import { useAuth } from '@/hooks/useAuth';

/**
 * Account Page - User's balance and transaction history
 *
 * Features:
 * - Balance display with fiat conversion
 * - Deposit/withdraw actions via modals
 * - Transaction history from on-chain events
 * - Authentication guard (redirects if not connected)
 * - Korean labels
 */
export default function AccountPage() {
    const router = useRouter();
    const { isConnected, address } = useAccount();
    const { isLoading: authLoading } = useAuth();

    // Modal state for deposit/withdraw
    const [isDepositOpen, setIsDepositOpen] = useState(false);
    const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);

    // Authentication guard - redirect if not connected
    useEffect(() => {
        if (!authLoading && (!isConnected || !address)) {
            router.push('/');
        }
    }, [isConnected, address, authLoading, router]);

    // Show loading state while checking auth
    if (authLoading || !isConnected || !address) {
        return (
            <div className="min-h-screen bg-black pt-24">
                <div className="max-w-4xl mx-auto py-8 px-4">
                    <div className="animate-pulse">
                        <div className="h-10 w-40 bg-gray-800 rounded mb-8" />
                        <div className="bg-gray-900 rounded-xl p-6 mb-6">
                            <div className="h-6 w-24 bg-gray-800 rounded mb-4" />
                            <div className="h-12 w-48 bg-gray-800 rounded mb-2" />
                            <div className="h-5 w-32 bg-gray-800 rounded" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black pt-24">
            <div className="max-w-4xl mx-auto py-8 px-4">
                {/* Page title */}
                <h1 className="text-3xl font-bold text-white mb-8">
                    내 계정
                </h1>

                {/* Balance card */}
                <div className="bg-gray-900 rounded-xl p-6 mb-6">
                    <BalanceDisplay
                        showActions={true}
                        onDepositClick={() => setIsDepositOpen(true)}
                        onWithdrawClick={() => setIsWithdrawOpen(true)}
                    />
                </div>

                {/* Transaction history card */}
                <div className="bg-gray-900 rounded-xl p-6">
                    <TransactionHistory limit={20} />
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
            </div>
        </div>
    );
}
