import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../styles.css";

function StallApplications() {
  const user = JSON.parse(
    localStorage.getItem("ticketflowUser") || "{}"
  );

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchApplications = async () => {
      if (!user.id) {
        setError("Please log in again to view your applications.");
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem("ticketflowToken");

if (!token) {
  throw new Error("Login token missing. Please log in again.");
}
        // Load stalls belonging to the logged-in owner.
        
const stallsResponse = await fetch(
  `http://localhost:8080/api/stalls/owner/${user.id}`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);


        if (!stallsResponse.ok) {
          throw new Error("Failed to load your stalls.");
        }

        const stalls = await stallsResponse.json();

        // Load applications associated with each stall.
        const applicationLists = await Promise.all(
          stalls.map(async (stall) => {
            
const response = await fetch(
  `http://localhost:8080/api/event-stalls/stall/${stall.id}`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);


            if (!response.ok) {
              throw new Error(
                `Failed to load applications for ${stall.stallName}.`
              );
            }

            const data = await response.json();

            return data.map((application) => ({
              ...application,
              stallName: stall.stallName,
            }));
          })
        );

        setApplications(applicationLists.flat());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [user.id]);

  const getStatusClass = (status) => {
    switch (status?.toUpperCase()) {
      case "APPROVED":
        return "approved";
      case "REJECTED":
        return "rejected";
      default:
        return "pending";
    }
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">

        <div className="dashboard-header">
          <div>
            <span className="section-label">
              STALL MANAGEMENT
            </span>
            <h1>Applications</h1>
            <p>Track your stall applications for events.</p>
          </div>

          <Link
            to="/stall-owner/dashboard"
            className="dashboard-home"
          >
            ← Dashboard
          </Link>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-stat">
            <span>📋</span>
            <strong>{applications.length}</strong>
            <small>Total Applications</small>
          </div>

          <div className="dashboard-stat">
            <span>⏳</span>
            <strong>
              {applications.filter(
                (a) => a.status?.toUpperCase() === "PENDING"
              ).length}
            </strong>
            <small>Pending</small>
          </div>

          <div className="dashboard-stat">
            <span>✓</span>
            <strong>
              {applications.filter(
                (a) => a.status?.toUpperCase() === "APPROVED"
              ).length}
            </strong>
            <small>Approved</small>
          </div>

          <div className="dashboard-stat">
            <span>✕</span>
            <strong>
              {applications.filter(
                (a) => a.status?.toUpperCase() === "REJECTED"
              ).length}
            </strong>
            <small>Rejected</small>
          </div>
        </div>

        <div className="dashboard-section">
          <h2>My Event Applications</h2>

          {loading && <p>Loading applications...</p>}

          {error && (
            <p role="alert" style={{ color: "#dc2626" }}>
              {error}
            </p>
          )}

          {!loading && !error && applications.length === 0 && (
            <div className="dashboard-action">
              <h3>No applications yet</h3>
              <p>
                You have not applied to any events with your stalls.
              </p>
              <p>
                Note: Your stall must be approved before you can apply.
              </p>

              <Link
                to="/stall-owner/events"
                className="dashboard-home"
              >
                Browse Events
              </Link>
            </div>
          )}

          {!loading && !error && applications.length > 0 && (
            <div className="dashboard-actions">
              {applications.map((application) => (
                <div
                  key={application.id}
                  className="dashboard-action"
                  style={{
                    cursor: "default",
                    minWidth: 0,
                  }}
                >
                  <span>📅</span>

                  <strong>
                    {application.event?.title || "Event"}
                  </strong>

                  <small>
                    Stall: {application.stallName}
                  </small>

                  <small>
                    Date:{" "}
                    {application.event?.eventDate || "Not specified"}
                  </small>

                  <small>
                    Venue:{" "}
                    {application.event?.venue?.name ||
                      "Not specified"}
                  </small>

                  <div style={{ marginTop: "12px" }}>
                    <span
                      className={`stall-status ${getStatusClass(
                        application.status
                      )}`}
                    >
                      {application.status || "PENDING"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default StallApplications;
