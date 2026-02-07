import { createServerClient } from '@/lib/supabase';
import CodesPageClient from './CodesPageClient';
import PaginationControl from '@/app/components/PaginationControl';

async function getCodes(page: number, type: string = 'HodewaBot', search: string = '') {
    const supabase = createServerClient();
    const limit = 50;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
        .from('activation_codes')
        .select(`
            *,
            device_sessions(id, device_id, expires_at),
            user_profiles(id),
            link_stats(total_scraped, total_generated, total_exported)
        `)
        .eq('app_type', type)
        .order('created_at', { ascending: false });

    // Apply Search
    if (search) {
        query = query.ilike('code', `%${search}%`);
    }

    const { data, error } = await query.range(from, to);

    // Get Count
    let countQuery = supabase
        .from('activation_codes')
        .select('*', { count: 'exact', head: true })
        .eq('app_type', type);

    if (search) {
        countQuery = countQuery.ilike('code', `%${search}%`);
    }

    const { count } = await countQuery;

    if (error) {
        console.error('Error fetching codes:', error);
        return { data: [], count: 0 };
    }

    return { data: data || [], count: count || 0 };
}

export default async function CodesPage({ searchParams }: { searchParams: { page?: string; type?: string; q?: string } }) {
    const page = parseInt(searchParams?.page || '1');
    const type = searchParams?.type || 'HodewaBot';
    const search = searchParams?.q || '';

    // Pass search params to getCodes
    const { data: codes, count } = await getCodes(page, type, search);
    const totalPages = Math.ceil(count / 50);

    return (
        <div>
            {/* Search Bar */}
            <div style={{ marginBottom: '1rem' }}>
                <form style={{ display: 'flex', gap: '0.5rem' }}>
                    <input type="hidden" name="type" value={type} />
                    <input
                        type="text"
                        name="q"
                        defaultValue={search}
                        placeholder="Search code..."
                        className="form-input"
                        style={{ maxWidth: '300px' }}
                    />
                    <button type="submit" className="btn btn-primary">Search</button>
                    {search && (
                        /* Use a simple link to clear params */
                        <a href={`/dashboard/codes?type=${type}`} className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>
                            Clear
                        </a>
                    )}
                </form>
            </div>

            <CodesPageClient codes={codes} />

            <PaginationControl
                currentPage={page}
                totalPages={totalPages}
                baseUrl="/dashboard/codes"
            />
        </div>
    );
}
