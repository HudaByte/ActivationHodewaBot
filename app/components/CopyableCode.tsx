"use client";

import { useState } from 'react';

interface CopyableCodeProps {
    code: string;
    className?: string;
}

export default function CopyableCode({ code, className = "code-cell" }: CopyableCodeProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy code:', err);
        }
    };

    return (
        <span
            className={`${className} cursor-pointer hover:bg-opacity-80 transition-all relative group select-none`}
            onClick={handleCopy}
            title="Click to copy"
            style={{
                cursor: 'pointer',
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
            }}
        >
            {code}

            {/* Copy Icon (visible on hover) */}
            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-gray-400">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
            </span>

            {/* Copied Tooltip */}
            {copied && (
                <span
                    style={{
                        position: 'absolute',
                        top: '-30px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: '#10b981',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '600',
                        zIndex: 50,
                        whiteSpace: 'nowrap',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}
                >
                    Copied!
                </span>
            )}
        </span>
    );
}
