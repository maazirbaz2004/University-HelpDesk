// src/pages/AdminLogin.js
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function AdminLogin() {
    const navigate = useNavigate();

    const [error, setError]     = useState('');
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        email:    '',
        password: ''
    });

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await axios.post('/api/admin/login', {
                email:    form.email,
                password: form.password
            }, { withCredentials: true });

            // redirect to admin dashboard on success
            if (res.data.role === 'Admin') {
                navigate('/admin/dashboard');
            }

        } catch (err) {
            setError(err.response?.data?.error || 'Something went wrong.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.page}>
            <div style={styles.card}>
                <h2 style={styles.title}>Admin Portal</h2>
                <p style={styles.subtitle}>Restricted access</p>

                {error && <p style={styles.error}>{error}</p>}

                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.field}>
                        <label style={styles.label}>Email</label>
                        <input
                            style={styles.input}
                            name="email"
                            type="email"
                            placeholder="admin@university.edu"
                            value={form.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div style={styles.field}>
                        <label style={styles.label}>Password</label>
                        <input
                            style={styles.input}
                            name="password"
                            type="password"
                            placeholder="Enter admin password"
                            value={form.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        style={{ ...styles.button, opacity: loading ? 0.7 : 1 }}
                        disabled={loading}
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
            </div>
        </div>
    );
}

const styles = {
    page: {
        minHeight:       '100vh',
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        backgroundColor: '#0f172a'    // dark bg to distinguish from student/staff login
    },
    card: {
        backgroundColor: '#1e293b',
        padding:         '2rem',
        borderRadius:    '12px',
        width:           '100%',
        maxWidth:        '380px',
        boxShadow:       '0 2px 20px rgba(0,0,0,0.4)'
    },
    title: {
        margin:     '0 0 4px',
        fontSize:   '22px',
        fontWeight: '500',
        color:      '#f1f5f9'
    },
    subtitle: {
        margin:    '0 0 1.5rem',
        color:     '#94a3b8',
        fontSize:  '14px'
    },
    form:  { display: 'flex', flexDirection: 'column', gap: '1rem' },
    field: { display: 'flex', flexDirection: 'column', gap: '4px' },
    label: { fontSize: '14px', fontWeight: '500', color: '#cbd5e1' },
    input: {
        padding:         '10px 12px',
        borderRadius:    '8px',
        border:          '1px solid #334155',
        fontSize:        '14px',
        outline:         'none',
        backgroundColor: '#0f172a',
        color:           '#f1f5f9'
    },
    button: {
        padding:         '11px',
        backgroundColor: '#6366f1',
        color:           '#fff',
        border:          'none',
        borderRadius:    '8px',
        fontSize:        '15px',
        fontWeight:      '500',
        cursor:          'pointer',
        marginTop:       '4px'
    },
    error: { color: '#f87171', fontSize: '14px', margin: '0 0 8px' }
};