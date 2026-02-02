import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getRemainingDays } from '@/lib/utils';

/**
 * POST /api/activation/check
 * Bot checks if device is still valid
 * Body: { device_id: string }
 */
export async function POST(request: NextRequest) {
    try {
        const { device_id } = await request.json();

        if (!device_id) {
            return NextResponse.json(
                { valid: false, message: 'device_id diperlukan' },
                { status: 400 }
            );
        }

        const supabase = createServerClient();

        // Find device session
        const { data: session, error } = await supabase
            .from('device_sessions')
            .select('*, activation_codes(*)')
            .eq('device_id', device_id)
            .single();

        if (error || !session) {
            return NextResponse.json({
                valid: false,
                message: 'Device tidak terdaftar',
            });
        }

        const now = new Date();
        const expiresAt = new Date(session.expires_at);

        if (expiresAt <= now) {
            // Expired - delete session
            await supabase
                .from('device_sessions')
                .delete()
                .eq('id', session.id);

            return NextResponse.json({
                valid: false,
                message: 'Aktivasi sudah expired',
            });
        }

        // Check if activation code is still active
        if (!session.activation_codes?.is_active) {
            return NextResponse.json({
                valid: false,
                message: 'Activation code sudah dinonaktifkan',
            });
        }

        // Update last_check
        await supabase
            .from('device_sessions')
            .update({ last_check: new Date().toISOString() })
            .eq('id', session.id);

        // Get device count for this activation code
        const { count: currentDevices } = await supabase
            .from('device_sessions')
            .select('*', { count: 'exact', head: true })
            .eq('activation_code_id', session.activation_code_id)
            .gt('expires_at', new Date().toISOString());

        return NextResponse.json({
            valid: true,
            expires_at: session.expires_at,
            remaining_days: getRemainingDays(session.expires_at),
            max_devices: session.activation_codes?.max_devices || 1,
            current_devices: currentDevices || 1,
            code_note: session.activation_codes?.note || null,
            message: 'Aktivasi masih valid',
        });

    } catch (error) {
        console.error('Check error:', error);
        return NextResponse.json({
            valid: false,
            message: 'Terjadi kesalahan server',
        }, { status: 500 });
    }
}
