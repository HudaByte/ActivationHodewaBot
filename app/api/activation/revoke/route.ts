import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getSession } from '@/lib/auth';

/**
 * POST /api/activation/revoke
 * Admin revokes a device session
 * Body: { device_id: string }
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

        const { device_id } = await request.json();

        if (!device_id) {
            return NextResponse.json(
                { success: false, message: 'device_id diperlukan' },
                { status: 400 }
            );
        }

        const supabase = createServerClient();

        // Delete device session
        const { error } = await supabase
            .from('device_sessions')
            .delete()
            .eq('device_id', device_id);

        if (error) {
            return NextResponse.json({
                success: false,
                message: 'Gagal menghapus device session',
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Device berhasil di-revoke',
        });

    } catch (error) {
        console.error('Revoke error:', error);
        return NextResponse.json({
            success: false,
            message: 'Terjadi kesalahan server',
        }, { status: 500 });
    }
}
