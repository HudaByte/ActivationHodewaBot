import { createServerClient } from '@/lib/supabase';
import DevicesTable from './DevicesTable';

import PaginationControl from '@/app/components/PaginationControl';

async function getDevices(page: number) {
    const supabase = createServerClient();
    const limit = 50;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error } = await supabase
        .from('device_sessions')
        .select('*, activation_codes(code, note)')
        .order('activated_at', { ascending: false })
        .range(from, to);

    const { count } = await supabase
        .from('device_sessions')
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.error('Error fetching devices:', error);
        return { data: [], count: 0 };
    }

    return { data: data || [], count: count || 0 };
}

export default async function DevicesPage({ searchParams }: { searchParams: { page?: string } }) {
    const page = parseInt(searchParams?.page || '1');
    const { data: devices, count } = await getDevices(page);
    const totalPages = Math.ceil(count / 50);

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Active Devices</h1>
            </div>

            <div className="card">
                <DevicesTable devices={devices} />
            </div>

            <PaginationControl
                currentPage={page}
                totalPages={totalPages}
                baseUrl="/dashboard/devices"
            />
        </div>
    );
}
