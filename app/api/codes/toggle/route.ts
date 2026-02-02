import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getSession } from '@/lib/auth';

/**
 * POST /api/codes/toggle
 * Admin toggles activation code active status
 * Body: { code: string, is_active: boolean }
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

        const { code, is_active } = await request.json();

        if (!code || typeof is_active !== 'boolean') {
            return NextResponse.json(
                { success: false, message: 'code dan is_active diperlukan' },
                { status: 400 }
            );
        }

        const supabase = createServerClient();

        const { error } = await supabase
            .from('activation_codes')
            .update({ is_active })
            .eq('code', code);

        if (error) {
            return NextResponse.json({
                success: false,
                message: 'Gagal update status',
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: `Code berhasil ${is_active ? 'diaktifkan' : 'dinonaktifkan'}`,
        });

    } catch (error) {
        console.error('Toggle code error:', error);
        return NextResponse.json({
            success: false,
            message: 'Terjadi kesalahan server',
        }, { status: 500 });
    }
}
