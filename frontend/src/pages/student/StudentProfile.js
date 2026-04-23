import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function StudentProfile() {
    const navigate = useNavigate();
    const [profile, setProfile] = useState({ name: '', phoneNumber: '', email: '', department_name: '' });
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await axios.get('/api/student/profile', { withCredentials: true });
            setProfile(res.data);
        } catch (err) {
            console.error('Error fetching profile:', err);
            setMessage({ text: 'Failed to load profile', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ text: '', type: '' });
        try {
            await axios.put('/api/student/profile', {
                name: profile.name,
                phoneNumber: profile.phone_number,
                password: password || null
            }, { withCredentials: true });
            setMessage({ text: 'Profile updated successfully!', type: 'success' });
            setPassword('');
        } catch (err) {
            setMessage({ text: err.response?.data?.error || 'Update failed', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div style={styles.loading}>Loading Profile...</div>;

    return (
        <div style={styles.page}>
            <div style={styles.navbar}>
                <span style={styles.logo} onClick={() => navigate('/student/dashboard')}>SmartResolve</span>
                <button style={styles.backBtn} onClick={() => navigate('/student/dashboard')}>Back to Dashboard</button>
            </div>

            <div style={styles.content}>
                <div style={styles.card}>
                    <h2 style={styles.heading}>Profile Settings</h2>
                    <p style={styles.sub}>Update your personal information and account security.</p>

                    {message.text && (
                        <div style={{
                            ...styles.alert,
                            backgroundColor: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: message.type === 'success' ? '#10b981' : '#f87171',
                            borderColor: message.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'
                        }}>
                            {message.text}
                        </div>
                    )}

                    <form onSubmit={handleUpdate} style={styles.form}>
                        <div style={styles.section}>
                            <h3 style={styles.sectionTitle}>Account Details</h3>
                            <div style={styles.field}>
                                <label style={styles.label}>Full Name</label>
                                <input 
                                    style={styles.input}
                                    type="text"
                                    value={profile.name}
                                    onChange={(e) => setProfile({...profile, name: e.target.value})}
                                    required
                                />
                            </div>
                            <div style={styles.field}>
                                <label style={styles.label}>Email Address (Cannot change)</label>
                                <input 
                                    style={{...styles.input, backgroundColor: '#0f172a', cursor: 'not-allowed'}}
                                    type="email"
                                    value={profile.email}
                                    disabled
                                />
                            </div>
                            <div style={styles.field}>
                                <label style={styles.label}>Phone Number</label>
                                <input 
                                    style={styles.input}
                                    type="text"
                                    value={profile.phone_number || ''}
                                    onChange={(e) => setProfile({...profile, phone_number: e.target.value})}
                                    required
                                />
                            </div>
                            <div style={styles.field}>
                                <label style={styles.label}>Department</label>
                                <input 
                                    style={{...styles.input, backgroundColor: '#0f172a', cursor: 'not-allowed'}}
                                    type="text"
                                    value={profile.department_name}
                                    disabled
                                />
                            </div>
                        </div>

                        <div style={styles.divider} />

                        <div style={styles.section}>
                            <h3 style={styles.sectionTitle}>Security</h3>
                            <div style={styles.field}>
                                <label style={styles.label}>New Password (Leave blank to keep current)</label>
                                <input 
                                    style={styles.input}
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button style={styles.saveBtn} type="submit" disabled={saving}>
                            {saving ? 'Saving Changes...' : 'Save Profile'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

const styles = {
    page: { minHeight: '100vh', backgroundColor: '#0f172a', color: '#f1f5f9', fontFamily: "'Inter', sans-serif" },
    navbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', backgroundColor: '#1e293b', borderBottom: '1px solid #334155' },
    logo: { fontSize: '18px', fontWeight: '700', color: '#818cf8', cursor: 'pointer' },
    backBtn: { padding: '8px 16px', backgroundColor: 'transparent', color: '#94a3b8', border: '1px solid #334155', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' },
    content: { padding: '3rem 1rem', maxWidth: '600px', margin: '0 auto' },
    card: { backgroundColor: '#1e293b', padding: '2.5rem', borderRadius: '20px', border: '1px solid #334155', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' },
    heading: { fontSize: '24px', fontWeight: '700', margin: '0 0 8px' },
    sub: { color: '#94a3b8', fontSize: '14px', marginBottom: '2rem' },
    form: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
    section: { display: 'flex', flexDirection: 'column', gap: '1.25rem' },
    sectionTitle: { fontSize: '16px', fontWeight: '600', color: '#818cf8', marginBottom: '0.5rem' },
    field: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
    label: { fontSize: '13px', fontWeight: '500', color: '#94a3b8' },
    input: { padding: '12px 16px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', color: 'white', fontSize: '15px', outline: 'none', transition: 'border-color 0.2s' },
    divider: { height: '1px', backgroundColor: '#334155', margin: '1rem 0' },
    saveBtn: { marginTop: '1rem', padding: '14px', backgroundColor: '#6366f1', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', transition: 'background 0.2s' },
    alert: { padding: '1rem', borderRadius: '10px', border: '1px solid', marginBottom: '1.5rem', fontSize: '14px', textAlign: 'center' },
    loading: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#0f172a', color: '#94a3b8' }
};
