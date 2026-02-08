import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getSession } from '@/lib/auth';
import { generateActivationCode } from '@/lib/utils';

/**
 * POST /api/codes/create
 * Admin creates new activation code
 * Body: { max_devices: number, duration_days: number | null, note?: string }
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

        const {
            app_type,
            max_devices,
            duration_days,
            note,
            max_whatsapp_profiles,
        } = await request.json();

        if (!max_devices || max_devices < 1) {
            return NextResponse.json(
                { success: false, message: 'max_devices minimal 1' },
                { status: 400 }
            );
        }

        const supabase = createServerClient();

        // Generate unique code
        let code: string;
        let attempts = 0;
        do {
            code = generateActivationCode();
            const { data } = await supabase
                .from('activation_codes')
                .select('id')
                .eq('code', code)
                .single();

            if (!data) break;
            attempts++;
        } while (attempts < 10);

        // Insert new code with all fields
        const { error } = await supabase
            .from('activation_codes')
            .insert({
                code,
                app_type: app_type || 'HudzSender',
                max_devices,
                duration_days: duration_days || null,
                note: note || null,
                is_active: true,
                max_whatsapp_profiles: max_whatsapp_profiles || 3,
            });

        if (error) {
            console.error('Error creating code:', error);
            return NextResponse.json({
                success: false,
                message: 'Gagal membuat code',
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            code,
            message: 'Code berhasil dibuat',
        });

    } catch (error) {
        console.error('Create code error:', error);
        return NextResponse.json({
            success: false,
            message: 'Terjadi kesalahan server',
        }, { status: 500 });
    }
}
