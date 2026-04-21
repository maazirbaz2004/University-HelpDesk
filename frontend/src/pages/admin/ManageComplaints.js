import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const PRIORITY_COLORS = {
  High: { bg: '#fee2e2', text: '#dc2626', border: '#fca5a5' },
  Medium: { bg: '#fef3c7', text: '#d97706', border: '#fcd34d' },
  Low: { bg: '#d1fae5', text: '#059669', border: '#6ee7b7' },
};
const STATUS_COLORS = {
  Pending: { bg: '#1e3a5f', text: '#60a5fa' },
  'In-Progress': { bg: '#1e293b', text: '#a78bfa' },
  Resolved: { bg: '#064e3b', text: '#34d399' },
  Rejected: { bg: '#3b0f0f', text: '#f87171' },
  Reopened: { bg: '#1e293b', text: '#fb923c' },
};

export default function ManageComplaints() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');        // 'all' | 'unassigned' | 'assigned'
  const [complaints, setComplaints] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters for Assigned tab
  const [filterDept, setFilterDept] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  // History modal
  const [historyModal, setHistoryModal] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Priority update feedback
  const [updatingId, setUpdatingId] = useState(null);
  const [updateMsg, setUpdateMsg] = useState({});

  // Fetch complaints
  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (activeTab === 'unassigned') params.filter = 'unassigned';
      else if (activeTab === 'assigned') {
        params.filter = 'assigned';
        if (filterDept) params.departmentId = filterDept;
        if (filterPriority) params.priority = filterPriority;
      }
      const res = await axios.get('/api/admin/complaints', { params, withCredentials: true });
      setComplaints(res.data);
    } catch (err) {
      setError('Failed to load complaints. ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  }, [activeTab, filterDept, filterPriority]);

  // Fetch departments for filter dropdown
  useEffect(() => {
    axios.get('/api/departments', { withCredentials: true })
      .then(r => setDepartments(r.data))
      .catch(() => {});
  }, []);

  useEffect(() => { fetchComplaints(); }, [fetchComplaints]);

  // Update complain priority
  const handlePriorityChange = async (complaintId, newPriority) => {
    setUpdatingId(complaintId);
    try {
      await axios.patch(`/api/admin/complaints/${complaintId}/priority`,
        { priority: newPriority }, { withCredentials: true });
      setComplaints(prev => prev.map(c =>
        c.complaint_id === complaintId ? { ...c, priority: newPriority } : c));
      setUpdateMsg(prev => ({ ...prev, [complaintId]: 'ok' }));
      setTimeout(() => setUpdateMsg(prev => { const n = { ...prev }; delete n[complaintId]; return n; }), 2000);
    } catch {
      setUpdateMsg(prev => ({ ...prev, [complaintId]: 'err' }));
      setTimeout(() => setUpdateMsg(prev => { const n = { ...prev }; delete n[complaintId]; return n; }), 2000);
    } finally {
      setUpdatingId(null);
    }
  };

  // Update complain status
  const handleStatusChange = async (complaintId, newStatus) => {
    setUpdatingId(complaintId);
    try {
      await axios.patch(`/api/admin/complaints/${complaintId}/status`,
        { status: newStatus }, { withCredentials: true });
      setComplaints(prev => prev.map(c =>
        c.complaint_id === complaintId ? { ...c, status: newStatus } : c));
      setUpdateMsg(prev => ({ ...prev, [complaintId]: 'ok' }));
      setTimeout(() => setUpdateMsg(prev => { const n = { ...prev }; delete n[complaintId]; return n; }), 2000);
    } catch {
      setUpdateMsg(prev => ({ ...prev, [complaintId]: 'err' }));
      setTimeout(() => setUpdateMsg(prev => { const n = { ...prev }; delete n[complaintId]; return n; }), 2000);
    } finally {
      setUpdatingId(null);
    }
  };

  // Open complaint history 
  const openHistory = async (complaint) => {
    setHistoryModal({ complaintId: complaint.complaint_id, title: complaint.title, history: [] });
    setHistoryLoading(true);
    try {
      const res = await axios.get(`/api/admin/complaints/${complaint.complaint_id}/history`,
        { withCredentials: true });
      setHistoryModal(prev => prev ? { ...prev, history: res.data } : null);
    } catch {
      setHistoryModal(prev => prev ? { ...prev, error: 'Failed to load history.' } : null);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleLogout = async () => {
    await axios.post('/api/logout', {}, { withCredentials: true });
    navigate('/admin/login');
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={S.page}>
      {/* ── Navbar ── */}
      <nav style={S.navbar}>
        <span style={S.logo}>SmartResolve</span>
        <div style={S.navMid}>
          <button style={S.navLink} onClick={() => navigate('/admin/dashboard')}>Dashboard</button>
          <button style={{ ...S.navLink, ...S.navActive }}>Manage Complaints</button>
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
            <h1 style={S.pageTitle}>Manage Complaints</h1>
            <p style={S.pageSub}>Review, prioritise, and track all student complaints</p>
          </div>
          <div style={S.stats}>
            <span style={S.statBadge}>{complaints.length} shown</span>
          </div>
        </div>

        {/* ── Tab buttons ── */}
        <div style={S.tabRow}>
          {['all', 'unassigned', 'assigned'].map(tab => (
            <button
              key={tab}
              style={activeTab === tab ? { ...S.tab, ...S.tabActive } : S.tab}
              onClick={() => { setActiveTab(tab); setFilterDept(''); setFilterPriority(''); }}
            >
              {tab === 'all' ? '📋 All' : tab === 'unassigned' ? '🔴 Unassigned' : '✅ Assigned'}
            </button>
          ))}
        </div>

        {/* ── Assigned sub-filters ── */}
        {activeTab === 'assigned' && (
          <div style={S.filterRow}>
            <label style={S.filterLabel}>Department</label>
            <select style={S.select} value={filterDept} onChange={e => setFilterDept(e.target.value)}>
              <option value="">All Departments</option>
              {departments.map(d => (
                <option key={d.departmentId} value={d.departmentId}>{d.departmentName}</option>
              ))}
            </select>

            <label style={S.filterLabel}>Priority</label>
            <select style={S.select} value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
              <option value="">All Priorities</option>
              <option value="High">🔴 High</option>
              <option value="Medium">🟡 Medium</option>
              <option value="Low">🟢 Low</option>
            </select>

            <button style={S.clearBtn} onClick={() => { setFilterDept(''); setFilterPriority(''); }}>
              Clear Filters
            </button>
          </div>
        )}

        {/* ── Error ── */}
        {error && <div style={S.errorBanner}>{error}</div>}

        {/* ── Loading ── */}
        {loading ? (
          <div style={S.loadingWrap}>
            <div style={S.spinner} />
            <p style={S.loadingText}>Loading complaints…</p>
          </div>
        ) : complaints.length === 0 ? (
          <div style={S.emptyState}>
            <span style={S.emptyIcon}>📭</span>
            <p style={S.emptyText}>No complaints found for this filter.</p>
          </div>
        ) : (
          <div style={S.cardGrid}>
            {complaints.map(c => (
              <ComplaintCard
                key={c.complaint_id}
                c={c}
                updatingId={updatingId}
                updateMsg={updateMsg}
                onPriorityChange={handlePriorityChange}
                onStatusChange={handleStatusChange}
                onHistory={openHistory}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── History Modal ── */}
      {historyModal && (
        <div style={S.modalOverlay} onClick={() => setHistoryModal(null)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <div style={S.modalHeader}>
              <div>
                <h2 style={S.modalTitle}>Complaint History</h2>
                <p style={S.modalSub}>{historyModal.title}</p>
              </div>
              <button style={S.modalClose} onClick={() => setHistoryModal(null)}>✕</button>
            </div>

            <div style={S.modalBody}>
              {historyLoading ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <div style={S.spinner} />
                  <p style={S.loadingText}>Loading history…</p>
                </div>
              ) : historyModal.error ? (
                <p style={{ color: '#f87171' }}>{historyModal.error}</p>
              ) : historyModal.history.length === 0 ? (
                <p style={S.emptyText}>No history entries yet.</p>
              ) : (
                <div style={S.timeline}>
                  {historyModal.history.map((h, i) => (
                    <div key={h.history_id ?? i} style={S.timelineItem}>
                      <div style={S.timelineDot} />
                      <div style={S.timelineContent}>
                        <div style={S.timelineTop}>
                          <span style={S.actionBadge}>{h.action_type}</span>
                          <span style={S.timelineTime}>
                            {h.change_time ? new Date(h.change_time).toLocaleString() : '—'}
                          </span>
                        </div>
                        {(h.old_status || h.new_status) && (
                          <p style={S.statusChange}>
                            {h.old_status && <span style={S.oldStatus}>{h.old_status}</span>}
                            {h.old_status && h.new_status && <span style={{ color: '#94a3b8' }}> → </span>}
                            {h.new_status && <span style={S.newStatus}>{h.new_status}</span>}
                          </p>
                        )}
                        {h.remarks && <p style={S.remarks}>{h.remarks}</p>}
                        <p style={S.changedBy}>
                          By: {h.changed_by_name || 'Unknown'} ({h.changed_by_role || '—'})
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Complaint Card ──────────────────────────────────────────────────────────────
function ComplaintCard({ c, updatingId, updateMsg, onPriorityChange, onStatusChange, onHistory }) {
  const priColor = PRIORITY_COLORS[c.priority] || PRIORITY_COLORS.Medium;
  const stColor  = STATUS_COLORS[c.status]     || STATUS_COLORS.Pending;
  const msg      = updateMsg[c.complaint_id];

  return (
    <div style={S.card}>
      {/* Top row */}
      <div style={S.cardTop}>
        <span style={S.cid}>#{c.complaint_id}</span>
        
        <div style={S.statusControl}>
           <select
              style={{ ...S.statusSelect, background: stColor.bg, color: stColor.text }}
              value={c.status}
              disabled={updatingId === c.complaint_id}
              onChange={e => onStatusChange(c.complaint_id, e.target.value)}
            >
              <option value="Pending">Pending</option>
              <option value="In-Progress">In-Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Rejected">Rejected</option>
              <option value="Reopened">Reopened</option>
            </select>
        </div>
      </div>

      {/* Title & category */}
      <h3 style={S.cardTitle}>{c.title || 'Untitled'}</h3>
      <p style={S.cardMeta}>
        <span style={S.metaTag}>📂 {c.category_name || 'Uncategorised'}</span>
        <span style={S.metaTag}>🏢 {c.department_name || '—'}</span>
      </p>

      {/* Description snippet */}
      {c.description && (
        <p style={S.description}>
          {c.description.length > 120 ? c.description.slice(0, 120) + '…' : c.description}
        </p>
      )}

      {/* Student & date */}
      <p style={S.smallMeta}>
        <span>👤 {c.student_name || 'Student'}</span>
        <span>📅 {c.submission_date ? new Date(c.submission_date).toLocaleDateString() : '—'}</span>
      </p>

      {/* Assigned to */}
      {c.assigned_to_staff_name && (
        <p style={S.assignedTo}>🔧 Assigned to: <strong>{c.assigned_to_staff_name}</strong></p>
      )}

      {/* ── Priority changer ── */}
      <div style={S.priorityRow}>
        <span style={{ ...S.priorityBadge, background: priColor.bg, color: priColor.text, border: `1px solid ${priColor.border}` }}>
          Priority: {c.priority}
        </span>
        <div style={S.priorityControl}>
          <select
            style={S.prioritySelect}
            value={c.priority}
            disabled={updatingId === c.complaint_id}
            onChange={e => onPriorityChange(c.complaint_id, e.target.value)}
          >
            <option value="High">🔴 High</option>
            <option value="Medium">🟡 Medium</option>
            <option value="Low">🟢 Low</option>
          </select>
          {msg === 'ok'  && <span style={S.updateOk}>✓ Updated</span>}
          {msg === 'err' && <span style={S.updateErr}>✗ Failed</span>}
        </div>
      </div>

      {/* History button */}
      <button style={S.historyBtn} onClick={() => onHistory(c)}>
        🕐 View History
      </button>
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
  main: { padding: '2rem 2.5rem', maxWidth: '1400px', margin: '0 auto' },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' },
  pageTitle: { fontSize: '26px', fontWeight: '700', margin: 0, color: '#f1f5f9' },
  pageSub: { fontSize: '14px', color: '#64748b', margin: '4px 0 0' },
  stats: { display: 'flex', gap: '0.5rem', alignItems: 'center' },
  statBadge: { background: '#1e2d47', color: '#93c5fd', fontSize: '13px', padding: '4px 12px', borderRadius: '20px', border: '1px solid #1e3a5f' },

  // Tabs
  tabRow: { display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' },
  tab: { padding: '9px 22px', borderRadius: '10px', border: '1px solid #1e2d47', background: '#0d1526', color: '#94a3b8', fontSize: '14px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s' },
  tabActive: { background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#0a0f1e', border: '1px solid transparent', boxShadow: '0 0 16px rgba(245,158,11,0.3)' },

  // Filters
  filterRow: { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', background: '#0d1526', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid #1e2d47' },
  filterLabel: { fontSize: '13px', color: '#94a3b8', fontWeight: '500' },
  select: { background: '#111827', color: '#f1f5f9', border: '1px solid #1e2d47', borderRadius: '8px', padding: '7px 12px', fontSize: '13px', cursor: 'pointer', outline: 'none' },
  clearBtn: { background: 'transparent', color: '#f87171', border: '1px solid #f87171', borderRadius: '8px', padding: '7px 14px', fontSize: '13px', cursor: 'pointer' },

  // Cards
  cardGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' },
  card: { background: 'linear-gradient(145deg, #0d1526, #111827)', border: '1px solid #1e2d47', borderRadius: '16px', padding: '1.5rem', transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'default' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' },
  cid: { fontSize: '12px', color: '#475569', fontWeight: '600' },
  statusControl: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  statusSelect: { border: 'none', borderRadius: '20px', padding: '3px 10px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', outline: 'none', appearance: 'none', textAlign: 'center' },
  cardTitle: { fontSize: '15px', fontWeight: '700', color: '#f1f5f9', margin: '0 0 0.5rem' },
  cardMeta: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap', margin: '0 0 0.6rem' },
  metaTag: { fontSize: '12px', color: '#64748b', background: '#111827', padding: '3px 8px', borderRadius: '6px', border: '1px solid #1e2d47' },
  description: { fontSize: '13px', color: '#94a3b8', lineHeight: '1.5', margin: '0 0 0.75rem' },
  smallMeta: { display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#475569', margin: '0 0 0.5rem' },
  assignedTo: { fontSize: '12px', color: '#7dd3fc', margin: '0 0 0.75rem' },

  // Priority
  priorityRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0.75rem 0 0.75rem', gap: '0.5rem', flexWrap: 'wrap' },
  priorityBadge: { fontSize: '12px', fontWeight: '600', padding: '4px 10px', borderRadius: '8px' },
  priorityControl: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  prioritySelect: { background: '#111827', color: '#f1f5f9', border: '1px solid #334155', borderRadius: '8px', padding: '5px 10px', fontSize: '12px', cursor: 'pointer', outline: 'none' },
  updateOk: { fontSize: '12px', color: '#34d399', fontWeight: '600' },
  updateErr: { fontSize: '12px', color: '#f87171', fontWeight: '600' },

  // History button
  historyBtn: { width: '100%', marginTop: '0.5rem', padding: '8px', background: 'rgba(99,102,241,0.1)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '10px', fontSize: '13px', cursor: 'pointer', fontWeight: '500', transition: 'all 0.2s' },

  // Misc
  errorBanner: { background: '#3b0f0f', color: '#f87171', padding: '1rem 1.25rem', borderRadius: '10px', fontSize: '14px', marginBottom: '1rem' },
  loadingWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem', gap: '1rem' },
  spinner: { width: '36px', height: '36px', border: '3px solid #1e2d47', borderTop: '3px solid #f59e0b', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  loadingText: { color: '#64748b', fontSize: '14px' },
  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem', gap: '0.75rem' },
  emptyIcon: { fontSize: '48px' },
  emptyText: { color: '#64748b', fontSize: '15px' },

  // Modal
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' },
  modal: { background: '#0d1526', border: '1px solid #1e2d47', borderRadius: '20px', width: '100%', maxWidth: '600px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '1.5rem', borderBottom: '1px solid #1e2d47' },
  modalTitle: { fontSize: '18px', fontWeight: '700', margin: 0, color: '#f1f5f9' },
  modalSub: { fontSize: '13px', color: '#64748b', margin: '4px 0 0' },
  modalClose: { background: 'none', border: 'none', color: '#94a3b8', fontSize: '18px', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px' },
  modalBody: { padding: '1.5rem', overflowY: 'auto', flex: 1 },

  // Timeline
  timeline: { display: 'flex', flexDirection: 'column', gap: '0' },
  timelineItem: { display: 'flex', gap: '1rem', paddingBottom: '1.5rem', position: 'relative' },
  timelineDot: { width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b', marginTop: '5px', flexShrink: 0, boxShadow: '0 0 8px rgba(245,158,11,0.5)' },
  timelineContent: { flex: 1, background: '#111827', borderRadius: '10px', padding: '0.75rem 1rem', border: '1px solid #1e2d47' },
  timelineTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' },
  actionBadge: { fontSize: '11px', fontWeight: '700', color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '2px 8px', borderRadius: '6px' },
  timelineTime: { fontSize: '11px', color: '#475569' },
  statusChange: { fontSize: '13px', margin: '0.25rem 0' },
  oldStatus: { color: '#f87171', fontWeight: '600' },
  newStatus: { color: '#34d399', fontWeight: '600' },
  remarks: { fontSize: '13px', color: '#94a3b8', margin: '0.25rem 0 0' },
  changedBy: { fontSize: '12px', color: '#475569', marginTop: '0.4rem' },
};
