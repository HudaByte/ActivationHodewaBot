import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getSession } from '@/lib/auth';

/**
 * POST /api/codes/delete
 * Admin deletes an activation code
 * Body: { code: string }
 * 
 * Note: This will cascade delete all device_sessions due to ON DELETE CASCADE
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

        const { code } = await request.json();

        if (!code) {
            return NextResponse.json(
                { success: false, message: 'code diperlukan' },
                { status: 400 }
            );
        }

        const supabase = createServerClient();

        // Get code info first for logging
        const { data: activationCode } = await supabase
            .from('activation_codes')
            .select('id, code, app_type')
            .eq('code', code.toUpperCase())
            .single();

        if (!activationCode) {
            return NextResponse.json({
                success: false,
                message: 'Code tidak ditemukan',
            });
        }

        // Delete activation code (device_sessions will cascade)
        const { error } = await supabase
            .from('activation_codes')
            .delete()
            .eq('id', activationCode.id);

        if (error) {
            console.error('Error deleting code:', error);
            return NextResponse.json({
                success: false,
                message: 'Gagal menghapus code',
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: `Code ${activationCode.code} berhasil dihapus`,
        });

    } catch (error) {
        console.error('Delete code error:', error);
        return NextResponse.json({
            success: false,
            message: 'Terjadi kesalahan server',
        }, { status: 500 });
    }
}
