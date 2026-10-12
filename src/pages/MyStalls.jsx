import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../styles.css";

function MyStalls() {
  const user = JSON.parse(
    localStorage.getItem("ticketflowUser") || "{}"
  );

  const [stalls, setStalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Menu items modal state
  const [activeStall, setActiveStall] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [itemError, setItemError] = useState("");
  const [itemSuccess, setItemSuccess] = useState("");
  const [submittingItem, setSubmittingItem] = useState(false);

  const [itemForm, setItemForm] = useState({
    itemName: "",
    category: "FOOD",
    price: "",
    availableQuantity: "50",
    description: "",
  });

  const fetchStalls = async () => {
    if (!user.id) {
      setError("Please log in again to view your stalls.");
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("ticketflowToken");
      const response = await fetch(
        `http://localhost:8080/api/stalls/owner/${user.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to load your stalls.");
      }

      const data = await response.json();
      setStalls(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStalls();
  }, [user.id]);

  const loadMenuItems = async (stallId) => {
    try {
      setLoadingItems(true);
      setItemError("");
      const response = await fetch(
        `http://localhost:8080/api/stall-items/stall/${stallId}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch menu items.");
      }
      const data = await response.json();
      setMenuItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setItemError(err.message);
    } finally {
      setLoadingItems(false);
    }
  };

  const handleOpenMenuModal = (stall) => {
    setActiveStall(stall);
    setItemSuccess("");
    setItemError("");
    setItemForm({
      itemName: "",
      category: "FOOD",
      price: "",
      availableQuantity: "50",
      description: "",
    });
    loadMenuItems(stall.id);
  };

  const handleCloseMenuModal = () => {
    setActiveStall(null);
    setMenuItems([]);
    setItemError("");
    setItemSuccess("");
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!itemForm.itemName.trim()) {
      setItemError("Please enter an item name.");
      return;
    }
    if (!itemForm.price || Number(itemForm.price) <= 0) {
      setItemError("Please enter a valid price greater than 0.");
      return;
    }
    if (!itemForm.availableQuantity || Number(itemForm.availableQuantity) <= 0) {
      setItemError("Please enter a valid available quantity.");
      return;
    }

    setSubmittingItem(true);
    setItemError("");
    setItemSuccess("");

    try {
      const token = localStorage.getItem("ticketflowToken");
      const response = await fetch("http://localhost:8080/api/stall-items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          itemName: itemForm.itemName.trim(),
          category: itemForm.category,
          price: Number(itemForm.price),
          availableQuantity: Number(itemForm.availableQuantity),
          description: itemForm.description.trim(),
          stallId: activeStall.id,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to add menu item.");
      }

      setItemSuccess(`✓ "${itemForm.itemName.trim()}" added to stall menu!`);
      setItemForm({
        itemName: "",
        category: "FOOD",
        price: "",
        availableQuantity: "50",
        description: "",
      });
      await loadMenuItems(activeStall.id);
    } catch (err) {
      setItemError(err.message);
    } finally {
      setSubmittingItem(false);
    }
  };

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
            <span className="section-label">STALL MANAGEMENT</span>
            <h1>My Stalls</h1>
            <p>View your submitted stalls and manage their menu items.</p>
          </div>

          <Link to="/stall-owner/dashboard" className="dashboard-home">
            ← Dashboard
          </Link>
        </div>

        <div className="dashboard-section">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
              marginBottom: "20px",
            }}
          >
            <h2>My Stall Listings</h2>

            <Link to="/stall-owner/add" className="dashboard-home">
              + Add Stall
            </Link>
          </div>

          {loading && <p>Loading your stalls...</p>}

          {error && (
            <p role="alert" style={{ color: "#dc2626" }}>
              {error}
            </p>
          )}

          {!loading && !error && stalls.length === 0 && (
            <div className="dashboard-action">
              <h3>No stalls yet</h3>
              <p>
                You haven't submitted any stalls. Add your first stall to get started.
              </p>
              <Link to="/stall-owner/add" className="dashboard-home">
                Add Your First Stall
              </Link>
            </div>
          )}

          {!loading && !error && stalls.length > 0 && (
            <div className="dashboard-actions">
              {stalls.map((stall) => (
                <div
                  key={stall.id}
                  className="dashboard-action"
                  style={{
                    cursor: "default",
                    minWidth: 0,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <span>🏪</span>
                    <strong>{stall.stallName}</strong>
                    <small>{stall.description || "No description provided"}</small>
                    <small>Location: {stall.location || "Not specified"}</small>
                    <div style={{ marginTop: "12px" }}>
                      <span
                        className={`stall-status ${getStatusClass(
                          stall.status
                        )}`}
                      >
                        {stall.status || "PENDING"}
                      </span>
                    </div>
                  </div>

                  <div style={{ marginTop: "18px", borderTop: "1px solid #e2e8f0", paddingTop: "12px" }}>
                    <button
                      type="button"
                      onClick={() => handleOpenMenuModal(stall)}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        background: "#4f46e5",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "8px",
                        fontWeight: "600",
                        fontSize: "14px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                      }}
                    >
                      🍽️ Manage Menu Items
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* MENU ITEMS MODAL */}
        {activeStall && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(15, 23, 42, 0.65)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
              zIndex: 1000,
              backdropFilter: "blur(4px)",
            }}
          >
            <div
              style={{
                background: "#ffffff",
                borderRadius: "16px",
                width: "100%",
                maxWidth: "750px",
                maxHeight: "90vh",
                overflowY: "auto",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                padding: "28px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: "1px solid #e2e8f0",
                  paddingBottom: "16px",
                  marginBottom: "20px",
                }}
              >
                <div>
                  <h2 style={{ margin: "0 0 4px", fontSize: "20px", color: "#0f172a" }}>
                    🍽️ Menu for {activeStall.stallName}
                  </h2>
                  <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                    Add dishes, beverages, and pricing for event pre-orders.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCloseMenuModal}
                  style={{
                    background: "#f1f5f9",
                    border: "none",
                    borderRadius: "8px",
                    width: "36px",
                    height: "36px",
                    fontSize: "18px",
                    cursor: "pointer",
                    color: "#475569",
                  }}
                >
                  ✕
                </button>
              </div>

              {/* CURRENT MENU LIST */}
              <div style={{ marginBottom: "28px" }}>
                <h3 style={{ fontSize: "16px", marginBottom: "12px", color: "#1e293b" }}>
                  Current Menu Items ({menuItems.length})
                </h3>

                {loadingItems ? (
                  <p style={{ color: "#64748b" }}>Loading menu items...</p>
                ) : menuItems.length === 0 ? (
                  <div
                    style={{
                      background: "#f8fafc",
                      border: "1px dashed #cbd5e1",
                      borderRadius: "10px",
                      padding: "20px",
                      textAlign: "center",
                      color: "#64748b",
                    }}
                  >
                    No menu items added yet. Use the form below to add food/drink items!
                  </div>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                      gap: "12px",
                    }}
                  >
                    {menuItems.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          background: "#f8fafc",
                          border: "1px solid #e2e8f0",
                          borderRadius: "10px",
                          padding: "14px",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <strong style={{ fontSize: "15px", color: "#0f172a" }}>{item.itemName}</strong>
                          <span
                            style={{
                              fontSize: "11px",
                              background: "#e0e7ff",
                              color: "#4338ca",
                              padding: "2px 8px",
                              borderRadius: "6px",
                              fontWeight: "600",
                            }}
                          >
                            {item.category || "FOOD"}
                          </span>
                        </div>
                        <p style={{ margin: "4px 0 8px", fontSize: "12px", color: "#64748b" }}>
                          {item.description || "No description"}
                        </p>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                          <strong style={{ color: "#059669" }}>₹{item.price}</strong>
                          <span style={{ color: "#64748b" }}>Stock: {item.availableQuantity}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ADD NEW ITEM FORM */}
              <div
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  padding: "20px",
                }}
              >
                <h3 style={{ margin: "0 0 16px", fontSize: "16px", color: "#1e293b" }}>
                  + Add New Menu Item
                </h3>

                {itemSuccess && (
                  <div
                    style={{
                      background: "#dcfce7",
                      border: "1px solid #86efac",
                      color: "#166534",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      marginBottom: "14px",
                      fontSize: "13px",
                    }}
                  >
                    {itemSuccess}
                  </div>
                )}

                {itemError && (
                  <div
                    style={{
                      background: "#fee2e2",
                      border: "1px solid #fca5a5",
                      color: "#991b1b",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      marginBottom: "14px",
                      fontSize: "13px",
                    }}
                  >
                    ✕ {itemError}
                  </div>
                )}

                <form onSubmit={handleAddItem}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                      gap: "14px",
                      marginBottom: "14px",
                    }}
                  >
                    <div>
                      <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>
                        Item Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Special Masala Burger"
                        value={itemForm.itemName}
                        onChange={(e) => setItemForm({ ...itemForm, itemName: e.target.value })}
                        required
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: "8px",
                          border: "1px solid #cbd5e1",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>
                        Category *
                      </label>
                      <select
                        value={itemForm.category}
                        onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: "8px",
                          border: "1px solid #cbd5e1",
                          boxSizing: "border-box",
                          background: "#ffffff",
                        }}
                      >
                        <option value="FOOD">Food / Meal</option>
                        <option value="BEVERAGE">Beverage / Drink</option>
                        <option value="SNACK">Snack</option>
                        <option value="DESSERT">Dessert</option>
                        <option value="MERCHANDISE">Merchandise</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>
                        Price (₹) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="0.01"
                        placeholder="e.g. 150"
                        value={itemForm.price}
                        onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                        required
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: "8px",
                          border: "1px solid #cbd5e1",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>
                        Available Quantity *
                      </label>
                      <input
                        type="number"
                        min="1"
                        placeholder="e.g. 100"
                        value={itemForm.availableQuantity}
                        onChange={(e) => setItemForm({ ...itemForm, availableQuantity: e.target.value })}
                        required
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: "8px",
                          border: "1px solid #cbd5e1",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>
                      Description (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Served hot with fries and dip"
                      value={itemForm.description}
                      onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                    <button
                      type="button"
                      onClick={handleCloseMenuModal}
                      style={{
                        padding: "10px 18px",
                        background: "#e2e8f0",
                        color: "#334155",
                        border: "none",
                        borderRadius: "8px",
                        fontWeight: "600",
                        cursor: "pointer",
                      }}
                    >
                      Done
                    </button>
                    <button
                      type="submit"
                      disabled={submittingItem}
                      style={{
                        padding: "10px 20px",
                        background: "#10b981",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "8px",
                        fontWeight: "700",
                        cursor: "pointer",
                      }}
                    >
                      {submittingItem ? "Adding..." : "+ Add Item to Menu"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MyStalls;
