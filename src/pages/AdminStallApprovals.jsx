import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../styles.css";

function AdminStallApprovals() {
  const [stalls, setStalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const fetchStalls = async () => {
    try {
      const token = localStorage.getItem("ticketflowToken");

      if (!token) {
        throw new Error("Please log in as Admin first.");
      }

      const response = await fetch(
        "http://localhost:8080/api/stalls",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to load stalls (${response.status}).`
        );
      }

      const data = await response.json();
      setStalls(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      setError(err.message || "Could not load stalls.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStalls();
  }, []);

  const updateStatus = async (stallId, action) => {
    setMessage("");
    setError("");
    setUpdatingId(stallId);

    try {
      const token = localStorage.getItem("ticketflowToken");

      if (!token) {
        throw new Error("Please log in as Admin first.");
      }

      const response = await fetch(
        `http://localhost:8080/api/stalls/${stallId}/${action}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to ${action} stall (${response.status}).`
        );
      }

      setMessage(
        action === "approve"
          ? "Stall approved successfully."
          : "Stall rejected successfully."
      );

      await fetchStalls();
    } catch (err) {
      setError(err.message || `Could not ${action} stall.`);
    } finally {
      setUpdatingId(null);
    }
  };

  const pendingStalls = stalls.filter(
    (stall) => stall.status?.toUpperCase() === "PENDING"
  );

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div>
            <span className="section-label">
              ADMIN MANAGEMENT
            </span>
            <h1>Stall Approvals</h1>
            <p>Review and manage stall owner submissions.</p>
          </div>

          <Link to="/admin/dashboard" className="dashboard-home">
            ← Dashboard
          </Link>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-stat">
            <span>🏪</span>
            <strong>{stalls.length}</strong>
            <small>Total Stalls</small>
          </div>

          <div className="dashboard-stat">
            <span>⏳</span>
            <strong>{pendingStalls.length}</strong>
            <small>Pending Approval</small>
          </div>

          <div className="dashboard-stat">
            <span>✓</span>
            <strong>
              {
                stalls.filter(
                  (stall) =>
                    stall.status?.toUpperCase() === "APPROVED"
                ).length
              }
            </strong>
            <small>Approved</small>
          </div>

          <div className="dashboard-stat">
            <span>✕</span>
            <strong>
              {
                stalls.filter(
                  (stall) =>
                    stall.status?.toUpperCase() === "REJECTED"
                ).length
              }
            </strong>
            <small>Rejected</small>
          </div>
        </div>

        <div className="dashboard-section">
          <h2>Submitted Stalls</h2>

          {message && (
            <p role="status" style={{ color: "#15803d" }}>
              {message}
            </p>
          )}

          {error && (
            <p role="alert" style={{ color: "#dc2626" }}>
              {error}
            </p>
          )}

          {loading && <p>Loading stalls...</p>}

          {!loading && !error && stalls.length === 0 && (
            <p>No stalls have been submitted yet.</p>
          )}

          {!loading && !error && stalls.length > 0 && (
            <div className="dashboard-actions">
              {stalls.map((stall) => (
                <div
                  key={stall.id}
                  className="dashboard-action"
                  style={{ cursor: "default", minWidth: 0 }}
                >
                  <span>🏪</span>
                  <strong>{stall.stallName}</strong>

                  <small>
                    Description: {stall.description || "Not provided"}
                  </small>

                  <small>
                    Location: {stall.location || "Not specified"}
                  </small>

                  <small>
                    Owner:{" "}
                    {stall.owner
                      ? `${stall.owner.firstName || ""} ${
                          stall.owner.lastName || ""
                        }`.trim() || `User #${stall.owner.id}`
                      : "Unknown"}
                  </small>

                  <small>
                    Status: {stall.status || "Unknown"}
                  </small>

                  {stall.status?.toUpperCase() === "PENDING" && (
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        flexWrap: "wrap",
                        marginTop: "12px",
                      }}
                    >
                      <button
                        type="button"
                        className="register-btn"
                        disabled={updatingId !== null}
                        onClick={() =>
                          updateStatus(stall.id, "approve")
                        }
                      >
                        {updatingId === stall.id
                          ? "Updating..."
                          : "Approve"}
                      </button>

                      <button
                        type="button"
                        disabled={updatingId !== null}
                        onClick={() =>
                          updateStatus(stall.id, "reject")
                        }
                        style={{
                          background: "#dc2626",
                          color: "#fff",
                          border: "none",
                          borderRadius: "6px",
                          padding: "10px 14px",
                          cursor: "pointer",
                        }}
                      >
                        {updatingId === stall.id
                          ? "Updating..."
                          : "Reject"}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminStallApprovals;