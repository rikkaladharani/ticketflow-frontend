import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import NotificationDropdown from "./NotificationDropdown";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("ticketflowUser");
      if (saved) {
        setUser(JSON.parse(saved));
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem("ticketflowToken");
    localStorage.removeItem("ticketflowUser");
    setUser(null);
    navigate("/login");
  };

  const getDashboardLink = () => {
    if (!user) return "/";
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

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="navbar-brand-section">
          <Link to="/" className="navbar-logo">
            TICKET<span>FLOW</span>
          </Link>
          {user && (
            <span className={`role-pill role-${user.role ? user.role.toLowerCase() : "user"}`}>
              {user.role}
            </span>
          )}
        </div>

        <div className={`navbar-links ${mobileMenuOpen ? "open" : ""}`}>
          <Link to="/" className={location.pathname === "/" ? "active" : ""}>
            Home
          </Link>
          <Link to="/events" className={location.pathname === "/events" ? "active" : ""}>
            Browse Events
          </Link>

          {user && user.role === "CUSTOMER" && (
            <>
              <Link
                to="/customer/tickets"
                className={location.pathname.startsWith("/customer/tickets") ? "active" : ""}
              >
                My Tickets
              </Link>
              <Link
                to="/customer/wishlist"
                className={location.pathname === "/customer/wishlist" ? "active" : ""}
              >
                Wishlist
              </Link>
            </>
          )}

          {user && user.role === "ORGANIZER" && (
            <>
              <Link
                to="/organizer/dashboard"
                className={location.pathname === "/organizer/dashboard" ? "active" : ""}
              >
                Dashboard
              </Link>
              <Link
                to="/organizer/check-in"
                className={location.pathname === "/organizer/check-in" ? "active" : ""}
              >
                QR Check-In
              </Link>
              <Link
                to="/organizer/create-event"
                className={location.pathname === "/organizer/create-event" ? "active" : ""}
              >
                + Create Event
              </Link>
            </>
          )}

          {user && user.role === "STALL_OWNER" && (
            <>
              <Link
                to="/stall-owner/dashboard"
                className={location.pathname === "/stall-owner/dashboard" ? "active" : ""}
              >
                Dashboard
              </Link>
              <Link
                to="/stall-owner/stalls"
                className={location.pathname === "/stall-owner/stalls" ? "active" : ""}
              >
                My Stalls
              </Link>
              <Link
                to="/stall-owner/events"
                className={location.pathname === "/stall-owner/events" ? "active" : ""}
              >
                Available Events
              </Link>
            </>
          )}

          {user && user.role === "ADMIN" && (
            <>
              <Link
                to="/admin/dashboard"
                className={location.pathname === "/admin/dashboard" ? "active" : ""}
              >
                Dashboard
              </Link>
              <Link
                to="/admin/users"
                className={location.pathname === "/admin/users" ? "active" : ""}
              >
                Users
              </Link>
              <Link
                to="/admin/events"
                className={location.pathname === "/admin/events" ? "active" : ""}
              >
                Events
              </Link>
              <Link
                to="/admin/refunds"
                className={location.pathname === "/admin/refunds" ? "active" : ""}
              >
                Refunds
              </Link>
              <Link
                to="/admin/activity-logs"
                className={location.pathname === "/admin/activity-logs" ? "active" : ""}
              >
                Audit Logs
              </Link>
            </>
          )}
        </div>

        <div className="navbar-actions">
          {user ? (
            <div className="navbar-user-actions">
              <NotificationDropdown />
              <Link to={getDashboardLink()} className="user-profile-badge" title="Go to Dashboard">
                <span className="user-avatar">
                  {user.firstName ? user.firstName.charAt(0).toUpperCase() : "U"}
                </span>
                <span className="user-name-label">
                  {user.firstName || user.email?.split("@")[0] || "User"}
                </span>
              </Link>
              <Link to="/profile" className="profile-nav-link" title="My Profile & Settings">
                Profile
              </Link>
              <button type="button" onClick={handleLogout} className="logout-btn">
                Logout
              </button>
            </div>
          ) : (
            <div className="navbar-auth-buttons">
              <Link to="/login" className="login-btn-outline">
                Login
              </Link>
              <Link to="/register" className="register-btn-solid">
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
