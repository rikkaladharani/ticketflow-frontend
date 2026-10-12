import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import Navbar from "../components/Navbar";
import "../styles.css";

function AdminActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/activity-logs");
      setLogs(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to load logs:", err);
      setError(err.response?.data?.message || err.message || "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const getActionBadge = (action) => {
    switch (action) {
      case "TICKET_CHECKED_IN":
        return <span className="badge badge-success">✓ CHECK-IN</span>;
      case "BOOKING_CANCELLED":
        return <span className="badge badge-warning">⚠️ CANCELLATION</span>;
      case "REFUND_PROCESSED":
        return <span className="badge badge-primary">💰 REFUND</span>;
      case "EVENT_APPROVED":
      case "STALL_APPROVED":
        return <span className="badge badge-success">✓ APPROVED</span>;
      case "EVENT_REJECTED":
      case "STALL_REJECTED":
        return <span className="badge badge-danger">✕ REJECTED</span>;
      case "EVENT_REVIEWED":
        return <span className="badge badge-info">⭐ REVIEW</span>;
      default:
        return <span className="badge badge-secondary">{action}</span>;
    }
  };

  const filteredLogs = logs.filter((log) => {
    const term = searchTerm.toLowerCase();
    const action = (log.action || "").toLowerCase();
    const details = (log.details || "").toLowerCase();
    const userEmail = (log.user?.email || "").toLowerCase();
    return action.includes(term) || details.includes(term) || userEmail.includes(term);
  });

  return (
    <div className="dashboard-page">
      <Navbar />

      <div className="dashboard-container">
        <div className="dashboard-header">
          <div>
            <span className="section-label">AUDIT TRAIL</span>
            <h1>Platform Activity Logs</h1>
            <p>Real-time system audit logs for administrative actions, gate check-ins, cancellations, and approvals.</p>
          </div>

          <Link to="/admin/dashboard" className="dashboard-home">
            ← Admin Dashboard
          </Link>
        </div>

        <div className="dashboard-section">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
            <div style={{ flex: "1", maxWidth: "400px" }}>
              <input
                type="text"
                placeholder="Search by action, user, or detail..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-control"
                style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--border)" }}
              />
            </div>

            <button type="button" className="btn-secondary" onClick={loadLogs}>
              🔄 Refresh Logs
            </button>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          {loading ? (
            <p>Loading activity logs...</p>
          ) : filteredLogs.length === 0 ? (
            <p className="text-muted">No activity logs found.</p>
          ) : (
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Action</th>
                    <th>Actor / User</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ whiteSpace: "nowrap" }}>
                        {log.timestamp ? new Date(log.timestamp).toLocaleString("en-IN") : "—"}
                      </td>
                      <td>{getActionBadge(log.action)}</td>
                      <td>
                        <strong>{log.user?.email || "System"}</strong>
                        {log.user?.role && (
                          <small className="text-muted d-block" style={{ display: "block" }}>
                            ({log.user.role})
                          </small>
                        )}
                      </td>
                      <td>{log.details || "—"}</td>
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

export default AdminActivityLogs;
