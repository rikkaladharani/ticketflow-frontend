import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../styles.css";

const API = "http://localhost:8080/api";

function AdminAnalytics() {
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [venues, setVenues] = useState([]);
  const [bookingStats, setBookingStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAnalytics() {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("ticketflowToken");

      if (!token) {
        throw new Error("Please log in as Admin first.");
      }

      const endpoints = [
        `${API}/auth/users`,
        `${API}/events`,
        `${API}/venues`,
        `${API}/bookings/admin/statistics`,
      ];

      const responses = await Promise.all(
        endpoints.map((url) =>
          fetch(url, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
        )
      );

      const failedIndex = responses.findIndex(
        (response) => !response.ok
      );

      if (failedIndex !== -1) {
        throw new Error(
          `Statistics request failed (${responses[failedIndex].status}): ${
            endpoints[failedIndex]
          }`
        );
      }

      const [usersData, eventsData, venuesData, bookingData] =
        await Promise.all(
          responses.map((response) => response.json())
        );

      if (
        !Array.isArray(usersData) ||
        !Array.isArray(eventsData) ||
        !Array.isArray(venuesData) ||
        typeof bookingData.totalBookings !== "number" ||
        typeof bookingData.totalRevenue !== "number"
      ) {
        throw new Error(
          "The backend returned unexpected statistics."
        );
      }

      setUsers(usersData);
      setEvents(eventsData);
      setVenues(venuesData);
      setBookingStats(bookingData);
    } catch (err) {
      setError(err.message || "Unable to load analytics.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAnalytics();
  }, []);

  const userRoles = [
    "CUSTOMER",
    "ORGANIZER",
    "STALL_OWNER",
    "ADMIN",
  ];

  const eventStatuses = [
    "PENDING",
    "APPROVED",
    "REJECTED",
  ];

  const countBy = (items, field, value) =>
    items.filter(
      (item) =>
        (item[field] || "").toUpperCase() === value
    ).length;

  const totalCapacity = venues.reduce(
    (total, venue) =>
      total + (Number(venue.capacity) || 0),
    0
  );

  const formatNumber = (value) =>
    Number(value).toLocaleString("en-IN");

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div>
            <span className="section-label">
              ADMINISTRATION
            </span>
            <h1>Platform Analytics</h1>
            <p>
              Overview of users, events, bookings and venues.
            </p>
          </div>

          <Link
            to="/admin/dashboard"
            className="dashboard-home"
          >
            ← Dashboard
          </Link>
        </div>

        {error && (
          <div
            role="alert"
            style={{
              color: "#c62828",
              marginBottom: 16,
            }}
          >
            <p>{error}</p>
            <button
              type="button"
              onClick={loadAnalytics}
              disabled={loading}
            >
              Try again
            </button>
          </div>
        )}

        {loading ? (
          <div className="dashboard-section">
            <p>Loading analytics...</p>
          </div>
        ) : (
          <>
            <div className="dashboard-grid">
              <div className="dashboard-stat">
                <span>👥</span>
                <strong>{formatNumber(users.length)}</strong>
                <small>Total Users</small>
              </div>

              <div className="dashboard-stat">
                <span>🎤</span>
                <strong>{formatNumber(events.length)}</strong>
                <small>Total Events</small>
              </div>

              <div className="dashboard-stat">
                <span>🎟️</span>
                <strong>
                  {formatNumber(
                    bookingStats?.totalBookings ?? 0
                  )}
                </strong>
                <small>Total Bookings</small>
              </div>

              <div className="dashboard-stat">
                <span>₹</span>
                <strong>
                  ₹
                  {formatNumber(
                    bookingStats?.totalRevenue ?? 0
                  )}
                </strong>
                <small>Reported Revenue</small>
              </div>
            </div>

            <div className="dashboard-section">
              <h2>Users by Role</h2>

              <div className="dashboard-grid">
                {userRoles.map((role) => (
                  <div
                    className="dashboard-stat"
                    key={role}
                  >
                    <span>👤</span>
                    <strong>
                      {countBy(users, "role", role)}
                    </strong>
                    <small>{role.replace("_", " ")}</small>
                  </div>
                ))}
              </div>
            </div>

            <div className="dashboard-section">
              <h2>Events by Status</h2>

              <div className="dashboard-grid">
                {eventStatuses.map((status) => (
                  <div
                    className="dashboard-stat"
                    key={status}
                  >
                    <span>
                      {status === "APPROVED"
                        ? "✅"
                        : status === "REJECTED"
                        ? "❌"
                        : "⏳"}
                    </span>
                    <strong>
                      {countBy(events, "status", status)}
                    </strong>
                    <small>{status} Events</small>
                  </div>
                ))}
              </div>
            </div>

            <div className="dashboard-section">
              <h2>Venue Overview</h2>

              <p>
                Registered venues:{" "}
                <strong>{venues.length}</strong>
              </p>

              <p>
                Combined listed capacity:{" "}
                <strong>
                  {formatNumber(totalCapacity)}
                </strong>
              </p>

              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                  }}
                >
                  <thead>
                    <tr>
                      <th
                        style={{
                          padding: 12,
                          textAlign: "left",
                        }}
                      >
                        Venue
                      </th>
                      <th
                        style={{
                          padding: 12,
                          textAlign: "left",
                        }}
                      >
                        City
                      </th>
                      <th
                        style={{
                          padding: 12,
                          textAlign: "left",
                        }}
                      >
                        Capacity
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {venues.map((venue) => (
                      <tr key={venue.id}>
                        <td style={{ padding: 12 }}>
                          {venue.name || "—"}
                        </td>
                        <td style={{ padding: 12 }}>
                          {venue.city || "—"}
                        </td>
                        <td style={{ padding: 12 }}>
                          {formatNumber(
                            venue.capacity || 0
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="dashboard-section">
              <button
                type="button"
                onClick={loadAnalytics}
                disabled={loading}
              >
                Refresh Analytics
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AdminAnalytics;