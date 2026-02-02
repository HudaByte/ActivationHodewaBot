import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { calculateExpiresAt } from '@/lib/utils';

/**
 * POST /api/activation/validate
 * Bot validates activation code and registers device
 * Body: { code: string, device_id: string, device_info?: object }
 */
export async function POST(request: NextRequest) {
    try {
        const { code, device_id, device_info } = await request.json();

        if (!code || !device_id) {
            return NextResponse.json(
                { valid: false, message: 'Code dan device_id diperlukan' },
                { status: 400 }
            );
        }

        // Validate device_info size (max 5KB)
        if (device_info && JSON.stringify(device_info).length > 5120) {
            return NextResponse.json(
                { valid: false, message: 'device_info terlalu besar (max 5KB)' },
                { status: 400 }
            );
        }

        const supabase = createServerClient();

        // 1. Find activation code
        const { data: activationCode, error: codeError } = await supabase
            .from('activation_codes')
            .select('*')
            .eq('code', code.toUpperCase().replace(/[^A-Z0-9-]/g, ''))
            .eq('is_active', true)
            .single();

        if (codeError || !activationCode) {
            return NextResponse.json({
                valid: false,
                message: 'Activation code tidak valid atau sudah tidak aktif',
            });
        }

        // 2. Check existing device sessions for this code
        const { data: existingSessions, error: sessionsError } = await supabase
            .from('device_sessions')
            .select('*')
            .eq('activation_code_id', activationCode.id);

        if (sessionsError) {
            console.error('Error fetching sessions:', sessionsError);
            return NextResponse.json({
                valid: false,
                message: 'Terjadi kesalahan server',
            }, { status: 500 });
        }

        // 3. Check if this device already registered
        const existingDevice = existingSessions?.find(s => s.device_id === device_id);

        if (existingDevice) {
            // Device already registered, check if still valid
            const now = new Date();
            const expiresAt = new Date(existingDevice.expires_at);

            if (expiresAt > now) {
                // Update last_check
                await supabase
                    .from('device_sessions')
                    .update({ last_check: new Date().toISOString() })
                    .eq('id', existingDevice.id);

                return NextResponse.json({
                    valid: true,
                    expires_at: existingDevice.expires_at,
                    message: 'Device sudah terdaftar dan masih aktif',
                });
            } else {
                // Expired, remove old session
                await supabase
                    .from('device_sessions')
                    .delete()
                    .eq('id', existingDevice.id);
            }
        }

        // 4. Check max devices limit
        const activeSessionsCount = (existingSessions || []).filter(s => {
            const now = new Date();
            const expiresAt = new Date(s.expires_at);
            return expiresAt > now;
        }).length;

        if (activeSessionsCount >= activationCode.max_devices) {
            return NextResponse.json({
                valid: false,
                message: `Limit device tercapai (${activationCode.max_devices} device)`,
            });
        }

        // 5. Calculate expires_at
        let expiresAt: Date;
        if (activationCode.duration_days === null) {
            // Lifetime - set to 100 years
            expiresAt = new Date();
            expiresAt.setFullYear(expiresAt.getFullYear() + 100);
        } else {
            expiresAt = calculateExpiresAt(activationCode.duration_days);
        }

        // 6. Register new device session
        const { error: insertError } = await supabase
            .from('device_sessions')
            .insert({
                activation_code_id: activationCode.id,
                device_id,
                expires_at: expiresAt.toISOString(),
                device_info: device_info || null,
            });

        if (insertError) {
            console.error('Error inserting session:', insertError);
            return NextResponse.json({
                valid: false,
                message: 'Gagal mendaftarkan device',
            }, { status: 500 });
        }

        return NextResponse.json({
            valid: true,
            expires_at: expiresAt.toISOString(),
            message: 'Aktivasi berhasil',
        });

    } catch (error) {
        console.error('Validate error:', error);
        return NextResponse.json({
            valid: false,
            message: 'Terjadi kesalahan server',
        }, { status: 500 });
    }
}
