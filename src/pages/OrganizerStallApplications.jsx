import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../styles.css";

function OrganizerStallApplications() {
  const [events, setEvents] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  // Stall menu preview state
  const [expandedMenus, setExpandedMenus] = useState({});
  const [stallMenus, setStallMenus] = useState({});
  const [loadingMenus, setLoadingMenus] = useState({});

  const fetchApplications = async () => {
    setLoading(true);
    setError("");

    try {
      const storedUser = localStorage.getItem("ticketflowUser");
      const token = localStorage.getItem("ticketflowToken");

      if (!storedUser) {
        throw new Error("Please log in to continue.");
      }

      if (!token) {
        throw new Error("Login token missing. Please log in again.");
      }

      const user = JSON.parse(storedUser);
      const organizerId = user.id;

      if (!organizerId || user.role !== "ORGANIZER") {
        throw new Error("Please log in with a valid organizer account.");
      }

      const authHeaders = {
        Authorization: `Bearer ${token}`,
      };

      const eventsResponse = await fetch(
        `http://localhost:8080/api/events/organizer/${organizerId}`,
        {
          headers: authHeaders,
        }
      );

      if (!eventsResponse.ok) {
        throw new Error("Unable to load your events.");
      }

      const fetchedEvents = await eventsResponse.json();

      if (!Array.isArray(fetchedEvents)) {
        throw new Error("Invalid events response from the server.");
      }

      setEvents(fetchedEvents);

      if (fetchedEvents.length === 0) {
        setApplications([]);
        return;
      }

      const results = await Promise.all(
        fetchedEvents.map(async (event) => {
          const response = await fetch(
            `http://localhost:8080/api/event-stalls/event/${event.id}`,
            {
              headers: authHeaders,
            }
          );

          if (!response.ok) {
            throw new Error(
              `Unable to load applications for ${event.title}.`
            );
          }

          const eventApplications = await response.json();

          if (!Array.isArray(eventApplications)) {
            return [];
          }

          return eventApplications.map((application) => ({
            ...application,
            eventTitle: event.title,
            eventDate: event.eventDate,
            venueName: event.venue?.name || "Venue not specified",
          }));
        })
      );

      setApplications(results.flat());
    } catch (err) {
      console.error("Failed to load stall applications:", err);
      setError(err.message || "Failed to load stall applications.");
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const toggleStallMenu = async (stallId) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [stallId]: !prev[stallId],
    }));

    if (!stallMenus[stallId]) {
      try {
        setLoadingMenus((prev) => ({ ...prev, [stallId]: true }));
        const res = await fetch(`http://localhost:8080/api/stall-items/stall/${stallId}`);
        if (res.ok) {
          const items = await res.json();
          setStallMenus((prev) => ({
            ...prev,
            [stallId]: Array.isArray(items) ? items : [],
          }));
        }
      } catch (err) {
        console.error("Failed to load stall items:", err);
      } finally {
        setLoadingMenus((prev) => ({ ...prev, [stallId]: false }));
      }
    }
  };

  const updateApplication = async (applicationId, action) => {
    setUpdatingId(applicationId);
    setError("");
    setMessage("");

    try {
      const storedUser = localStorage.getItem("ticketflowUser");
      const token = localStorage.getItem("ticketflowToken");

      if (!storedUser) {
        throw new Error("Please log in again.");
      }

      if (!token) {
        throw new Error("Login token missing. Please log in again.");
      }

      const user = JSON.parse(storedUser);

      if (!user.id || user.role !== "ORGANIZER") {
        throw new Error("Please log in with a valid organizer account.");
      }

      const response = await fetch(
        `http://localhost:8080/api/event-stalls/${applicationId}/${action}?organizerId=${user.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          text || `Failed to ${action} the application.`
        );
      }

      setMessage(
        action === "approve"
          ? "✓ Stall application approved! The stall owner has been notified, and this stall & menu are now active for customer pre-orders."
          : "Stall application rejected."
      );

      await fetchApplications();
    } catch (err) {
      setError(err.message || `Could not ${action} application.`);
    } finally {
      setUpdatingId(null);
    }
  };

  const countStatus = (status) =>
    applications.filter(
      (app) => app.status?.toUpperCase() === status.toUpperCase()
    ).length;

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div>
            <span className="section-label">ORGANIZER PANEL</span>
            <h1>Stall Applications & Menus</h1>
            <p>
              Review stalls and their food/product menus applying to your events.
            </p>
          </div>

          <Link to="/organizer/dashboard" className="dashboard-home">
            ← Dashboard
          </Link>
        </div>

        <div className="dashboard-stats">
          <div className="dashboard-stat">
            <span>🏪</span>
            <strong>{applications.length}</strong>
            <small>Total Applications</small>
          </div>

          <div className="dashboard-stat">
            <span>⏳</span>
            <strong>{countStatus("PENDING")}</strong>
            <small>Pending Review</small>
          </div>

          <div className="dashboard-stat">
            <span>✓</span>
            <strong>{countStatus("APPROVED")}</strong>
            <small>Approved Stalls</small>
          </div>

          <div className="dashboard-stat">
            <span>✕</span>
            <strong>{countStatus("REJECTED")}</strong>
            <small>Rejected</small>
          </div>
        </div>

        <div className="dashboard-section">
          <h2>Stall Applications for Your Events</h2>

          {message && (
            <div
              style={{
                background: "#ecfdf5",
                border: "1px solid #10b981",
                color: "#065f46",
                padding: "12px 18px",
                borderRadius: "8px",
                marginBottom: "16px",
              }}
            >
              {message}
            </div>
          )}

          {error && (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #f87171",
                color: "#991b1b",
                padding: "12px 18px",
                borderRadius: "8px",
                marginBottom: "16px",
              }}
            >
              ✕ {error}
            </div>
          )}

          {loading && <p>Loading applications...</p>}

          {!loading && !error && applications.length === 0 && (
            <div className="dashboard-action">
              <span>📋</span>
              <strong>No Applications Yet</strong>
              <small>When stall owners apply to your events with stalls enabled, their stalls and menus will appear here.</small>
              <small>Events found: {events.length}</small>
            </div>
          )}

          {!loading && applications.length > 0 && (
            <div className="dashboard-actions">
              {applications.map((application) => {
                const stallId = application.stall?.id;
                const isExpanded = stallId && expandedMenus[stallId];
                const items = stallId ? stallMenus[stallId] || [] : [];
                const isLoadingMenu = stallId && loadingMenus[stallId];

                return (
                  <div
                    key={application.id}
                    className="dashboard-action"
                    style={{ cursor: "default", minWidth: 0, padding: "20px" }}
                  >
                    <span>🏪</span>

                    <strong style={{ fontSize: "18px", color: "#0f172a" }}>
                      {application.stall?.stallName || "Stall"}
                    </strong>

                    <small style={{ color: "#475569" }}>
                      🎯 Event: <strong>{application.eventTitle}</strong>
                    </small>
                    <small style={{ color: "#475569" }}>
                      📅 Date: {application.eventDate || "Not specified"} | 📍 {application.venueName}
                    </small>
                    <small style={{ color: "#475569" }}>
                      📍 Location: {application.stall?.location || "Not specified"}
                    </small>
                    {application.stall?.description && (
                      <small style={{ color: "#64748b", margin: "4px 0" }}>
                        "{application.stall.description}"
                      </small>
                    )}

                    <div style={{ marginTop: "10px", marginBottom: "12px" }}>
                      <span
                        className={`stall-status ${
                          application.status?.toLowerCase() || "pending"
                        }`}
                      >
                        {application.status || "PENDING"}
                      </span>
                    </div>

                    {/* MENU PREVIEW TOGGLE */}
                    {stallId && (
                      <div
                        style={{
                          background: "#f8fafc",
                          border: "1px solid #e2e8f0",
                          borderRadius: "10px",
                          padding: "12px",
                          marginBottom: "14px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <span style={{ fontSize: "13px", fontWeight: "700", color: "#334155" }}>
                            🍽️ Stall Menu Preview
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleStallMenu(stallId)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#4f46e5",
                              fontWeight: "700",
                              fontSize: "12px",
                              cursor: "pointer",
                              textDecoration: "underline",
                            }}
                          >
                            {isExpanded ? "Hide Menu ▲" : "View Menu Items ▼"}
                          </button>
                        </div>

                        {isExpanded && (
                          <div style={{ marginTop: "10px", borderTop: "1px solid #e2e8f0", paddingTop: "8px" }}>
                            {isLoadingMenu ? (
                              <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>Loading menu...</p>
                            ) : items.length === 0 ? (
                              <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8" }}>No menu items listed yet.</p>
                            ) : (
                              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                {items.map((item) => (
                                  <div
                                    key={item.id}
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                      background: "#ffffff",
                                      padding: "6px 10px",
                                      borderRadius: "6px",
                                      border: "1px solid #cbd5e1",
                                      fontSize: "13px",
                                    }}
                                  >
                                    <div>
                                      <strong>{item.itemName}</strong>
                                      <span
                                        style={{
                                          marginLeft: "6px",
                                          fontSize: "11px",
                                          color: "#64748b",
                                        }}
                                      >
                                        ({item.category || "Item"})
                                      </span>
                                    </div>
                                    <div style={{ fontWeight: "700", color: "#059669" }}>
                                      ₹{item.price}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* APPROVE / REJECT BUTTONS */}
                    {application.status?.toUpperCase() === "PENDING" && (
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          flexWrap: "wrap",
                          marginTop: "auto",
                        }}
                      >
                        <button
                          type="button"
                          className="register-btn"
                          disabled={updatingId !== null}
                          onClick={() =>
                            updateApplication(application.id, "approve")
                          }
                          style={{
                            flex: 1,
                            padding: "10px",
                            background: "#10b981",
                            color: "#ffffff",
                            fontWeight: "700",
                            borderRadius: "8px",
                            border: "none",
                            cursor: "pointer",
                          }}
                        >
                          {updatingId === application.id
                            ? "Updating..."
                            : "✓ Approve Stall & Menu"}
                        </button>

                        <button
                          type="button"
                          disabled={updatingId !== null}
                          onClick={() =>
                            updateApplication(application.id, "reject")
                          }
                          style={{
                            background: "#ef4444",
                            color: "#fff",
                            border: "none",
                            borderRadius: "8px",
                            padding: "10px 14px",
                            fontWeight: "700",
                            cursor: "pointer",
                          }}
                        >
                          {updatingId === application.id
                            ? "..."
                            : "✕ Reject"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default OrganizerStallApplications;
