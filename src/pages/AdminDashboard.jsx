
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import "../styles.css";

function getSavedUser() {
  try {
    return JSON.parse(
      localStorage.getItem("ticketflowUser") || "{}"
    );
  } catch {
    return {};
  }
}

function AdminDashboard() {
  const [user] = useState(getSavedUser);

  const [counts, setCounts] = useState({
    users: null,
    events: null,
    venues: null,
    bookings: null,
    revenue: null,
  });

  const [errors, setErrors] = useState([]);

  useEffect(() => {
    let cancelled = false;

async function loadStatistics() {
  const token = localStorage.getItem("ticketflowToken");

  const endpoints = [
    ["users", "http://localhost:8080/api/auth/users"],
    ["events", "http://localhost:8080/api/events"],
    ["venues", "http://localhost:8080/api/venues"],
    [
      "bookingStats",
      "http://localhost:8080/api/bookings/admin/statistics",
    ],
  ];

  const results = await Promise.allSettled(
    endpoints.map(async ([key, url]) => {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`${key} request failed (${response.status})`);
      }

      const data = await response.json();

      if (key === "bookingStats") {
        if (
          typeof data.totalBookings !== "number" ||
          typeof data.totalRevenue !== "number"
        ) {
          throw new Error("Invalid booking statistics response");
        }

        return {
          key,
          bookings: data.totalBookings,
          revenue: data.totalRevenue,
        };
      }

      if (!Array.isArray(data)) {
        throw new Error(`Unexpected ${key} response`);
      }

      return { key, count: data.length };
    })
  );

  if (cancelled) return;

  const nextCounts = {
    users: null,
    events: null,
    venues: null,
    bookings: null,
    revenue: null,
  };

  const nextErrors = [];

  results.forEach((result, index) => {
    const key = endpoints[index][0];

    if (result.status === "fulfilled") {
      if (key === "bookingStats") {
        nextCounts.bookings = result.value.bookings;
        nextCounts.revenue = result.value.revenue;
      } else {
        nextCounts[result.value.key] = result.value.count;
      }
    } else {
      console.error(`Failed to load ${key}:`, result.reason);
      nextErrors.push(
        `Could not load ${key}: ${
          result.reason?.message || "Unknown error"
        }`
      );
    }
  });

  setCounts(nextCounts);
  setErrors(nextErrors);
}

    loadStatistics();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="dashboard-page">
      <Navbar />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div>
            <span className="section-label">ADMIN DASHBOARD</span>
            <h1>Welcome, {user.firstName || "Admin"}!</h1>
            <p>Manage the complete TicketFlow platform.</p>
          </div>

          <Link to="/" className="dashboard-home">
            ← Home
          </Link>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-stat">
            <span>👥</span>
            <strong>{counts.users ?? "—"}</strong>
            <small>Users</small>
          </div>

          <div className="dashboard-stat">
            <span>🎤</span>
            <strong>{counts.events ?? "—"}</strong>
            <small>Events</small>
          </div>

          <div className="dashboard-stat">
            <span>🎟️</span>
            <strong>{counts.bookings ?? "—"}</strong>
            <small>Bookings</small>
          </div>

          <div className="dashboard-stat">
            <span>₹</span>
            <strong>
              {counts.revenue === null
                ? "—"
                : `₹${Number(counts.revenue).toLocaleString("en-IN")}`}
            </strong>
            <small>Revenue</small>
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-stat">
            <span>🏟️</span>
            <strong>{counts.venues ?? "—"}</strong>
            <small>Venues</small>
          </div>
        </div>

        {errors.length > 0 && (
          <div className="dashboard-section" role="alert">
            {errors.map((message) => (
              <p key={message}>{message}</p>
            ))}

            <button
              type="button"
              onClick={() => window.location.reload()}
            >
              Try again
            </button>
          </div>
        )}

        <div className="dashboard-section">
          <h2>Platform Management</h2>

          <div className="dashboard-actions">
            <Link to="/admin/users" className="dashboard-action">
              <span>👥</span>
              <strong>Users</strong>
              <small>Manage platform users</small>
            </Link>

            <Link
              to="/admin/stall-approvals"
              className="dashboard-action"
            >
              <span>🏪</span>
              <strong>Stall Approvals</strong>
              <small>Approve or reject stall submissions</small>
            </Link>

            <Link to="/admin/events" className="dashboard-action">
  <span>🎤</span>
  <strong>Events</strong>
  <small>Approve and manage events</small>
</Link>

            <Link to="/admin/venues" className="dashboard-action">
  <span>🏟️</span>
  <strong>Venues</strong>
  <small>Manage venues and layouts</small>
</Link>

            <Link to="/admin/analytics" className="dashboard-action">
  <span>📊</span>
  <strong>Analytics</strong>
  <small>View platform statistics</small>
</Link>

            <Link to="/admin/refunds" className="dashboard-action">
  <span>💰</span>
  <strong>Refunds</strong>
  <small>Process ticket cancellations & refunds</small>
</Link>

            <Link to="/admin/activity-logs" className="dashboard-action">
  <span>📜</span>
  <strong>Audit Logs</strong>
  <small>Track platform activity & check-ins</small>
</Link>

            <Link to="/admin/profile" className="dashboard-action">
  <span>👤</span>
  <strong>Admin Profile</strong>
  <small>Personal details & password</small>
</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
