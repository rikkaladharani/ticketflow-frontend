import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import Navbar from "../components/Navbar";
import "../styles.css";

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [actionSuccess, setActionSuccess] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/auth/users");
      const list = Array.isArray(response.data) ? response.data : [];
      setUsers(list);
    } catch (err) {
      console.error("Fetch users error:", err);
      setError(err.response?.data?.message || err.message || "Could not retrieve users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, currentRole) => {
    const roles = ["CUSTOMER", "ORGANIZER", "STALL_OWNER", "ADMIN"];
    const newRole = window.prompt(
      `Change role for user #${userId} (Current: ${currentRole}):\nOptions: ${roles.join(", ")}`
    );

    if (!newRole) return;
    const formatted = newRole.trim().toUpperCase();
    if (!roles.includes(formatted)) {
      alert("Invalid role. Must be one of: " + roles.join(", "));
      return;
    }

    try {
      setActionSuccess("");
      await api.put(`/auth/users/${userId}/role`, { role: formatted });
      setActionSuccess(`User #${userId} role updated to ${formatted}`);
      fetchUsers();
    } catch (err) {
      console.error("Change role error:", err);
      alert(err.response?.data?.message || err.message || "Failed to update role");
    }
  };

  const handleDeleteUser = async (userId, email) => {
    if (!window.confirm(`Are you sure you want to permanently delete user "${email}"?`)) {
      return;
    }

    try {
      setActionSuccess("");
      await api.delete(`/auth/users/${userId}`);
      setActionSuccess(`User ${email} deleted successfully`);
      fetchUsers();
    } catch (err) {
      console.error("Delete user error:", err);
      alert(err.response?.data?.message || err.message || "Failed to delete user");
    }
  };

  const filteredUsers = users.filter((u) => {
    const term = searchTerm.toLowerCase();
    const name = `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase();
    const email = (u.email || "").toLowerCase();
    const matchesSearch = name.includes(term) || email.includes(term);
    const matchesRole = roleFilter === "ALL" || (u.role || "").toUpperCase() === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="dashboard-page">
      <Navbar />

      <div className="dashboard-container">
        <div className="dashboard-header">
          <div>
            <span className="section-label">ADMIN DASHBOARD</span>
            <h1>Platform User Management</h1>
            <p>Manage all customer, organizer, stall owner, and administrator accounts.</p>
          </div>

          <Link to="/admin/dashboard" className="dashboard-home">
            ← Dashboard
          </Link>
        </div>

        {actionSuccess && (
          <div className="alert alert-success" style={{ margin: "16px 0", padding: "12px 18px", borderRadius: "8px", background: "#dcfce7", color: "#166534" }}>
            ✓ {actionSuccess}
          </div>
        )}

        <div className="dashboard-section">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "16px" }}>
            <div style={{ display: "flex", gap: "12px", flex: "1", maxWidth: "600px", flexWrap: "wrap" }}>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ flex: "1", minWidth: "200px", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--border)" }}
              />

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--border)" }}
              >
                <option value="ALL">All Roles ({users.length})</option>
                <option value="CUSTOMER">Customer</option>
                <option value="ORGANIZER">Organizer</option>
                <option value="STALL_OWNER">Stall Owner</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            <button type="button" className="btn-secondary" onClick={fetchUsers}>
              ↻ Refresh
            </button>
          </div>

          {loading && <p>Loading users...</p>}

          {error && <div className="alert alert-danger">{error}</div>}

          {!loading && !error && filteredUsers.length === 0 && (
            <p className="text-muted">No users found matching your search.</p>
          )}

          {!loading && !error && filteredUsers.length > 0 && (
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id}>
                      <td>#{u.id}</td>
                      <td>
                        <strong>
                          {[u.firstName, u.lastName].filter(Boolean).join(" ") || "—"}
                        </strong>
                      </td>
                      <td>{u.email}</td>
                      <td>
                        <span className={`role-pill role-${(u.role || "user").toLowerCase()}`}>
                          {u.role}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            type="button"
                            className="btn-secondary btn-sm"
                            onClick={() => handleRoleChange(u.id, u.role)}
                          >
                            Change Role
                          </button>
                          <button
                            type="button"
                            className="btn-danger btn-sm"
                            onClick={() => handleDeleteUser(u.id, u.email)}
                          >
                            Delete
                          </button>
                        </div>
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

export default AdminUsers;
