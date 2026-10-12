import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles.css";

function Register() {
  const navigate = useNavigate();

  const [role, setRole] = useState("CUSTOMER");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    terms: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    if (formData.password.length < 6) {
      alert("Password must contain at least 6 characters.");
      return;
    }

    if (!formData.terms) {
      alert("Please agree to the TicketFlow terms and conditions.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:8080/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            password: formData.password,
            role: role,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed.");
      }

      alert("Account created successfully!");

      navigate("/login");

    } catch (error) {
      alert(error.message || "Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left register-left">
        <Link to="/" className="auth-brand">
          <span>🎟</span>
          TICKETFLOW
        </Link>

        <div className="auth-intro">
          <span className="section-label">JOIN TICKETFLOW</span>

          <h1>
            Your event
            <br />
            journey
            <br />
            <span>starts here.</span>
          </h1>

          <p>
            Create your TicketFlow account and discover,
            organize or participate in unforgettable events.
          </p>
        </div>

        <div className="auth-feature-list">
          <div>
            <span>01</span>
            <strong>Discover events</strong>
          </div>

          <div>
            <span>02</span>
            <strong>Book your perfect seat</strong>
          </div>

          <div>
            <span>03</span>
            <strong>Manage your experiences</strong>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card register-card">
          <div className="auth-card-header">
            <span className="auth-mobile-brand">
              🎟 TICKETFLOW
            </span>

            <h2>Create your account</h2>

            <p>
              Choose how you want to use TicketFlow.
            </p>
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

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">First name</label>

                <input
                  id="firstName"
                  type="text"
                  placeholder="First name"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="lastName">Last name</label>

                <input
                  id="lastName"
                  type="text"
                  placeholder="Last name"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">
                Email address
              </label>

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
              <label htmlFor="phone">Phone number</label>

              <input
                id="phone"
                type="tel"
                placeholder="+91 XXXXX XXXXX"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="password">Password</label>

                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create password"
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
                      fontSize: "12px",
                      fontWeight: "600",
                      cursor: "pointer",
                      padding: "4px 6px",
                    }}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm password</label>

                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    style={{ width: "100%", paddingRight: "55px" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    style={{
                      position: "absolute",
                      right: "10px",
                      background: "none",
                      border: "none",
                      color: "#64748b",
                      fontSize: "12px",
                      fontWeight: "600",
                      cursor: "pointer",
                      padding: "4px 6px",
                    }}
                  >
                    {showConfirmPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
            </div>

            <label className="terms-row">
              <input
                id="terms"
                type="checkbox"
                checked={formData.terms}
                onChange={handleChange}
              />

              <span>
                I agree to the TicketFlow terms and conditions.
              </span>
            </label>

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <div className="auth-divider">
            <span>Already have an account?</span>
          </div>

          <Link to="/login" className="auth-secondary">
            Sign in
          </Link>

          <Link to="/" className="back-home">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Register;