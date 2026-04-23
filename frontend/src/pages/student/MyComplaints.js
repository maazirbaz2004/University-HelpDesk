import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function MyComplaints() {
    const navigate = useNavigate();
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [reopenId, setReopenId] = useState(null);
    const [reopenRemarks, setReopenRemarks] = useState('');
    const [reopenLoading, setReopenLoading] = useState(false);

    const [feedbackId, setFeedbackId] = useState(null);
    const [rating, setRating] = useState(5);
    const [comments, setComments] = useState('');
    const [feedbackLoading, setFeedbackLoading] = useState(false);

    useEffect(() => {
        fetchComplaints();
    }, []);

    const fetchComplaints = async () => {
        try {
            const res = await axios.get('/api/student/complaints', { withCredentials: true });
            setComplaints(res.data);
        } catch (err) {
            console.error('Error fetching complaints:', err);
            setError('Failed to load your complaints');
        } finally {
            setLoading(false);
        }
    };

    const handleReopen = async (e) => {
        e.preventDefault();
        if (!reopenRemarks.trim()) return alert('Please provide a reason');
        setReopenLoading(true);
        try {
            await axios.post(`/api/student/complaints/${reopenId}/reopen`, { remarks: reopenRemarks }, { withCredentials: true });
            alert('Complaint reopened successfully');
            setReopenId(null);
            setReopenRemarks('');
            fetchComplaints();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to reopen complaint');
        } finally {
            setReopenLoading(false);
        }
    };

    const handleFeedback = async (e) => {
        e.preventDefault();
        setFeedbackLoading(true);
        try {
            await axios.post('/api/student/feedback', { 
                complaintId: feedbackId, 
                rating, 
                comments 
            }, { withCredentials: true });
            alert('Feedback submitted successfully. Thank you!');
            setFeedbackId(null);
            setRating(5);
            setComments('');
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to submit feedback');
        } finally {
            setFeedbackLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending':     return '#fbbf24';
            case 'In-Progress': return '#3b82f6';
            case 'Resolved':    return '#10b981';
            case 'Rejected':    return '#f87171';
            case 'Reopened':    return '#8b5cf6';
            default:            return '#94a3b8';
        }
    };

    return (
        <div style={styles.page}>
            <div style={styles.navbar}>
                <span style={styles.logo} onClick={() => navigate('/student/dashboard')}>SmartResolve</span>
                <button style={styles.backBtn} onClick={() => navigate('/student/dashboard')}>Back to Dashboard</button>
            </div>

            <div style={styles.content}>
                <div style={styles.header}>
                    <h2 style={styles.heading}>My Complaints</h2>
                    <p style={styles.sub}>Track the status of your submitted issues.</p>
                </div>

                {loading ? (
                    <div style={styles.loading}>Loading complaints...</div>
                ) : error ? (
                    <div style={styles.error}>{error}</div>
                ) : complaints.length === 0 ? (
                    <div style={styles.empty}>
                        <p>You haven't submitted any complaints yet.</p>
                        <button style={styles.submitBtn} onClick={() => navigate('/student/submit-complaint')}>
                            Submit Your First Complaint
                        </button>
                    </div>
                ) : (
                    <div style={styles.tableContainer}>
                        <table style={styles.table}>
                            <thead>
                                <tr style={styles.tableHeader}>
                                    <th style={styles.th}>ID</th>
                                    <th style={styles.th}>Title</th>
                                    <th style={styles.th}>Department</th>
                                    <th style={styles.th}>Category</th>
                                    <th style={styles.th}>Status</th>
                                    <th style={styles.th}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {complaints.map(complaint => (
                                    <tr key={complaint.complaint_id} style={styles.tableRow}>
                                        <td style={styles.td}>#{complaint.complaint_id}</td>
                                        <td style={{...styles.td, fontWeight: '500'}}>{complaint.title}</td>
                                        <td style={styles.td}>{complaint.department_name}</td>
                                        <td style={styles.td}>{complaint.category_name || 'N/A'}</td>
                                        <td style={styles.td}>
                                            <span style={{
                                                ...styles.badge,
                                                backgroundColor: `${getStatusColor(complaint.status)}20`,
                                                color: getStatusColor(complaint.status),
                                                border: `1px solid ${getStatusColor(complaint.status)}40`
                                            }}>
                                                {complaint.status}
                                            </span>
                                        </td>
                                        <td style={{...styles.td, display: 'flex', gap: '8px'}}>
                                            {(complaint.status === 'Resolved' || complaint.status === 'Rejected') && (
                                                <button 
                                                    style={styles.reopenBtn}
                                                    onClick={() => setReopenId(complaint.complaint_id)}
                                                >
                                                    Reopen
                                                </button>
                                            )}
                                            {complaint.status === 'Resolved' && (
                                                <button 
                                                    style={styles.feedbackBtn}
                                                    onClick={() => setFeedbackId(complaint.complaint_id)}
                                                >
                                                    Feedback
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Reopen Modal */}
            {reopenId && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modal}>
                        <h3>Reopen Complaint #{reopenId}</h3>
                        <p style={styles.modalSub}>Please provide a reason for reopening this complaint.</p>
                        <form onSubmit={handleReopen}>
                            <textarea 
                                style={styles.modalTextarea}
                                value={reopenRemarks}
                                onChange={(e) => setReopenRemarks(e.target.value)}
                                placeholder="Reason for reopening..."
                                required
                            />
                            <div style={styles.modalActions}>
                                <button type="button" style={styles.cancelBtn} onClick={() => setReopenId(null)}>Cancel</button>
                                <button type="submit" style={styles.confirmBtn} disabled={reopenLoading}>
                                    {reopenLoading ? 'Reopening...' : 'Confirm Reopen'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Feedback Modal */}
            {feedbackId && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modal}>
                        <h3>Share Your Feedback</h3>
                        <p style={styles.modalSub}>How would you rate the resolution of complaint #{feedbackId}?</p>
                        <form onSubmit={handleFeedback}>
                            <div style={styles.ratingGroup}>
                                {[1, 2, 3, 4, 5].map(num => (
                                    <button 
                                        key={num}
                                        type="button"
                                        style={{
                                            ...styles.star,
                                            color: num <= rating ? '#fbbf24' : '#4b5563'
                                        }}
                                        onClick={() => setRating(num)}
                                    >
                                        ★
                                    </button>
                                ))}
                            </div>
                            <textarea 
                                style={styles.modalTextarea}
                                value={comments}
                                onChange={(e) => setComments(e.target.value)}
                                placeholder="Your comments (optional)..."
                            />
                            <div style={styles.modalActions}>
                                <button type="button" style={styles.cancelBtn} onClick={() => setFeedbackId(null)}>Cancel</button>
                                <button type="submit" style={styles.feedbackSubmitBtn} disabled={feedbackLoading}>
                                    {feedbackLoading ? 'Submitting...' : 'Submit Feedback'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

const styles = {
    page: { minHeight: '100vh', backgroundColor: '#0f172a', color: '#f1f5f9', fontFamily: "'Inter', sans-serif" },
    navbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', backgroundColor: '#1e293b', borderBottom: '1px solid #334155' },
    logo: { fontSize: '18px', fontWeight: '700', color: '#818cf8', cursor: 'pointer' },
    backBtn: { padding: '8px 16px', backgroundColor: 'transparent', color: '#94a3b8', border: '1px solid #334155', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' },
    content: { padding: '2rem', maxWidth: '1200px', margin: '0 auto' },
    header: { marginBottom: '2rem' },
    heading: { fontSize: '24px', fontWeight: '600', margin: '0 0 6px' },
    sub: { color: '#94a3b8', fontSize: '14px', margin: 0 },
    loading: { textAlign: 'center', padding: '3rem', color: '#94a3b8' },
    error: { padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#f87171', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' },
    empty: { textAlign: 'center', padding: '4rem 2rem', backgroundColor: '#1e293b', borderRadius: '16px', border: '1px solid #334155' },
    submitBtn: { marginTop: '1.5rem', padding: '12px 24px', backgroundColor: '#6366f1', color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
    tableContainer: { backgroundColor: '#1e293b', borderRadius: '16px', border: '1px solid #334155', overflow: 'hidden' },
    table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
    tableHeader: { backgroundColor: '#0f172a' },
    th: { padding: '1rem', fontSize: '13px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' },
    tableRow: { borderBottom: '1px solid #334155', transition: 'background-color 0.2s' },
    td: { padding: '1rem', fontSize: '14px', color: '#f1f5f9' },
    badge: { padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
    reopenBtn: { padding: '6px 12px', backgroundColor: 'transparent', color: '#8b5cf6', border: '1px solid #8b5cf6', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '500' },
    feedbackBtn: { padding: '6px 12px', backgroundColor: 'transparent', color: '#f59e0b', border: '1px solid #f59e0b', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '500' },
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modal: { backgroundColor: '#1e293b', padding: '2rem', borderRadius: '16px', width: '100%', maxWidth: '500px', border: '1px solid #334155' },
    modalSub: { color: '#94a3b8', fontSize: '14px', marginBottom: '1.5rem' },
    modalTextarea: { width: '100%', padding: '12px', backgroundColor: '#0f172a', color: 'white', border: '1px solid #334155', borderRadius: '10px', minHeight: '100px', marginBottom: '1.5rem', outline: 'none' },
    modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '1rem' },
    cancelBtn: { padding: '10px 20px', backgroundColor: 'transparent', color: '#94a3b8', border: '1px solid #334155', borderRadius: '8px', cursor: 'pointer' },
    confirmBtn: { padding: '10px 20px', backgroundColor: '#8b5cf6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
    ratingGroup: { display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.5rem' },
    star: { fontSize: '32px', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', outline: 'none' },
    feedbackSubmitBtn: { padding: '10px 20px', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }
};
