import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function StaffFeedback() {
    const navigate = useNavigate();
    const [feedback, setFeedback] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchFeedback = async () => {
            try {
                const res = await axios.get('/api/staff/feedback', { withCredentials: true });
                setFeedback(res.data);
                setLoading(false);
            } catch (err) {
                console.error(err);
                setError('Failed to fetch feedback.');
                setLoading(false);
            }
        };
        fetchFeedback();
    }, []);

    const renderStars = (rating) => {
        return '⭐'.repeat(rating);
    };

    if (loading) return <div style={styles.page}><p>Loading feedback...</p></div>;

    return (
        <div style={styles.page}>
            <div style={styles.header}>
                <h2 style={styles.heading}>Student Feedback</h2>
                <button style={styles.backBtn} onClick={() => navigate('/staff/dashboard')}>
                    Back to Dashboard
                </button>
            </div>

            {error && <p style={styles.error}>{error}</p>}

            {feedback.length === 0 ? (
                <div style={styles.emptyState}>
                    <p>No feedback received yet.</p>
                </div>
            ) : (
                <div style={styles.grid}>
                    {feedback.map((f) => (
                        <div key={f.feedback_id} style={styles.card}>
                            <div style={styles.cardHeader}>
                                <h3 style={styles.complaintTitle}>{f.complaint_title}</h3>
                                <span style={styles.rating}>{renderStars(f.rating)}</span>
                            </div>
                            <p style={styles.comments}>"{f.comments}"</p>
                            <div style={styles.cardFooter}>
                                <span style={styles.studentName}>— {f.student_name}</span>
                                <span style={styles.date}>{new Date(f.feedback_date).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

const styles = {
    page: { minHeight: '100vh', backgroundColor: '#0f172a', color: '#f1f5f9', padding: '2rem' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' },
    heading: { fontSize: '24px', fontWeight: '600', margin: 0 },
    backBtn: { padding: '8px 16px', backgroundColor: '#334155', color: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' },
    card: { backgroundColor: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '1rem' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' },
    complaintTitle: { fontSize: '16px', fontWeight: '600', color: '#34d399', margin: 0 },
    rating: { fontSize: '14px' },
    comments: { fontSize: '14px', color: '#cbd5e1', fontStyle: 'italic', lineHeight: '1.5', margin: 0 },
    cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid #334155' },
    studentName: { fontSize: '12px', color: '#94a3b8' },
    date: { fontSize: '12px', color: '#64748b' },
    error: { color: '#f87171', backgroundColor: '#450a0a', padding: '10px', borderRadius: '8px', marginBottom: '1rem', fontSize: '14px' },
    emptyState: { textAlign: 'center', padding: '4rem', backgroundColor: '#1e293b', borderRadius: '12px', border: '1px dashed #334155' }
};
