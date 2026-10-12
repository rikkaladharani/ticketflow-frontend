import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../styles.css";

function AdminVenues() {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadVenues() {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("ticketflowToken");

      if (!token) {
        throw new Error("Please log in as Admin first.");
      }

      const response = await fetch(
        "http://localhost:8080/api/venues",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to load venues (${response.status}).`
        );
      }

      const data = await response.json();
      setVenues(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Could not load venues.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVenues();
  }, []);

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div>
            <span className="section-label">ADMINISTRATION</span>
            <h1>Venue Management</h1>
            <p>View venues registered on the TicketFlow platform.</p>
          </div>

          <Link to="/admin/dashboard" className="dashboard-home">
            ← Dashboard
          </Link>
        </div>

        {error && (
          <div
            role="alert"
            style={{ color: "#c62828", marginBottom: 16 }}
          >
            {error}
            <button
              type="button"
              onClick={loadVenues}
              style={{ marginLeft: 12 }}
            >
              Try again
            </button>
          </div>
        )}

        <div className="dashboard-section">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              marginBottom: 20,
              flexWrap: "wrap",
            }}
          >
            <h2>All Venues ({venues.length})</h2>

            <button
              type="button"
              onClick={loadVenues}
              disabled={loading}
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>

          {loading ? (
            <p>Loading venues...</p>
          ) : venues.length === 0 ? (
            <p>No venues found.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                }}
              >
                <thead>
                  <tr>
                    <th style={{ padding: 12, textAlign: "left" }}>
                      ID
                    </th>
                    <th style={{ padding: 12, textAlign: "left" }}>
                      Venue Name
                    </th>
                    <th style={{ padding: 12, textAlign: "left" }}>
                      City
                    </th>
                    <th style={{ padding: 12, textAlign: "left" }}>
                      Capacity
                    </th>
                    <th style={{ padding: 12, textAlign: "left" }}>
                      Layout
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {venues.map((venue) => (
                    <tr key={venue.id}>
                      <td style={{ padding: 12 }}>{venue.id}</td>
                      <td style={{ padding: 12 }}>
                        <strong>{venue.name || "—"}</strong>
                      </td>
                      <td style={{ padding: 12 }}>
                        {venue.city || "—"}
                      </td>
                      <td style={{ padding: 12 }}>
                        {venue.capacity ?? "—"}
                      </td>
                      <td style={{ padding: 12 }}>
                        {venue.layoutType || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminVenues;