import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import "../styles.css";

function CustomerWishlist() {
  const [wishlist, setWishlist] = useState([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("ticketflowWishlist") || "[]"
      );
      setWishlist(Array.isArray(saved) ? saved : []);
    } catch {
      setWishlist([]);
    }
  }, []);

  const removeFromWishlist = (title) => {
    const updated = wishlist.filter((item) => item !== title);
    localStorage.setItem("ticketflowWishlist", JSON.stringify(updated));
    setWishlist(updated);
    window.dispatchEvent(new Event("wishlistUpdated"));
  };

  const clearAll = () => {
    localStorage.setItem("ticketflowWishlist", JSON.stringify([]));
    setWishlist([]);
    window.dispatchEvent(new Event("wishlistUpdated"));
  };

  return (
    <div className="dashboard-page">
      <Navbar />

      <div className="dashboard-container">
        <div className="dashboard-header">
          <div>
            <span className="section-label">CUSTOMER DASHBOARD</span>
            <h1>My Saved Events Wishlist</h1>
            <p>Your saved events ready to book anytime.</p>
          </div>
          <Link to="/customer/dashboard" className="dashboard-home">
            ← Dashboard
          </Link>
        </div>

        <div className="dashboard-section">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2>Wishlisted Events ({wishlist.length})</h2>
            {wishlist.length > 0 && (
              <button type="button" className="btn-secondary btn-sm" onClick={clearAll}>
                Clear Wishlist
              </button>
            )}
          </div>

          {wishlist.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <span style={{ fontSize: "40px", display: "block", marginBottom: "12px" }}>💔</span>
              <p style={{ color: "var(--text-muted)", marginBottom: "16px" }}>
                Your wishlist is empty. Browse exciting concerts, sports, and theatre events and save your favorites!
              </p>
              <Link to="/events" className="btn-primary" style={{ display: "inline-block" }}>
                Browse Events
              </Link>
            </div>
          ) : (
            <div className="dashboard-actions" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
              {wishlist.map((title) => (
                <div className="dashboard-action" key={title} style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "flex-start" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%" }}>
                    <span style={{ fontSize: "24px" }}>❤️</span>
                    <strong style={{ fontSize: "16px", flex: 1 }}>{title}</strong>
                  </div>

                  <div style={{ display: "flex", gap: "8px", width: "100%", marginTop: "auto" }}>
                    <Link
                      to="/events"
                      className="btn-primary btn-sm"
                      style={{ flex: 1, textAlign: "center" }}
                    >
                      Book Now
                    </Link>
                    <button
                      type="button"
                      className="btn-secondary btn-sm"
                      onClick={() => removeFromWishlist(title)}
                    >
                      Remove
                    </button>
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

export default CustomerWishlist;
