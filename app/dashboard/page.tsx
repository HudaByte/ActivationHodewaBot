import { createServerClient } from '@/lib/supabase';

async function getStats() {
    const supabase = createServerClient();
    const now = new Date().toISOString();

    // Parallel queries with error handling
    const [totalCodesRes, activeCodesRes, activeDevicesRes, expiredDevicesRes] = await Promise.allSettled([
        supabase.from('activation_codes').select('*', { count: 'exact', head: true }),
        supabase.from('activation_codes').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('device_sessions').select('*', { count: 'exact', head: true }).gt('expires_at', now),
        supabase.from('device_sessions').select('*', { count: 'exact', head: true }).lte('expires_at', now),
    ]);

    const getCount = (res: PromiseSettledResult<any>) =>
        (res.status === 'fulfilled' && res.value.count !== null) ? res.value.count : 0;

    return {
        totalCodes: getCount(totalCodesRes),
        activeCodes: getCount(activeCodesRes),
        activeDevices: getCount(activeDevicesRes),
        expiredDevices: getCount(expiredDevicesRes),
    };
}

export default async function DashboardPage() {
    const stats = await getStats();

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Dashboard</h1>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-value">{stats.totalCodes}</div>
                    <div className="stat-label">Total Codes</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value" style={{ color: 'var(--success)' }}>{stats.activeCodes}</div>
                    <div className="stat-label">Active Codes</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value" style={{ color: 'var(--primary)' }}>{stats.activeDevices}</div>
                    <div className="stat-label">Active Devices</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value" style={{ color: 'var(--warning)' }}>{stats.expiredDevices}</div>
                    <div className="stat-label">Expired Devices</div>
                </div>
            </div>

            <div className="card">
                <div className="guide-box">
                    <h4>Quick Guide</h4>
                    <ol>
                        <li>Create new <strong>Activation Code</strong> in the Codes section</li>
                        <li>Share the code with your users for bot activation</li>
                        <li>Monitor registered devices in <strong>Active Devices</strong></li>
                        <li>Use <strong>Extend</strong> to add more days without changing code</li>
                        <li>Use <strong>Revoke</strong> to disconnect specific devices</li>
                    </ol>
                </div>
            </div>
        </div>
    );
}
