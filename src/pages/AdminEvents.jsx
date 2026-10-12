import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../styles.css";

const API = "http://localhost:8080/api/events";

function AdminEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [processingId, setProcessingId] = useState(null);
  const [filter, setFilter] = useState("ALL");

  const filteredEvents =
    filter === "ALL"
      ? events
      : events.filter(
          (event) =>
            (event.status || "").toUpperCase() === filter
        );

  async function loadEvents() {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("ticketflowToken");

      const response = await fetch(API, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch events (${response.status}).`
        );
      }

      const data = await response.json();
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Could not load events.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEvents();
  }, []);

  async function updateStatus(eventId, action) {
    const actionLabel = action === "approve" ? "approve" : "reject";

    if (
      !window.confirm(
        `Are you sure you want to ${actionLabel} this event?`
      )
    ) {
      return;
    }

    setProcessingId(eventId);
    setError("");
    setMessage("");

    try {
      const token = localStorage.getItem("ticketflowToken");

      const response = await fetch(
        `${API}/${eventId}/${action}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.message ||
            `Could not ${actionLabel} the event (${response.status}).`
        );
      }

      setMessage(
        `Event "${result?.title || "event"}" ${
          actionLabel === "approve" ? "approved" : "rejected"
        } successfully.`
      );

      await loadEvents();
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setProcessingId(null);
    }
  }

  function statusColor(status) {
    switch ((status || "").toUpperCase()) {
      case "APPROVED":
        return "#16803c";
      case "REJECTED":
        return "#c62828";
      case "PENDING":
        return "#a16207";
      default:
        return "#555";
    }
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div>
            <span className="section-label">ADMINISTRATION</span>
            <h1>Event Management</h1>
            <p>Review events submitted by organizers.</p>
          </div>

          <Link to="/admin/dashboard" className="dashboard-home">
            ← Dashboard
          </Link>
        </div>

        {message && (
          <div
            role="status"
            style={{ marginBottom: 16, color: "#16803c" }}
          >
            {message}
          </div>
        )}

        {error && (
          <div
            role="alert"
            style={{ marginBottom: 16, color: "#c62828" }}
          >
            {error}
          </div>
        )}

        <div className="dashboard-section">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
              marginBottom: 20,
            }}
          >
            <div>
              <h2>
                Event Management ({filteredEvents.length})
              </h2>

              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                  marginTop: 12,
                }}
              >
                {["ALL", "PENDING", "APPROVED", "REJECTED"].map(
                  (status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setFilter(status)}
                      style={{
                        padding: "8px 14px",
                        borderRadius: 8,
                        border: "1px solid #d1d5db",
                        cursor: "pointer",
                        background:
                          filter === status ? "#172554" : "#ffffff",
                        color:
                          filter === status ? "#ffffff" : "#374151",
                        fontWeight: 600,
                      }}
                    >
                      {status === "ALL" ? "All Events" : status}
                      {" ("}
                      {status === "ALL"
                        ? events.length
                        : events.filter(
                            (event) =>
                              (event.status || "").toUpperCase() ===
                              status
                          ).length}
                      {")"}
                    </button>
                  )
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={loadEvents}
              disabled={loading}
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>

          {loading ? (
            <p>Loading events...</p>
          ) : events.length === 0 ? (
            <p>No events found.</p>
          ) : filteredEvents.length === 0 ? (
            <p>No events match this status.</p>
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
                    <th style={{ padding: 12, textAlign: "left" }}>ID</th>
                    <th style={{ padding: 12, textAlign: "left" }}>Event</th>
                    <th style={{ padding: 12, textAlign: "left" }}>Date</th>
                    <th style={{ padding: 12, textAlign: "left" }}>Venue</th>
                    <th style={{ padding: 12, textAlign: "left" }}>
                      Organizer
                    </th>
                    <th style={{ padding: 12, textAlign: "left" }}>Status</th>
                    <th style={{ padding: 12, textAlign: "left" }}>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredEvents.map((event) => {
                    const status = (event.status || "").toUpperCase();

                    return (
                      <tr key={event.id}>
                        <td style={{ padding: 12 }}>{event.id}</td>

                        <td style={{ padding: 12 }}>
                          <strong>{event.title}</strong>
                          <div style={{ fontSize: 12, opacity: 0.75 }}>
                            {event.category}
                          </div>
                        </td>

                        <td style={{ padding: 12 }}>
                          {event.eventDate || "—"}
                          <div style={{ fontSize: 12, opacity: 0.75 }}>
                            {event.startTime || ""}
                          </div>
                        </td>

                        <td style={{ padding: 12 }}>
                          {event.venue?.name || "Not assigned"}
                        </td>

                        <td style={{ padding: 12 }}>
                          {event.organizer
                            ? `${event.organizer.firstName || ""} ${
                                event.organizer.lastName || ""
                              }`.trim() ||
                              event.organizer.email ||
                              "—"
                            : "—"}
                        </td>

                        <td style={{ padding: 12 }}>
                          <span
                            style={{
                              color: statusColor(status),
                              fontWeight: 700,
                            }}
                          >
                            {status || "UNKNOWN"}
                          </span>
                        </td>

                        <td style={{ padding: 12 }}>
                          {status === "PENDING" ? (
                            <div
                              style={{
                                display: "flex",
                                gap: 8,
                                flexWrap: "wrap",
                              }}
                            >
                              <button
                                type="button"
                                disabled={processingId !== null}
                                onClick={() =>
                                  updateStatus(event.id, "approve")
                                }
                              >
                                {processingId === event.id
                                  ? "Processing..."
                                  : "Approve"}
                              </button>

                              <button
                                type="button"
                                disabled={processingId !== null}
                                onClick={() =>
                                  updateStatus(event.id, "reject")
                                }
                              >
                                {processingId === event.id
                                  ? "Processing..."
                                  : "Reject"}
                              </button>
                            </div>
                          ) : (
                            <span>—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminEvents;