import { createServerClient } from '@/lib/supabase';
import Link from 'next/link';
import CopyableCode from '@/app/components/CopyableCode';
import { formatDateWIB } from '@/lib/utils';

async function getUsageOverview() {
    const supabase = createServerClient();
    const now = new Date().toISOString();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Get recent usage data
    const { data: recentUsage } = await supabase
        .from('daily_usage')
        .select('*, activation_codes(code, app_type, note)')
        .gte('date', sevenDaysAgo)
        .order('date', { ascending: false })
        .limit(50);

    // Get top active codes (most broadcasts)
    const { data: topCodes } = await supabase
        .from('daily_usage')
        .select('activation_code_id, broadcasts_count, messages_sent, activation_codes(id, code, app_type, note)')
        .gte('date', sevenDaysAgo)
        .order('broadcasts_count', { ascending: false })
        .limit(10);

    // Aggregate stats
    const totalBroadcasts = recentUsage?.reduce((sum, u) => sum + (u.broadcasts_count || 0), 0) || 0;
    const totalMessages = recentUsage?.reduce((sum, u) => sum + (u.messages_sent || 0), 0) || 0;
    const totalGroupsJoined = recentUsage?.reduce((sum, u) => sum + (u.groups_joined || 0), 0) || 0;

    // Active codes count
    const { count: activeCodesCount } = await supabase
        .from('device_sessions')
        .select('activation_code_id', { count: 'exact', head: true })
        .gt('expires_at', now);

    return {
        recentUsage: recentUsage || [],
        topCodes: topCodes || [],
        stats: {
            totalBroadcasts,
            totalMessages,
            totalGroupsJoined,
            activeCodesCount: activeCodesCount || 0,
        }
    };
}

export default async function UsagePage() {
    const { recentUsage, topCodes, stats } = await getUsageOverview();

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Usage Overview</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                    Activity summary from all activation codes (last 7 days)
                </p>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid" style={{ marginBottom: '24px' }}>
                <div className="stat-card">
                    <div className="stat-value" style={{ color: 'var(--success)' }}>{stats.totalBroadcasts}</div>
                    <div className="stat-label">Total Broadcasts</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value" style={{ color: 'var(--primary)' }}>{stats.totalMessages}</div>
                    <div className="stat-label">Messages Sent</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value" style={{ color: 'var(--warning)' }}>{stats.totalGroupsJoined}</div>
                    <div className="stat-label">Groups Joined</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.activeCodesCount}</div>
                    <div className="stat-label">Active Devices</div>
                </div>
            </div>

            {/* Top Active Codes */}
            <div className="card" style={{ marginBottom: '24px' }}>
                <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 6l-9.5 9.5-5-5L1 18"></path>
                        <path d="M17 6h6v6"></path>
                    </svg>
                    Top Active Codes
                </h3>
                {topCodes.length > 0 ? (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Code</th>
                                    <th>Type</th>
                                    <th>Note</th>
                                    <th>Broadcasts</th>
                                    <th>Messages</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topCodes.map((item: {
                                    activation_code_id: string;
                                    broadcasts_count: number;
                                    messages_sent: number;
                                    activation_codes: { id: string; code: string; app_type: string; note: string | null }[];
                                }, index: number) => {
                                    const code = item.activation_codes?.[0];
                                    if (!code) return null;

                                    const typeIcon = code.app_type === 'HodewaBot'
                                        ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="10" rx="2" ry="2"></rect><circle cx="12" cy="5" r="2"></circle><path d="M12 7v4"></path></svg>
                                        : code.app_type === 'HodewaLink'
                                            ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                                            : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>;

                                    return (
                                        <tr key={`${item.activation_code_id}-${index}`}>
                                            <td><CopyableCode code={code.code} /></td>
                                            <td style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>{typeIcon} {code.app_type || 'HodewaBot'}</td>
                                            <td style={{ color: 'var(--text-secondary)' }}>{code.note || '-'}</td>
                                            <td style={{ fontWeight: 600, color: 'var(--success)' }}>{item.broadcasts_count || 0}</td>
                                            <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{item.messages_sent || 0}</td>
                                            <td>
                                                <Link
                                                    href={`/dashboard/codes/${code.id}`}
                                                    className="btn btn-primary btn-sm"
                                                >
                                                    View
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '24px' }}>
                        No usage data yet in the last 7 days.
                    </p>
                )}
            </div>

            {/* Recent Activity Log */}
            <div className="card">
                <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="20" x2="18" y2="10"></line>
                        <line x1="12" y1="20" x2="12" y2="4"></line>
                        <line x1="6" y1="20" x2="6" y2="14"></line>
                    </svg>
                    Daily Activity Log
                </h3>
                {recentUsage.length > 0 ? (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Code</th>
                                    <th>Broadcasts</th>
                                    <th>Messages</th>
                                    <th>Groups Joined</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentUsage.slice(0, 20).map((item: {
                                    id: string;
                                    date: string;
                                    broadcasts_count: number;
                                    messages_sent: number;
                                    groups_joined: number;
                                    activation_codes: { code: string; app_type: string; note: string | null }[];
                                }) => (
                                    <tr key={item.id}>
                                        <td>{item.date}</td>
                                        <td>
                                            <CopyableCode code={item.activation_codes?.[0]?.code || 'Unknown'} />
                                        </td>
                                        <td>{item.broadcasts_count || 0}</td>
                                        <td>{item.messages_sent || 0}</td>
                                        <td>{item.groups_joined || 0}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '24px' }}>
                        No activity logged yet.
                    </p>
                )}
            </div>
        </div>
    );
}
