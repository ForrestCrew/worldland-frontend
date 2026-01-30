'use client';

import { useAccount } from 'wagmi';
import type {
  TransactionStatus as TxStatus,
  StatusMessages,
} from '@/types/transaction';
import { defaultStatusMessages } from '@/types/transaction';

/**
 * TransactionStatus Component Props
 */
interface TransactionStatusProps {
  /** Current transaction status */
  status: TxStatus;
  /** Transaction hash (available after wallet signature) */
  hash?: `0x${string}`;
  /** Error message if transaction failed */
  error?: string | null;
  /** Custom status messages (override defaults) */
  customMessages?: Partial<StatusMessages>;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Get block explorer URL for transaction
 */
function getExplorerUrl(hash: string, chainId: number | undefined): string {
  // BNB Chain mainnet
  if (chainId === 56) {
    return `https://bscscan.com/tx/${hash}`;
  }
  // BSC Testnet
  if (chainId === 97) {
    return `https://testnet.bscscan.com/tx/${hash}`;
  }
  // Sepolia (for development)
  if (chainId === 11155111) {
    return `https://sepolia.etherscan.io/tx/${hash}`;
  }
  // Default to BSC Testnet
  return `https://testnet.bscscan.com/tx/${hash}`;
}

/**
 * Status indicator component
 */
function StatusIndicator({ status }: { status: TxStatus }) {
  switch (status) {
    case 'idle':
      return (
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-gray-500" />
        </div>
      );

    case 'wallet':
      return (
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
          <svg
            className="w-4 h-4 text-orange-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
            />
          </svg>
        </div>
      );

    case 'pending':
      return (
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-blue-500 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
      );

    case 'confirmed':
      return (
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-blue-400 animate-spin"
            style={{ animationDuration: '0.5s' }}
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
      );

    case 'success':
      return (
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
      );

    case 'fail':
      return (
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
      );
  }
}

/**
 * Get status-specific text color
 */
function getStatusColor(status: TxStatus): string {
  switch (status) {
    case 'idle':
      return 'text-gray-400';
    case 'wallet':
      return 'text-orange-400';
    case 'pending':
      return 'text-blue-400';
    case 'confirmed':
      return 'text-blue-300';
    case 'success':
      return 'text-green-400';
    case 'fail':
      return 'text-red-400';
  }
}

/**
 * TransactionStatus - Shows 6-state transaction feedback
 *
 * States:
 * 1. idle - Gray dot, "거래 대기 중"
 * 2. wallet - Pulsing orange dot + wallet icon, "지갑에서 서명을 기다리는 중..."
 * 3. pending - Spinning loader, "트랜잭션 제출됨, 블록 확인 대기 중..."
 * 4. confirmed - Faster spinning loader, "블록 확인 중..."
 * 5. success - Green checkmark, "완료!"
 * 6. fail - Red X, "트랜잭션 실패"
 *
 * @example
 * <TransactionStatus
 *   status="pending"
 *   hash="0x..."
 *   error={null}
 * />
 */
export function TransactionStatus({
  status,
  hash,
  error,
  customMessages,
  className = '',
}: TransactionStatusProps) {
  const { chainId } = useAccount();

  // Merge default messages with custom overrides
  const messages: StatusMessages = {
    ...defaultStatusMessages,
    ...customMessages,
  };

  const statusColor = getStatusColor(status);
  const explorerUrl = hash ? getExplorerUrl(hash, chainId) : null;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Status indicator and message */}
      <div className="flex items-center gap-3">
        <StatusIndicator status={status} />
        <span className={`text-sm ${statusColor}`}>
          {messages[status]}
        </span>
      </div>

      {/* Transaction hash with explorer link */}
      {hash && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500 font-mono text-xs">
            {hash.slice(0, 10)}...{hash.slice(-8)}
          </span>
          {explorerUrl && (
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1"
            >
              BscScan에서 보기
              <svg
                className="w-3 h-3"
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
          )}
        </div>
      )}

      {/* Error message */}
      {status === 'fail' && error && (
        <div className="text-sm text-red-400 bg-red-900/20 rounded-lg p-2">
          {error}
        </div>
      )}
    </div>
  );
}

export default TransactionStatus;
