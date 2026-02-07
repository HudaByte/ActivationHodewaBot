// ... imports
import { useSearchParams } from 'next/navigation';

// ... interface

export default function CodesPageClient({ codes }: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const activeTab = (searchParams.get('type') as 'HodewaBot' | 'HodewaLink') || 'HodewaBot';
    const [, startTransition] = useTransition();
    // ...

    // Switch tab handler
    const setActiveTab = (tab: 'HodewaBot' | 'HodewaLink') => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('type', tab);
        params.set('page', '1'); // Reset to page 1 on tab switch
        router.push(`?${params.toString()}`);
    };

    // ... create code handler reads activeTab from URL ...
    // Note: Previous filteredCodes logic is now REDUNDANT if server filters properly.
    // But we might still need to optimistic update.
    // For now, let's assume `codes` passed prop IS ALREADY filtered by server.
    const filteredCodes = optimisticCodes; // Already filtered from server

    app_type: AppType;
    max_devices: number;
    duration_days: number | null;
    created_at: string;
    is_active: boolean;
    note: string | null;
    first_activated_at: string | null;
    device_sessions: Array<{
        id: string;
        device_id: string;
        expires_at: string;
    }>;
    user_profiles ?: Array<{ id: string }>;
    link_stats ?: Array<{
        total_scraped: number;
        total_generated: number;
        total_exported: number;
    }>;
}

// Helper function to get activation status
function getActivationStatus(code: ActivationCode): { status: 'never' | 'active' | 'expired'; label: string; className: string } {
    if (!code.first_activated_at) {
        return { status: 'never', label: 'Belum Diaktivasi', className: 'status-warning' };
    }

    if (code.duration_days === null) {
        return { status: 'active', label: 'Aktif (Lifetime)', className: 'status-active' };
    }

    const firstActivated = new Date(code.first_activated_at);
    const expiresAt = new Date(firstActivated);
    expiresAt.setDate(expiresAt.getDate() + code.duration_days);

    if (expiresAt > new Date()) {
        const remaining = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return { status: 'active', label: `Aktif (${remaining} hari)`, className: 'status-active' };
    }

    return { status: 'expired', label: 'Expired', className: 'status-inactive' };
}

interface Props {
    codes: ActivationCode[];
}

export default function CodesPageClient({ codes }: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const activeTab = (searchParams.get('type') as 'HodewaBot' | 'HodewaLink') || 'HodewaBot';
    const [, startTransition] = useTransition();

    const [showCreateForm, setShowCreateForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [extendModal, setExtendModal] = useState<{ code: string; open: boolean }>({ code: '', open: false });
    const [extendDays, setExtendDays] = useState(30);

    // Form states
    const [formData, setFormData] = useState({
        max_devices: 1,
        duration_days: 30,
        is_lifetime: false,
        note: '',
        max_whatsapp_profiles: 3,
    });

    // Optimistic state
    const [optimisticCodes, updateOptimisticCodes] = useOptimistic(
        codes,
        (state, { code, is_active }: { code: string; is_active: boolean }) =>
            state.map(c => c.code === code ? { ...c, is_active } : c)
    );

    // Use optimisticCodes directly (server filtered)
    const filteredCodes = optimisticCodes;

    const setActiveTab = (tab: 'HodewaBot' | 'HodewaLink') => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('type', tab);
        params.set('page', '1');
        router.push(`?${params.toString()}`);
    };

    const handleCreateCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/codes/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    app_type: activeTab,
                    max_devices: formData.max_devices,
                    duration_days: formData.is_lifetime ? null : formData.duration_days,
                    note: formData.note || null,
                    max_whatsapp_profiles: activeTab === 'HodewaBot' ? formData.max_whatsapp_profiles : 1,
                }),
            });

            const data = await res.json();
            if (data.success) {
                alert(`Berhasil! Code: ${data.code}`);
                router.refresh();
                setFormData({
                    max_devices: 1,
                    duration_days: 30,
                    is_lifetime: false,
                    note: '',
                    max_whatsapp_profiles: 3,
                });
                setShowCreateForm(false);
            } else {
                alert(`Error: ${data.message}`);
            }
        } catch {
            alert('Terjadi kesalahan');
        } finally {
            setLoading(false);
        }
    };

    const handleExtend = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/activation/extend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: extendModal.code,
                    additional_days: extendDays
                }),
            });
            const data = await res.json();
            if (data.success) {
                alert(`Berhasil! ${data.message}`);
                router.refresh();
            } else {
                alert(`Error: ${data.message}`);
            }
        } catch {
            alert('Terjadi kesalahan');
        } finally {
            setLoading(false);
            setExtendModal({ code: '', open: false });
        }
    };

    const handleDelete = async (code: string) => {
        if (!confirm(`PERINGATAN: Hapus code ${code}? Semua device sessions juga akan terhapus!`)) return;

        setLoading(true);
        try {
            const res = await fetch('/api/codes/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code }),
            });
            const data = await res.json();
            if (data.success) {
                alert(data.message);
                router.refresh();
            } else {
                alert(`Error: ${data.message}`);
            }
        } catch {
            alert('Terjadi kesalahan');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleActive = async (code: string, currentActive: boolean) => {
        if (!confirm(`${currentActive ? 'Nonaktifkan' : 'Aktifkan'} code ${code}?`)) return;

        // Optimistic update - instant
        startTransition(() => {
            updateOptimisticCodes({ code, is_active: !currentActive });
        });

        try {
            const res = await fetch('/api/codes/toggle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, is_active: !currentActive }),
            });
            if (res.ok) {
                startTransition(() => router.refresh());
            }
        } catch {
            alert('Terjadi kesalahan');
            startTransition(() => router.refresh()); // Rollback
        }
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Activation Codes</h1>
            </div>

            {/* Tab Navigation */}
            <div className="tabs-container" style={{ marginBottom: '24px' }}>
                <div className="tabs">
                    <button
                        className={`tab ${activeTab === 'HodewaBot' ? 'tab-active' : ''}`}
                        onClick={() => setActiveTab('HodewaBot')}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="10" rx="2" ry="2"></rect>
                            <circle cx="12" cy="5" r="2"></circle>
                            <path d="M12 7v4"></path>
                            <line x1="8" y1="16" x2="8" y2="16"></line>
                            <line x1="16" y1="16" x2="16" y2="16"></line>
                        </svg>
                        HodewaBot
                    </button>
                    <button
                        className={`tab ${activeTab === 'HodewaLink' ? 'tab-active' : ''}`}
                        onClick={() => setActiveTab('HodewaLink')}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                        </svg>
                        HodewaLink
                    </button>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => setShowCreateForm(!showCreateForm)}
                >
                    {showCreateForm ? '✕ Tutup' : '+ Create Code'}
                </button>
            </div>

            {/* Create Form */}
            {showCreateForm && (
                <form onSubmit={handleCreateCode} className="card" style={{ marginBottom: '24px' }}>
                    <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Create New {activeTab === 'HodewaBot' ? (
                            <>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2" ry="2"></rect><circle cx="12" cy="5" r="2"></circle><path d="M12 7v4"></path><line x1="8" y1="16" x2="8" y2="16"></line><line x1="16" y1="16" x2="16" y2="16"></line></svg>
                                HodewaBot
                            </>
                        ) : (
                            <>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                                HodewaLink
                            </>
                        )} Code
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Max Devices</label>
                            <input
                                type="number"
                                className="form-input"
                                value={formData.max_devices}
                                onChange={(e) => setFormData({ ...formData, max_devices: parseInt(e.target.value) || 1 })}
                                min="1"
                                max="100"
                            />
                        </div>

                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Duration (Days)</label>
                            <input
                                type="number"
                                className="form-input"
                                value={formData.duration_days}
                                onChange={(e) => setFormData({ ...formData, duration_days: parseInt(e.target.value) || 1 })}
                                min="1"
                                max="365"
                                disabled={formData.is_lifetime}
                            />
                        </div>

                        {activeTab === 'HodewaBot' && (
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Max WA Profiles</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={formData.max_whatsapp_profiles}
                                    onChange={(e) => setFormData({ ...formData, max_whatsapp_profiles: parseInt(e.target.value) || 3 })}
                                    min="1"
                                    max="10"
                                />
                            </div>
                        )}

                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Note (Optional)</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.note}
                                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                                placeholder="e.g. Customer A"
                            />
                        </div>
                    </div>

                    <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={formData.is_lifetime}
                                onChange={(e) => setFormData({ ...formData, is_lifetime: e.target.checked })}
                            />
                            <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Lifetime (No Expiry)</span>
                        </label>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                            style={{ marginLeft: 'auto', width: 'auto' }}
                        >
                            {loading ? 'Creating...' : 'Generate Code'}
                        </button>
                    </div>
                </form>
            )}

            {/* Table */}
            <div className="card">
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Code</th>
                                <th>Max Devices</th>
                                <th>Durasi</th>
                                <th>Active Devices</th>
                                {activeTab === 'HodewaBot' && <th>Profiles</th>}
                                {activeTab === 'HodewaLink' && <th>Links</th>}
                                <th>Masa Aktif</th>
                                <th>Code Status</th>
                                <th className="hidden-mobile">Note</th>
                                <th className="hidden-mobile">Created</th>
                                <th className="text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCodes.map((item) => {
                                const activeDevices = item.device_sessions.filter(d =>
                                    new Date(d.expires_at) > new Date()
                                ).length;

                                const typeIcon = item.app_type === 'HodewaBot' ? (
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2" ry="2"></rect><circle cx="12" cy="5" r="2"></circle><path d="M12 7v4"></path></svg>
                                ) : item.app_type === 'HodewaLink' ? (
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                                ) : (
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>
                                );

                                return (
                                    <tr key={item.id}>
                                        <td>
                                            <CopyableCode code={item.code} />
                                        </td>
                                        <td>{typeIcon} {item.app_type}</td>
                                        <td>{item.duration_days ? `${item.duration_days} hari` : 'Lifetime'}</td>
                                        <td>{activeDevices} / {item.max_devices}</td>
                                        {activeTab === 'HodewaBot' && (
                                            <td>{item.user_profiles?.length || 0}</td>
                                        )}
                                        {activeTab === 'HodewaLink' && (
                                            <td>{item.link_stats?.[0]?.total_scraped || 0}</td>
                                        )}
                                        <td>
                                            {(() => {
                                                const activationStatus = getActivationStatus(item);
                                                return (
                                                    <span className={`status-badge ${activationStatus.className}`}>
                                                        {activationStatus.label}
                                                    </span>
                                                );
                                            })()}
                                        </td>
                                        <td>
                                            <span className={`status-badge ${item.is_active ? 'status-active' : 'status-inactive'}`}>
                                                {item.is_active ? 'Active' : 'Paused'}
                                            </span>
                                        </td>
                                        <td className="hidden-mobile">
                                            <span style={{ color: item.note ? 'var(--text-primary)' : 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                                {item.note || '-'}
                                            </span>
                                        </td>
                                        <td className="hidden-mobile">{formatDateWIB(item.created_at)}</td>
                                        <td>
                                            <div className="action-buttons" style={{ justifyContent: 'center' }}>
                                                <Link
                                                    href={`/dashboard/codes/${item.id}`}
                                                    className="btn btn-primary btn-sm"
                                                    title="Detail"
                                                    style={{ padding: '6px' }}
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                                </Link>
                                                <button
                                                    className="btn btn-success btn-sm"
                                                    onClick={() => setExtendModal({ code: item.code, open: true })}
                                                    title="Extend Duration"
                                                    style={{ padding: '6px' }}
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                                </button>
                                                <button
                                                    className={`btn btn-sm ${item.is_active ? 'btn-warning' : 'btn-success'}`}
                                                    onClick={() => handleToggleActive(item.code, item.is_active)}
                                                    title={item.is_active ? 'Pause' : 'Resume'}
                                                    style={{ padding: '6px' }}
                                                >
                                                    {item.is_active ? (
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                                                    ) : (
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                                                    )}
                                                </button>
                                                <button
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() => handleDelete(item.code)}
                                                    disabled={loading}
                                                    title="Delete"
                                                    style={{ padding: '6px' }}
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredCodes.length === 0 && (
                                <tr>
                                    <td colSpan={activeTab === 'HodewaBot' ? 11 : 11} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                                        Belum ada activation code untuk {activeTab}. Buat yang baru!
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Extend Modal */}
            {extendModal.open && (
                <div className="modal-overlay" onClick={() => setExtendModal({ code: '', open: false })}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Extend Duration</h3>
                            <button className="modal-close" onClick={() => setExtendModal({ code: '', open: false })}>×</button>
                        </div>

                        <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
                            Code: <span className="code-cell">{extendModal.code}</span>
                        </p>

                        <div className="form-group">
                            <label className="form-label">Tambah Hari</label>
                            <input
                                type="number"
                                className="form-input"
                                value={extendDays}
                                onChange={(e) => setExtendDays(parseInt(e.target.value) || 1)}
                                min="1"
                                max="365"
                            />
                        </div>

                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                            Semua device yang terdaftar dengan code ini akan diperpanjang.
                        </p>

                        <div className="modal-actions">
                            <button
                                className="btn btn-success"
                                onClick={handleExtend}
                                disabled={loading}
                                style={{ flex: 1 }}
                            >
                                {loading ? 'Memproses...' : `Perpanjang ${extendDays} Hari`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
