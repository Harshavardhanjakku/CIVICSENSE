import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../App.jsx"; // Import useAuth hook

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

const SignupForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    district: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [districts, setDistricts] = useState([]);
  const [districtsLoading, setDistrictsLoading] = useState(true);
  const [districtSearch, setDistrictSearch] = useState("");
  const [showDistrictDropdown, setShowDistrictDropdown] = useState(false);
  const [filteredDistricts, setFilteredDistricts] = useState([]);
  const districtInputRef = useRef(null);
  const districtDropdownRef = useRef(null);
  const navigate = useNavigate();
  const { token, userRole } = useAuth(); // Use useAuth to check if already logged in

  // New state for OTP
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState("");
  const [phoneNumber, setPhoneNumber] = useState(""); // New state for phone number

  // Redirect if already logged in as a user
  useEffect(() => {
    if (token && userRole === "user") {
      navigate("/user/dashboard");
    }
  }, [token, userRole, navigate]);

  // Fetch districts from API
  useEffect(() => {
    const fetchDistricts = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/districts`);
        if (response.data && Array.isArray(response.data)) {
          setDistricts(response.data);
          setFilteredDistricts(response.data);
        } else {
          console.error("Invalid districts data format:", response.data);
          setDistricts([]);
          setFilteredDistricts([]);
        }
      } catch (err) {
        console.error("Error fetching districts:", err);
        setDistricts([]);
        setFilteredDistricts([]);
      } finally {
        setDistrictsLoading(false);
      }
    };

    fetchDistricts();
  }, []);

  // Filter districts based on search input
  useEffect(() => {
    if (districtSearch.trim() === "") {
      setFilteredDistricts(districts);
    } else {
      const filtered = districts.filter(district =>
        district.toLowerCase().includes(districtSearch.toLowerCase())
      );
      setFilteredDistricts(filtered);
    }
  }, [districtSearch, districts]);

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (districtDropdownRef.current && !districtDropdownRef.current.contains(event.target)) {
        setShowDistrictDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleDistrictSearch = (e) => {
    const value = e.target.value;
    setDistrictSearch(value);
    setFormData({
      ...formData,
      district: value
    });
    setShowDistrictDropdown(true);
  };

  const handleDistrictSelect = (district) => {
    setFormData({
      ...formData,
      district: district
    });
    setDistrictSearch(district);
    setShowDistrictDropdown(false);
  };

  const handleDistrictFocus = (e) => {
    e.target.style.borderColor = "#1b4480";
    setShowDistrictDropdown(true);
  };

  const handleDistrictBlur = (e) => {
    e.target.style.borderColor = "#d6d6d6";
  };

  const handleInitiateRegistration = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    if (!formData.district) {
      setError("Please select your district");
      return;
    }

    // Check if the entered district exists in the list
    const districtExists = districts.some(district => 
      district.toLowerCase() === formData.district.toLowerCase()
    );
    
    if (!districtExists) {
      setError("Please select a valid district from the list");
      return;
    }

    setLoading(true);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, {
        name: formData.name,
        email: formData.email,
        phoneNumber: phoneNumber, // Include phone number
        password: formData.password,
        district: formData.district,
      });

      if (response.status === 200) {
        alert(response.data.message);
        setShowOtpInput(true); // Show OTP input after successful initiation
      } else {
        setError(response.data?.message || "Failed to initiate registration.");
      }
    } catch (err) {
      console.error("Signup initiation error:", err);
      if (err.response) {
        setError(err.response.data?.message || `Server error: ${err.response.status}`);
      } else if (err.request) {
        setError("Cannot connect to server. Please check if backend is running.");
      } else {
        setError("Registration initiation failed: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/verify-otp`, {
        phoneNumber,
        otp,
      });

      if (response.data.token) {
        alert(response.data.message);
        navigate("/login");
      } else {
        setError(response.data?.message || "OTP verification failed.");
      }
    } catch (err) {
      console.error("OTP verification error:", err);
      if (err.response) {
        setError(err.response.data?.message || `Server error: ${err.response.status}`);
      } else if (err.request) {
        setError("Cannot connect to server. Please check if backend is running.");
      } else {
        setError("OTP verification failed: " + err.message);
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

          {/* Navigation */}
          <nav style={{ display: "flex", gap: "24px", alignItems: "center" }}>
            <Link
              to="/login"
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
              Sign In
            </Link>
            <Link
              to="/admin/login"
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
              Admin Sign In
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
              Create Your Citizen Account
            </h2>

            <p
              style={{
                fontSize: "18px",
                color: "#565c65",
                marginBottom: "32px",
                lineHeight: "1.5",
              }}
            >
              Register for a citizen account to access municipal services,
              submit complaints, and track your service requests.
            </p>

            {/* Benefits List */}
            <div style={{ marginBottom: "40px" }}>
              <h3
                style={{
                  fontSize: "20px",
                  fontWeight: "600",
                  color: "#1b4480",
                  marginBottom: "16px",
                }}
              >
                With your citizen account, you can:
              </h3>
              <ul
                style={{
                  listStyle: "none",
                  padding: "0",
                  margin: "0",
                }}
              >
                <li
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "12px",
                    fontSize: "16px",
                    color: "#565c65",
                  }}
                >
                  <span
                    style={{
                      width: "24px",
                      height: "24px",
                      backgroundColor: "#00a91c",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: "12px",
                      color: "white",
                      fontSize: "14px",
                      fontWeight: "bold",
                    }}
                  >
                    ✓
                  </span>
                  Submit and track complaint requests
                </li>
                <li
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "12px",
                    fontSize: "16px",
                    color: "#565c65",
                  }}
                >
                  <span
                    style={{
                      width: "24px",
                      height: "24px",
                      backgroundColor: "#00a91c",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: "12px",
                      color: "white",
                      fontSize: "14px",
                      fontWeight: "bold",
                    }}
                  >
                    ✓
                  </span>
                  Receive status updates via email
                </li>
                <li
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "12px",
                    fontSize: "16px",
                    color: "#565c65",
                  }}
                >
                  <span
                    style={{
                      width: "24px",
                      height: "24px",
                      backgroundColor: "#00a91c",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: "12px",
                      color: "white",
                      fontSize: "14px",
                      fontWeight: "bold",
                    }}
                  >
                    ✓
                  </span>
                  Access your service history
                </li>
                <li
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "12px",
                    fontSize: "16px",
                    color: "#565c65",
                  }}
                >
                  <span
                    style={{
                      width: "24px",
                      height: "24px",
                      backgroundColor: "#00a91c",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: "12px",
                      color: "white",
                      fontSize: "14px",
                      fontWeight: "bold",
                    }}
                  >
                    ✓
                  </span>
                  Manage your profile information
                </li>
              </ul>
            </div>

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
                🔒 Secure & Private
              </h4>
              <p
                style={{
                  margin: "0",
                  fontSize: "14px",
                  color: "#565c65",
                  lineHeight: "1.4",
                }}
              >
                Your information is protected with government-grade security. We
                use encryption and follow federal privacy standards.
              </p>
            </div>

            {/* Privacy Notice */}
            <div
              style={{
                backgroundColor: "#f0f0f0",
                border: "1px solid #d6d6d6",
                borderRadius: "4px",
                padding: "16px",
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
                📋 Privacy & Terms
              </h4>
              <p
                style={{
                  margin: "0",
                  fontSize: "14px",
                  color: "#565c65",
                  lineHeight: "1.4",
                }}
              >
                By creating an account, you agree to our Terms of Service and
                Privacy Policy. Your data is collected and used in accordance
                with federal privacy laws.
              </p>
            </div>
          </div>

          {/* Right Side - Registration Form */}
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
                Create Account
              </h2>

              <form
                onSubmit={
                  showOtpInput ? handleVerifyOtp : handleInitiateRegistration
                }
              >
                {!showOtpInput ? (
                  <>
                    {/* Name Field */}
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
                        Full Name
                        <span style={{ color: "#d54309", marginLeft: "4px" }}>
                          *
                        </span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        disabled={loading}
                        placeholder="Enter your full name"
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
                        Email Address
                        <span style={{ color: "#d54309", marginLeft: "4px" }}>
                          *
                        </span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        disabled={loading}
                        placeholder="Enter your email address"
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

                    {/* Phone Number Field */}
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
                        name="phoneNumber"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        required
                        disabled={loading}
                        placeholder="Enter your phone number"
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
                        Password
                        <span style={{ color: "#d54309", marginLeft: "4px" }}>
                          *
                        </span>
                      </label>
                      <div style={{ position: "relative" }}>
                        <input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          required
                          disabled={loading}
                          placeholder="Create a strong password"
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
                            fontSize: "14px",
                            padding: "4px",
                          }}
                        >
                          {showPassword ? "Hide" : "Show"}
                        </button>
                      </div>
                      <p
                        style={{
                          margin: "4px 0 0 0",
                          fontSize: "12px",
                          color: "#565c65",
                        }}
                      >
                        Password must be at least 6 characters long
                      </p>
                    </div>

                    {/* Confirm Password Field */}
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
                        Confirm Password
                        <span style={{ color: "#d54309", marginLeft: "4px" }}>
                          *
                        </span>
                      </label>
                      <div style={{ position: "relative" }}>
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          required
                          disabled={loading}
                          placeholder="Confirm your password"
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
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          style={{
                            position: "absolute",
                            right: "12px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "#565c65",
                            fontSize: "14px",
                            padding: "4px",
                          }}
                        >
                          {showConfirmPassword ? "Hide" : "Show"}
                        </button>
                      </div>
                    </div>

                    {/* District Field - Searchable Dropdown */}
                    <div
                      style={{ marginBottom: "24px", position: "relative" }}
                      ref={districtDropdownRef}
                    >
                      <label
                        style={{
                          display: "block",
                          marginBottom: "8px",
                          fontSize: "16px",
                          fontWeight: "600",
                          color: "#1b4480",
                        }}
                      >
                        District
                        <span style={{ color: "#d54309", marginLeft: "4px" }}>
                          *
                        </span>
                      </label>
                      <div style={{ position: "relative" }}>
                        <input
                          ref={districtInputRef}
                          type="text"
                          value={districtSearch}
                          onChange={handleDistrictSearch}
                          onFocus={handleDistrictFocus}
                          onBlur={handleDistrictBlur}
                          disabled={loading || districtsLoading}
                          placeholder={
                            districtsLoading
                              ? "Loading districts..."
                              : "Type to search districts..."
                          }
                          style={{
                            width: "100%",
                            padding: "12px 40px 12px 16px",
                            border: "2px solid #d6d6d6",
                            borderRadius: "4px",
                            fontSize: "16px",
                            fontFamily: "inherit",
                            boxSizing: "border-box",
                            backgroundColor:
                              loading || districtsLoading ? "#f0f0f0" : "white",
                            outline: "none",
                            transition: "border-color 0.2s ease",
                          }}
                        />
                        <div
                          style={{
                            position: "absolute",
                            right: "12px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            color: "#565c65",
                            fontSize: "16px",
                            pointerEvents: "none",
                          }}
                        >
                          🔍
                        </div>
                      </div>

                      {/* Dropdown List */}
                      {showDistrictDropdown && filteredDistricts.length > 0 && (
                        <div
                          style={{
                            position: "absolute",
                            top: "100%",
                            left: "0",
                            right: "0",
                            backgroundColor: "white",
                            border: "1px solid #d6d6d6",
                            borderTop: "none",
                            borderRadius: "0 0 4px 4px",
                            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                            maxHeight: "200px",
                            overflowY: "auto",
                            zIndex: 1000,
                          }}
                        >
                          {filteredDistricts.map((district, index) => (
                            <div
                              key={index}
                              onClick={() => handleDistrictSelect(district)}
                              style={{
                                padding: "12px 16px",
                                cursor: "pointer",
                                fontSize: "16px",
                                color: "#1b4480",
                                borderBottom:
                                  index < filteredDistricts.length - 1
                                    ? "1px solid #f0f0f0"
                                    : "none",
                                transition: "background-color 0.2s ease",
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.backgroundColor = "#f0f0f0";
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.backgroundColor = "white";
                              }}
                            >
                              {district}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* No results message */}
                      {showDistrictDropdown &&
                        filteredDistricts.length === 0 &&
                        districtSearch.trim() !== "" && (
                          <div
                            style={{
                              position: "absolute",
                              top: "100%",
                              left: "0",
                              right: "0",
                              backgroundColor: "white",
                              border: "1px solid #d6d6d6",
                              borderTop: "none",
                              borderRadius: "0 0 4px 4px",
                              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                              padding: "12px 16px",
                              fontSize: "14px",
                              color: "#565c65",
                              zIndex: 1000,
                            }}
                          >
                            No districts found matching "{districtSearch}"
                          </div>
                        )}

                      <p
                        style={{
                          margin: "4px 0 0 0",
                          fontSize: "12px",
                          color: "#565c65",
                        }}
                      >
                        Type to search and select your district
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    {/* OTP Input Field */}
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
                        OTP
                        <span style={{ color: "#d54309", marginLeft: "4px" }}>
                          *
                        </span>
                      </label>
                      <input
                        type="text"
                        name="otp"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        required
                        disabled={loading}
                        placeholder="Enter the OTP sent to your phone"
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
                    <p
                      style={{
                        margin: "4px 0 20px 0",
                        fontSize: "12px",
                        color: "#565c65",
                        textAlign: "center",
                      }}
                    >
                      A one-time password has been sent to your phone number: **
                      {phoneNumber}**
                    </p>
                  </>
                )}

                {/* Error Message */}
                {error && (
                  <div
                    style={{
                      backgroundColor: "#f9dedc",
                      color: "#d54309",
                      padding: "12px 16px",
                      borderRadius: "4px",
                      marginBottom: "20px",
                      fontSize: "14px",
                      border: "1px solid #d54309",
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
                  disabled={loading || districtsLoading}
                  style={{
                    width: "100%",
                    padding: "16px",
                    backgroundColor:
                      loading || districtsLoading ? "#565c65" : "#00a91c",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    fontSize: "16px",
                    fontWeight: "600",
                    cursor:
                      loading || districtsLoading ? "not-allowed" : "pointer",
                    transition: "background-color 0.2s ease",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                  onMouseEnter={(e) => {
                    if (!loading && !districtsLoading) {
                      e.target.style.backgroundColor = "#008817";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading && !districtsLoading) {
                      e.target.style.backgroundColor = "#00a91c";
                    }
                  }}
                >
                  {loading
                    ? showOtpInput
                      ? "Verifying OTP..."
                      : "Initiating Registration..."
                    : showOtpInput
                    ? "Verify OTP"
                    : "Create Citizen Account"}
                </button>
              </form>

              {/* Footer Links */}
              <div
                style={{
                  marginTop: "24px",
                  paddingTop: "24px",
                  borderTop: "1px solid #d6d6d6",
                  textAlign: "center",
                }}
              >
                <p
                  style={{
                    margin: "0 0 16px 0",
                    fontSize: "14px",
                    color: "#565c65",
                  }}
                >
                  Already have a citizen account?
                </p>
                <Link
                  to="/login"
                  style={{
                    color: "#1b4480",
                    textDecoration: "none",
                    fontSize: "16px",
                    fontWeight: "600",
                    borderBottom: "1px solid #1b4480",
                    paddingBottom: "2px",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.color = "#0f3a6b";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.color = "#1b4480";
                  }}
                >
                  Sign in to your account
                </Link>
              </div>
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

export default SignupForm;
