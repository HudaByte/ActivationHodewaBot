export default function DashboardLoading() {
    return (
        <div>
            <div className="page-header">
                <div style={{ width: '200px', height: '32px', background: 'var(--bg-card)', borderRadius: '8px', animation: 'pulse 1.5s infinite' }} />
            </div>
            <div className="stats-grid">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="stat-card" style={{ animation: 'pulse 1.5s infinite' }}>
                        <div style={{ width: '60px', height: '40px', background: 'var(--border)', borderRadius: '8px', margin: '0 auto 8px' }} />
                        <div style={{ width: '80px', height: '16px', background: 'var(--border)', borderRadius: '4px', margin: '0 auto' }} />
                    </div>
                ))}
            </div>
            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
            `}</style>
        </div>
    );
}
