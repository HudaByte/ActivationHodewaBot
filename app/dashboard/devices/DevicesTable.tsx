'use client';

import { useRouter } from 'next/navigation';
import { formatDateWIB, getRemainingDays } from '@/lib/utils';

interface DeviceSession {
    id: string;
    device_id: string;
    activated_at: string;
    expires_at: string;
    last_check: string;
    device_info: Record<string, unknown> | null;
    activation_codes: {
        code: string;
        note: string | null;
    } | null;
}

interface Props {
    devices: DeviceSession[];
}

export default function DevicesTable({ devices }: Props) {
    const router = useRouter();

    const handleRevoke = async (device_id: string) => {
        if (!confirm(`Revoke device ${device_id.substring(0, 8)}...?`)) return;

        try {
            const res = await fetch('/api/activation/revoke', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ device_id }),
            });
            const data = await res.json();
            if (data.success) {
                alert('Device berhasil di-revoke');
                router.refresh();
            } else {
                alert(`Error: ${data.message}`);
            }
        } catch {
            alert('Terjadi kesalahan');
        }
    };

    const now = new Date();

    return (
        <div className="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Device ID</th>
                        <th>Activation Code</th>
                        <th>Activated</th>
                        <th>Expires</th>
                        <th>Remaining</th>
                        <th>Last Check</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {devices.map((device) => {
                        const expiresAt = new Date(device.expires_at);
                        const isExpired = expiresAt <= now;
                        const remainingDays = getRemainingDays(device.expires_at);

                        return (
                            <tr key={device.id}>
                                <td>
                                    <code style={{ fontSize: '0.8rem' }}>
                                        {device.device_id.substring(0, 12)}...
                                    </code>
                                </td>
                                <td>
                                    <span className="code-cell">{device.activation_codes?.code || '-'}</span>
                                    {device.activation_codes?.note && (
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                            {device.activation_codes.note}
                                        </div>
                                    )}
                                </td>
                                <td>{formatDateWIB(device.activated_at)}</td>
                                <td>{formatDateWIB(device.expires_at)}</td>
                                <td>
                                    <span style={{
                                        color: isExpired ? 'var(--danger)' : remainingDays <= 7 ? 'var(--warning)' : 'var(--success)',
                                        fontWeight: 600
                                    }}>
                                        {isExpired ? 'Expired' : `${remainingDays} hari`}
                                    </span>
                                </td>
                                <td>{formatDateWIB(device.last_check)}</td>
                                <td>
                                    <span className={`status-badge ${isExpired ? 'status-expired' : 'status-active'}`}>
                                        {isExpired ? 'Expired' : 'Active'}
                                    </span>
                                </td>
                                <td>
                                    <button
                                        className="btn btn-danger btn-sm"
                                        onClick={() => handleRevoke(device.device_id)}
                                    >
                                        Revoke
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                    {devices.length === 0 && (
                        <tr>
                            <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                                Belum ada device yang terdaftar.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
