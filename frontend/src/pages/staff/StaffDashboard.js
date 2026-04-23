import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function StaffDashboard() {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [analytics, setAnalytics] = useState({ TotalAssigned: 0, Resolved: 0, Pending: 0, AvgRating: 0 });

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [notifRes, analyticsRes] = await Promise.all([
                    axios.get('/api/staff/notifications', { withCredentials: true }),
                    axios.get('/api/staff/analytics', { withCredentials: true })
                ]);
                setNotifications(notifRes.data);
                setAnalytics(analyticsRes.data);
            } catch (err) {
                console.error('Error fetching dashboard data:', err);
            }
        };
        fetchDashboardData();
    }, []);

    const unreadCount = notifications.filter(n => !n.is_read).length;
    // ... handleMarkAsRead and handleLogout unchanged

    const handleMarkAsRead = async (id) => {
        try {
            await axios.patch(`/api/staff/notifications/${id}/read`, {}, { withCredentials: true });
            setNotifications(notifications.map(n => n.notification_id === id ? { ...n, is_read: true } : n));
        } catch (err) {
            console.error('Error marking as read:', err);
        }
    };

    const handleLogout = async () => {
        await axios.post('/api/logout', {}, { withCredentials: true });
        navigate('/login');
    };

    return (
        <div style={styles.page}>
            <div style={styles.navbar}>
                <span style={styles.logo}>SmartResolve Staff</span>
                <div style={styles.navRight}>
                    <div style={styles.notifContainer} onClick={() => setShowNotifications(!showNotifications)}>
                        <span style={styles.bellIcon}>🔔</span>
                        {unreadCount > 0 && <span style={styles.badge}>{unreadCount}</span>}
                    </div>
                    <span style={styles.role}>Staff</span>
                    <button style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
                </div>
            </div>

            {/* Notifications Popup */}
            {showNotifications && (
                <div style={styles.notifPopup}>
                    <div style={styles.notifHeader}>
                        <h3 style={{ margin: 0, fontSize: '16px' }}>Notifications</h3>
                        <button onClick={() => setShowNotifications(false)} style={styles.closeBtn}>×</button>
                    </div>
                    <div style={styles.notifList}>
                        {notifications.length === 0 ? (
                            <p style={styles.emptyNotif}>No notifications yet</p>
                        ) : (
                            notifications.map(n => (
                                <div 
                                    key={n.notification_id} 
                                    style={{ 
                                        ...styles.notifItem, 
                                        backgroundColor: n.is_read ? 'transparent' : '#0f172a',
                                        borderLeft: n.is_read ? 'none' : '4px solid #34d399'
                                    }}
                                    onClick={() => !n.is_read && handleMarkAsRead(n.notification_id)}
                                >
                                    <p style={styles.notifMsg}>{n.message}</p>
                                    <small style={styles.notifDate}>{new Date(n.created_at).toLocaleString()}</small>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            <div style={styles.body}>
                <h2 style={styles.heading}>Staff Dashboard</h2>
                <p style={styles.sub}>Welcome! Manage your assigned tasks and track your performance.</p>

                {/* Stats Overview */}
                <div style={styles.statsRow}>
                    <div style={{ ...styles.statCard, borderBottom: '4px solid #34d399' }}>
                        <span style={styles.statLabel}>Resolved</span>
                        <h3 style={styles.statValue}>{analytics.Resolved}</h3>
                    </div>
                    <div style={{ ...styles.statCard, borderBottom: '4px solid #fb923c' }}>
                        <span style={styles.statLabel}>Pending</span>
                        <h3 style={styles.statValue}>{analytics.Pending}</h3>
                    </div>
                    <div style={{ ...styles.statCard, borderBottom: '4px solid #60a5fa' }}>
                        <span style={styles.statLabel}>Total Tasks</span>
                        <h3 style={styles.statValue}>{analytics.TotalAssigned}</h3>
                    </div>
                    <div style={{ ...styles.statCard, borderBottom: '4px solid #facc15' }}>
                        <span style={styles.statLabel}>Avg Rating</span>
                        <h3 style={styles.statValue}>{Number(analytics.AvgRating).toFixed(1)} ⭐</h3>
                    </div>
                </div>

                <div style={styles.grid}>
                    <div style={{ ...styles.card, cursor: 'pointer' }} onClick={() => navigate('/staff/complaints')}>
                        <h3 style={styles.cardTitle}>Assigned Complaints</h3>
                        <p style={{ ...styles.cardSub, color: '#34d399' }}>View & Manage &rarr;</p>
                    </div>
                    <div style={{ ...styles.card, cursor: 'pointer' }} onClick={() => navigate('/staff/profile')}>
                        <h3 style={styles.cardTitle}>Manage Profile</h3>
                        <p style={{ ...styles.cardSub, color: '#34d399' }}>Update info & password &rarr;</p>
                    </div>
                    <div style={{ ...styles.card, cursor: 'pointer' }} onClick={() => navigate('/staff/feedback')}>
                        <h3 style={styles.cardTitle}>View Feedback</h3>
                        <p style={{ ...styles.cardSub, color: '#34d399' }}>Student ratings & comments &rarr;</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

const styles = {
    page: { minHeight: '100vh', backgroundColor: '#0f172a', color: '#f1f5f9' },
    navbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', backgroundColor: '#1e293b', borderBottom: '1px solid #334155' },
    logo: { fontSize: '18px', fontWeight: '700', color: '#34d399' },
    navRight: { display: 'flex', alignItems: 'center', gap: '1.5rem' },
    role: { fontSize: '13px', color: '#94a3b8', backgroundColor: '#0f172a', padding: '4px 10px', borderRadius: '20px', border: '1px solid #334155' },
    logoutBtn: { padding: '7px 16px', backgroundColor: 'transparent', color: '#f87171', border: '1px solid #f87171', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' },
    notifContainer: { position: 'relative', cursor: 'pointer', fontSize: '1.2rem' },
    badge: { position: 'absolute', top: '-5px', right: '-5px', backgroundColor: '#ef4444', color: 'white', fontSize: '10px', padding: '2px 5px', borderRadius: '50%', fontWeight: 'bold' },
    notifPopup: { position: 'absolute', top: '70px', right: '2rem', width: '300px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', zIndex: 1000, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' },
    notifHeader: { padding: '1rem', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    closeBtn: { background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer' },
    notifList: { maxHeight: '400px', overflowY: 'auto' },
    notifItem: { padding: '1rem', borderBottom: '1px solid #334155', cursor: 'pointer', transition: 'background 0.2s' },
    notifMsg: { margin: '0 0 0.5rem 0', fontSize: '13px', lineHeight: '1.4' },
    notifDate: { color: '#64748b', fontSize: '11px' },
    emptyNotif: { padding: '2rem', textAlign: 'center', color: '#64748b', fontSize: '14px' },
    body: { padding: '2rem' },
    heading: { fontSize: '24px', fontWeight: '600', margin: '0 0 6px' },
    sub: { color: '#94a3b8', fontSize: '14px', margin: '0 0 2rem' },
    statsRow: { display: 'flex', gap: '1rem', marginBottom: '2.5rem', flexWrap: 'wrap' },
    statCard: { flex: '1', minWidth: '150px', backgroundColor: '#1e293b', padding: '1.25rem', borderRadius: '12px', border: '1px solid #334155', textAlign: 'center' },
    statLabel: { fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' },
    statValue: { fontSize: '24px', fontWeight: 'bold', margin: '8px 0 0', color: '#f1f5f9' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' },
    card: { backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '1.5rem' },
    cardTitle: { margin: '0 0 6px', fontSize: '16px', fontWeight: '600', color: '#f1f5f9' },
    cardSub: { margin: 0, fontSize: '13px', color: '#64748b' }
};