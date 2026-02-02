export default function CodesLoading() {
    return (
        <div>
            <div className="page-header">
                <div style={{ width: '220px', height: '32px', background: 'var(--bg-card)', borderRadius: '8px', animation: 'pulse 1.5s infinite' }} />
            </div>
            <div className="card" style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    {[1, 2, 3].map((i) => (
                        <div key={i} style={{ width: '120px', height: '40px', background: 'var(--border)', borderRadius: '8px', animation: 'pulse 1.5s infinite' }} />
                    ))}
                </div>
            </div>
            <div className="card">
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                {['Code', 'Max', 'Durasi', 'Active', 'Status', 'Created', 'Actions'].map((h) => (
                                    <th key={h}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {[1, 2, 3, 4, 5].map((i) => (
                                <tr key={i}>
                                    {[1, 2, 3, 4, 5, 6, 7].map((j) => (
                                        <td key={j}>
                                            <div style={{ width: j === 1 ? '100px' : '60px', height: '20px', background: 'var(--border)', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
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
