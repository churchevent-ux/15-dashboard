// src/components/AdminProtectedRoute.js
import React from "react";
import { Navigate } from "react-router-dom";

const AdminProtectedRoute = ({ children }) => {
  const adminAuth = localStorage.getItem("adminAuth"); 
  // This will be set to "true" on successful login

  return adminAuth === "true" ? children : <Navigate to="/admin-login" />;
};

export default AdminProtectedRoute;
