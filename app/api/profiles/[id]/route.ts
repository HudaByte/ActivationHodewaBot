import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getSession } from '@/lib/auth';

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/profiles/[id]
 * Get profile details for accordion lazy loading
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        // Check admin auth
        const session = await getSession();
        if (!session?.isAdmin) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { id } = await params;
        const supabase = createServerClient();

        // Get profile basic info & jsonb settings
        const { data: profile, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !profile) {
            return NextResponse.json(
                { success: false, message: 'Profile not found' },
                { status: 404 }
            );
        }

        // Get stats counts safely
        const { count: contactsCount } = await supabase
            .from('subscribers')
            .select('*', { count: 'exact', head: true })
            .eq('profile_name', profile.profile_name)
            .eq('activation_code_id', profile.activation_code_id);

        const { count: broadcastsCount } = await supabase
            .from('campaign_logs')
            .select('*', { count: 'exact', head: true })
            .eq('profile_name', profile.profile_name)
            .eq('activation_code_id', profile.activation_code_id)
            .eq('status', 'sent');

        // Extract settings safely from JSONB
        // Note: Accommodating potential different JSON structures
        const settings = profile.settings || {};

        // Format the response
        const formattedProfile = {
            id: profile.id,
            profile_name: profile.profile_name,
            created_at: profile.created_at,
            updated_at: profile.updated_at,
            // Message settings extraction
            greeting_message: settings.greeting_message || null,
            auto_reply_message: settings.auto_reply_message || null,
            broadcast_template: settings.broadcast_template || null,
            // Stats
            total_contacts: contactsCount || 0,
            total_groups: 0, // Placeholder as we don't have explicit groups tracking table yet
            total_broadcasts: broadcastsCount || 0,
        };

        return NextResponse.json({
            success: true,
            profile: formattedProfile,
        });

    } catch (error) {
        console.error('Get profile error:', error);
        return NextResponse.json({
            success: false,
            message: 'Terjadi kesalahan server',
        }, { status: 500 });
    }
}
