import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function AdminReports() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('/api/admin/reports/departments', { withCredentials: true });
      setReports(res.data);
    } catch (err) {
      setError('Failed to load reports. ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await axios.post('/api/logout', {}, { withCredentials: true });
    navigate('/admin/login');
  };

  return (
    <div style={S.page}>
      {/* ── Navbar ── */}
      <nav style={S.navbar}>
        <span style={S.logo}>SmartResolve</span>
        <div style={S.navMid}>
          <button style={S.navLink} onClick={() => navigate('/admin/dashboard')}>Dashboard</button>
          <button style={S.navLink} onClick={() => navigate('/admin/complaints')}>Manage Complaints</button>
          <button style={{ ...S.navLink, ...S.navActive }}>Reports</button>
        </div>
        <div style={S.navRight}>
          <span style={S.roleTag}>Admin</span>
          <button style={S.logoutBtn} onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      {/* ── Main ── */}
      <div style={S.main}>
        <div style={S.headerRow}>
          <div>
            <h1 style={S.pageTitle}>Department Reports</h1>
            <p style={S.pageSub}>Performance and resolution statistics by department</p>
          </div>
        </div>

        {error && <div style={S.errorBanner}>{error}</div>}

        {loading ? (
          <div style={S.loadingWrap}>
            <div style={S.spinner} />
            <p style={S.loadingText}>Loading reports…</p>
          </div>
        ) : (
          <div style={S.tableContainer}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Department</th>
                  <th style={S.thCenter}>Total Complaints</th>
                  <th style={S.thCenter}>Pending</th>
                  <th style={S.thCenter}>In-Progress</th>
                  <th style={S.thCenter}>Resolved</th>
                  <th style={S.thCenter}>Rejected</th>
                  <th style={S.thCenter}>Reopened</th>
                  <th style={S.thCenter}>Resolution %</th>
                </tr>
              </thead>
              <tbody>
                {reports.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={S.emptyState}>No data available</td>
                  </tr>
                ) : (
                  reports.map((r, i) => (
                    <tr key={r.department_id || i} style={S.tr}>
                      <td style={S.tdName}>{r.department_name}</td>
                      <td style={S.tdCenter}><strong>{r.total_complaints}</strong></td>
                      <td style={{ ...S.tdCenter, color: '#60a5fa' }}>{r.pending_complaints}</td>
                      <td style={{ ...S.tdCenter, color: '#a78bfa' }}>{r.in_progress_complaints}</td>
                      <td style={{ ...S.tdCenter, color: '#34d399' }}>{r.resolved_complaints}</td>
                      <td style={{ ...S.tdCenter, color: '#f87171' }}>{r.rejected_complaints}</td>
                      <td style={{ ...S.tdCenter, color: '#fb923c' }}>{r.reopened_complaints}</td>
                      <td style={S.tdCenter}>
                        <div style={S.progressWrapper}>
                          <div style={S.progressBg}>
                            <div 
                              style={{ 
                                ...S.progressFill, 
                                width: `${r.resolution_percentage}%`,
                                backgroundColor: r.resolution_percentage >= 75 ? '#34d399' : r.resolution_percentage >= 50 ? '#fbbf24' : '#f87171'
                              }} 
                            />
                          </div>
                          <span style={S.progressText}>{r.resolution_percentage}%</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────────
const S = {
  page: { minHeight: '100vh', backgroundColor: '#0a0f1e', color: '#f1f5f9', fontFamily: "'Inter', sans-serif" },

  // Navbar
  navbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.9rem 2rem', backgroundColor: '#0d1526', borderBottom: '1px solid #1e2d47', position: 'sticky', top: 0, zIndex: 100 },
  logo: { fontSize: '18px', fontWeight: '800', color: '#f59e0b', letterSpacing: '0.5px' },
  navMid: { display: 'flex', gap: '0.5rem' },
  navLink: { background: 'none', border: 'none', color: '#94a3b8', fontSize: '14px', cursor: 'pointer', padding: '6px 14px', borderRadius: '8px', transition: 'all 0.2s' },
  navActive: { color: '#f59e0b', background: 'rgba(245,158,11,0.1)' },
  navRight: { display: 'flex', alignItems: 'center', gap: '1rem' },
  roleTag: { fontSize: '12px', color: '#94a3b8', background: '#1e2d47', padding: '4px 10px', borderRadius: '20px' },
  logoutBtn: { padding: '6px 14px', background: 'transparent', color: '#f87171', border: '1px solid #f87171', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' },

  // Main layout
  main: { padding: '2rem 2.5rem', maxWidth: '1200px', margin: '0 auto' },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' },
  pageTitle: { fontSize: '26px', fontWeight: '700', margin: 0, color: '#f1f5f9' },
  pageSub: { fontSize: '14px', color: '#64748b', margin: '4px 0 0' },

  tableContainer: { background: '#0d1526', border: '1px solid #1e2d47', borderRadius: '12px', overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  th: { padding: '16px', borderBottom: '1px solid #1e2d47', backgroundColor: '#111827', color: '#94a3b8', fontSize: '13px', fontWeight: '600' },
  thCenter: { padding: '16px', borderBottom: '1px solid #1e2d47', backgroundColor: '#111827', color: '#94a3b8', fontSize: '13px', fontWeight: '600', textAlign: 'center' },
  tr: { borderBottom: '1px solid #1e2d47', transition: 'background 0.2s' },
  tdName: { padding: '16px', fontSize: '14px', color: '#f1f5f9', fontWeight: '500' },
  tdCenter: { padding: '16px', fontSize: '14px', textAlign: 'center' },
  
  progressWrapper: { display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' },
  progressBg: { width: '80px', height: '6px', background: '#1e2d47', borderRadius: '3px', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: '3px', transition: 'width 0.5s ease' },
  progressText: { fontSize: '12px', color: '#cbd5e1', minWidth: '40px', textAlign: 'right' },

  // Misc
  errorBanner: { background: '#3b0f0f', color: '#f87171', padding: '1rem 1.25rem', borderRadius: '10px', fontSize: '14px', marginBottom: '1rem' },
  loadingWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem', gap: '1rem' },
  spinner: { width: '36px', height: '36px', border: '3px solid #1e2d47', borderTop: '3px solid #f59e0b', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  loadingText: { color: '#64748b', fontSize: '14px' },
  emptyState: { textAlign: 'center', padding: '3rem', color: '#64748b', fontSize: '14px' },
};
