import { createServerClient } from '@/lib/supabase';
import DevicesTable from './DevicesTable';

async function getDevices() {
    const supabase = createServerClient();

    const { data, error } = await supabase
        .from('device_sessions')
        .select('*, activation_codes(code, note)')
        .order('activated_at', { ascending: false })
        .limit(100); // Limit untuk performance

    if (error) {
        console.error('Error fetching devices:', error);
        return [];
    }

    return data || [];
}

export default async function DevicesPage() {
    const devices = await getDevices();

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Active Devices</h1>
            </div>

            <div className="card">
                <DevicesTable devices={devices} />
            </div>
        </div>
    );
}
