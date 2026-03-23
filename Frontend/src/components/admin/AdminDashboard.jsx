import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../App.jsx";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { userEmail, logout, token, userRole, userId } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [staffUsers, setStaffUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [newStaff, setNewStaff] = useState({
    name: "", // Add name field
    email: "",
    phone: "",
    password: "",
    district: "",
    address: "", // Add address field
  });
  const [addStaffLoading, setAddStaffLoading] = useState(false);
  const [addStaffError, setAddStaffError] = useState("");
  const [districts, setDistricts] = useState([]);
  const [districtsLoading, setDistrictsLoading] = useState(true);

  const adminIdentifier = userEmail || "Admin"; // Use userEmail (which is phone for admin) as identifier
  const adminName = adminIdentifier.includes("@")
    ? adminIdentifier.split("@")[0]
    : adminIdentifier; // Safely derive name

  useEffect(() => {
    if (!token) {
      navigate("/admin/login");
    } else if (userRole !== "admin") {
      navigate("/user/dashboard"); // Redirect to user dashboard if not admin
    } else {
      fetchData();
      fetchDistricts();
    }
  }, [token, userRole, navigate, logout]);

  const fetchDistricts = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/districts`);
      if (response.data && Array.isArray(response.data)) {
        setDistricts(response.data);
      } else {
        console.error("Invalid districts data format:", response.data);
        setDistricts([]);
      }
    } catch (err) {
      console.error("Error fetching districts:", err);
      setDistricts([]);
    } finally {
      setDistrictsLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      const [complaintsResponse, staffResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/admin/complaints`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_BASE_URL}/admin/staff`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setComplaints(complaintsResponse.data || []);
      setStaffUsers(staffResponse.data || []);
    } catch (err) {
      console.error("Error fetching admin data:", err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        logout();
        navigate("/admin/login");
      } else {
        setError(err.response?.data?.message || "Failed to fetch data");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAssignComplaint = async (complaintId, staffId) => {
    try {
      await axios.put(
        `${API_BASE_URL}/admin/complaints/${complaintId}/assign`,
        { staffId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Complaint assigned successfully!");
      fetchData(); // Refresh data
    } catch (err) {
      console.error("Error assigning complaint:", err);
      setError(err.response?.data?.message || "Failed to assign complaint");
    }
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await axios.post(
        `${API_BASE_URL}/admin/staff`,
        {
          name: newStaff.name, // Include name
          email: newStaff.email,
          phone: newStaff.phone,
          password: newStaff.password,
          district: newStaff.district,
          address: newStaff.address, // Include address
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Staff added successfully!");
      setNewStaff({
        name: "", // Reset name
        email: "",
        phone: "",
        password: "",
        district: "",
        address: "", // Reset address
      });
      setShowAddStaffModal(false);
      fetchData(); // Refresh data
    } catch (err) {
      console.error("Error adding staff:", err);
      setError(err.response?.data?.message || "Failed to add staff");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "#fdb81e";
      case "in progress":
        return "#1b4480";
      case "resolved":
        return "#00a91c";
      case "rejected":
        return "#d54309";
      default:
        return "#565c65";
    }
  };

  const getStatusBackground = (status) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "#fff3cd";
      case "in progress":
        return "#e7f3ff";
      case "resolved":
        return "#e7f4e4";
      case "rejected":
        return "#f9dedc";
      default:
        return "#f0f0f0";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#f0f0f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily:
            "'Public Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif",
        }}
      >
        <div
          style={{
            backgroundColor: "white",
            padding: "40px",
            borderRadius: "4px",
            textAlign: "center",
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              border: "4px solid #f0f0f0",
              borderTop: "4px solid #1b4480",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 20px auto",
            }}
          ></div>
          <h2 style={{ color: "#1b4480", margin: "0" }}>
            Loading admin dashboard...
          </h2>
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
                {adminName.charAt(0).toUpperCase() + adminName.slice(1)}
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
                Admin Dashboard
              </h2>
              <p
                style={{
                  margin: "0",
                  fontSize: "16px",
                  color: "#565c65",
                }}
              >
                Overview of all complaints and staff management
              </p>
            </div>
            {/* Add Staff Button/Modal Trigger */}
            <button
              onClick={() => setShowAddStaffModal(true)}
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
            >
              ➕ Add New Staff
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
                Pending Complaints
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
                Total Staff
              </h3>
              <p
                style={{
                  margin: "0",
                  fontSize: "32px",
                  fontWeight: "700",
                  color: "#00a91c",
                }}
              >
                {staffUsers.length}
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

          {/* Complaints List */}
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
                All Complaints
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
                  No complaints registered yet.
                </h4>
              </div>
            ) : (
              <div style={{ padding: "0" }}>
                {complaints.map((complaint, index) => {
                  try {
                    const assignedStaff = staffUsers.find(
                      (s) => s._id === complaint.assignedTo
                    );

                    return (
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
                                👤{" "}
                                {complaint.userId?.phoneNumber ||
                                  complaint.userId?.name ||
                                  "N/A"}
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
                              {complaint.assignedTo && (
                                <span
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                  }}
                                >
                                  👷{" "}
                                  {staffUsers.find(
                                    (s) => s._id === complaint.assignedTo
                                  )?.name ||
                                    staffUsers.find(
                                      (s) => s._id === complaint.assignedTo
                                    )?.phone ||
                                    "Assigned"}
                                </span>
                              )}
                              <span
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                              >
                                📞{" "}
                                {staffUsers.find(
                                  (s) => s._id === complaint.assignedTo
                                )?.phone || "N/A"}
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
                            {complaint.status.toLowerCase() === "pending" &&
                              staffUsers.length > 0 && (
                                <select
                                  onChange={(e) =>
                                    handleAssignComplaint(
                                      complaint._id,
                                      e.target.value
                                    )
                                  }
                                  defaultValue=""
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
                                  <option value="" disabled>
                                    Assign Staff
                                  </option>
                                  {staffUsers.map((staff) => (
                                    <option key={staff._id} value={staff._id}>
                                      {staff.name || staff.phone}
                                    </option>
                                  ))}
                                </select>
                              )}
                          </div>
                        </div>
                      </div>
                    );
                  } catch (e) {
                    console.error("Error rendering complaint:", complaint, e);
                    return (
                      <div key={complaint._id || `error-${index}`}>
                        <p style={{ color: "red", padding: "10px" }}>
                          Error displaying complaint ID:{" "}
                          {complaint._id || "Unknown"}. Check console for
                          details.
                        </p>
                      </div>
                    );
                  }
                })}
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

      {/* Add Staff Modal */}
      {showAddStaffModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "30px",
              borderRadius: "10px",
              width: "90%",
              maxWidth: "500px",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <h2 style={{ margin: 0, color: "#495057" }}>Add New Staff</h2>
              <button
                onClick={() => setShowAddStaffModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  color: "#6c757d",
                }}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleAddStaff}>
              {" "}
              {/* Add form and onSubmit handler */}
              {/* Name Field */}
              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "bold",
                    color: "#495057",
                  }}
                >
                  Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={newStaff.name}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, name: e.target.value })
                  }
                  required
                  disabled={loading}
                  placeholder="Enter staff name"
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #ced4da",
                    borderRadius: "5px",
                    fontSize: "16px",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              {/* Email Field */}
              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "bold",
                    color: "#495057",
                  }}
                >
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={newStaff.email}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, email: e.target.value })
                  }
                  required
                  disabled={loading}
                  placeholder="Enter staff email"
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #ced4da",
                    borderRadius: "5px",
                    fontSize: "16px",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              {/* Phone Number Field */}
              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "bold",
                    color: "#495057",
                  }}
                >
                  Phone Number *
                </label>
                <input
                  type="text"
                  name="phone"
                  value={newStaff.phone}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, phone: e.target.value })
                  }
                  required
                  disabled={loading}
                  placeholder="Enter staff phone number"
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #ced4da",
                    borderRadius: "5px",
                    fontSize: "16px",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              {/* Password Field */}
              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "bold",
                    color: "#495057",
                  }}
                >
                  Password *
                </label>
                <input
                  type="password"
                  name="password"
                  value={newStaff.password}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, password: e.target.value })
                  }
                  required
                  disabled={loading}
                  placeholder="Enter staff password"
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #ced4da",
                    borderRadius: "5px",
                    fontSize: "16px",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              {/* Address Field */}
              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "bold",
                    color: "#495057",
                  }}
                >
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={newStaff.address}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, address: e.target.value })
                  }
                  disabled={loading}
                  placeholder="Enter staff address (optional)"
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #ced4da",
                    borderRadius: "5px",
                    fontSize: "16px",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              {/* District Field */}
              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "bold",
                    color: "#495057",
                  }}
                >
                  District *
                </label>
                <select
                  name="district"
                  value={newStaff.district}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, district: e.target.value })
                  }
                  required
                  disabled={loading || districtsLoading}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #ced4da",
                    borderRadius: "5px",
                    fontSize: "16px",
                    boxSizing: "border-box",
                    backgroundColor:
                      loading || districtsLoading ? "#f0f0f0" : "white",
                    cursor:
                      loading || districtsLoading ? "not-allowed" : "pointer",
                  }}
                >
                  <option value="" disabled>
                    Select a district
                  </option>
                  {districts.map((district, index) => (
                    <option key={index} value={district}>
                      {district}
                    </option>
                  ))}
                </select>
              </div>
              {error && (
                <div
                  style={{
                    backgroundColor: "#f8d7da",
                    color: "#721c24",
                    padding: "10px",
                    borderRadius: "5px",
                    marginBottom: "20px",
                    border: "1px solid #f5c6cb",
                  }}
                >
                  {error}
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  disabled={loading}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#6c757d",
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                    cursor: loading ? "not-allowed" : "pointer",
                    fontSize: "16px",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || districtsLoading}
                  style={{
                    padding: "10px 20px",
                    backgroundColor:
                      loading || districtsLoading ? "#6c757d" : "#007bff",
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                    cursor:
                      loading || districtsLoading ? "not-allowed" : "pointer",
                    fontSize: "16px",
                    fontWeight: "bold",
                  }}
                >
                  {loading ? "Adding Staff..." : "Add Staff"}
                </button>
              </div>
            </form>{" "}
            {/* Close form tag */}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
