import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import "../styles.css";

function UserProfile() {
  const navigate = useNavigate();

  const getSavedUser = () => {
    try {
      return JSON.parse(localStorage.getItem("ticketflowUser") || "{}");
    } catch {
      return {};
    }
  };

  const [user, setUser] = useState(getSavedUser);

  // Profile Details Form State
  const [profileData, setProfileData] = useState({
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    email: user.email || "",
    phone: user.phone || "",
  });

  // Password Change Form State
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Password Visibility States (Zero emojis, clean Show / Hide text)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status & Feedback States
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  useEffect(() => {
    const saved = getSavedUser();
    if (!saved || !saved.id) {
      navigate("/login");
      return;
    }
    setUser(saved);
    setProfileData({
      firstName: saved.firstName || "",
      lastName: saved.lastName || "",
      email: saved.email || "",
      phone: saved.phone || "",
    });
  }, [navigate]);

  const handleProfileChange = (e) => {
    setProfileData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setProfileError("");
    setProfileSuccess("");
  };

  const handlePasswordChange = (e) => {
    setPasswordData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setPasswordError("");
    setPasswordSuccess("");
  };

  const getDashboardPath = () => {
    switch (user.role) {
      case "ADMIN":
        return "/admin/dashboard";
      case "ORGANIZER":
        return "/organizer/dashboard";
      case "STALL_OWNER":
        return "/stall-owner/dashboard";
      case "CUSTOMER":
      default:
        return "/customer/dashboard";
    }
  };

  const getRoleTitle = () => {
    switch (user.role) {
      case "ADMIN":
        return "ADMIN CONSOLE";
      case "ORGANIZER":
        return "ORGANIZER PORTAL";
      case "STALL_OWNER":
        return "STALL OWNER PORTAL";
      case "CUSTOMER":
      default:
        return "CUSTOMER ACCOUNT";
    }
  };

  // Submit Profile Information Changes
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileError("");
    setProfileSuccess("");

    if (!user.id) {
      setProfileError("Session expired. Please log in again.");
      return;
    }

    if (
      !profileData.firstName.trim() ||
      !profileData.lastName.trim() ||
      !profileData.email.trim() ||
      !profileData.phone.trim()
    ) {
      setProfileError("All personal fields are required.");
      return;
    }

    const token = localStorage.getItem("ticketflowToken");
    if (!token) {
      setProfileError("Your session has expired. Please log in again.");
      return;
    }

    try {
      setProfileLoading(true);
      const res = await fetch(`http://localhost:8080/api/auth/profile/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName: profileData.firstName.trim(),
          lastName: profileData.lastName.trim(),
          email: profileData.email.trim(),
          phone: profileData.phone.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to update profile details.");
      }

      const updatedUser = {
        ...user,
        ...data,
      };

      localStorage.setItem("ticketflowUser", JSON.stringify(updatedUser));
      setUser(updatedUser);
      setProfileSuccess("Personal details updated successfully!");
    } catch (err) {
      setProfileError(err.message || "Error updating personal details.");
    } finally {
      setProfileLoading(false);
    }
  };

  // Submit Password Change
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (!passwordData.currentPassword.trim()) {
      setPasswordError("Please enter your current password.");
      return;
    }

    if (!passwordData.newPassword.trim()) {
      setPasswordError("Please enter a new password.");
      return;
    }

    if (passwordData.newPassword.trim().length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("New password and confirm password do not match.");
      return;
    }

    const token = localStorage.getItem("ticketflowToken");
    if (!token) {
      setPasswordError("Your session has expired. Please log in again.");
      return;
    }

    try {
      setPasswordLoading(true);
      const res = await fetch(`http://localhost:8080/api/auth/profile/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName: profileData.firstName.trim() || user.firstName,
          lastName: profileData.lastName.trim() || user.lastName,
          email: profileData.email.trim() || user.email,
          phone: profileData.phone.trim() || user.phone,
          currentPassword: passwordData.currentPassword.trim(),
          newPassword: passwordData.newPassword.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to change password.");
      }

      setPasswordSuccess("Password changed successfully!");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    } catch (err) {
      setPasswordError(err.message || "Failed to change password.");
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="dashboard-page">
      <Navbar />

      <div className="dashboard-container">
        {/* Header Section */}
        <div className="dashboard-header">
          <div>
            <span className="section-label">{getRoleTitle()}</span>
            <h1>Account Settings & Profile</h1>
            <p>Manage your personal contact details and update your login password.</p>
          </div>

          <Link to={getDashboardPath()} className="dashboard-home">
            &larr; Back to Dashboard
          </Link>
        </div>

        {/* Profile Card Grid */}
        <div className="profile-grid-container">
          {/* Card 1: Personal Details */}
          <div className="profile-card">
            <div className="profile-card-header">
              <h2>Personal Information</h2>
              <p>Update your name, registered email address, and phone number.</p>
            </div>

            {profileError && (
              <div className="profile-alert profile-alert-error" role="alert">
                {profileError}
              </div>
            )}

            {profileSuccess && (
              <div className="profile-alert profile-alert-success" role="status">
                {profileSuccess}
              </div>
            )}

            <form onSubmit={handleProfileSubmit}>
              <div className="profile-form-group">
                <label htmlFor="userRole">Account Role</label>
                <input
                  id="userRole"
                  type="text"
                  value={user.role || "CUSTOMER"}
                  disabled
                  style={{
                    backgroundColor: "#f8fafc",
                    color: "#64748b",
                    cursor: "not-allowed",
                    fontWeight: "600",
                  }}
                />
              </div>

              <div className="profile-form-group">
                <label htmlFor="firstName">First Name</label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={profileData.firstName}
                  onChange={handleProfileChange}
                  placeholder="Enter first name"
                  required
                />
              </div>

              <div className="profile-form-group">
                <label htmlFor="lastName">Last Name</label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={profileData.lastName}
                  onChange={handleProfileChange}
                  placeholder="Enter last name"
                  required
                />
              </div>

              <div className="profile-form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={profileData.email}
                  onChange={handleProfileChange}
                  placeholder="name@example.com"
                  required
                />
              </div>

              <div className="profile-form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={profileData.phone}
                  onChange={handleProfileChange}
                  placeholder="Enter contact number"
                  required
                />
              </div>

              <button
                type="submit"
                className="register-btn"
                disabled={profileLoading}
                style={{ marginTop: "10px" }}
              >
                {profileLoading ? "Saving Details..." : "Save Personal Details"}
              </button>
            </form>
          </div>

          {/* Card 2: Password Management */}
          <div className="profile-card">
            <div className="profile-card-header">
              <h2>Change Password</h2>
              <p>Safely update your login password. Current password verification is required.</p>
            </div>

            {passwordError && (
              <div className="profile-alert profile-alert-error" role="alert">
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="profile-alert profile-alert-success" role="status">
                {passwordSuccess}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit}>
              <div className="profile-form-group">
                <label htmlFor="currentPassword">Current Password</label>
                <div className="profile-input-wrapper">
                  <input
                    id="currentPassword"
                    name="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter current password"
                    required
                  />
                  <button
                    type="button"
                    className="profile-toggle-btn"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div className="profile-form-group">
                <label htmlFor="newPassword">New Password</label>
                <div className="profile-input-wrapper">
                  <input
                    id="newPassword"
                    name="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter at least 6 characters"
                    required
                  />
                  <button
                    type="button"
                    className="profile-toggle-btn"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
              <p className="profile-hint">Password must contain a minimum of 6 characters.</p>

              <div className="profile-form-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <div className="profile-input-wrapper">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="Re-enter new password"
                    required
                  />
                  <button
                    type="button"
                    className="profile-toggle-btn"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="register-btn"
                disabled={passwordLoading}
                style={{ marginTop: "10px" }}
              >
                {passwordLoading ? "Updating Password..." : "Update Password"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserProfile;
