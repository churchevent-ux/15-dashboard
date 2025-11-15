import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// ===================== Public Pages =====================
import Home from "./pages/Home";
import Register from "./pages/Register";
import IDCard from "./pages/IDCard";

// ===================== Admin Layout & Pages =====================
import AdminLayout from "./pages/AdminLayout";
import AdminDashboard from "./pages/AdminDashboard";
import Users from "./pages/users";
import UserDetails from "./pages/UserDetails";
import Orders from "./pages/Orders";
import Products from "./pages/Products";
import Settings from "./pages/Settings";
import Teams from "./pages/Team";
import Attendance from "./pages/attendence";
import BreakIn from "./pages/break";
import Notifications from "./pages/notifications";
import Volunteers from "./pages/volunteers";
import Preview from "./pages/Preview";

// ===================== Volunteer Pages =====================
import VolunteerRegister from "./pages/VolunteerRegister";
import VolunteerIDCard from "./pages/VolunteerIDCard";

function App() {
  return (
    <Router>
      <Routes>

        {/* Default route → go directly to admin dashboard */}
        <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />

        {/* -------------------- Public Routes -------------------- */}
        <Route path="/home" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/id-card" element={<IDCard />} />
        <Route path="/volunteer-register" element={<VolunteerRegister />} />
        <Route path="/volunteer-id" element={<VolunteerIDCard />} />
        <Route path="/preview" element={<Preview />} />

        {/* -------------------- Admin Routes -------------------- */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />

          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="users/:id" element={<UserDetails />} />
          <Route path="orders" element={<Orders />} />
          <Route path="products" element={<Products />} />
          <Route path="settings" element={<Settings />} />
          <Route path="teams" element={<Teams />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="break" element={<BreakIn />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="volunteers" element={<Volunteers />} />
        </Route>

        {/* Fallback → default to admin dashboard */}
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />

      </Routes>
    </Router>
  );
}

export default App;
