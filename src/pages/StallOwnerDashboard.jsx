
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

function StallOwnerDashboard() {
  const [user] = useState(getSavedUser);
  const [stalls, setStalls] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      if (!user.id) {
        setError("Please log in again to view your dashboard.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
const token = localStorage.getItem("ticketflowToken");

if (!token) {
  throw new Error("Login token missing. Please log in again.");
}
        
const stallResponse = await fetch(
  `http://localhost:8080/api/stalls/owner/${user.id}`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);


        if (!stallResponse.ok) {
          throw new Error("Could not load your stalls.");
        }

        const stallData = await stallResponse.json();

        if (!Array.isArray(stallData)) {
          throw new Error("Unexpected response while loading stalls.");
        }

        
const applicationResponses = await Promise.all(
  stallData.map((stall) =>
    fetch(
      `http://localhost:8080/api/event-stalls/stall/${stall.id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )
  )
);


        if (applicationResponses.some((response) => !response.ok)) {
          throw new Error("Could not load your event applications.");
        }

        const applicationLists = await Promise.all(
          applicationResponses.map((response) => response.json())
        );

        const allApplications = applicationLists.flat();

        if (!cancelled) {
          setStalls(stallData);
          setApplications(allApplications);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.message || "Unable to load your dashboard."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [user.id, refreshKey]);

  const countStatus = (items, status) =>
    items.filter(
      (item) =>
        String(item.status || "PENDING").toUpperCase() === status
    ).length;

  const approvedStalls = countStatus(stalls, "APPROVED");
  const pendingStalls = countStatus(stalls, "PENDING");
  const rejectedStalls = countStatus(stalls, "REJECTED");

  const approvedApplications = countStatus(
    applications,
    "APPROVED"
  );
  const pendingApplications = countStatus(
    applications,
    "PENDING"
  );
  const rejectedApplications = countStatus(
    applications,
    "REJECTED"
  );

  function getEventName(application) {
    return application.event?.name ||
      application.event?.eventName ||
      `Event #${application.event?.id ?? "—"}`;
  }

  function getStallName(application) {
    return application.stall?.stallName || "My Stall";
  }

  return (
    <div className="dashboard-page">
      <Navbar />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div>
            <span className="section-label">
              STALL OWNER DASHBOARD
            </span>
            <h1>
              Welcome, {user.firstName || user.name || "Stall Owner"}!
            </h1>
            <p>Manage your stalls and event participation.</p>
          </div>

          <Link to="/" className="dashboard-home">
            ← Home
          </Link>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-stat">
            <span>🏪</span>
            <strong>{loading ? "—" : stalls.length}</strong>
            <small>My Stalls</small>
          </div>

          <div className="dashboard-stat">
            <span>✓</span>
            <strong>{loading ? "—" : approvedStalls}</strong>
            <small>Approved Stalls</small>
          </div>

          <div className="dashboard-stat">
            <span>⏳</span>
            <strong>{loading ? "—" : pendingStalls}</strong>
            <small>Pending Stalls</small>
          </div>

          <div className="dashboard-stat">
            <span>✕</span>
            <strong>{loading ? "—" : rejectedStalls}</strong>
            <small>Rejected Stalls</small>
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-stat">
            <span>📋</span>
            <strong>{loading ? "—" : applications.length}</strong>
            <small>Total Applications</small>
          </div>

          <div className="dashboard-stat">
            <span>✓</span>
            <strong>{loading ? "—" : approvedApplications}</strong>
            <small>Approved Applications</small>
          </div>

          <div className="dashboard-stat">
            <span>⏳</span>
            <strong>{loading ? "—" : pendingApplications}</strong>
            <small>Pending Applications</small>
          </div>

          <div className="dashboard-stat">
            <span>✕</span>
            <strong>{loading ? "—" : rejectedApplications}</strong>
            <small>Rejected Applications</small>
          </div>
        </div>

        {loading && <p>Loading your dashboard...</p>}

        {error && (
          <div className="dashboard-section" role="alert">
            <p>{error}</p>
            <button
              type="button"
              onClick={() => setRefreshKey((key) => key + 1)}
            >
              Try again
            </button>
          </div>
        )}

        <div className="dashboard-section">
          <h2>Stall Management</h2>

          <div className="dashboard-actions">
            <Link to="/stall-owner/add" className="dashboard-action">
              <span>➕</span>
              <strong>Add Stall</strong>
              <small>Create a stall listing</small>
            </Link>

            <Link to="/stall-owner/stalls" className="dashboard-action">
              <span>🏪</span>
              <strong>My Stalls</strong>
              <small>Manage your stalls</small>
            </Link>

            <Link to="/stall-owner/events" className="dashboard-action">
              <span>📅</span>
              <strong>Available Events</strong>
              <small>Find events accepting stalls</small>
            </Link>

            <Link
              to="/stall-owner/applications"
              className="dashboard-action"
            >
              <span>📋</span>
              <strong>Applications</strong>
              <small>Track event application statuses</small>
            </Link>

            <Link
              to="/stall-owner/profile"
              className="dashboard-action"
            >
              <span>👤</span>
              <strong>My Profile</strong>
              <small>Edit personal details & password</small>
            </Link>
          </div>
        </div>

        {!loading && !error && (
          <>
            <div className="dashboard-section">
              <h2>My Recent Stalls</h2>

              {stalls.length === 0 ? (
                <div>
                  <p>You haven't created any stalls yet.</p>
                  <Link
                    to="/stall-owner/add"
                    className="explore-btn"
                  >
                    Create your first stall
                  </Link>
                </div>
              ) : (
                stalls.map((stall) => (
                  <div
                    key={stall.id}
                    className="dashboard-action"
                    style={{ marginBottom: "12px" }}
                  >
                    <strong>{stall.stallName || "Unnamed Stall"}</strong>
                    <small>
                      {stall.location || "Location not specified"}
                    </small>
                    <small>
                      Status: {stall.status || "PENDING"}
                    </small>
                  </div>
                ))
              )}
            </div>

            <div className="dashboard-section">
              <h2>Recent Event Applications</h2>

              {applications.length === 0 ? (
                <p>
                  No event applications yet. Once your stall is
                  approved, you can apply to available events.
                </p>
              ) : (
                applications.slice(0, 10).map((application) => (
                  <div
                    key={application.id}
                    className="dashboard-action"
                    style={{ marginBottom: "12px" }}
                  >
                    <strong>{getEventName(application)}</strong>
                    <small>{getStallName(application)}</small>
                    <small>
                      Status: {application.status || "PENDING"}
                    </small>
                  </div>
                ))
              )}

              <Link
                to="/stall-owner/applications"
                className="explore-btn"
              >
                View All Applications
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default StallOwnerDashboard;
