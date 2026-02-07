'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface Props {
    currentPage: number;
    totalPages: number;
    baseUrl: string;
}

export default function PaginationControl({ currentPage, totalPages, baseUrl }: Props) {
    const searchParams = useSearchParams();

    // Preserve other params
    const createPageURL = (pageNumber: number | string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', pageNumber.toString());
        return `${baseUrl}?${params.toString()}`;
    };

    if (totalPages <= 1) return null;

    return (
        <div className="pagination" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '2rem' }}>
            {currentPage > 1 ? (
                <Link href={createPageURL(currentPage - 1)} className="btn btn-sm">
                    « Prev
                </Link>
            ) : (
                <button className="btn btn-sm" disabled style={{ opacity: 0.5 }}>
                    « Prev
                </button>
            )}

            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Page {currentPage} of {totalPages}
            </span>

            {currentPage < totalPages ? (
                <Link href={createPageURL(currentPage + 1)} className="btn btn-sm">
                    Next »
                </Link>
            ) : (
                <button className="btn btn-sm" disabled style={{ opacity: 0.5 }}>
                    Next »
                </button>
            )}
        </div>
    );
}
