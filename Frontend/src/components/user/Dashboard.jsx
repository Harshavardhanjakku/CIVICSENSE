import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import ComplaintForm from "../complaints/complaintForm.jsx";
import { useAuth } from "../../App.jsx"; // Import useAuth hook

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

const Dashboard = () => {
  const navigate = useNavigate();
  const { userEmail, logout, token, userRole } = useAuth(); // Use useAuth hook
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showComplaintForm, setShowComplaintForm] = useState(false);

  // If no token or not a user, redirect to login
  useEffect(() => {
    if (!token || userRole !== "user") {
      logout();
      navigate("/login");
    }
  }, [token, userRole, navigate, logout]);

  // Extract name from email (everything before @)
  const userName = userEmail ? userEmail.split('@')[0] : 'User';

  useEffect(() => {
    if (token && userRole === "user") {
      fetchComplaints();
    }
  }, [token, userRole]);

  const fetchComplaints = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/complaints`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.data && Array.isArray(response.data)) {
        setComplaints(response.data);
      } else {
        setComplaints([]);
      }
    } catch (err) {
      console.error("Error fetching complaints:", err);
      
      if (err.response?.status === 401 || err.response?.status === 403) {
        logout();
        navigate("/login");
      } else if (err.code === 'ECONNREFUSED' || err.message.includes('Network Error')) {
        setError(`Cannot connect to server. Please check if backend is running at ${API_BASE_URL}.`);
      } else if (err.response) {
        setError(`Server error: ${err.response.status} - ${err.response.data?.message || err.response.statusText}`);
      } else {
        setError(`Failed to load complaints: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handlePostComplaint = () => {
    setShowComplaintForm(true);
  };

  const handleComplaintSubmitted = (newComplaint) => {
    setComplaints(prevComplaints => [newComplaint, ...prevComplaints]);
    setShowComplaintForm(false);
    alert("Complaint submitted successfully!");
  };

  const handleCloseComplaintForm = () => {
    setShowComplaintForm(false);
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return '#fdb81e';
      case 'in progress':
        return '#1b4480';
      case 'resolved':
        return '#00a91c';
      case 'rejected':
        return '#d54309';
      default:
        return '#565c65';
    }
  };

  const getStatusBackground = (status) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return '#fff3cd';
      case 'in progress':
        return '#e7f3ff';
      case 'resolved':
        return '#e7f4e4';
      case 'rejected':
        return '#f9dedc';
      default:
        return '#f0f0f0';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        backgroundColor: "#f0f0f0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Public Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif"
      }}>
        <div style={{
          backgroundColor: "white",
          padding: "40px",
          borderRadius: "4px",
          textAlign: "center",
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
        }}>
          <div style={{
            width: "40px",
            height: "40px",
            border: "4px solid #f0f0f0",
            borderTop: "4px solid #1b4480",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 20px auto"
          }}></div>
          <h2 style={{ color: "#1b4480", margin: "0" }}>Loading your dashboard...</h2>
        </div>
        <style>
          {`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}
        </style>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
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
                Municipal ICMS
              </h1>
              <p
                style={{
                  margin: "0",
                  fontSize: "14px",
                  color: "#565c65",
                  fontWeight: "400",
                }}
              >
                Incident & Complaint Management System
              </p>
            </div>
          </div>

          {/* User Info and Navigation */}
          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            <div style={{ textAlign: "right" }}>
              <p
                style={{
                  margin: "0",
                  fontSize: "14px",
                  color: "#565c65",
                  fontWeight: "400",
                }}
              >
                Welcome, {userName.charAt(0).toUpperCase() + userName.slice(1)}
              </p>
              <p
                style={{
                  margin: "0",
                  fontSize: "12px",
                  color: "#565c65",
                }}
              >
                {userEmail}
              </p>
            </div>
            <button
              onClick={handleLogout}
              style={{
                backgroundColor: "#d54309",
                color: "white",
                border: "none",
                padding: "8px 16px",
                borderRadius: "4px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "#b73507";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "#d54309";
              }}
            >
              Sign Out
            </button>
          </div>
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
          }}
        >
          {/* Page Title and Action Button */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "32px",
            }}
          >
            <div>
              <h2
                style={{
                  margin: "0 0 8px 0",
                  fontSize: "32px",
                  fontWeight: "700",
                  color: "#1b4480",
                }}
              >
                Citizen Dashboard
              </h2>
              <p
                style={{
                  margin: "0",
                  fontSize: "16px",
                  color: "#565c65",
                }}
              >
                Manage your municipal service requests and complaints
              </p>
            </div>
            <button
              onClick={handlePostComplaint}
              style={{
                backgroundColor: "#1b4480",
                color: "white",
                border: "none",
                padding: "12px 24px",
                borderRadius: "4px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: "pointer",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "#0f3a6b";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "#1b4480";
              }}
            >
              📝 Submit New Complaint
            </button>
          </div>

          {/* Statistics Cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "24px",
              marginBottom: "40px",
            }}
          >
            <div
              style={{
                backgroundColor: "white",
                border: "1px solid #d6d6d6",
                borderRadius: "4px",
                padding: "24px",
                textAlign: "center",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
              }}
            >
              <h3
                style={{
                  margin: "0 0 8px 0",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#565c65",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Total Complaints
              </h3>
              <p
                style={{
                  margin: "0",
                  fontSize: "32px",
                  fontWeight: "700",
                  color: "#1b4480",
                }}
              >
                {complaints.length}
              </p>
            </div>

            <div
              style={{
                backgroundColor: "white",
                border: "1px solid #d6d6d6",
                borderRadius: "4px",
                padding: "24px",
                textAlign: "center",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
              }}
            >
              <h3
                style={{
                  margin: "0 0 8px 0",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#565c65",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Pending
              </h3>
              <p
                style={{
                  margin: "0",
                  fontSize: "32px",
                  fontWeight: "700",
                  color: "#fdb81e",
                }}
              >
                {
                  complaints.filter((c) => c.status.toLowerCase() === "pending")
                    .length
                }
              </p>
            </div>

            <div
              style={{
                backgroundColor: "white",
                border: "1px solid #d6d6d6",
                borderRadius: "4px",
                padding: "24px",
                textAlign: "center",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
              }}
            >
              <h3
                style={{
                  margin: "0 0 8px 0",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#565c65",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Resolved
              </h3>
              <p
                style={{
                  margin: "0",
                  fontSize: "32px",
                  fontWeight: "700",
                  color: "#00a91c",
                }}
              >
                {
                  complaints.filter(
                    (c) => c.status.toLowerCase() === "resolved"
                  ).length
                }
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div
              style={{
                backgroundColor: "#f9dedc",
                border: "1px solid #d54309",
                borderRadius: "4px",
                padding: "16px",
                marginBottom: "24px",
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

          {/* Complaints Section */}
          <div
            style={{
              backgroundColor: "white",
              border: "1px solid #d6d6d6",
              borderRadius: "4px",
              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
            }}
          >
            <div
              style={{
                padding: "24px",
                borderBottom: "1px solid #d6d6d6",
                backgroundColor: "#f0f0f0",
              }}
            >
              <h3
                style={{
                  margin: "0",
                  fontSize: "20px",
                  fontWeight: "700",
                  color: "#1b4480",
                }}
              >
                Your Complaints
              </h3>
            </div>

            {complaints.length === 0 ? (
              <div
                style={{
                  padding: "60px 24px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    width: "80px",
                    height: "80px",
                    backgroundColor: "#f0f0f0",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 24px auto",
                    fontSize: "32px",
                  }}
                >
                  📋
                </div>
                <h4
                  style={{
                    margin: "0 0 16px 0",
                    fontSize: "18px",
                    fontWeight: "600",
                    color: "#565c65",
                  }}
                >
                  No complaints found
                </h4>
                <p
                  style={{
                    margin: "0 0 24px 0",
                    fontSize: "14px",
                    color: "#565c65",
                  }}
                >
                  You haven't submitted any complaints yet. Submit your first
                  complaint to get started.
                </p>
                <button
                  onClick={handlePostComplaint}
                  style={{
                    backgroundColor: "#1b4480",
                    color: "white",
                    border: "none",
                    padding: "12px 24px",
                    borderRadius: "4px",
                    fontSize: "16px",
                    fontWeight: "600",
                    cursor: "pointer",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = "#0f3a6b";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = "#1b4480";
                  }}
                >
                  Submit Your First Complaint
                </button>
              </div>
            ) : (
              <div style={{ padding: "0" }}>
                {complaints.map((complaint, index) => (
                  <div
                    key={complaint._id}
                    style={{
                      padding: "24px",
                      borderBottom:
                        index < complaints.length - 1
                          ? "1px solid #d6d6d6"
                          : "none",
                      backgroundColor: "white",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: "16px",
                      }}
                    >
                      <div style={{ flex: "1" }}>
                        <h4
                          style={{
                            margin: "0 0 8px 0",
                            fontSize: "18px",
                            fontWeight: "600",
                            color: "#1b4480",
                            lineHeight: "1.3",
                          }}
                        >
                          {complaint.title}
                        </h4>
                        <p
                          style={{
                            margin: "0 0 12px 0",
                            fontSize: "14px",
                            color: "#565c65",
                            lineHeight: "1.5",
                          }}
                        >
                          {complaint.description}
                        </p>
                        <div
                          style={{
                            display: "flex",
                            gap: "24px",
                            fontSize: "12px",
                            color: "#565c65",
                          }}
                        >
                          <span
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            📍 {complaint.location}
                          </span>
                          <span
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            📅 {formatDate(complaint.createdAt)}
                          </span>
                        </div>
                      </div>
                      <div
                        style={{
                          marginLeft: "16px",
                          textAlign: "right",
                        }}
                      >
                        <span
                          style={{
                            display: "inline-block",
                            padding: "6px 12px",
                            backgroundColor: getStatusBackground(
                              complaint.status
                            ),
                            color: getStatusColor(complaint.status),
                            borderRadius: "4px",
                            fontSize: "12px",
                            fontWeight: "600",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            border: `1px solid ${getStatusColor(
                              complaint.status
                            )}`,
                          }}
                        >
                          {complaint.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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

      {/* Complaint Form Modal */}
      {showComplaintForm && (
        <ComplaintForm
          onComplaintSubmitted={handleComplaintSubmitted}
          onClose={handleCloseComplaintForm}
        />
      )}
    </div>
  );
};

export default Dashboard;
