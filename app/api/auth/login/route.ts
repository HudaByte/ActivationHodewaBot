import { NextRequest, NextResponse } from 'next/server';
import { checkPassword, createSession, setSessionCookie } from '@/lib/auth';
import { checkRateLimit, resetRateLimit, LOGIN_RATE_LIMIT } from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
    try {
        // Get client IP for rate limiting
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
            || request.headers.get('x-real-ip')
            || 'unknown';

        // Check rate limit
        const rateLimitResult = checkRateLimit(`login:${ip}`, LOGIN_RATE_LIMIT);

        if (!rateLimitResult.success) {
            const retryAfter = Math.ceil(rateLimitResult.resetIn / 1000);
            return NextResponse.json(
                {
                    error: `Terlalu banyak percobaan. Coba lagi dalam ${Math.ceil(retryAfter / 60)} menit.`,
                    retryAfter
                },
                {
                    status: 429,
                    headers: {
                        'Retry-After': String(retryAfter),
                    }
                }
            );
        }

        const { password } = await request.json();

        if (!password) {
            return NextResponse.json(
                { error: 'Password diperlukan' },
                { status: 400 }
            );
        }

        if (!checkPassword(password)) {
            return NextResponse.json(
                {
                    error: 'Password salah',
                    remaining: rateLimitResult.remaining
                },
                { status: 401 }
            );
        }

        // Reset rate limit on successful login
        resetRateLimit(`login:${ip}`);

        // Create session and set cookie
        const token = await createSession();
        await setSessionCookie(token);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'Terjadi kesalahan server' },
            { status: 500 }
        );
    }
}
