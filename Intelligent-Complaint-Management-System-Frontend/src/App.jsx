import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, createContext, useContext } from "react";

// Auth components
import LoginForm from "./components/auth/loginForm.jsx";
import SignupForm from "./components/auth/signupForm.jsx";
import AdminLoginForm from "./components/admin/AdminLoginForm.jsx";
import StaffLoginForm from "./components/staff/StaffLoginForm.jsx";

// Dashboard component
import Dashboard from "./components/user/Dashboard.jsx"; // Renamed to UserDashboard to reflect user role
import AdminDashboard from "./components/admin/AdminDashboard.jsx";
import StaffDashboard from "./components/staff/StaffDashboard.jsx";

// Auth Context
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [userRole, setUserRole] = useState(localStorage.getItem("userRole")); // 'user', 'admin', 'staff'
  const [userEmail, setUserEmail] = useState(localStorage.getItem("userEmail"));
  const [userId, setUserId] = useState(localStorage.getItem("userId"));

  const login = (newToken, role, email, providedId) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("userRole", role);
    localStorage.setItem("userEmail", email);

    let extractedId = providedId;

    // If no ID is provided explicitly, try to extract it from the token
    if (!providedId && newToken) {
      try {
        const base64Url = newToken.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        const { id } = JSON.parse(jsonPayload);
        extractedId = id; // This is the admin._id or staff._id
      } catch (e) {
        console.error("Failed to decode JWT token for ID:", e);
      }
    }

    if (extractedId) {
      localStorage.setItem("userId", extractedId);
      setUserId(extractedId);
    } else {
      localStorage.removeItem("userId");
      setUserId(null);
    }

    setToken(newToken);
    setUserRole(role);
    setUserEmail(email);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userId");
    setToken(null);
    setUserRole(null);
    setUserEmail(null);
    setUserId(null);
  };

  return (
    <AuthContext.Provider value={{ token, userRole, userEmail, userId, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};

// ProtectedRoute component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { token, userRole } = useAuth();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // Redirect to a forbidden page or their respective dashboard
    switch (userRole) {
      case "admin":
        return <Navigate to="/admin/dashboard" replace />;
      case "staff":
        return <Navigate to="/staff/dashboard" replace />;
      case "user":
        return <Navigate to="/user/dashboard" replace />;
      default:
        return <Navigate to="/login" replace />; // Fallback
    }
  }

  return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/signup" element={<SignupForm />} />
          <Route path="/admin/login" element={<AdminLoginForm />} />
          <Route path="/staff/login" element={<StaffLoginForm />} />

          {/* User Protected Routes */}
          <Route
            path="/user/dashboard"
            element={
              <ProtectedRoute allowedRoles={["user"]}>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Admin Protected Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          {/* Add more admin routes here */}

          {/* Staff Protected Routes */}
          <Route
            path="/staff/dashboard"
            element={
              <ProtectedRoute allowedRoles={["staff"]}>
                <StaffDashboard />
              </ProtectedRoute>
            }
          />
          {/* Add more staff routes here */}

          <Route path="*" element={<h1>404 - Page Not Found</h1>} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
