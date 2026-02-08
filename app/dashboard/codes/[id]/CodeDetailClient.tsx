'use client';

import { useState } from 'react';
import { formatDateWIB } from '@/lib/utils';
import type { AppType } from '@/lib/supabase';

interface Profile {
    id: string;
    profile_name: string;
    created_at: string;
    updated_at: string;
    // Message settings
    greeting_message?: string;
    auto_reply_message?: string;
    broadcast_template?: string;
    // Stats
    total_contacts?: number;
    total_groups?: number;
    total_broadcasts?: number;
}

interface DeviceSession {
    id: string;
    device_id: string;
    activated_at: string;
    expires_at: string;
    last_check: string;
    device_info: { app?: string } | null;
}

interface DailyUsage {
    date: string;
    broadcasts_count: number;
    messages_sent: number;
    groups_joined: number;
}

interface LinkStats {
    total_scraped?: number;
    total_generated?: number;
    total_exported?: number;
    last_activity?: string;
}

interface CodeData {
    id: string;
    code: string;
    app_type: AppType;
    max_devices: number;
    duration_days: number | null;
    created_at: string;
    is_active: boolean;
    note: string | null;
    max_whatsapp_profiles?: number;
    device_sessions?: DeviceSession[];
    user_profiles?: Profile[];
    daily_usage?: DailyUsage[];
    link_stats?: LinkStats;
}

interface Props {
    code: CodeData;
}

export default function CodeDetailClient({ code }: Props) {
    const [expandedProfiles, setExpandedProfiles] = useState<string[]>([]);
    const [loadingProfile, setLoadingProfile] = useState<string | null>(null);
    const [profileDetails, setProfileDetails] = useState<Record<string, Profile>>({});

    const now = new Date();
    const activeDevices = code.device_sessions?.filter((d) =>
        new Date(d.expires_at) > now
    ).length || 0;

    const typeIcon = code.app_type === 'HudzSender'
        ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="10" rx="2" ry="2"></rect><circle cx="12" cy="5" r="2"></circle><path d="M12 7v4"></path></svg>
        : code.app_type === 'HudzLink'
            ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
            : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>;

    const typeColor = code.app_type === 'HudzSender' ? 'var(--primary)' : code.app_type === 'HudzLink' ? 'var(--success)' : 'var(--warning)';

    // Calculate total usage for last 7 days
    const totalBroadcasts = code.daily_usage?.reduce((sum, u) => sum + (u.broadcasts_count || 0), 0) || 0;
    const totalMessages = code.daily_usage?.reduce((sum, u) => sum + (u.messages_sent || 0), 0) || 0;

    const toggleProfile = async (profileId: string) => {
        if (expandedProfiles.includes(profileId)) {
            setExpandedProfiles(expandedProfiles.filter(id => id !== profileId));
        } else {
            // Load profile details if not already loaded
            if (!profileDetails[profileId]) {
                setLoadingProfile(profileId);
                try {
                    const res = await fetch(`/api/profiles/${profileId}`);
                    if (res.ok) {
                        const data = await res.json();
                        setProfileDetails(prev => ({ ...prev, [profileId]: data.profile }));
                    }
                } catch (error) {
                    console.error('Failed to load profile:', error);
                } finally {
                    setLoadingProfile(null);
                }
            }
            setExpandedProfiles([...expandedProfiles, profileId]);
        }
    };

    return (
        <div>
            {/* Code Info Card */}
            <div className="card" style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <span className="code-cell" style={{ fontSize: '20px' }}>{code.code}</span>
                            <span className={`status-badge ${code.is_active ? 'status-active' : 'status-inactive'}`}>
                                {code.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                            <span style={{ color: typeColor, fontWeight: 500 }}>{typeIcon} {code.app_type || 'HudzSender'}</span>
                            <span>•</span>
                            <span>Created {formatDateWIB(code.created_at)}</span>
                        </div>
                        {code.note && (
                            <div style={{ marginTop: '8px', color: 'var(--text-secondary)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                {code.note}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid" style={{ marginBottom: '24px' }}>
                <div className="stat-card">
                    <div className="stat-value">{activeDevices} / {code.max_devices}</div>
                    <div className="stat-label">Active Devices</div>
                </div>
                {code.app_type === 'HudzSender' && (
                    <>
                        <div className="stat-card">
                            <div className="stat-value">{code.user_profiles?.length || 0} / {code.max_whatsapp_profiles || 3}</div>
                            <div className="stat-label">WA Profiles</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value" style={{ color: 'var(--success)' }}>{totalBroadcasts}</div>
                            <div className="stat-label">Broadcasts (7d)</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value" style={{ color: 'var(--primary)' }}>{totalMessages}</div>
                            <div className="stat-label">Messages (7d)</div>
                        </div>
                    </>
                )}
                {code.app_type === 'HudzLink' && (
                    <>
                        <div className="stat-card">
                            <div className="stat-value" style={{ color: 'var(--success)' }}>{code.link_stats?.total_scraped || 0}</div>
                            <div className="stat-label">Links Scraped</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value" style={{ color: 'var(--primary)' }}>{code.link_stats?.total_generated || 0}</div>
                            <div className="stat-label">Links Generated</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value" style={{ color: 'var(--warning)' }}>{code.link_stats?.total_exported || 0}</div>
                            <div className="stat-label">Total Exported</div>
                        </div>
                    </>
                )}
            </div>

            {/* Limits Section */}
            <div className="card" style={{ marginBottom: '24px' }}>
                <h3 className="card-title">Configuration</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
                    <div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Duration</div>
                        <div style={{ fontWeight: 600 }}>{code.duration_days ? `${code.duration_days} days` : '∞ Lifetime'}</div>
                    </div>
                    <div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Max Devices</div>
                        <div style={{ fontWeight: 600 }}>{code.max_devices}</div>
                    </div>
                    {code.app_type === 'HudzSender' && (
                        <div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Max WA Profiles</div>
                            <div style={{ fontWeight: 600 }}>{code.max_whatsapp_profiles || 3}</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Registered Devices */}
            <div className="card" style={{ marginBottom: '24px' }}>
                <h3 className="card-title">Registered Devices ({code.device_sessions?.length || 0})</h3>
                {code.device_sessions && code.device_sessions.length > 0 ? (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Device ID</th>
                                    <th className="hidden-mobile">App</th>
                                    <th className="hidden-mobile">Registered</th>
                                    <th>Expires</th>
                                    <th className="hidden-mobile">Last Check</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {code.device_sessions.map((device) => {
                                    const isExpired = new Date(device.expires_at) <= now;
                                    return (
                                        <tr key={device.id}>
                                            <td>
                                                <code style={{ fontSize: '11px' }}>{device.device_id.substring(0, 8)}...</code>
                                            </td>
                                            <td className="hidden-mobile">{device.device_info?.app || code.app_type}</td>
                                            <td className="hidden-mobile">{formatDateWIB(device.activated_at)}</td>
                                            <td>{formatDateWIB(device.expires_at)}</td>
                                            <td className="hidden-mobile">{formatDateWIB(device.last_check)}</td>
                                            <td>
                                                <span className={`status-badge ${isExpired ? 'status-inactive' : 'status-active'}`}>
                                                    {isExpired ? 'Exp' : 'Act'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '24px' }}>
                        No devices registered yet.
                    </p>
                )}
            </div>

            {/* HudzSender: WhatsApp Profiles with Accordion */}
            {code.app_type === 'HudzSender' && (
                <div className="card">
                    <h3 className="card-title">WhatsApp Profiles ({code.user_profiles?.length || 0})</h3>
                    {code.user_profiles && code.user_profiles.length > 0 ? (
                        <div>
                            {code.user_profiles.map((profile, index) => (
                                <div key={profile.id} className="accordion">
                                    <button
                                        className="accordion-header"
                                        onClick={() => toggleProfile(profile.id)}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <span style={{
                                                width: '28px',
                                                height: '28px',
                                                background: 'var(--primary)',
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '12px',
                                                fontWeight: 600
                                            }}>
                                                {index + 1}
                                            </span>
                                            <span>{profile.profile_name || `Profile ${index + 1}`}</span>
                                        </div>
                                        <span className={`accordion-icon ${expandedProfiles.includes(profile.id) ? 'open' : ''}`}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="6 9 12 15 18 9"></polyline>
                                            </svg>
                                        </span>
                                    </button>

                                    {expandedProfiles.includes(profile.id) && (
                                        <div className="accordion-content">
                                            {loadingProfile === profile.id ? (
                                                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
                                                    Loading...
                                                </div>
                                            ) : (
                                                <div style={{ paddingTop: '16px' }}>
                                                    {/* Profile Info */}
                                                    <div style={{ marginBottom: '16px' }}>
                                                        <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>Created</div>
                                                        <div>{formatDateWIB(profile.created_at)}</div>
                                                    </div>

                                                    {/* Message Settings Preview */}
                                                    <div style={{ marginBottom: '16px' }}>
                                                        <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                            Message Settings
                                                        </div>
                                                        <div className="profile-stats">
                                                            <div className="profile-stat">
                                                                <div className="profile-stat-value">
                                                                    {profileDetails[profile.id]?.greeting_message ? '✓' : '—'}
                                                                </div>
                                                                <div className="profile-stat-label">Greeting</div>
                                                            </div>
                                                            <div className="profile-stat">
                                                                <div className="profile-stat-value">
                                                                    {profileDetails[profile.id]?.auto_reply_message ? '✓' : '—'}
                                                                </div>
                                                                <div className="profile-stat-label">Auto Reply</div>
                                                            </div>
                                                            <div className="profile-stat">
                                                                <div className="profile-stat-value">
                                                                    {profileDetails[profile.id]?.broadcast_template ? '✓' : '—'}
                                                                </div>
                                                                <div className="profile-stat-label">Broadcast</div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Usage Stats */}
                                                    <div>
                                                        <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                            Statistics
                                                        </div>
                                                        <div className="profile-stats">
                                                            <div className="profile-stat">
                                                                <div className="profile-stat-value" style={{ color: 'var(--success)' }}>
                                                                    {profileDetails[profile.id]?.total_contacts || 0}
                                                                </div>
                                                                <div className="profile-stat-label">Contacts</div>
                                                            </div>
                                                            <div className="profile-stat">
                                                                <div className="profile-stat-value" style={{ color: 'var(--warning)' }}>
                                                                    {profileDetails[profile.id]?.total_groups || 0}
                                                                </div>
                                                                <div className="profile-stat-label">Groups</div>
                                                            </div>
                                                            <div className="profile-stat">
                                                                <div className="profile-stat-value" style={{ color: 'var(--primary)' }}>
                                                                    {profileDetails[profile.id]?.total_broadcasts || 0}
                                                                </div>
                                                                <div className="profile-stat-label">Broadcasts</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '24px' }}>
                            No WhatsApp profiles created yet.
                        </p>
                    )}
                </div>
            )}

            {/* HudzLink: Link Statistics */}
            {code.app_type === 'HudzLink' && (
                <div className="card">
                    <h3 className="card-title">Link Activity Details</h3>
                    <div className="link-stats-grid">
                        <div className="link-stat-card">
                            <div className="link-stat-value">{code.link_stats?.total_scraped || 0}</div>
                            <div className="link-stat-label">Total Scraped</div>
                        </div>
                        <div className="link-stat-card">
                            <div className="link-stat-value" style={{ color: 'var(--primary)' }}>
                                {code.link_stats?.total_generated || 0}
                            </div>
                            <div className="link-stat-label">Total Generated</div>
                        </div>
                        <div className="link-stat-card">
                            <div className="link-stat-value" style={{ color: 'var(--warning)' }}>
                                {code.link_stats?.total_exported || 0}
                            </div>
                            <div className="link-stat-label">Total Exported</div>
                        </div>
                    </div>
                    {code.link_stats?.last_activity && (
                        <div style={{ marginTop: '16px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                            Last activity: {formatDateWIB(code.link_stats.last_activity)}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
