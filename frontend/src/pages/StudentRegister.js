// src/pages/Register.jsx
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

export default function StudentRegister() {
    const navigate = useNavigate();

    const [departments, setDepartments]   = useState([]);
    const [error, setError]               = useState('');
    const [loading, setLoading]           = useState(false);
    const [focused, setFocused] = useState(null);
    const [hover, setHover] = useState(false);
    
    const [form, setForm] = useState({
        name:         '',
        email:        '',
        password:     '',
        phone:        '',
        departmentId: ''
    });

    // fetch departments on mount for the dropdown
    useEffect(() => {
        axios.get('/api/departments')
            .then(res => setDepartments(res.data))
            .catch(() => setError('Could not load departments.'));
    }, []);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await axios.post('/api/register/student', {
                name:         form.name,
                email:        form.email,
                password:     form.password,
                phone:        form.phone,
                departmentId: form.departmentId ? parseInt(form.departmentId) : null
            });

            // registration successful → redirect to login
            navigate('/login');

        } catch (err) {
            setError(err.response?.data?.error || 'Something went wrong.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.page}>
            <div style={styles.card}>
                <h2 style={styles.title}>Create account</h2>
                <p style={styles.subtitle}>Student registration</p>

                {error && <p style={styles.error}>{error}</p>}

                <form onSubmit={handleSubmit} style={styles.form}>

                    {/* Name */}
                    <div style={styles.field}>
                        <label style={styles.label}>Full name</label>
                        <input
                            style={{
                                ...styles.input,
                                ...(focused === "name" ? styles.inputFocus : {})
                            }}
                            name="name"
                            type="text"
                            placeholder="Ali Hassan"
                            value={form.name}
                            onChange={handleChange}
                            onFocus={() => setFocused("name")}
                            onBlur={() => setFocused(null)}
                            required
                        />
                    </div>

                    {/* Email */}
                    <div style={styles.field}>
                        <label style={styles.label}>Email</label>
                        <input
                            style={{
                                ...styles.input,
                                ...(focused === "email" ? styles.inputFocus : {})
                            }}
                            name="email"
                            type="email"
                            placeholder="ali@university.edu"
                            value={form.email}
                            onChange={handleChange}
                            onFocus={() => setFocused("email")}
                            onBlur={() => setFocused(null)}
                            required
                        />
                    </div>

                    {/* Password */}
                    <div style={styles.field}>
                        <label style={styles.label}>Password</label>
                        <input
                            style={{
                                ...styles.input,
                                ...(focused === "password" ? styles.inputFocus : {})
                            }}
                            name="password"
                            type="password"
                            placeholder="Min 8 characters"
                            value={form.password}
                            onChange={handleChange}
                            onFocus={() => setFocused("password")}
                            onBlur={() => setFocused(null)}
                            required
                        />
                    </div>

                    {/* Phone */}
                    <div style={styles.field}>
                        <label style={styles.label}>Phone</label>
                        <input
                            style={{
                                ...styles.input,
                                ...(focused === "phone" ? styles.inputFocus : {})
                            }}
                            name="phone"
                            type="text"
                            placeholder="03001234567"
                            value={form.phone}
                            onChange={handleChange}
                            onFocus={() => setFocused("phone")}
                            onBlur={() => setFocused(null)}
                            required
                        />
                    </div>

                    {/* Department */}
                    <div style={styles.field}>
                        <label style={styles.label}>
                            Department <span style={styles.optional}>(optional)</span>
                        </label>
                        <select
                            style={{
                                ...styles.input,
                                ...(focused === "departmentId" ? styles.inputFocus : {})
                            }}
                            name="departmentId"
                            value={form.departmentId}
                            onChange={handleChange}
                            onFocus={() => setFocused("departmentId")}
                            onBlur={() => setFocused(null)}
                        >
                            <option value="">-- Select department --</option>
                            {departments.map((d) => (
                                <option key={d.departmentId} value={d.departmentId}>
                                    {d.departmentName}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Button */}
                    <button
                        type="submit"
                        style={{
                            ...styles.button,
                            ...(hover ? styles.buttonHover : {}),
                            opacity: loading ? 0.7 : 1
                        }}
                        onMouseEnter={() => setHover(true)}
                        onMouseLeave={() => setHover(false)}
                        disabled={loading}
                    >
                        {loading ? "Registering..." : "Register"}
                    </button>
                </form>

                <p style={styles.footer}>
                    Already have an account?{" "}
                    <Link to="/login" style={styles.link}>
                        Login
                    </Link>
                </p>
            </div>
        </div>
    );
}

const styles = {
    page: {
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0f172a, #1e293b)"
    },

    card: {
        backgroundColor: "#0f172a",
        padding: "2.2rem",
        borderRadius: "16px",
        width: "100%",
        maxWidth: "430px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
        border: "1px solid rgba(255,255,255,0.05)"
    },

    title: {
        margin: "0 0 6px",
        fontSize: "24px",
        fontWeight: "600",
        color: "#f8fafc"
    },

    subtitle: {
        margin: "0 0 1.8rem",
        color: "#94a3b8",
        fontSize: "14px"
    },

    form: {
        display: "flex",
        flexDirection: "column",
        gap: "1.1rem"
    },

    field: {
        display: "flex",
        flexDirection: "column",
        gap: "6px"
    },

    label: {
        fontSize: "13px",
        fontWeight: "500",
        color: "#cbd5f5"
    },

    optional: {
        fontWeight: "400",
        color: "#64748b"
    },

    input: {
        padding: "11px 12px",
        borderRadius: "10px",
        border: "1px solid #334155",
        fontSize: "14px",
        backgroundColor: "#020617",
        color: "#f1f5f9",
        outline: "none",
        transition: "0.2s ease"
    },

    inputFocus: {
        border: "1px solid #6366f1",
        boxShadow: "0 0 0 2px rgba(99,102,241,0.25)"
    },

    button: {
        padding: "12px",
        background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
        color: "#fff",
        border: "none",
        borderRadius: "10px",
        fontSize: "15px",
        fontWeight: "600",
        cursor: "pointer",
        marginTop: "6px",
        transition: "0.2s ease",
        boxShadow: "0 6px 18px rgba(99,102,241,0.35)"
    },

    buttonHover: {
        transform: "translateY(-1px)",
        boxShadow: "0 10px 22px rgba(139,92,246,0.45)"
    },

    error: {
        color: "#f87171",
        fontSize: "13px",
        marginBottom: "6px"
    },

    footer: {
        textAlign: "center",
        fontSize: "13px",
        marginTop: "1.2rem",
        color: "#94a3b8"
    },

    link: {
        color: "#818cf8",
        textDecoration: "none",
        fontWeight: "500"
    }
};