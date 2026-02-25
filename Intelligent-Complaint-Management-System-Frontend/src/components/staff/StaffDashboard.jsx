import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../App.jsx";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

const StaffDashboard = () => {
  const navigate = useNavigate();
  const { userEmail, logout, token, userId } = useAuth();
  const [assignedComplaints, setAssignedComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const staffName = userEmail ? userEmail.split('@')[0] : 'Staff';

  useEffect(() => {
    if (token) {
      fetchAssignedComplaints();
    } else {
      navigate("/staff/login");
    }
  }, [token]);

  const fetchAssignedComplaints = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/staff/complaints`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAssignedComplaints(response.data || []);
    } catch (err) {
      console.error("Error fetching assigned complaints:", err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        logout();
        navigate("/staff/login");
      } else {
        setError(err.response?.data?.message || "Failed to fetch assigned complaints");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (complaintId, newStatus) => {
    try {
      await axios.put(
        `${API_BASE_URL}/staff/complaints/${complaintId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Complaint status updated successfully!");
      fetchAssignedComplaints(); // Refresh data
    } catch (err) {
      console.error("Error updating complaint status:", err);
      setError(err.response?.data?.message || "Failed to update status");
    }
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
          <h2 style={{ color: "#1b4480", margin: "0" }}>Loading staff dashboard...</h2>
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
                Municipal ICMS Staff
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
                Welcome,{" "}
                {staffName.charAt(0).toUpperCase() + staffName.slice(1)}
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
              onClick={logout}
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
          {/* Page Title and Stats */}
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
                Staff Dashboard
              </h2>
              <p
                style={{
                  margin: "0",
                  fontSize: "16px",
                  color: "#565c65",
                }}
              >
                Manage your assigned complaints and update their statuses
              </p>
            </div>
          </div>

          {/* Statistics Cards (Optional, can add later) */}
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
                Total Assigned
              </h3>
              <p
                style={{
                  margin: "0",
                  fontSize: "32px",
                  fontWeight: "700",
                  color: "#1b4480",
                }}
              >
                {assignedComplaints.length}
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
                In Progress
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
                  assignedComplaints.filter(
                    (c) => c.status.toLowerCase() === "in progress"
                  ).length
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
                  assignedComplaints.filter(
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

          {/* Assigned Complaints List */}
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
                Your Assigned Complaints
              </h3>
            </div>
            {assignedComplaints.length === 0 ? (
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
                  ✅
                </div>
                <h4
                  style={{
                    margin: "0 0 16px 0",
                    fontSize: "18px",
                    fontWeight: "600",
                    color: "#565c65",
                  }}
                >
                  No complaints currently assigned to you.
                </h4>
              </div>
            ) : (
              <div style={{ padding: "0" }}>
                {assignedComplaints.map((complaint, index) => (
                  <div
                    key={complaint._id}
                    style={{
                      padding: "24px",
                      borderBottom:
                        index < assignedComplaints.length - 1
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
                            👤 {complaint.user?.email || "N/A"}
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
                        {complaint.status.toLowerCase() !== "resolved" &&
                          complaint.status.toLowerCase() !== "rejected" && (
                            <select
                              onChange={(e) =>
                                handleUpdateStatus(
                                  complaint._id,
                                  e.target.value
                                )
                              }
                              defaultValue={complaint.status}
                              style={{
                                marginTop: "10px",
                                padding: "8px",
                                borderRadius: "4px",
                                border: "1px solid #d6d6d6",
                                backgroundColor: "#f0f0f0",
                                cursor: "pointer",
                                fontSize: "14px",
                              }}
                            >
                              <option value="pending">Pending</option>
                              <option value="in progress">In Progress</option>
                              <option value="resolved">Resolved</option>
                              <option value="rejected">Rejected</option>
                            </select>
                          )}
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
    </div>
  );
};

export default StaffDashboard;
