import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getSession } from '@/lib/auth';

/**
 * POST /api/activation/extend
 * Admin extends activation duration
 * Body: { code: string, additional_days: number }
 */
export async function POST(request: NextRequest) {
    try {
        // Check admin auth
        const session = await getSession();
        if (!session?.isAdmin) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { code, additional_days } = await request.json();

        if (!code || !additional_days || additional_days < 1) {
            return NextResponse.json(
                { success: false, message: 'Code dan additional_days (min 1) diperlukan' },
                { status: 400 }
            );
        }

        const supabase = createServerClient();

        // Find activation code
        const { data: activationCode, error: codeError } = await supabase
            .from('activation_codes')
            .select('*')
            .eq('code', code.toUpperCase())
            .single();

        if (codeError || !activationCode) {
            return NextResponse.json({
                success: false,
                message: 'Activation code tidak ditemukan',
            });
        }

        // Get all device sessions for this code
        const { data: sessions, error: sessionsError } = await supabase
            .from('device_sessions')
            .select('*')
            .eq('activation_code_id', activationCode.id);

        if (sessionsError) {
            return NextResponse.json({
                success: false,
                message: 'Gagal mengambil data sessions',
            }, { status: 500 });
        }

        // Extend each session's expires_at (batch update with Promise.all)
        const now = new Date();

        const updatePromises = (sessions || []).map(sess => {
            const currentExpires = new Date(sess.expires_at);
            const baseDate = currentExpires > now ? currentExpires : now;
            const newExpires = new Date(baseDate);
            newExpires.setDate(newExpires.getDate() + additional_days);

            return supabase
                .from('device_sessions')
                .update({ expires_at: newExpires.toISOString() })
                .eq('id', sess.id);
        });

        const results = await Promise.all(updatePromises);
        const extendedCount = results.filter(r => !r.error).length;

        return NextResponse.json({
            success: true,
            extended_devices: extendedCount,
            message: `Berhasil memperpanjang ${extendedCount} device`,
        });

    } catch (error) {
        console.error('Extend error:', error);
        return NextResponse.json({
            success: false,
            message: 'Terjadi kesalahan server',
        }, { status: 500 });
    }
}
