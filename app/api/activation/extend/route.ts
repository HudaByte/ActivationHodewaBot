import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getSession } from '@/lib/auth';

/**
 * POST /api/activation/extend
 * Admin extends activation duration
 * Body: { code: string, additional_days: number }
 * 
 * Behavior:
 * - Updates duration_days in activation_codes (affects new devices)
 * - Extends expires_at for all existing device sessions
 * - Rejects lifetime codes (duration_days = null)
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

        // Reject lifetime codes - they don't need extension
        if (activationCode.duration_days === null) {
            return NextResponse.json({
                success: false,
                message: 'Code ini adalah Lifetime dan tidak perlu diperpanjang',
            });
        }

        // 1. Update duration_days in activation_codes (affects new device registrations)
        const newDurationDays = activationCode.duration_days + additional_days;
        const { error: updateCodeError } = await supabase
            .from('activation_codes')
            .update({ duration_days: newDurationDays })
            .eq('id', activationCode.id);

        if (updateCodeError) {
            console.error('Error updating activation_codes:', updateCodeError);
            return NextResponse.json({
                success: false,
                message: 'Gagal mengupdate durasi code',
            }, { status: 500 });
        }

        // 2. Get all device sessions for this code
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

        // 3. Extend each existing session's expires_at
        const now = new Date();
        let extendedCount = 0;

        if (sessions && sessions.length > 0) {
            const updatePromises = sessions.map(sess => {
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
            extendedCount = results.filter(r => !r.error).length;
        }

        return NextResponse.json({
            success: true,
            new_duration_days: newDurationDays,
            extended_devices: extendedCount,
            message: extendedCount > 0
                ? `Berhasil! Durasi code: ${newDurationDays} hari, ${extendedCount} device diperpanjang`
                : `Berhasil! Durasi code: ${newDurationDays} hari (belum ada device terdaftar)`,
        });

    } catch (error) {
        console.error('Extend error:', error);
        return NextResponse.json({
            success: false,
            message: 'Terjadi kesalahan server',
        }, { status: 500 });
    }
}
