import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await axios.get('/api/admin/notifications', { withCredentials: true });
            setNotifications(res.data);
        } catch (err) {
            console.error('Error fetching notifications:', err);
        }
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    const handleMarkAsRead = async (id) => {
        try {
            await axios.patch(`/api/admin/notifications/${id}/read`, {}, { withCredentials: true });
            setNotifications(notifications.map(n => n.notification_id === id ? { ...n, is_read: true } : n));
        } catch (err) {
            console.error('Error marking as read:', err);
        }
    };

    const handleLogout = async () => {
        await axios.post('/api/logout', {}, { withCredentials: true });
        navigate('/admin/login');
    };

    return (
        <div style={styles.page}>
            <div style={styles.navbar}>
                <span style={styles.logo}>SmartResolve Admin</span>
                <div style={styles.navRight}>
                    <div style={styles.notifContainer} onClick={() => setShowNotifications(!showNotifications)}>
                        <span style={styles.bellIcon}>🔔</span>
                        {unreadCount > 0 && <span style={styles.badge}>{unreadCount}</span>}
                    </div>
                    <span style={styles.role}>Admin</span>
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
                                        borderLeft: n.is_read ? 'none' : '4px solid #f59e0b'
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
                <h2 style={styles.heading}>Admin Dashboard</h2>
                <p style={styles.sub}>Welcome! Manage your university helpdesk operations.</p>
                <div style={styles.grid}>
                    <div style={{ ...styles.card, cursor: 'pointer' }} onClick={() => navigate('/admin/complaints')}>
                        <h3 style={styles.cardTitle}>Manage Complaints</h3>
                        <p style={styles.cardSub}>View, assign &amp; prioritise</p>
                    </div>
                    <div style={{ ...styles.card, cursor: 'pointer' }} onClick={() => navigate('/admin/reports')}>
                        <h3 style={styles.cardTitle}>Generate Reports</h3>
                        <p style={styles.cardSub}>View department analytics</p>
                    </div>
                    <div style={{ ...styles.card, cursor: 'pointer' }} onClick={() => navigate('/admin/departments')}>
                        <h3 style={styles.cardTitle}>Manage Departments</h3>
                        <p style={styles.cardSub}>View and edit department names</p>
                    </div>
                    <div style={{ ...styles.card, cursor: 'pointer' }} onClick={() => navigate('/admin/users')}>
                        <h3 style={styles.cardTitle}>Manage Users</h3>
                        <p style={styles.cardSub}>Add, view and deactivate users</p>
                    </div>
                    <div style={{ ...styles.card, cursor: 'pointer' }} onClick={() => navigate('/admin/profile')}>
                        <h3 style={styles.cardTitle}>Change Personal Info</h3>
                        <p style={styles.cardSub}>Update your profile details</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

const styles = {
    page: { minHeight: '100vh', backgroundColor: '#0f172a', color: '#f1f5f9' },
    navbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', backgroundColor: '#1e293b', borderBottom: '1px solid #334155' },
    logo: { fontSize: '18px', fontWeight: '700', color: '#f59e0b' },
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
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' },
    card: { backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '1.5rem' },
    cardTitle: { margin: '0 0 6px', fontSize: '16px', fontWeight: '600', color: '#f1f5f9' },
    cardSub: { margin: 0, fontSize: '13px', color: '#64748b' }
};