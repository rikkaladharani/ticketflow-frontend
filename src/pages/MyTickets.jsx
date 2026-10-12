import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import Navbar from "../components/Navbar";
import ReviewModal from "../components/ReviewModal";
import "../styles.css";

function MyTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [reviewModalEvent, setReviewModalEvent] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  const loadTickets = async () => {
    try {
      setLoading(true);
      setError("");
      const savedUser = localStorage.getItem("ticketflowUser");
      if (!savedUser) {
        throw new Error("No logged-in user found");
      }

      const user = JSON.parse(savedUser);
      if (!user.id) {
        throw new Error("User ID is missing from login data");
      }

      const res = await api.get(`/tickets/customer/${user.id}`);
      setTickets(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("MY TICKETS ERROR:", err);
      setError(err.response?.data?.message || err.message || "Unable to load your tickets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const handleCancelBooking = async (bookingId, eventTitle) => {
    const reason = window.prompt(
      `Are you sure you want to cancel your ticket for "${eventTitle}"?\n\nPlease enter a cancellation reason for your refund:`
    );

    if (reason === null) return; // cancelled prompt

    try {
      setCancellingId(bookingId);
      setActionMessage("");
      await api.post(`/bookings/${bookingId}/cancel`, {
        reason: reason.trim() || "Customer requested cancellation",
      });

      setActionMessage("Booking cancelled successfully! Your refund request has been submitted.");
      loadTickets();
    } catch (err) {
      console.error("Cancel booking error:", err);
      alert(err.response?.data?.message || err.message || "Failed to cancel booking.");
    } finally {
      setCancellingId(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return "";
    const [hours, minutes] = timeString.split(":");
    const date = new Date();
    date.setHours(Number(hours), Number(minutes));
    return date.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatCurrency = (amount) => {
    return Number(amount || 0).toLocaleString("en-IN");
  };

  if (loading) {
    return (
      <div className="tickets-page">
        <Navbar />
        <div className="tickets-loading">
          <div className="ticket-spinner"></div>
          <p>Loading your tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tickets-page">
      <Navbar />

      <main className="tickets-main">
        <div className="tickets-title-section">
          <span className="tickets-eyebrow">YOUR BOOKINGS</span>
          <h1>My Tickets</h1>
          <p>View your confirmed event tickets, seats, food orders, and QR check-in codes.</p>
        </div>

        {actionMessage && (
          <div className="alert alert-success" style={{ margin: "16px auto", maxWidth: "800px", padding: "12px 18px", borderRadius: "8px", background: "#dcfce7", color: "#166534" }}>
            ✓ {actionMessage}
          </div>
        )}

        {error && <div className="tickets-error">{error}</div>}

        {!error && tickets.length === 0 && (
          <div className="no-tickets">
            <div className="no-tickets-icon">🎟️</div>
            <h2>No tickets yet</h2>
            <p>You haven't booked any events yet. Explore events and get your tickets today!</p>
            <Link to="/events" className="browse-events-btn">
              Browse Events
            </Link>
          </div>
        )}

        <div className="tickets-list">
          {tickets.map((ticket) => {
            const isCancelled = ticket.bookingStatus === "CANCELLED" || ticket.bookingStatus === "REFUNDED";
            const isCheckedIn = Boolean(ticket.checkedIn);

            return (
              <article className={`digital-ticket ${isCancelled ? "ticket-cancelled" : ""}`} key={ticket.ticketId}>
                {/* EVENT HEADER */}
                <div className="ticket-event">
                  <div className="ticket-event-info">
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "8px" }}>
                      <span className="ticket-category">{ticket.eventCategory}</span>
                      {isCheckedIn && (
                        <span className="badge badge-success" style={{ background: "#22c55e", color: "white", padding: "4px 8px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "600" }}>
                          ✓ CHECKED IN
                        </span>
                      )}
                      {isCancelled && (
                        <span className="badge badge-danger" style={{ background: "#ef4444", color: "white", padding: "4px 8px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "600" }}>
                          ✕ CANCELLED
                        </span>
                      )}
                    </div>

                    <h2>{ticket.eventTitle}</h2>

                    <div className="ticket-event-details">
                      <div>
                        <span className="detail-label">DATE</span>
                        <strong>{formatDate(ticket.eventDate)}</strong>
                      </div>
                      <div>
                        <span className="detail-label">TIME</span>
                        <strong>
                          {formatTime(ticket.startTime)} – {formatTime(ticket.endTime)}
                        </strong>
                      </div>
                    </div>

                    <div className="ticket-venue">
                      <span className="venue-icon">📍</span>
                      <div>
                        <strong>{ticket.venueName}</strong>
                        <span>{ticket.venueAddress}, {ticket.venueCity}</span>
                      </div>
                    </div>
                  </div>

                  {/* QR CODE CARD */}
                  <div className="ticket-qr-section">
                    {!isCancelled && ticket.qrCodeImage ? (
                      <div className="ticket-qr-box">
                        <img src={ticket.qrCodeImage} alt="QR Code" className="ticket-qr-img" />
                        <span className="ticket-qr-caption">Scan at Entrance</span>
                        {isCheckedIn && (
                          <span className="checked-in-stamp">USED</span>
                        )}
                      </div>
                    ) : (
                      <div className="ticket-qr-box qr-cancelled">
                        <span style={{ fontSize: "2.5rem" }}>🚫</span>
                        <span className="ticket-qr-caption" style={{ color: "#ef4444" }}>
                          {isCancelled ? "Booking Cancelled" : "No QR"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* SEAT DETAILS */}
                {ticket.seats && ticket.seats.length > 0 && (
                  <div className="ticket-seats-section">
                    <span className="section-title">RESERVED SEATS ({ticket.seats.length})</span>
                    <div className="ticket-seats-chips">
                      {ticket.seats.map((seat, idx) => (
                        <div className="seat-chip" key={idx}>
                          <span className="seat-chip-id">{seat.seatRow}{seat.seatNumber}</span>
                          <span className="seat-chip-type">{seat.seatType}</span>
                          <span className="seat-chip-price">₹{formatCurrency(seat.price)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* FOOD ITEMS */}
                {ticket.foodItems && ticket.foodItems.length > 0 && (
                  <div className="ticket-food-section">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <span className="section-title" style={{ margin: 0 }}>⚡ FOOD PRE-ORDER (SKIP THE QUEUE)</span>
                      <span style={{ fontSize: "11px", background: "#dcfce7", color: "#166534", fontWeight: "700", padding: "2px 8px", borderRadius: "4px" }}>
                        EXPRESS PICKUP PASS ACTIVE
                      </span>
                    </div>

                    <div style={{ background: "#f0fdf4", border: "1px dashed #22c55e", borderRadius: "8px", padding: "10px 14px", marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                      <div>
                        <span style={{ fontSize: "11px", color: "#15803d", fontWeight: "700", display: "block" }}>⚡ EXPRESS PICKUP TOKEN</span>
                        <strong style={{ fontSize: "15px", color: "#14532d", letterSpacing: "0.5px" }}>
                          PICKUP-{ticket.bookingReference || ticket.ticketNumber}
                        </strong>
                      </div>
                      <small style={{ color: "#166534" }}>Show token at stall counter to skip line & collect</small>
                    </div>

                    <div className="ticket-food-list">
                      {ticket.foodItems.map((food, idx) => (
                        <div className="ticket-food-item" key={idx}>
                          <span className="food-icon">{food.category === "BEVERAGE" ? "🥤" : "🍔"}</span>
                          <div className="food-details">
                            <strong>{food.itemName}</strong>
                            <small>{food.stallName || "Event Stall"}</small>
                          </div>
                          <div className="food-qty">×{food.quantity}</div>
                          <div className="food-total">₹{formatCurrency(food.totalPrice)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* PAYMENT SUMMARY */}
                <div className="ticket-payment-section">
                  <div className="payment-row">
                    <span>Ticket Subtotal</span>
                    <strong>₹{formatCurrency(ticket.subtotalAmount)}</strong>
                  </div>
                  {Number(ticket.foodSubtotalAmount || 0) > 0 && (
                    <div className="payment-row">
                      <span>Food & Refreshments</span>
                      <strong>₹{formatCurrency(ticket.foodSubtotalAmount)}</strong>
                    </div>
                  )}
                  {Number(ticket.discountAmount || 0) > 0 && (
                    <div className="payment-row payment-discount">
                      <span>Discount {ticket.couponCode ? `(${ticket.couponCode})` : ""}</span>
                      <strong>− ₹{formatCurrency(ticket.discountAmount)}</strong>
                    </div>
                  )}
                  <div className="payment-row payment-total">
                    <span>Total Amount</span>
                    <strong>₹{formatCurrency(ticket.totalAmount)}</strong>
                  </div>
                </div>

                {/* BOTTOM METADATA & ACTIONS */}
                <div className="ticket-bottom">
                  <div>
                    <span>TICKET NUMBER</span>
                    <strong>{ticket.ticketNumber}</strong>
                  </div>
                  <div>
                    <span>BOOKING REF</span>
                    <strong>{ticket.bookingReference}</strong>
                  </div>
                  <div>
                    <span>ENTRY STATUS</span>
                    <strong style={{ color: isCheckedIn ? "#22c55e" : isCancelled ? "#ef4444" : "#2563eb" }}>
                      {isCheckedIn ? "Checked In" : isCancelled ? "Cancelled" : "Ready for Entry"}
                    </strong>
                  </div>
                </div>

                {/* TICKET ACTION BUTTONS */}
                <div className="ticket-actions-bar" style={{ display: "flex", gap: "10px", padding: "16px 24px", background: "rgba(0,0,0,0.02)", borderTop: "1px solid var(--border)", flexWrap: "wrap", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    className="btn-secondary btn-sm"
                    onClick={() => window.print()}
                  >
                    🖨️ Print Ticket
                  </button>

                  <button
                    type="button"
                    className="btn-secondary btn-sm"
                    onClick={() => setReviewModalEvent({ id: ticket.eventId, title: ticket.eventTitle })}
                  >
                    ⭐ Rate Event
                  </button>

                  {!isCancelled && !isCheckedIn && (
                    <button
                      type="button"
                      className="btn-danger btn-sm"
                      disabled={cancellingId === ticket.bookingId}
                      onClick={() => handleCancelBooking(ticket.bookingId, ticket.eventTitle)}
                    >
                      {cancellingId === ticket.bookingId ? "Cancelling..." : "Cancel & Refund"}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </main>

      {/* REVIEW MODAL */}
      {reviewModalEvent && (
        <ReviewModal
          eventId={reviewModalEvent.id}
          eventTitle={reviewModalEvent.title}
          onClose={() => setReviewModalEvent(null)}
          onReviewSubmitted={() => {
            setActionMessage("Thank you! Your event rating and review was submitted.");
          }}
        />
      )}
    </div>
  );
}

export default MyTickets;