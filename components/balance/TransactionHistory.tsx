'use client';

import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useTransactionHistory, type Transaction } from '@/hooks/useTransactionHistory';
import { getExplorerTxUrl } from '@/lib/explorer';
import { useChainId } from 'wagmi';

/**
 * TransactionHistory component props
 */
interface TransactionHistoryProps {
  /** Maximum number of transactions to show (default 10) */
  limit?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Loading skeleton for transaction list
 */
function TransactionSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg animate-pulse"
        >
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-gray-700 rounded" />
            <div className="space-y-1">
              <div className="h-4 w-16 bg-gray-700 rounded" />
              <div className="h-3 w-24 bg-gray-700 rounded" />
            </div>
          </div>
          <div className="h-4 w-20 bg-gray-700 rounded" />
        </div>
      ))}
    </div>
  );
}

/**
 * Empty state when no transactions exist
 */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-gray-500">
      <svg
        className="w-12 h-12 mb-3 text-gray-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        />
      </svg>
      <p className="text-sm">거래 내역이 없습니다</p>
    </div>
  );
}

/**
 * Single transaction row
 */
function TransactionRow({
  transaction,
  chainId,
}: {
  transaction: Transaction;
  chainId: number | undefined;
}) {
  const isDeposit = transaction.type === 'deposit';
  const explorerUrl = getExplorerTxUrl(transaction.hash, chainId);

  // Format relative timestamp
  const timeAgo = transaction.timestamp
    ? formatDistanceToNow(transaction.timestamp, {
        addSuffix: true,
        locale: ko,
      })
    : '시간 미확인';

  return (
    <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-colors">
      {/* Left: Type icon and info */}
      <div className="flex items-center gap-3">
        {/* Type icon */}
        <div
          className={`flex items-center justify-center w-8 h-8 rounded-full ${
            isDeposit ? 'bg-green-900/50' : 'bg-red-900/50'
          }`}
        >
          {isDeposit ? (
            <svg
              className="w-4 h-4 text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          ) : (
            <svg
              className="w-4 h-4 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 10l7-7m0 0l7 7m-7-7v18"
              />
            </svg>
          )}
        </div>

        {/* Type label and timestamp */}
        <div>
          <div
            className={`text-sm font-medium ${
              isDeposit ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {isDeposit ? '입금' : '출금'}
          </div>
          <div className="text-xs text-gray-500">{timeAgo}</div>
        </div>
      </div>

      {/* Center: Amount */}
      <div
        className={`font-mono text-lg ${
          isDeposit ? 'text-green-400' : 'text-red-400'
        }`}
      >
        {isDeposit ? '+' : '-'}
        {parseFloat(transaction.amount).toFixed(4)} WLC
      </div>

      {/* Right: Explorer link */}
      <a
        href={explorerUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 text-blue-400 hover:text-blue-300 hover:underline text-sm"
        title="BscScan에서 보기"
      >
        <span className="hidden sm:inline">BscScan</span>
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
          />
        </svg>
      </a>
    </div>
  );
}

/**
 * TransactionHistory - Displays user's deposit/withdraw history
 *
 * Shows a list of past deposit and withdraw transactions from on-chain events.
 * Each transaction shows:
 * - Type (deposit/withdraw) with icon
 * - Amount in BNB
 * - Relative timestamp (Korean locale)
 * - Link to block explorer
 *
 * Features:
 * - Korean UI labels
 * - Loading skeleton state
 * - Empty state message
 * - Responsive design
 * - Clickable explorer links
 *
 * @example
 * // In balance page
 * <TransactionHistory limit={5} />
 *
 * @example
 * // Full history modal
 * <TransactionHistory limit={20} className="max-h-96 overflow-y-auto" />
 */
export function TransactionHistory({
  limit = 10,
  className = '',
}: TransactionHistoryProps) {
  const { transactions, loading, error } = useTransactionHistory();
  const chainId = useChainId();

  // Limit transactions to show
  const displayedTransactions = transactions.slice(0, limit);

  if (loading) {
    return (
      <div className={className}>
        <h3 className="text-lg font-semibold text-white mb-4">거래 내역</h3>
        <TransactionSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <h3 className="text-lg font-semibold text-white mb-4">거래 내역</h3>
        <div className="p-4 bg-red-900/20 rounded-lg text-red-400 text-sm">
          거래 내역을 불러오는데 실패했습니다
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <h3 className="text-lg font-semibold text-white mb-4">거래 내역</h3>

      {displayedTransactions.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-2">
          {displayedTransactions.map((tx) => (
            <TransactionRow key={tx.id} transaction={tx} chainId={chainId} />
          ))}
        </div>
      )}
    </div>
  );
}

export default TransactionHistory;
