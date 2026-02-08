import { createServerClient } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import CodeDetailClient from './CodeDetailClient';

interface PageProps {
    params: Promise<{ id: string }>;
}

async function getCodeDetails(id: string) {
    const supabase = createServerClient();

    // Get activation code with all related data
    const { data: code, error } = await supabase
        .from('activation_codes')
        .select(`
            *,
            device_sessions(id, device_id, activated_at, expires_at, last_check, device_info),
            user_profiles(id, profile_name, created_at, updated_at),
            daily_usage(date, broadcasts_count, messages_sent, groups_joined)
        `)
        .eq('id', id)
        .single();

    if (error || !code) {
        return null;
    }

    // For HudzLink, try to get link stats
    if (code.app_type === 'HudzLink') {
        const { data: linkStats } = await supabase
            .from('link_stats')
            .select('*')
            .eq('activation_code_id', id)
            .single();

        if (linkStats) {
            code.link_stats = linkStats;
        }
    }

    return code;
}

export default async function CodeDetailPage({ params }: PageProps) {
    const { id } = await params;
    const code = await getCodeDetails(id);

    if (!code) {
        notFound();
    }

    return (
        <div>
            <div className="page-header">
                <Link href="/dashboard/codes" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '14px' }}>
                    ← Back to Codes
                </Link>
                <h1 className="page-title" style={{ marginTop: '8px' }}>Code Details</h1>
            </div>

            <CodeDetailClient code={code} />
        </div>
    );
}
