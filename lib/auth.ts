import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

if (!process.env.JWT_SECRET) {
    console.warn('[Auth] WARNING: JWT_SECRET not set in environment!');
}

const COOKIE_NAME = 'admin_session';
const SESSION_DURATION = 60 * 60 * 24; // 24 hours in seconds

export interface SessionPayload {
    isAdmin: boolean;
    exp: number;
}

// Create JWT session token
export async function createSession(): Promise<string> {
    const token = await new SignJWT({ isAdmin: true })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('24h')
        .setIssuedAt()
        .sign(JWT_SECRET);

    return token;
}

// Verify JWT session token
export async function verifySession(token: string): Promise<SessionPayload | null> {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return payload as unknown as SessionPayload;
    } catch {
        return null;
    }
}

// Get session from cookies (for Server Components)
export async function getSession(): Promise<SessionPayload | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) return null;
    return verifySession(token);
}

// Set session cookie
export async function setSessionCookie(token: string) {
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: SESSION_DURATION,
        path: '/',
    });
}

// Delete session cookie
export async function deleteSessionCookie() {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
}

// Check admin password
export function checkPassword(password: string): boolean {
    return password === process.env.ADMIN_PASSWORD;
}
