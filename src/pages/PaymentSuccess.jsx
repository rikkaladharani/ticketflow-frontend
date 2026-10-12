
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

const API_URL = "http://localhost:8080";

function PaymentSuccess() {
  const { bookingId } = useParams();

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("ticketflowToken") || ""}`,
    Accept: "application/json",
  });

  const readResponse = async (response) => {
    const text = await response.text();

    if (!text.trim()) {
      return null;
    }

    try {
      return JSON.parse(text);
    } catch {
      throw new Error("The server returned an invalid response.");
    }
  };

  const loadTicket = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/api/tickets/booking/${bookingId}`,
        {
          headers: getHeaders(),
        }
      );

      if (response.status === 404) {
        setTicket(null);
        return;
      }

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Unable to load ticket."
        );
      }

      setTicket(data);
    } catch (err) {
      console.error("Load ticket error:", err);
      setError(err.message || "Unable to load ticket.");
    } finally {
      setLoading(false);
    }
  };

  const generateTicket = async () => {
    try {
      setGenerating(true);
      setError("");

      const response = await fetch(
        `${API_URL}/api/tickets/booking/${bookingId}`,
        {
          method: "POST",
          headers: getHeaders(),
        }
      );

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Unable to generate ticket."
        );
      }

      if (!data) {
        // The server may have completed the operation
        // without returning a response body.
        await loadTicket();
        return;
      }

      setTicket(data);
    } catch (err) {
      console.error("Generate ticket error:", err);
      setError(err.message || "Unable to generate ticket.");
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    loadTicket();
  }, [bookingId]);

  if (loading) {
    return (
      <div className="payment-success-page">
        <div className="ticket-loading">
          <div className="loading-spinner"></div>
          <p>Loading your ticket...</p>
        </div>
      </div>
    );
  }

  if (error && !ticket) {
    return (
      <div className="payment-success-page">
        <div className="ticket-error">
          <div className="error-icon">⚠️</div>
          <h2>Payment completed</h2>
          <p>{error}</p>

          <button
            type="button"
            className="generate-ticket-btn"
            onClick={generateTicket}
            disabled={generating}
          >
            {generating ? "Generating..." : "Generate Ticket"}
          </button>


          <Link
            to="/customer/dashboard"
            className="back-dashboard-link"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="payment-success-page">
        <div className="ticket-error">
          <div className="success-icon">✓</div>
          <h1>Payment Successful!</h1>
          <p>Your booking has been confirmed.</p>

          {error && <p>{error}</p>}

          <button
            type="button"
            className="generate-ticket-btn"
            onClick={generateTicket}
            disabled={generating}
          >
            {generating ? "Generating Ticket..." : "Generate Ticket"}
          </button>

          <Link
            to="/customer/dashboard"
            className="back-dashboard-link"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const booking = ticket.booking || {};
  const event = booking.event || {};
  const venue = event.venue || {};

  const bookingReference =
    ticket.bookingReference ||
    booking.bookingReference ||
    `TF-${bookingId}`;

  const eventTitle =
    ticket.eventTitle ||
    event.title ||
    "TICKETFLOW Event";

  const eventDate =
    ticket.eventDate ||
    event.eventDate ||
    "";

  const startTime =
    ticket.startTime ||
    event.startTime ||
    "";

  const endTime =
    ticket.endTime ||
    event.endTime ||
    "";

  const venueName =
    ticket.venueName ||
    venue.name ||
    "";

  const venueCity =
    ticket.venueCity ||
    venue.city ||
    "";

  const totalAmount =
    ticket.totalAmount ??
    booking.totalAmount ??
    0;

  const seats = Array.isArray(ticket.seats)
    ? ticket.seats
    : [];

  return (
    <div className="payment-success-page">
      <div className="payment-success-header">
        <div className="payment-success-icon">✓</div>
        <h1>Payment Successful!</h1>
        <p>
          Your booking has been confirmed. Your digital ticket is ready.
        </p>
      </div>

      <div className="digital-ticket">
        <div className="digital-ticket-header">
          <div>
            <span className="ticket-label">DIGITAL TICKET</span>
            <h2>{eventTitle}</h2>
          </div>

          <span className="ticket-valid">✓ VALID</span>
        </div>

        <div className="digital-ticket-body">
          <div className="ticket-info-grid">
            <div className="ticket-info-item">
              <span>Ticket Number</span>
              <strong>{ticket.ticketNumber || "—"}</strong>
            </div>

            <div className="ticket-info-item">
              <span>Booking Reference</span>
              <strong>{bookingReference}</strong>
            </div>

            <div className="ticket-info-item">
              <span>Date</span>
              <strong>
                {eventDate
                  ? new Date(eventDate).toLocaleDateString(
                      "en-IN",
                      {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      }
                    )
                  : "—"}
              </strong>
            </div>

            <div className="ticket-info-item">
              <span>Time</span>
              <strong>
                {startTime
                  ? `${startTime.substring(0, 5)}${
                      endTime
                        ? ` - ${endTime.substring(0, 5)}`
                        : ""
                    }`
                  : "—"}
              </strong>
            </div>

            <div className="ticket-info-item">
              <span>Venue</span>
              <strong>{venueName || "—"}</strong>
              {venueCity && <small>{venueCity}</small>}
            </div>

            <div className="ticket-info-item">
              <span>Total Paid</span>
              <strong>
                ₹{Number(totalAmount).toLocaleString("en-IN")}
              </strong>
            </div>
          </div>

          {seats.length > 0 && (
            <div className="ticket-seats-section">
              <div className="ticket-section-title">
                Selected Seats
              </div>

              <div className="ticket-seat-list">
                {seats.map((seat, index) => (
                  <div
                    className="ticket-seat"
                    key={seat.eventSeatId || seat.id || index}
                  >
                    <span>
                      {seat.seatRow || ""}
                      {seat.seatNumber ?? ""}
                    </span>

                    <small>{seat.seatType || ""}</small>

                    <strong>
                      ₹{Number(seat.price || 0).toLocaleString("en-IN")}
                    </strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="ticket-qr-section">
            <div className="ticket-qr-box">
              {ticket.qrCodeImage ? (
                <img
                  src={ticket.qrCodeImage}
                  alt="Ticket QR Code"
                />
              ) : (
                <div className="qr-placeholder">QR</div>
              )}
            </div>

            <div className="ticket-qr-info">
              <h3>Entry QR Code</h3>
              <p>
                Show this QR code at the venue entrance for verification.
              </p>
              <strong>Scan at event entrance</strong>
            </div>
          </div>
        </div>
      </div>

      {error && <p className="ticket-error-message">{error}</p>}

      <div className="ticket-actions">
        <Link
          to="/customer/tickets"
          className="view-tickets-btn"
        >
          🎟️ View My Tickets
        </Link>

        <Link
          to="/"
          className="browse-events-btn"
        >
          Browse More Events
        </Link>
      </div>
    </div>
  );
}

export default PaymentSuccess;
