import { useState } from "react";
import { Link } from "react-router-dom";
import "../styles.css";

function Login() {
  const [role, setRole] = useState("CUSTOMER");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    remember: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { id, value, checked, type } = e.target;

    setFormData((prev) => ({
      ...prev,
      [id]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:8080/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        }
      );

      const user = await response.json();

      if (!response.ok) {
        throw new Error(
          user.message || "Invalid email or password"
        );
      }

      // Verify that the selected account type matches the actual role.
      if (user.role !== role) {
        throw new Error(
          `This account is registered as ${user.role.replace(
            "_",
            " "
          )}. Please select the correct account type.`
        );
      }

      // Save the logged-in user and JWT token.
      localStorage.setItem(
        "ticketflowUser",
        JSON.stringify(user)
      );

      localStorage.setItem("ticketflowToken", user.token);
      localStorage.setItem("ticketflowLoggedIn", "true");

      alert(`Welcome back, ${user.firstName}!`);

      // Redirect according to the authenticated role.
      if (user.role === "CUSTOMER") {
        window.location.href = "/";
      } else if (user.role === "ORGANIZER") {
        window.location.href = "/organizer/dashboard";
      } else if (user.role === "STALL_OWNER") {
        window.location.href = "/stall-owner/dashboard";
      } else if (user.role === "ADMIN") {
        window.location.href = "/admin/dashboard";
      } else {
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Login error:", error);
      alert(error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <Link to="/" className="auth-brand">
          <span>🎟</span>
          TICKETFLOW
        </Link>

        <div className="auth-intro">
          <span className="section-label">WELCOME BACK</span>

          <h1>
            Your next
            <br />
            experience
            <br />
            <span>awaits.</span>
          </h1>

          <p>
            Sign in to discover events, manage your bookings,
            save your favourite venues and more.
          </p>
        </div>

        <div className="auth-feature">
          <span>✓</span>
          <div>
            <strong>One account. Everything TicketFlow.</strong>
            <p>Events, bookings, tickets and more in one place.</p>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-card-header">
            <span className="auth-mobile-brand">
              🎟 TICKETFLOW
            </span>

            <h2>Welcome back</h2>

            <p>Sign in to continue to TicketFlow.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Account type</label>

              <div className="role-grid">
                <button
                  type="button"
                  className={
                    role === "CUSTOMER"
                      ? "role-option active"
                      : "role-option"
                  }
                  onClick={() => setRole("CUSTOMER")}
                >
                  <span>🎟️</span>
                  <strong>Customer</strong>
                  <small>Book tickets</small>
                </button>

                <button
                  type="button"
                  className={
                    role === "ORGANIZER"
                      ? "role-option active"
                      : "role-option"
                  }
                  onClick={() => setRole("ORGANIZER")}
                >
                  <span>🎤</span>
                  <strong>Organizer</strong>
                  <small>Create events</small>
                </button>

                <button
                  type="button"
                  className={
                    role === "STALL_OWNER"
                      ? "role-option active"
                      : "role-option"
                  }
                  onClick={() => setRole("STALL_OWNER")}
                >
                  <span>🏪</span>
                  <strong>Stall Owner</strong>
                  <small>Manage stalls</small>
                </button>

                <button
                  type="button"
                  className={
                    role === "ADMIN"
                      ? "role-option active"
                      : "role-option"
                  }
                  onClick={() => setRole("ADMIN")}
                >
                  <span>🛡️</span>
                  <strong>Admin</strong>
                  <small>Manage TicketFlow</small>
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email address</label>

              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>

              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  style={{ width: "100%", paddingRight: "55px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  style={{
                    position: "absolute",
                    right: "10px",
                    background: "none",
                    border: "none",
                    color: "#64748b",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: "pointer",
                    padding: "4px 6px",
                  }}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <label className="remember-row">
              <input
                id="remember"
                type="checkbox"
                checked={formData.remember}
                onChange={handleChange}
              />

              <span>Remember me</span>
            </label>

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="auth-divider">
            <span>New to TicketFlow?</span>
          </div>

          <Link to="/register" className="auth-secondary">
            Create an account
          </Link>

          <Link to="/" className="back-home">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Login;