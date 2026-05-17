import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../../components/Navbar';

export default function SubmitComplaint() {
    const navigate = useNavigate();
    const [departments, setDepartments] = useState([]);
    const [categories, setCategories] = useState([]);
    const [formData, setFormData] = useState({ departmentId: '', categoryId: '', title: '', description: '', priority: 'Medium' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => { fetchDepartments(); }, []);

    const fetchDepartments = async () => {
        try { const res = await axios.get('/api/departments'); setDepartments(res.data); }
        catch (err) { console.error('Error fetching departments:', err); }
    };

    const fetchCategories = async (deptId) => {
        try { const res = await axios.get(`/api/categories?departmentId=${deptId}`); setCategories(res.data); }
        catch (err) { console.error('Error fetching categories:', err); }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (name === 'departmentId') {
            setFormData(prev => ({ ...prev, categoryId: '' }));
            if (value) fetchCategories(value); else setCategories([]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true); setError(''); setSuccess('');
        try {
            await axios.post('/api/student/complaints', formData, { withCredentials: true });
            setSuccess('Complaint submitted successfully!');
            setTimeout(() => navigate('/student/dashboard'), 2000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to submit complaint');
        } finally {
            setLoading(false);
        }
    };

    const selectClass = "w-full bg-white/[0.05] border border-white/10 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 rounded-xl px-4 py-3 outline-none transition-all text-white cursor-pointer appearance-none";
    const inputClass = "w-full bg-white/[0.05] border border-white/10 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 rounded-xl px-4 py-3 outline-none transition-all text-white";

    return (
        <div className="min-h-screen bg-sr-dark">
            <Navbar role="Student" />

            <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="bg-white/[0.03] border border-violet-500/20 rounded-3xl p-8 sm:p-10">
                    <div className="mb-8 border-b border-white/[0.06] pb-6">
                        <h1 className="text-3xl font-bold text-white mb-2">Submit a New Complaint</h1>
                        <p className="text-slate-400">Please provide details about the issue you are facing.</p>
                    </div>

                    {error && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">{error}</div>}
                    {success && <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm font-medium flex items-center gap-2"><span>✨</span> {success}</div>}

                    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-slate-300">Department <span className="text-red-400">*</span></label>
                                <select id="complaint-dept" name="departmentId" value={formData.departmentId} onChange={handleChange} className={selectClass} required>
                                    <option value="" className="bg-gray-900">Select Department</option>
                                    {departments.map(d => <option key={d.departmentId} value={d.departmentId} className="bg-gray-900">{d.departmentName}</option>)}
                                </select>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-slate-300">Category <span className="text-slate-500 font-normal">(Optional)</span></label>
                                <select id="complaint-cat" name="categoryId" value={formData.categoryId} onChange={handleChange}
                                    className={`${selectClass} disabled:opacity-40 disabled:cursor-not-allowed`} disabled={!formData.departmentId}>
                                    <option value="" className="bg-gray-900">Select Category</option>
                                    {categories.map(c => <option key={c.category_id} value={c.category_id} className="bg-gray-900">{c.category_name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold text-slate-300">Priority Level</label>
                            <div className="flex gap-4">
                                {['Low', 'Medium', 'High'].map(p => (
                                    <label key={p} className={`flex-1 cursor-pointer border rounded-xl py-3 px-4 text-center text-sm font-bold transition-all ${
                                        formData.priority === p
                                        ? (p === 'High' ? 'bg-red-500/20 border-red-500/50 text-red-300' : p === 'Medium' ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300')
                                        : 'bg-white/[0.03] border-white/10 text-slate-500 hover:bg-white/[0.07]'
                                    }`}>
                                        <input type="radio" name="priority" value={p} checked={formData.priority === p} onChange={handleChange} className="hidden" />
                                        {p}
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold text-slate-300">Complaint Title <span className="text-red-400">*</span></label>
                            <input id="complaint-title" type="text" name="title" placeholder="Short summary of the issue"
                                value={formData.title} onChange={handleChange} className={inputClass} required />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold text-slate-300">Detailed Description <span className="text-red-400">*</span></label>
                            <textarea id="complaint-desc" name="description" rows="5"
                                placeholder="Please provide as much detail as possible..."
                                value={formData.description} onChange={handleChange}
                                className={`${inputClass} resize-y`} required />
                        </div>

                        <button
                            id="complaint-submit-btn"
                            type="submit" disabled={loading}
                            className="mt-4 w-full py-4 bg-gradient-to-r from-violet-500 to-purple-600 hover:opacity-90 text-white rounded-xl font-bold text-lg shadow-lg shadow-violet-500/25 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 flex justify-center items-center gap-2"
                        >
                            {loading ? (
                                <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting...</>
                            ) : (
                                <><span></span> Submit Complaint</>
                            )}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
}
