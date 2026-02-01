'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { WalletHeader } from './wallet/WalletHeader';
import { BalanceDisplay, DepositModal, WithdrawModal } from '@/components/balance';

/**
 * AuthHeader component
 *
 * Shows wallet connection status and balance controls.
 * Wallet connection is the primary (and only) authentication method.
 *
 * When connected:
 * - Links to Provider dashboard and Rent marketplace
 * - Balance display with deposit/withdraw buttons
 * - Wallet info (address, network)
 *
 * When not connected:
 * - Wallet connect button only
 */
export default function AuthHeader() {
    const { isConnected } = useAccount();

    // Modal state for deposit/withdraw
    const [isDepositOpen, setIsDepositOpen] = useState(false);
    const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);

    // If wallet is connected, show full header with navigation
    if (isConnected) {
        return (
            <>
                <div className="flex items-center gap-4">
                    <Link
                        href="/provider"
                        className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                        Provider
                    </Link>
                    <Link
                        href="/rent"
                        className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                        GPU 임대
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

    // Not connected - show wallet connect button only
    return (
        <div className="flex items-center gap-4">
            <WalletHeader />
        </div>
    );
}
