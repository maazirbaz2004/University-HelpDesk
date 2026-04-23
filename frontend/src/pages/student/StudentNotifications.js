import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function StudentNotifications() {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await axios.get('/api/student/notifications', { withCredentials: true });
            setNotifications(res.data);
        } catch (err) {
            console.error('Error fetching notifications:', err);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id) => {
        try {
            await axios.patch(`/api/student/notifications/${id}/read`, {}, { withCredentials: true });
            setNotifications(notifications.map(n => n.notification_id === id ? { ...n, is_read: true } : n));
        } catch (err) {
            console.error('Error marking notification as read:', err);
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'Submitted':    return '#3b82f6';
            case 'Assigned':     return '#8b5cf6';
            case 'StatusUpdate': return '#10b981';
            case 'Feedback':     return '#f59e0b';
            case 'Overdue':      return '#ef4444';
            default:             return '#94a3b8';
        }
    };

    return (
        <div style={styles.page}>
            <div style={styles.navbar}>
                <span style={styles.logo} onClick={() => navigate('/student/dashboard')}>SmartResolve</span>
                <button style={styles.backBtn} onClick={() => navigate('/student/dashboard')}>Back to Dashboard</button>
            </div>

            <div style={styles.content}>
                <h2 style={styles.heading}>Notifications</h2>
                
                {loading ? (
                    <div style={styles.loading}>Loading notifications...</div>
                ) : notifications.length === 0 ? (
                    <div style={styles.empty}>No notifications yet.</div>
                ) : (
                    <div style={styles.list}>
                        {notifications.map(n => (
                            <div 
                                key={n.notification_id} 
                                style={{
                                    ...styles.item,
                                    borderLeft: `4px solid ${getTypeColor(n.notification_type)}`,
                                    opacity: n.is_read ? 0.7 : 1,
                                    backgroundColor: n.is_read ? '#1e293b' : '#2d3748'
                                }}
                                onClick={() => !n.is_read && markAsRead(n.notification_id)}
                            >
                                <div style={styles.itemHeader}>
                                    <span style={{...styles.type, color: getTypeColor(n.notification_type)}}>
                                        {n.notification_type}
                                    </span>
                                    <span style={styles.date}>{new Date(n.created_at).toLocaleString()}</span>
                                </div>
                                <p style={styles.message}>{n.message}</p>
                                {!n.is_read && <div style={styles.unreadDot} />}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

const styles = {
    page: { minHeight: '100vh', backgroundColor: '#0f172a', color: '#f1f5f9', fontFamily: "'Inter', sans-serif" },
    navbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', backgroundColor: '#1e293b', borderBottom: '1px solid #334155' },
    logo: { fontSize: '18px', fontWeight: '700', color: '#818cf8', cursor: 'pointer' },
    backBtn: { padding: '8px 16px', backgroundColor: 'transparent', color: '#94a3b8', border: '1px solid #334155', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' },
    content: { padding: '2rem', maxWidth: '800px', margin: '0 auto' },
    heading: { fontSize: '24px', fontWeight: '600', marginBottom: '2rem' },
    loading: { textAlign: 'center', padding: '3rem', color: '#94a3b8' },
    empty: { textAlign: 'center', padding: '3rem', color: '#94a3b8', backgroundColor: '#1e293b', borderRadius: '12px' },
    list: { display: 'flex', flexDirection: 'column', gap: '1rem' },
    item: { padding: '1.25rem', borderRadius: '12px', cursor: 'pointer', position: 'relative', transition: 'transform 0.2s' },
    itemHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' },
    type: { fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' },
    date: { fontSize: '12px', color: '#94a3b8' },
    message: { fontSize: '14px', margin: 0, lineHeight: '1.5' },
    unreadDot: { position: 'absolute', top: '10px', right: '10px', width: '8px', height: '8px', backgroundColor: '#6366f1', borderRadius: '50%' }
};
