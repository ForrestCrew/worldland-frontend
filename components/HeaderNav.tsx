'use client';

import Link from 'next/link';
import { useState } from 'react';

interface DropdownItem {
    label: string;
    href: string;
    description?: string;
}

interface NavItemProps {
    label: string;
    href?: string;
    items?: DropdownItem[];
    external?: boolean;
}

function NavItem({ label, href, items, external }: NavItemProps) {
    const [isOpen, setIsOpen] = useState(false);

    if (!items) {
        // Simple link (no dropdown)
        if (external) {
            return (
                <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors text-sm font-medium"
                >
                    {label}
                </a>
            );
        }
        return (
            <Link href={href || '/'} className="text-gray-400 hover:text-white transition-colors text-sm font-medium">
                {label}
            </Link>
        );
    }

    // Dropdown menu
    return (
        <div
            className="relative"
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
        >
            <button className="text-gray-400 hover:text-white transition-colors text-sm font-medium flex items-center gap-1 py-2">
                {label}
                <svg className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 pt-1 z-50">
                    <div className="w-64 bg-[#0a0a0a] border border-[#1a1a1a] rounded-md shadow-xl">
                        {items.map((item, index) => (
                            <Link
                                key={index}
                                href={item.href}
                                className="block px-4 py-3 hover:bg-[#111] transition-colors border-b border-[#1a1a1a] last:border-0"
                            >
                                <div className="text-sm text-white font-medium">{item.label}</div>
                                {item.description && (
                                    <div className="text-xs text-gray-500 mt-1">{item.description}</div>
                                )}
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function HeaderNav() {
    const navItems: NavItemProps[] = [
        {
            label: 'GPU 임대',
            items: [
                { label: 'GPU 마켓플레이스', href: '/rent', description: '사용 가능한 GPU 검색 및 임대' },
                { label: '내 세션', href: '/rent/sessions', description: '진행 중인 임대 세션 관리' },
                { label: '가격 정보', href: '/pricing', description: 'GPU 가격 및 요금제' },
            ],
        },
        {
            label: 'GPU 제공',
            items: [
                { label: 'Provider 대시보드', href: '/provider', description: '노드 관리 및 수익 확인' },
                { label: '내 노드', href: '/provider/nodes', description: '등록된 GPU 노드 목록' },
                { label: '수익 현황', href: '/provider/earnings', description: '임대 수익 및 정산 내역' },
            ],
        },
        {
            label: '검증',
            items: [
                { label: 'GPU 검증', href: '/gpu-verification', description: '온체인 컴퓨트 감사 로그' },
                { label: 'DA 검증', href: '/da-verification', description: '데이터 가용성 블록 로그' },
            ],
        },
        {
            label: '리소스',
            items: [
                { label: '사용 사례', href: '/usecases', description: 'AI 추론, 에이전트, 파인튜닝' },
                { label: '문서', href: '/docs', description: 'API 레퍼런스 및 가이드' },
            ],
        },
        {
            label: '생태계',
            items: [
                { label: 'Worldland Scan', href: 'https://scan.worldland.foundation', description: '블록 탐색기' },
                { label: 'Worldland Main', href: 'https://worldland.foundation', description: '메인 네트워크 홈페이지' },
            ],
        },
    ];

    return (
        <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item, index) => (
                <NavItem key={index} {...item} />
            ))}
        </nav>
    );
}
