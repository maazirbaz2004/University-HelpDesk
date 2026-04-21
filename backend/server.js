require('dotenv').config();
const jwt = require('jsonwebtoken');
const express = require('express');
const cors = require('cors');
const { getDepartments, registerStudent, loginUser, adminLogin, getComplaintsForAdmin, updateComplaintPriority, updateComplaintStatus, getComplaintHistory, getDepartmentWiseReport } = require('./db');
const bcrypt = require('bcrypt');
const app = express();
const PORT = 5000;
const cookieParser = require('cookie-parser');
app.use(cookieParser());
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());

// ── Auth middleware ──────────────────────────────────────────────────────────
const requireAuth = (roles = []) => (req, res, next) => {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (roles.length && !roles.includes(decoded.role))
            return res.status(403).json({ error: 'Forbidden' });
        req.user = decoded;
        next();
    } catch {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

app.post("/api/register/student", async (req, res) => {
    const { name, email, password, phone, departmentId } = req.body;
    // departmentId is optional so not included in this check
    if (!name || !email || !password || !phone) {
        return res.status(400).json({ error: "Missing required fields" });
    }
    try {
        const result = await registerStudent({ name, email, password, phone, departmentId });

        // proc returns ResultCode: 0 = success, 1 = duplicate email, 2 = validation, 3 = error
        const { ResultCode, ResultMessage, NewStudentId } = result[0];
        if (ResultCode === 0) {
            return res.status(201).json({ message: ResultMessage, studentId: NewStudentId });
        } else {
            return res.status(400).json({ error: ResultMessage });
        }

    } catch (error) {
        console.error("Error registering student:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
})
app.get("/api/departments", async (req, res) => {
    try {
        const result = await getDepartments();
        res.status(200).json(result);
    } catch (error) {
        console.error("Error fetching departments:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        const result = await loginUser(email);
        const { ResultCode, ResultMessage, UserId, Role, PasswordHash, Name, DepartmentId } = result[0];
        // email not found
        if (ResultCode !== 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        // compare entered password with stored hash
        if (password !== PasswordHash) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        // generate JWT
        const token = jwt.sign(
            { userId: UserId, role: Role, name: Name, departmentId: DepartmentId },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );
        // set as httpOnly cookie
        res.cookie('token', token, {
            httpOnly: true,         // JS cannot access this cookie
            secure: false,        // set to true in production (HTTPS)
            sameSite: 'lax',
            maxAge: 8 * 60 * 60 * 1000   // 8 hours in ms
        });
        // send role back so React can redirect to correct dashboard
        return res.status(200).json({
            message: 'Login successful',
            role: Role,
            name: Name
        });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
app.post('/api/logout', (req, res) => {
    res.clearCookie('token');
    res.status(200).json({ message: 'Logged out successfully' });
});
app.post('/api/admin/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        const result = await adminLogin(email);
        const { ResultCode, AdminId, PasswordHash, Name } = result[0];

        // email not found
        if (ResultCode !== 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // compare password directly (plain text for now)
        if (password !== PasswordHash) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // generate JWT with role Admin
        const token = jwt.sign(
            { userId: AdminId, role: 'Admin', name: Name },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );
        
        // set as httpOnly cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            maxAge: 8 * 60 * 60 * 1000
        });

        return res.status(200).json({
            message: 'Admin login successful',
            role: 'Admin',
            name: Name
        });

    } catch (error) {
        console.error('Error during admin login:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
// ── Admin: Get all complaints (with filter) ──────────────────────────────────
app.get('/api/admin/complaints', requireAuth(['Admin']), async (req, res) => {
    const { filter = 'all', departmentId, priority } = req.query;
    try {
        const result = await getComplaintsForAdmin({ filter, departmentId, priority });
        res.status(200).json(result);
    } catch (error) {
        console.error('Error fetching complaints:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// ── Admin: Update complaint priority ─────────────────────────────────────────
app.patch('/api/admin/complaints/:id/priority', requireAuth(['Admin']), async (req, res) => {
    const { id } = req.params;
    const { priority } = req.body;
    const adminId = req.user.userId;
    if (!priority) return res.status(400).json({ error: 'Priority is required' });
    try {
        const result = await updateComplaintPriority(id, priority, adminId);
        const { ResultCode, ResultMessage } = result[0] ?? {};
        if (ResultCode === 0) return res.status(200).json({ message: ResultMessage });
        return res.status(400).json({ error: ResultMessage });
    } catch (error) {
        console.error('Error updating priority:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// ── Admin: Update complaint status ───────────────────────────────────────────
app.patch('/api/admin/complaints/:id/status', requireAuth(['Admin']), async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const adminId = req.user.userId;
    if (!status) return res.status(400).json({ error: 'Status is required' });
    try {
        const result = await updateComplaintStatus(id, status, adminId);
        const { ResultCode, ResultMessage } = result[0] ?? {};
        if (ResultCode === 0) return res.status(200).json({ message: ResultMessage });
        return res.status(400).json({ error: ResultMessage });
    } catch (error) {
        console.error('Error updating status:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// ── Admin: Get complaint history ──────────────────────────────────────────────
app.get('/api/admin/complaints/:id/history', requireAuth(['Admin']), async (req, res) => {
    const { id } = req.params;
    try {
        const result = await getComplaintHistory(id);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error fetching history:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// ── Admin: Get Department-wise Reports ─────────────────────────────────────────
app.get('/api/admin/reports/departments', requireAuth(['Admin']), async (req, res) => {
    try {
        const result = await getDepartmentWiseReport();
        res.status(200).json(result);
    } catch (error) {
        console.error('Error fetching department reports:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});