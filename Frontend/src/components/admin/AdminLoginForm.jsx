import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../App.jsx"; // Adjust path as necessary

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

const AdminLoginForm = () => {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/admin/auth/login`, {
        phone,
        password,
      });

      if (response.data.token) {
        login(response.data.token, "admin", phone, response.data.adminId); // Store adminId and use phone as userEmail
        navigate("/admin/dashboard");
      } else {
        setError("No token received from server");
      }
    } catch (err) {
      console.error("Admin Login error:", err);
      if (err.response) {
        setError(err.response.data?.message || `Server error: ${err.response.status}`);
      } else if (err.request) {
        setError("Cannot connect to server. Please check if backend is running.");
      } else {
        setError("Login failed: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        backgroundColor: "#f0f0f0",
        fontFamily:
          "'Public Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif",
        margin: "0",
        padding: "0",
      }}
    >
      {/* Government Banner */}
      <div
        style={{
          backgroundColor: "#1b4480",
          color: "white",
          padding: "8px 0",
          fontSize: "14px",
          textAlign: "center",
          borderBottom: "1px solid #1b4480",
        }}
      >
        <div
          style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px" }}
        >
          An official website of Govt. Of India.
        </div>
      </div>

      {/* Header with Logo and Navigation */}
      <header
        style={{
          backgroundColor: "white",
          borderBottom: "1px solid #d6d6d6",
          padding: "16px 0",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "0 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Logo and Agency Name */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                backgroundColor: "#1b4480",
                borderRadius: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "24px",
                fontWeight: "bold",
              }}
            >
              🏛️
            </div>
            <div>
              <h1
                style={{
                  margin: "0",
                  fontSize: "24px",
                  fontWeight: "700",
                  color: "#1b4480",
                  lineHeight: "1.2",
                }}
              >
                Municipal ICMS Admin
              </h1>
              <p
                style={{
                  margin: "0",
                  fontSize: "14px",
                  color: "#565c65",
                  fontWeight: "400",
                }}
              >
                Intelligent Complaint Management System
              </p>
            </div>
          </div>

          {/* Navigation - could be extended later for multi-role login links */}
          <nav style={{ display: "flex", gap: "24px", alignItems: "center" }}>
            <Link
              to="/login"
              style={{
                color: "#1b4480",
                textDecoration: "none",
                fontWeight: "600",
                fontSize: "16px",
                padding: "8px 16px",
                backgroundColor: "#f0f0f0",
                borderRadius: "4px",
              }}
            >
              User Sign In
            </Link>
            <Link
              to="/staff/login"
              style={{
                color: "white",
                textDecoration: "none",
                fontWeight: "600",
                fontSize: "16px",
                padding: "8px 16px",
                backgroundColor: "#1b4480",
                borderRadius: "4px",
              }}
            >
              Staff Sign In
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main
        style={{
          backgroundColor: "#f0f0f0",
          minHeight: "calc(100vh - 140px)",
          padding: "40px 0",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "0 20px",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "60px",
            alignItems: "start",
          }}
        >
          {/* Left Side - Information */}
          <div style={{ paddingTop: "40px" }}>
            <h2
              style={{
                fontSize: "32px",
                fontWeight: "700",
                color: "#1b4480",
                marginBottom: "24px",
                lineHeight: "1.2",
              }}
            >
              Administrator Access
            </h2>

            <p
              style={{
                fontSize: "18px",
                color: "#565c65",
                marginBottom: "32px",
                lineHeight: "1.5",
              }}
            >
              Sign in with your administrator credentials to manage complaints,
              users, and staff.
            </p>

            {/* Security Notice */}
            <div
              style={{
                backgroundColor: "#e7f3ff",
                border: "1px solid #b8daff",
                borderRadius: "4px",
                padding: "16px",
                marginBottom: "24px",
              }}
            >
              <h4
                style={{
                  margin: "0 0 8px 0",
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#1b4480",
                }}
              >
                🔒 Secure Access
              </h4>
              <p
                style={{
                  margin: "0",
                  fontSize: "14px",
                  color: "#565c65",
                  lineHeight: "1.4",
                }}
              >
                This is an administrative portal. Unauthorized access is
                prohibited.
              </p>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div>
            <div
              style={{
                backgroundColor: "white",
                border: "1px solid #d6d6d6",
                borderRadius: "4px",
                padding: "32px",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
              }}
            >
              <h2
                style={{
                  margin: "0 0 24px 0",
                  fontSize: "24px",
                  fontWeight: "700",
                  color: "#1b4480",
                }}
              >
                Admin Sign In
              </h2>

              <form onSubmit={handleSubmit}>
                {/* Email Field */}
                <div style={{ marginBottom: "20px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontSize: "16px",
                      fontWeight: "600",
                      color: "#1b4480",
                    }}
                  >
                    Phone Number
                    <span style={{ color: "#d54309", marginLeft: "4px" }}>
                      *
                    </span>
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    disabled={loading}
                    placeholder="Enter your admin phone number"
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      border: "2px solid #d6d6d6",
                      borderRadius: "4px",
                      fontSize: "16px",
                      fontFamily: "inherit",
                      boxSizing: "border-box",
                      backgroundColor: loading ? "#f0f0f0" : "white",
                      outline: "none",
                      transition: "border-color 0.2s ease",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#1b4480";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#d6d6d6";
                    }}
                  />
                </div>

                {/* Password Field */}
                <div style={{ marginBottom: "24px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontSize: "16px",
                      fontWeight: "600",
                      color: "#1b4480",
                    }}
                  >
                    Password
                    <span style={{ color: "#d54309", marginLeft: "4px" }}>
                      *
                    </span>
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      placeholder="Enter your password"
                      style={{
                        width: "100%",
                        padding: "12px 50px 12px 16px",
                        border: "2px solid #d6d6d6",
                        borderRadius: "4px",
                        fontSize: "16px",
                        fontFamily: "inherit",
                        boxSizing: "border-box",
                        backgroundColor: loading ? "#f0f0f0" : "white",
                        outline: "none",
                        transition: "border-color 0.2s ease",
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = "#1b4480";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "#d6d6d6";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: "absolute",
                        right: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#565c65",
                        fontSize: "16px",
                        padding: "4px",
                      }}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div
                    style={{
                      backgroundColor: "#f9dedc",
                      border: "1px solid #d54309",
                      borderRadius: "4px",
                      padding: "12px 16px",
                      marginBottom: "20px",
                      color: "#d54309",
                      fontSize: "14px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span>⚠️</span>
                    {error}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "16px",
                    backgroundColor: loading ? "#565c65" : "#1b4480",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    fontSize: "16px",
                    fontWeight: "600",
                    cursor: loading ? "not-allowed" : "pointer",
                    transition: "background-color 0.2s ease",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.target.style.backgroundColor = "#0f3a6b";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) {
                      e.target.style.backgroundColor = "#1b4480";
                    }
                  }}
                >
                  {loading ? "Signing In..." : "Sign In as Admin"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          backgroundColor: "white",
          borderTop: "1px solid #d6d6d6",
          padding: "24px 0",
          marginTop: "auto",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "0 20px",
            textAlign: "center",
          }}
        >
          <p
            style={{
              margin: "0",
              fontSize: "14px",
              color: "#565c65",
            }}
          >
            © 2024 Municipal ICMS. An official website of Govt. Of India.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default AdminLoginForm;
