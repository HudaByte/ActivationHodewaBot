import { nanoid } from 'nanoid';

/**
 * Generate random activation code
 * Format: XXXX-XXXX-XXXX (12 chars readable)
 */
export function generateActivationCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded: I, O, 0, 1 for readability
    let code = '';

    for (let i = 0; i < 12; i++) {
        if (i > 0 && i % 4 === 0) code += '-';
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return code;
}

/**
 * Format date to Indonesian timezone (WIB)
 */
export function formatDateWIB(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleString('id-ID', {
        timeZone: 'Asia/Jakarta',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

/**
 * Calculate remaining days from now
 */
export function getRemainingDays(expiresAt: Date | string): number {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

/**
 * Calculate expires_at from duration_days
 */
export function calculateExpiresAt(durationDays: number): Date {
    const now = new Date();
    now.setDate(now.getDate() + durationDays);
    return now;
}
