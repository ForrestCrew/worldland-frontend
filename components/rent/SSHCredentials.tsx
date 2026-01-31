'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * SSH credentials data
 */
export interface SSHCredentialsData {
  /** SSH host address */
  host: string;
  /** SSH port */
  port: number;
  /** SSH username */
  username: string;
  /** SSH password */
  password: string;
}

/**
 * SSHCredentials component props
 */
interface SSHCredentialsProps {
  /** SSH connection credentials */
  credentials: SSHCredentialsData;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Copy button with feedback state
 */
function CopyButton({
  text,
  label,
}: {
  text: string;
  label: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className={`
        px-2 py-1 rounded text-xs font-medium transition-colors
        ${copied
          ? 'bg-green-600 text-white'
          : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
        }
      `}
    >
      {copied ? '복사됨' : label}
    </button>
  );
}

/**
 * SSHCredentials - Secure credential display with click-to-reveal and auto-hide
 *
 * Security features:
 * - Hidden by default (isVisible initial false)
 * - Click to reveal credentials
 * - 60 second countdown timer
 * - Auto-hide when timer expires
 * - One-click copy for SSH command and password
 *
 * Korean labels throughout.
 *
 * @example
 * <SSHCredentials
 *   credentials={{
 *     host: '192.168.1.100',
 *     port: 22,
 *     username: 'user',
 *     password: 'secret123'
 *   }}
 * />
 */
export function SSHCredentials({
  credentials,
  className = '',
}: SSHCredentialsProps) {
  // Hidden by default for security
  const [isVisible, setIsVisible] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  // Construct SSH command
  const sshCommand = `ssh -p ${credentials.port} ${credentials.username}@${credentials.host}`;

  // Handle reveal button click
  const handleReveal = useCallback(() => {
    setIsVisible(true);
    setTimeLeft(60);
  }, []);

  // Handle hide button click
  const handleHide = useCallback(() => {
    setIsVisible(false);
    setTimeLeft(0);
  }, []);

  // Countdown timer effect
  useEffect(() => {
    if (!isVisible || timeLeft <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Auto-hide when timer expires
          setIsVisible(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isVisible, timeLeft]);

  return (
    <div className={`bg-gray-800 border border-gray-700 rounded-lg p-4 ${className}`}>
      {/* Header with title and toggle button */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-white font-medium flex items-center gap-2">
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
            />
          </svg>
          SSH 접속 정보
        </h4>

        {isVisible ? (
          <div className="flex items-center gap-2">
            {/* Countdown timer */}
            <span className="text-sm text-gray-400">
              {timeLeft}초 후 숨김
            </span>
            <button
              onClick={handleHide}
              className="px-3 py-1 rounded text-sm font-medium bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
            >
              숨기기
            </button>
          </div>
        ) : (
          <button
            onClick={handleReveal}
            className="px-3 py-1 rounded text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white transition-colors"
          >
            보기
          </button>
        )}
      </div>

      {/* Credentials content */}
      {isVisible ? (
        <div className="space-y-3">
          {/* SSH Command */}
          <div>
            <div className="text-sm text-gray-400 mb-1">SSH 명령어</div>
            <div className="flex items-center gap-2 bg-gray-900 rounded p-2">
              <code className="flex-1 text-sm text-green-400 font-mono break-all">
                {sshCommand}
              </code>
              <CopyButton text={sshCommand} label="복사" />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="text-sm text-gray-400 mb-1">비밀번호</div>
            <div className="flex items-center gap-2 bg-gray-900 rounded p-2">
              <code className="flex-1 text-sm text-yellow-400 font-mono">
                {credentials.password}
              </code>
              <CopyButton text={credentials.password} label="복사" />
            </div>
          </div>

          {/* Connection details */}
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div>
              <div className="text-gray-500">호스트</div>
              <div className="text-gray-300 font-mono">{credentials.host}</div>
            </div>
            <div>
              <div className="text-gray-500">포트</div>
              <div className="text-gray-300 font-mono">{credentials.port}</div>
            </div>
            <div>
              <div className="text-gray-500">사용자</div>
              <div className="text-gray-300 font-mono">{credentials.username}</div>
            </div>
          </div>

          {/* Security notice */}
          <div className="text-xs text-gray-500 bg-gray-900/50 rounded p-2 flex items-start gap-2">
            <svg
              className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span>
              보안을 위해 접속 정보는 {timeLeft}초 후 자동으로 숨겨집니다.
              비밀번호를 안전한 곳에 보관하세요.
            </span>
          </div>
        </div>
      ) : (
        <div className="text-center py-4 text-gray-500">
          <svg
            className="w-8 h-8 mx-auto mb-2 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <p className="text-sm">
            접속 정보를 보려면 &quot;보기&quot; 버튼을 클릭하세요
          </p>
        </div>
      )}
    </div>
  );
}

export default SSHCredentials;
