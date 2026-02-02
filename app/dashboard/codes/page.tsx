import { createServerClient } from '@/lib/supabase';
import CodesTable from './CodesTable';
import CreateCodeForm from './CreateCodeForm';

async function getCodes() {
    const supabase = createServerClient();

    const { data, error } = await supabase
        .from('activation_codes')
        .select('*, device_sessions(id, device_id, expires_at)')
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

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Activation Codes</h1>
            </div>

            <CreateCodeForm />

            <div className="card">
                <CodesTable codes={codes} />
            </div>
        </div>
    );
}
