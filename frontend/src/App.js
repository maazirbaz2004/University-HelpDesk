import { BrowserRouter, Routes, Route } from "react-router-dom";
import StudentRegister from "./pages/StudentRegister";
import Login from "./pages/Login";
import AdminLogin from "./pages/AdminLogin";
import StudentDashboard from "./pages/student/StudentDashboard";
import StaffDashboard from "./pages/staff/StaffDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageComplaints from "./pages/admin/ManageComplaints";
import AdminReports from "./pages/admin/AdminReports";
import AdminDepartments from "./pages/admin/AdminDepartments";
import ManageUsers from "./pages/admin/ManageUsers";
import AdminProfile from "./pages/admin/AdminProfile";
import StaffComplaints from "./pages/staff/StaffComplaints";
import StaffProfile from "./pages/staff/StaffProfile";
import StaffFeedback from "./pages/staff/StaffFeedback";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<h1>Home</h1>} />
        <Route path="/register" element={<StudentRegister />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/staff/dashboard" element={<StaffDashboard />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/complaints" element={<ManageComplaints />} />
        <Route path="/admin/reports" element={<AdminReports />} />
        <Route path="/admin/departments" element={<AdminDepartments />} />
        <Route path="/admin/users" element={<ManageUsers />} />
        <Route path="/admin/profile" element={<AdminProfile />} />
        <Route path="/staff/complaints" element={<StaffComplaints />} />
        <Route path="/staff/profile" element={<StaffProfile />} />
        <Route path="/staff/feedback" element={<StaffFeedback />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;