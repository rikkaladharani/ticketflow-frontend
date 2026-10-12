import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import Navbar from "../components/Navbar";
import "../styles.css";

export default function AllEvents() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [ratings, setRatings] = useState({});

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await api.get("/events");
        const list = Array.isArray(res.data) ? res.data : [];
        setEvents(list);

        // Fetch rating summaries for all events
        list.forEach(async (evt) => {
          try {
            const rRes = await api.get(`/reviews/event/${evt.id}/rating`);
            setRatings((prev) => ({ ...prev, [evt.id]: rRes.data }));
          } catch {
            // ignore individual rating fetch error
          }
        });
      } catch (err) {
        console.error("Failed to load events:", err);
        setError(err.response?.data?.message || err.message || "Failed to load events");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const categories = ["ALL", "CONCERT", "SPORTS", "THEATRE", "FESTIVAL", "CONFERENCE", "OTHER"];

  const filteredEvents = events.filter((event) => {
    const term = search.toLowerCase();
    const title = (event.title || "").toLowerCase();
    const category = (event.category || "").toLowerCase();
    const venue = (event.venue?.name || "").toLowerCase();
    const city = (event.venue?.city || "").toLowerCase();

    const matchesSearch =
      title.includes(term) || category.includes(term) || venue.includes(term) || city.includes(term);

    const matchesCat =
      selectedCategory === "ALL" || (event.category || "").toUpperCase() === selectedCategory;

    return matchesSearch && matchesCat;
  });

  const handleBook = (eventId) => {
    const user = localStorage.getItem("ticketflowUser");
    if (!user) {
      navigate("/login");
      return;
    }
    navigate(`/customer/book/${eventId}`);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "Date TBA";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="all-events-page" style={{ minHeight: "100vh", background: "var(--background)" }}>
      <Navbar />

      <div style={{ maxWidth: "1280px", margin: "auto", padding: "40px 24px" }}>
        <div style={{ marginBottom: "30px" }}>
          <span className="section-label">EXPERIENCES</span>
          <h1>All Upcoming Events</h1>
          <p style={{ color: "var(--text-muted)" }}>
            Discover and book tickets for live concerts, sports matches, conferences, and theatre shows.
          </p>
        </div>

        {/* SEARCH & FILTERS */}
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "30px", alignItems: "center" }}>
          <input
            type="text"
            placeholder="Search events, venues, or locations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: "1",
              minWidth: "260px",
              padding: "12px 18px",
              borderRadius: "10px",
              border: "1px solid var(--border)",
              fontSize: "15px",
            }}
          />

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {categories.map((cat) => (
              <button
                type="button"
                key={cat}
                className={`filter-tab ${selectedCategory === cat ? "active" : ""}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div className="ticket-spinner" style={{ margin: "auto" }}></div>
            <p style={{ color: "var(--text-muted)", marginTop: "16px" }}>Loading live events from database...</p>
          </div>
        )}

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: "20px" }}>
            ✕ {error}
          </div>
        )}

        {!loading && !error && filteredEvents.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <span style={{ fontSize: "40px", display: "block", marginBottom: "12px" }}>🔍</span>
            <h3>No events found</h3>
            <p style={{ color: "var(--text-muted)" }}>Try searching for a different keyword or category.</p>
          </div>
        )}

        {!loading && !error && filteredEvents.length > 0 && (
          <div className="event-grid">
            {filteredEvents.map((event) => {
              const rSummary = ratings[event.id] || { averageRating: 0, reviewCount: 0 };

              return (
                <div className="event-card" key={event.id}>
                  {event.imageUrl && (
                    <div style={{ height: "180px", overflow: "hidden", position: "relative" }}>
                      <img
                        src={event.imageUrl}
                        alt={event.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                      <span
                        className="ticket-category"
                        style={{
                          position: "absolute",
                          top: "12px",
                          left: "12px",
                          background: "rgba(15, 23, 42, 0.8)",
                          color: "#fff",
                        }}
                      >
                        {event.category || "Event"}
                      </span>
                    </div>
                  )}

                  <div className="event-content" style={{ padding: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--primary)" }}>
                        📅 {formatDate(event.eventDate)}
                      </span>

                      {rSummary.reviewCount > 0 ? (
                        <span style={{ fontSize: "12px", fontWeight: "700", color: "#f59e0b" }}>
                          ⭐ {rSummary.averageRating} ({rSummary.reviewCount})
                        </span>
                      ) : (
                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>No reviews yet</span>
                      )}
                    </div>

                    <h3 style={{ fontSize: "18px", marginBottom: "8px" }}>{event.title}</h3>
                    <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "8px" }}>
                      📍 {event.venue?.name ? `${event.venue.name}, ${event.venue.city || ""}` : "Venue TBA"}
                    </p>

                    {event.hasStalls && (
                      <div style={{ marginBottom: "10px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            background: "#ecfdf5",
                            color: "#059669",
                            border: "1px solid #10b981",
                            borderRadius: "999px",
                            fontSize: "11px",
                            fontWeight: "700",
                            padding: "3px 10px",
                          }}
                        >
                          🍔 Food Stalls & Pre-Orders Available
                        </span>
                      </div>
                    )}

                    {event.description && (
                      <p style={{ fontSize: "13px", color: "#475569", marginBottom: "16px", display: "-webkit-box", WebkitLineClamp: "2", WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {event.description}
                      </p>
                    )}

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", paddingTop: "12px", borderTop: "1px solid var(--border)" }}>
                      <div>
                        <small style={{ display: "block", fontSize: "11px", color: "var(--text-muted)" }}>SEATS</small>
                        <strong style={{ fontSize: "14px" }}>Available Now</strong>
                      </div>

                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => handleBook(event.id)}
                      >
                        Book Seats →
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
