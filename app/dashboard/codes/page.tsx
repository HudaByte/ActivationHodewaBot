import { createServerClient } from '@/lib/supabase';
import CodesPageClient from './CodesPageClient';

async function getCodes() {
    const supabase = createServerClient();

    const { data, error } = await supabase
        .from('activation_codes')
        .select(`
            *,
            device_sessions(id, device_id, expires_at),
            user_profiles(id),
            link_stats(total_scraped, total_generated, total_exported)
        `)
        .order('created_at', { ascending: false })
        .limit(100); // Limit untuk performance

    if (error) {
        console.error('Error fetching codes:', error);
        return [];
    }

    return data || [];
}

export default async function CodesPage() {
    const codes = await getCodes();

    return <CodesPageClient codes={codes} />;
}
