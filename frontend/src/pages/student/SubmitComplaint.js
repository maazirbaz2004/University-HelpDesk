import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function SubmitComplaint() {
    const navigate = useNavigate();
    const [departments, setDepartments] = useState([]);
    const [categories, setCategories] = useState([]);
    const [formData, setFormData] = useState({
        departmentId: '',
        categoryId: '',
        title: '',
        description: '',
        priority: 'Medium'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchDepartments();
    }, []);

    const fetchDepartments = async () => {
        try {
            const res = await axios.get('/api/departments');
            setDepartments(res.data);
        } catch (err) {
            console.error('Error fetching departments:', err);
        }
    };

    const fetchCategories = async (deptId) => {
        try {
            const res = await axios.get(`/api/categories?departmentId=${deptId}`);
            setCategories(res.data);
        } catch (err) {
            console.error('Error fetching categories:', err);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (name === 'departmentId') {
            setFormData(prev => ({ ...prev, categoryId: '' }));
            if (value) fetchCategories(value);
            else setCategories([]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const res = await axios.post('/api/student/complaints', formData, { withCredentials: true });
            setSuccess('Complaint submitted successfully!');
            setTimeout(() => navigate('/student/dashboard'), 2000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to submit complaint');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.page}>
            <div style={styles.navbar}>
                <span style={styles.logo} onClick={() => navigate('/student/dashboard')}>SmartResolve</span>
                <button style={styles.backBtn} onClick={() => navigate('/student/dashboard')}>Back to Dashboard</button>
            </div>

            <div style={styles.container}>
                <div style={styles.card}>
                    <h2 style={styles.heading}>Submit a New Complaint</h2>
                    <p style={styles.sub}>Please provide details about the issue you are facing.</p>

                    {error && <div style={styles.error}>{error}</div>}
                    {success && <div style={styles.success}>{success}</div>}

                    <form onSubmit={handleSubmit} style={styles.form}>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Department</label>
                            <select 
                                name="departmentId" 
                                value={formData.departmentId} 
                                onChange={handleChange} 
                                style={styles.input}
                                required
                            >
                                <option value="">Select Department</option>
                                {departments.map(dept => (
                                    <option key={dept.departmentId} value={dept.departmentId}>
                                        {dept.departmentName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>Category (Optional)</label>
                            <select 
                                name="categoryId" 
                                value={formData.categoryId} 
                                onChange={handleChange} 
                                style={styles.input}
                                disabled={!formData.departmentId}
                            >
                                <option value="">Select Category</option>
                                {categories.map(cat => (
                                    <option key={cat.category_id} value={cat.category_id}>
                                        {cat.category_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>Priority</label>
                            <select 
                                name="priority" 
                                value={formData.priority} 
                                onChange={handleChange} 
                                style={styles.input}
                            >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                            </select>
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>Title</label>
                            <input 
                                type="text" 
                                name="title" 
                                placeholder="Short summary of the issue"
                                value={formData.title} 
                                onChange={handleChange} 
                                style={styles.input}
                                required
                            />
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>Description</label>
                            <textarea 
                                name="description" 
                                rows="5"
                                placeholder="Detailed description..."
                                value={formData.description} 
                                onChange={handleChange} 
                                style={{...styles.input, resize: 'vertical'}}
                                required
                            />
                        </div>

                        <button 
                            type="submit" 
                            style={loading ? {...styles.submitBtn, opacity: 0.7} : styles.submitBtn}
                            disabled={loading}
                        >
                            {loading ? 'Submitting...' : 'Submit Complaint'}
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
    container: { display: 'flex', justifyContent: 'center', padding: '3rem 1rem' },
    card: { width: '100%', maxWidth: '600px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '2.5rem', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)' },
    heading: { fontSize: '24px', fontWeight: '600', margin: '0 0 8px', color: '#f1f5f9' },
    sub: { color: '#94a3b8', fontSize: '14px', margin: '0 0 2rem' },
    form: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
    formGroup: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
    label: { fontSize: '14px', fontWeight: '500', color: '#94a3b8' },
    input: { padding: '12px 16px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '10px', color: '#f1f5f9', fontSize: '15px', outline: 'none', transition: 'border-color 0.2s' },
    submitBtn: { marginTop: '1rem', padding: '14px', backgroundColor: '#6366f1', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', transition: 'background-color 0.2s' },
    error: { padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#f87171', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)', marginBottom: '1.5rem', fontSize: '14px' },
    success: { padding: '12px', backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#4ade80', borderRadius: '8px', border: '1px solid rgba(34, 197, 94, 0.2)', marginBottom: '1.5rem', fontSize: '14px' }
};
