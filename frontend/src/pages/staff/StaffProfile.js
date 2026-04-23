import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function StaffProfile() {
    const navigate = useNavigate();
    const [profile, setProfile] = useState({ name: '', email: '', phone: '', password: '' });
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await axios.get('/api/staff/profile', { withCredentials: true });
                setProfile({
                    name: res.data.name || '',
                    email: res.data.email || '',
                    phone: res.data.phone || '',
                    password: '' // Don't populate password
                });
                setLoading(false);
            } catch (err) {
                console.error(err);
                setError('Failed to fetch profile details.');
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleChange = (e) => {
        setProfile({ ...profile, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setUpdating(true);
        setError(null);
        setSuccess(null);
        try {
            await axios.patch('/api/staff/profile', profile, { withCredentials: true });
            setSuccess('Profile updated successfully.');
            setProfile(prev => ({ ...prev, password: '' })); // clear password field
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || 'Failed to update profile.');
        } finally {
            setUpdating(false);
        }
    };

    if (loading) return <div style={styles.page}><p>Loading...</p></div>;

    return (
        <div style={styles.page}>
            <div style={styles.header}>
                <h2 style={styles.heading}>Manage Staff Profile</h2>
                <button style={styles.backBtn} onClick={() => navigate('/staff/dashboard')}>
                    Back to Dashboard
                </button>
            </div>

            <div style={styles.card}>
                {error && <p style={styles.error}>{error}</p>}
                {success && <p style={styles.success}>{success}</p>}

                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Email (Read-only)</label>
                        <input
                            type="email"
                            name="email"
                            value={profile.email}
                            readOnly
                            style={{ ...styles.input, backgroundColor: '#334155', cursor: 'not-allowed' }}
                        />
                    </div>
                    
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Full Name</label>
                        <input
                            type="text"
                            name="name"
                            value={profile.name}
                            onChange={handleChange}
                            required
                            style={styles.input}
                        />
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.label}>Phone Number</label>
                        <input
                            type="text"
                            name="phone"
                            value={profile.phone}
                            onChange={handleChange}
                            required
                            style={styles.input}
                        />
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.label}>New Password (Optional)</label>
                        <input
                            type="password"
                            name="password"
                            value={profile.password}
                            onChange={handleChange}
                            placeholder="Leave blank to keep current password"
                            style={styles.input}
                        />
                    </div>

                    <button type="submit" style={styles.submitBtn} disabled={updating}>
                        {updating ? 'Updating...' : 'Save Changes'}
                    </button>
                </form>
            </div>
        </div>
    );
}

const styles = {
    page: { minHeight: '100vh', backgroundColor: '#0f172a', color: '#f1f5f9', padding: '2rem' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' },
    heading: { fontSize: '24px', fontWeight: '600', margin: 0 },
    backBtn: { padding: '8px 16px', backgroundColor: '#334155', color: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer' },
    card: { backgroundColor: '#1e293b', padding: '2rem', borderRadius: '12px', border: '1px solid #334155', maxWidth: '500px', margin: '0 auto' },
    form: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
    formGroup: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
    label: { fontSize: '14px', color: '#94a3b8' },
    input: { padding: '10px', borderRadius: '8px', border: '1px solid #475569', backgroundColor: '#0f172a', color: '#f1f5f9' },
    submitBtn: { padding: '12px', backgroundColor: '#34d399', color: '#0f172a', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', marginTop: '1rem' },
    error: { color: '#f87171', backgroundColor: '#450a0a', padding: '10px', borderRadius: '8px', marginBottom: '1rem', fontSize: '14px' },
    success: { color: '#34d399', backgroundColor: '#064e3b', padding: '10px', borderRadius: '8px', marginBottom: '1rem', fontSize: '14px' }
};
