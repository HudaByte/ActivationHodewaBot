import { NextRequest, NextResponse } from 'next/server';
import { checkPassword, createSession, setSessionCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const { password } = await request.json();

        if (!password) {
            return NextResponse.json(
                { error: 'Password diperlukan' },
                { status: 400 }
            );
        }

        if (!checkPassword(password)) {
            return NextResponse.json(
                { error: 'Password salah' },
                { status: 401 }
            );
        }

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
