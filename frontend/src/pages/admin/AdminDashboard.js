// src/pages/admin/AdminDashboard.js
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function AdminDashboard() {
    const navigate = useNavigate();

    const handleLogout = async () => {
        await axios.post('/api/logout', {}, { withCredentials: true });
        navigate('/admin/login');
    };

    return (
        <div style={styles.page}>
            <div style={styles.navbar}>
                <span style={styles.logo}>SmartResolve</span>
                <div style={styles.navRight}>
                    <span style={styles.role}>Admin</span>
                    <button style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
                </div>
            </div>
            <div style={styles.body}>
                <h2 style={styles.heading}>Admin Dashboard</h2>
                <p style={styles.sub}>Welcome! Your dashboard is under construction.</p>
                <div style={styles.grid}>
                    <div style={{ ...styles.card, cursor: 'pointer' }} onClick={() => navigate('/admin/complaints')}>
                        <h3 style={styles.cardTitle}>Manage Complaints</h3>
                        <p style={styles.cardSub}>View, assign &amp; prioritise</p>
                    </div>
                    <div style={{ ...styles.card, cursor: 'pointer' }} onClick={() => navigate('/admin/reports')}>
                        <h3 style={styles.cardTitle}>Generate Reports</h3>
                        <p style={styles.cardSub}>View department analytics</p>
                    </div>
                    <div style={styles.card}>
                        <h3 style={styles.cardTitle}>Manage Reports</h3>
                        <p style={styles.cardSub}>Coming soon</p>
                    </div>
                    <div style={styles.card}>
                        <h3 style={styles.cardTitle}>Manage Users</h3>
                        <p style={styles.cardSub}>Coming soon</p>
                    </div>
                    <div style={styles.card}>
                        <h3 style={styles.cardTitle}>Change Personal Info</h3>
                        <p style={styles.cardSub}>Coming soon</p>
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
    navRight: { display: 'flex', alignItems: 'center', gap: '1rem' },
    role: { fontSize: '13px', color: '#94a3b8', backgroundColor: '#0f172a', padding: '4px 10px', borderRadius: '20px', border: '1px solid #334155' },
    logoutBtn: { padding: '7px 16px', backgroundColor: 'transparent', color: '#f87171', border: '1px solid #f87171', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' },
    body: { padding: '2rem' },
    heading: { fontSize: '24px', fontWeight: '600', margin: '0 0 6px' },
    sub: { color: '#94a3b8', fontSize: '14px', margin: '0 0 2rem' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' },
    card: { backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '1.5rem' },
    cardTitle: { margin: '0 0 6px', fontSize: '16px', fontWeight: '600', color: '#f1f5f9' },
    cardSub: { margin: 0, fontSize: '13px', color: '#64748b' }
};