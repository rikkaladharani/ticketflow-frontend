import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import Navbar from "../components/Navbar";
import "../styles.css";

function AdminRefunds() {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [processingId, setProcessingId] = useState(null);
  const [actionSuccess, setActionSuccess] = useState("");

  const loadRefunds = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/bookings/admin/refunds");
      setRefunds(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to load refunds:", err);
      setError(err.response?.data?.message || err.message || "Failed to load refund requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRefunds();
  }, []);

  const handleProcessRefund = async (refundId) => {
    if (!window.confirm("Are you sure you want to approve and process this refund?")) {
      return;
    }

    try {
      setProcessingId(refundId);
      setActionSuccess("");
      const res = await api.put(`/bookings/admin/refunds/${refundId}/process`);
      setActionSuccess(`Refund #${refundId} successfully processed! Ref: ${res.data.transactionReference}`);
      loadRefunds();
    } catch (err) {
      console.error("Process refund error:", err);
      alert(err.response?.data?.message || err.message || "Failed to process refund");
    } finally {
      setProcessingId(null);
    }
  };

  const filteredRefunds = refunds.filter((r) => {
    if (filter === "ALL") return true;
    return (r.status || "").toUpperCase() === filter;
  });

  const totalRequested = refunds.reduce((sum, r) => sum + (r.amount || 0), 0);
  const totalProcessed = refunds
    .filter((r) => (r.status || "").toUpperCase() === "PROCESSED")
    .reduce((sum, r) => sum + (r.amount || 0), 0);
  const pendingCount = refunds.filter((r) => (r.status || "").toUpperCase() === "REQUESTED").length;

  return (
    <div className="dashboard-page">
      <Navbar />

      <div className="dashboard-container">
        <div className="dashboard-header">
          <div>
            <span className="section-label">FINANCIAL ADMINISTRATION</span>
            <h1>Cancellations & Refunds</h1>
            <p>Manage customer ticket cancellation refund requests and disbursements.</p>
          </div>

          <Link to="/admin/dashboard" className="dashboard-home">
            ← Admin Dashboard
          </Link>
        </div>

        {/* METRICS */}
        <div className="dashboard-grid">
          <div className="dashboard-stat">
            <span>📋</span>
            <strong>{refunds.length}</strong>
            <small>Total Refund Requests</small>
          </div>

          <div className="dashboard-stat">
            <span>⏳</span>
            <strong style={{ color: "#f59e0b" }}>{pendingCount}</strong>
            <small>Pending Approval</small>
          </div>

          <div className="dashboard-stat">
            <span>💰</span>
            <strong style={{ color: "#22c55e" }}>
              ₹{Number(totalProcessed).toLocaleString("en-IN")}
            </strong>
            <small>Total Refunded</small>
          </div>

          <div className="dashboard-stat">
            <span>₹</span>
            <strong>₹{Number(totalRequested).toLocaleString("en-IN")}</strong>
            <small>Gross Claims</small>
          </div>
        </div>

        {actionSuccess && (
          <div className="alert alert-success" style={{ margin: "16px 0", padding: "12px 18px", borderRadius: "8px", background: "#dcfce7", color: "#166534" }}>
            ✓ {actionSuccess}
          </div>
        )}

        {error && (
          <div className="alert alert-danger" style={{ margin: "16px 0", padding: "12px 18px", borderRadius: "8px", background: "#fee2e2", color: "#991b1b" }}>
            ✕ {error}
          </div>
        )}

        {/* TABLE SECTION */}
        <div className="dashboard-section mt-4">
          <div className="section-heading-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2>Refund Requests ({filteredRefunds.length})</h2>

            <div className="filter-buttons" style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                className={`filter-tab ${filter === "ALL" ? "active" : ""}`}
                onClick={() => setFilter("ALL")}
              >
                All
              </button>
              <button
                type="button"
                className={`filter-tab ${filter === "REQUESTED" ? "active" : ""}`}
                onClick={() => setFilter("REQUESTED")}
              >
                Pending ({pendingCount})
              </button>
              <button
                type="button"
                className={`filter-tab ${filter === "PROCESSED" ? "active" : ""}`}
                onClick={() => setFilter("PROCESSED")}
              >
                Processed
              </button>
            </div>
          </div>

          {loading ? (
            <p>Loading refund records...</p>
          ) : filteredRefunds.length === 0 ? (
            <p className="text-muted">No refund requests found under this filter.</p>
          ) : (
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Refund ID</th>
                    <th>Booking Ref</th>
                    <th>Event</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Reason</th>
                    <th>Requested At</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRefunds.map((refund) => (
                    <tr key={refund.id}>
                      <td>#{refund.id}</td>
                      <td>
                        <strong>{refund.booking?.bookingReference || "—"}</strong>
                      </td>
                      <td>{refund.booking?.event?.title || "Event"}</td>
                      <td>
                        {refund.booking?.customer?.email ||
                          refund.booking?.customer?.firstName ||
                          "—"}
                      </td>
                      <td>
                        <strong>₹{Number(refund.amount || 0).toLocaleString("en-IN")}</strong>
                      </td>
                      <td style={{ maxWidth: "200px" }}>
                        <small>{refund.reason || "Customer requested"}</small>
                      </td>
                      <td>
                        {refund.requestedAt
                          ? new Date(refund.requestedAt).toLocaleDateString("en-IN")
                          : "—"}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            refund.status === "PROCESSED" ? "badge-success" : "badge-warning"
                          }`}
                        >
                          {refund.status}
                        </span>
                      </td>
                      <td>
                        {refund.status === "REQUESTED" ? (
                          <button
                            type="button"
                            className="btn-primary btn-sm"
                            disabled={processingId === refund.id}
                            onClick={() => handleProcessRefund(refund.id)}
                          >
                            {processingId === refund.id ? "Processing..." : "Process Refund"}
                          </button>
                        ) : (
                          <small className="text-muted">
                            Ref: {refund.transactionReference || "Completed"}
                          </small>
                        )}
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

export default AdminRefunds;
