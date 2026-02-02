'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateCodeForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        max_devices: 1,
        duration_days: 30,
        is_lifetime: false,
        note: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/codes/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    max_devices: formData.max_devices,
                    duration_days: formData.is_lifetime ? null : formData.duration_days,
                    note: formData.note || null,
                }),
            });

            const data = await res.json();
            if (data.success) {
                alert(`Berhasil! Code: ${data.code}`);
                router.refresh();
                setFormData({ max_devices: 1, duration_days: 30, is_lifetime: false, note: '' });
            } else {
                alert(`Error: ${data.message}`);
            }
        } catch {
            alert('Terjadi kesalahan');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="card" style={{ marginBottom: '24px' }}>
            <h3 className="card-title">Create New Code</h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
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
    );
}
