/**
 * Simple in-memory rate limiter for Next.js API routes
 * No external dependencies - uses Map with auto-cleanup
 */

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Auto-cleanup expired entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    const entries = Array.from(rateLimitStore.entries());
    for (const [key, entry] of entries) {
        if (entry.resetTime < now) {
            rateLimitStore.delete(key);
        }
    }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
    maxAttempts: number;      // Max attempts allowed
    windowMs: number;         // Time window in milliseconds
    blockDurationMs: number;  // How long to block after limit exceeded
}

export interface RateLimitResult {
    success: boolean;
    remaining: number;
    resetIn: number;  // milliseconds until reset
    blocked: boolean;
}

/**
 * Check rate limit for a given key (typically IP address)
 * @param key - Unique identifier (e.g., IP address)
 * @param config - Rate limit configuration
 * @returns RateLimitResult
 */
export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
    const now = Date.now();
    const entry = rateLimitStore.get(key);

    // No existing entry - create new one
    if (!entry) {
        rateLimitStore.set(key, {
            count: 1,
            resetTime: now + config.windowMs,
        });
        return {
            success: true,
            remaining: config.maxAttempts - 1,
            resetIn: config.windowMs,
            blocked: false,
        };
    }

    // Entry exists but window expired - reset
    if (entry.resetTime < now) {
        rateLimitStore.set(key, {
            count: 1,
            resetTime: now + config.windowMs,
        });
        return {
            success: true,
            remaining: config.maxAttempts - 1,
            resetIn: config.windowMs,
            blocked: false,
        };
    }

    // Check if blocked (exceeded limit in previous window)
    if (entry.count >= config.maxAttempts) {
        const resetIn = entry.resetTime - now;
        return {
            success: false,
            remaining: 0,
            resetIn,
            blocked: true,
        };
    }

    // Increment count
    entry.count++;
    rateLimitStore.set(key, entry);

    const remaining = config.maxAttempts - entry.count;
    const success = remaining >= 0;

    // If just exceeded, extend block duration
    if (!success) {
        entry.resetTime = now + config.blockDurationMs;
        rateLimitStore.set(key, entry);
    }

    return {
        success,
        remaining: Math.max(0, remaining),
        resetIn: entry.resetTime - now,
        blocked: !success,
    };
}

/**
 * Reset rate limit for a key (e.g., after successful login)
 */
export function resetRateLimit(key: string): void {
    rateLimitStore.delete(key);
}

// Default config for login attempts
export const LOGIN_RATE_LIMIT: RateLimitConfig = {
    maxAttempts: 5,           // 5 attempts
    windowMs: 60 * 1000,      // per 1 minute
    blockDurationMs: 15 * 60 * 1000,  // block for 15 minutes
};
