import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../styles.css";

function AvailableEvents() {
  const user = JSON.parse(
    localStorage.getItem("ticketflowUser") || "{}"
  );

  const [events, setEvents] = useState([]);
  const [stalls, setStalls] = useState([]);
  const [selectedStalls, setSelectedStalls] = useState({});
  const [stallMenus, setStallMenus] = useState({});
  const [loadingMenus, setLoadingMenus] = useState({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [applyingId, setApplyingId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user.id) {
          throw new Error("Please log in again.");
        }

        const token = localStorage.getItem("ticketflowToken");

        if (!token) {
          throw new Error("Login token missing. Please log in again.");
        }

        const [eventsResponse, stallsResponse] = await Promise.all([
          fetch("http://localhost:8080/api/events"),
          fetch(`http://localhost:8080/api/stalls/owner/${user.id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        if (!eventsResponse.ok || !stallsResponse.ok) {
          throw new Error("Failed to load events or stalls.");
        }

        const eventsData = await eventsResponse.json();
        const stallsData = await stallsResponse.json();

        // Only show events open for stalls (hasStalls === true)
        const allEvents = Array.isArray(eventsData) ? eventsData : [];
        setEvents(allEvents);

        setStalls(
          Array.isArray(stallsData)
            ? stallsData.filter((stall) =>
                ["APPROVED", "ACTIVE"].includes(
                  stall.status?.toUpperCase()
                )
              )
            : []
        );
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user.id]);

  // Load menu for a selected stall
  const handleStallSelect = async (eventId, stallId) => {
    setSelectedStalls((prev) => ({
      ...prev,
      [eventId]: stallId,
    }));

    if (!stallId) return;

    if (!stallMenus[stallId]) {
      try {
        setLoadingMenus((prev) => ({ ...prev, [stallId]: true }));
        const res = await fetch(`http://localhost:8080/api/stall-items/stall/${stallId}`);
        if (res.ok) {
          const items = await res.json();
          setStallMenus((prev) => ({ ...prev, [stallId]: Array.isArray(items) ? items : [] }));
        }
      } catch (err) {
        console.error("Failed to fetch stall menu:", err);
      } finally {
        setLoadingMenus((prev) => ({ ...prev, [stallId]: false }));
      }
    }
  };

  // Filter events: open for stalls (hasStalls === true) and matches search query
  const stallEvents = events.filter((event) => event.hasStalls === true);

  const filteredEvents = stallEvents.filter((event) => {
    const query = search.toLowerCase();
    return (
      (event.title || "").toLowerCase().includes(query) ||
      (event.category || "").toLowerCase().includes(query) ||
      (event.venue?.name || "").toLowerCase().includes(query)
    );
  });

  const applyForEvent = async (eventId) => {
    const stallId = selectedStalls[eventId];

    if (!stallId) {
      setError("Please select an approved stall first.");
      setMessage("");
      return;
    }

    setError("");
    setMessage("");
    setApplyingId(eventId);

    try {
      const response = await fetch(
        "http://localhost:8080/api/event-stalls",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("ticketflowToken")}`,
          },
          body: JSON.stringify({
            eventId: Number(eventId),
            stallId: Number(stallId),
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          errorText || "Unable to submit your application."
        );
      }

      setMessage(
        `✓ Application submitted with stall details and menu for "${
          events.find((event) => event.id === eventId)?.title || "the event"
        }". The organizer has been notified for review!`
      );
    } catch (err) {
      setError(
        err.message.includes("already applied")
          ? "This stall has already applied to that event."
          : err.message
      );
    } finally {
      setApplyingId(null);
    }
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div>
            <span className="section-label">STALL MANAGEMENT</span>
            <h1>Available Events for Stalls</h1>
            <p>
              Events where organizers have enabled stalls and invited applications.
            </p>
          </div>

          <Link to="/stall-owner/dashboard" className="dashboard-home">
            ← Dashboard
          </Link>
        </div>

        <div className="dashboard-section">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events open for stalls..."
            aria-label="Search events"
            style={{
              width: "100%",
              maxWidth: "500px",
              padding: "12px",
              marginBottom: "24px",
              border: "1px solid #dbe3ef",
              borderRadius: "8px",
              boxSizing: "border-box",
            }}
          />

          {message && (
            <div
              style={{
                background: "#ecfdf5",
                border: "1px solid #10b981",
                color: "#065f46",
                padding: "14px 18px",
                borderRadius: "10px",
                marginBottom: "20px",
                fontSize: "14px",
              }}
            >
              {message}{" "}
              <Link
                to="/stall-owner/applications"
                style={{ fontWeight: "700", color: "#047857", marginLeft: "8px" }}
              >
                View your applications →
              </Link>
            </div>
          )}

          {error && (
            <p role="alert" style={{ color: "#dc2626", marginBottom: "16px" }}>
              ✕ {error}
            </p>
          )}

          {!loading && stalls.length === 0 && (
            <div
              style={{
                background: "#fffbeb",
                border: "1px solid #fde68a",
                color: "#92400e",
                padding: "14px 18px",
                borderRadius: "10px",
                marginBottom: "20px",
              }}
            >
              ⚠️ You need an approved stall before applying to events.{" "}
              <Link
                to="/stall-owner/add"
                style={{ color: "#b45309", fontWeight: "700", marginLeft: "6px" }}
              >
                Register a Stall here →
              </Link>
            </div>
          )}

          {loading && <p>Loading events open for stalls...</p>}

          {!loading && !error && filteredEvents.length === 0 && (
            <div
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                padding: "36px 20px",
                textAlign: "center",
                color: "#64748b",
              }}
            >
              <span style={{ fontSize: "36px", display: "block", marginBottom: "10px" }}>🎪</span>
              <h3>No events open for stalls right now</h3>
              <p style={{ margin: "6px 0 0" }}>
                When organizers create an event with "Want stalls for this event: Yes", it will appear here instantly!
              </p>
            </div>
          )}

          {!loading && filteredEvents.length > 0 && (
            <div className="dashboard-actions">
              {filteredEvents.map((event) => {
                const selectedStallId = selectedStalls[event.id];
                const itemsForStall = selectedStallId ? stallMenus[selectedStallId] || [] : [];
                const isLoadingMenu = selectedStallId && loadingMenus[selectedStallId];

                return (
                  <div
                    key={event.id}
                    className="dashboard-action"
                    style={{ cursor: "default", minWidth: 0, padding: "20px" }}
                  >
                    {event.imageUrl ? (
                      <img
                        src={event.imageUrl}
                        alt={event.title}
                        style={{
                          width: "100%",
                          height: "150px",
                          objectFit: "cover",
                          borderRadius: "8px",
                          marginBottom: "12px",
                        }}
                      />
                    ) : (
                      <span>🎪</span>
                    )}

                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                      <span
                        style={{
                          background: "#ecfdf5",
                          color: "#059669",
                          fontSize: "11px",
                          fontWeight: "700",
                          padding: "3px 8px",
                          borderRadius: "999px",
                          border: "1px solid #10b981",
                        }}
                      >
                        ✓ Stalls Invited
                      </span>
                      <span
                        style={{
                          background: "#f1f5f9",
                          color: "#475569",
                          fontSize: "11px",
                          fontWeight: "600",
                          padding: "3px 8px",
                          borderRadius: "999px",
                        }}
                      >
                        {event.category || "Event"}
                      </span>
                    </div>

                    <strong style={{ fontSize: "17px", color: "#0f172a" }}>{event.title}</strong>

                    <small style={{ color: "#475569", marginTop: "4px" }}>
                      📅 Date: {event.eventDate || "Not specified"} | ⏰ {event.startTime || ""}
                    </small>

                    <small style={{ color: "#475569" }}>
                      📍 Venue: {event.venue?.name || "Not specified"}
                    </small>

                    {event.description && (
                      <small style={{ color: "#64748b", margin: "6px 0" }}>
                        {event.description}
                      </small>
                    )}

                    {/* SELECT STALL TO APPLY */}
                    <div style={{ marginTop: "14px", borderTop: "1px solid #e2e8f0", paddingTop: "14px" }}>
                      <label
                        htmlFor={`stall-${event.id}`}
                        style={{
                          display: "block",
                          fontSize: "13px",
                          fontWeight: "700",
                          color: "#1e293b",
                          marginBottom: "6px",
                        }}
                      >
                        Select your stall to apply:
                      </label>

                      <select
                        id={`stall-${event.id}`}
                        value={selectedStalls[event.id] || ""}
                        onChange={(e) => handleStallSelect(event.id, e.target.value)}
                        disabled={stalls.length === 0}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          border: "1px solid #cbd5e1",
                          borderRadius: "8px",
                          marginBottom: "10px",
                          fontSize: "14px",
                          background: "#ffffff",
                        }}
                      >
                        <option value="">-- Choose an approved stall --</option>
                        {stalls.map((stall) => (
                          <option key={stall.id} value={stall.id}>
                            {stall.stallName} ({stall.location || "Stall"})
                          </option>
                        ))}
                      </select>

                      {/* MENU PREVIEW FOR SELECTED STALL */}
                      {selectedStallId && (
                        <div
                          style={{
                            background: "#f8fafc",
                            border: "1px solid #e2e8f0",
                            borderRadius: "8px",
                            padding: "10px 12px",
                            marginBottom: "12px",
                            fontSize: "12px",
                          }}
                        >
                          <div style={{ fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                            📋 Menu submitted with this stall:
                          </div>
                          {isLoadingMenu ? (
                            <span style={{ color: "#64748b" }}>Loading menu...</span>
                          ) : itemsForStall.length === 0 ? (
                            <div style={{ color: "#d97706" }}>
                              ⚠️ No menu items added to this stall yet.{" "}
                              <Link to="/stall-owner/stalls" style={{ color: "#b45309", fontWeight: "600" }}>
                                Add menu items in My Stalls
                              </Link>
                            </div>
                          ) : (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                              {itemsForStall.map((item) => (
                                <span
                                  key={item.id}
                                  style={{
                                    background: "#ffffff",
                                    border: "1px solid #cbd5e1",
                                    borderRadius: "4px",
                                    padding: "2px 6px",
                                    color: "#1e293b",
                                  }}
                                >
                                  {item.itemName} (₹{item.price})
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      <button
                        type="button"
                        className="register-btn"
                        disabled={
                          stalls.length === 0 ||
                          !selectedStalls[event.id] ||
                          applyingId !== null
                        }
                        onClick={() => applyForEvent(event.id)}
                        style={{
                          width: "100%",
                          padding: "10px",
                          fontWeight: "700",
                          borderRadius: "8px",
                          cursor: !selectedStalls[event.id] ? "not-allowed" : "pointer",
                        }}
                      >
                        {applyingId === event.id
                          ? "Submitting Application..."
                          : "Apply with Stall & Menu"}
                      </button>
                    </div>
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

export default AvailableEvents;
