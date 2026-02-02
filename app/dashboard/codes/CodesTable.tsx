'use client';

import { useState, useOptimistic, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { formatDateWIB } from '@/lib/utils';

interface ActivationCode {
    id: string;
    code: string;
    max_devices: number;
    duration_days: number | null;
    created_at: string;
    is_active: boolean;
    note: string | null;
    device_sessions: Array<{
        id: string;
        device_id: string;
        expires_at: string;
    }>;
}

interface Props {
    codes: ActivationCode[];
}

export default function CodesTable({ codes }: Props) {
    const router = useRouter();
    const [, startTransition] = useTransition();
    const [extendModal, setExtendModal] = useState<{ code: string; open: boolean }>({ code: '', open: false });
    const [extendDays, setExtendDays] = useState(30);
    const [loading, setLoading] = useState(false);

    // Optimistic state untuk instant UI update
    const [optimisticCodes, updateOptimisticCodes] = useOptimistic(
        codes,
        (state, { code, is_active }: { code: string; is_active: boolean }) =>
            state.map(c => c.code === code ? { ...c, is_active } : c)
    );

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
        <>
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Code</th>
                            <th>Max Devices</th>
                            <th>Durasi</th>
                            <th>Active Devices</th>
                            <th>Status</th>
                            <th>Created</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {optimisticCodes.map((item) => {
                            const activeDevices = item.device_sessions.filter(d =>
                                new Date(d.expires_at) > new Date()
                            ).length;

                            return (
                                <tr key={item.id}>
                                    <td>
                                        <span className="code-cell">{item.code}</span>
                                    </td>
                                    <td>{item.max_devices}</td>
                                    <td>{item.duration_days ? `${item.duration_days} hari` : 'Lifetime'}</td>
                                    <td>{activeDevices} / {item.max_devices}</td>
                                    <td>
                                        <span className={`status-badge ${item.is_active ? 'status-active' : 'status-inactive'}`}>
                                            {item.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>{formatDateWIB(item.created_at)}</td>
                                    <td>
                                        <div className="action-buttons">
                                            <button
                                                className="btn btn-success btn-sm"
                                                onClick={() => setExtendModal({ code: item.code, open: true })}
                                            >
                                                Extend
                                            </button>
                                            <button
                                                className={`btn btn-sm ${item.is_active ? 'btn-warning' : 'btn-success'}`}
                                                onClick={() => handleToggleActive(item.code, item.is_active)}
                                            >
                                                {item.is_active ? 'Pause' : 'Resume'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {codes.length === 0 && (
                            <tr>
                                <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                                    Belum ada activation code. Buat yang baru!
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
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
        </>
    );
}
