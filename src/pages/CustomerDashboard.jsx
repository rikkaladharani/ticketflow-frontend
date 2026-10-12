import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import "../styles.css";

function CustomerDashboard() {
  const user = JSON.parse(
    localStorage.getItem("ticketflowUser") || "{}"
  );


  const [wishlistCount, setWishlistCount] = useState(() => {
    try {
      const wishlist = JSON.parse(
        localStorage.getItem("ticketflowWishlist") || "[]"
      );
      return Array.isArray(wishlist) ? wishlist.length : 0;
    } catch {
      return 0;
    }
  });

  const [upcomingTickets, setUpcomingTickets] = useState(0);
  const [pastEvents, setPastEvents] = useState(0);

  useEffect(() => {
    const updateWishlistCount = () => {
      try {
        const wishlist = JSON.parse(
          localStorage.getItem("ticketflowWishlist") || "[]"
        );
        setWishlistCount(
          Array.isArray(wishlist) ? wishlist.length : 0
        );
      } catch {
        setWishlistCount(0);
      }
    };

    window.addEventListener("focus", updateWishlistCount);
    window.addEventListener("wishlistUpdated", updateWishlistCount);

    return () => {
      window.removeEventListener("focus", updateWishlistCount);
      window.removeEventListener("wishlistUpdated", updateWishlistCount);
    };
  }, []);

  useEffect(() => {
    const loadTicketStats = async () => {
      try {
        const savedUser = localStorage.getItem("ticketflowUser");
        const token = localStorage.getItem("ticketflowToken");

        if (!savedUser || !token) {
          console.warn("Customer login or token is missing.");
          return;
        }

        const loggedInUser = JSON.parse(savedUser);

        if (!loggedInUser.id) {
          console.warn("Customer ID is missing.");
          return;
        }

        const response = await fetch(
          `http://localhost:8080/api/tickets/customer/${loggedInUser.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(
            `Unable to load ticket statistics (${response.status})`
          );
        }

        const data = await response.json();
        const tickets = Array.isArray(data) ? data : [];

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const validTickets = tickets.filter((ticket) => {
          const status = String(
            ticket.bookingStatus || ticket.ticketStatus || ""
          ).toUpperCase();

          return !["CANCELLED", "REFUNDED", "FAILED"].includes(status);
        });

        setUpcomingTickets(
          validTickets.filter((ticket) => {
            if (!ticket.eventDate) return false;

            const eventDate = new Date(ticket.eventDate);

            return (
              !Number.isNaN(eventDate.getTime()) &&
              eventDate >= today
            );
          }).length
        );

        setPastEvents(
          validTickets.filter((ticket) => {
            if (!ticket.eventDate) return false;

            const eventDate = new Date(ticket.eventDate);

            return (
              !Number.isNaN(eventDate.getTime()) &&
              eventDate < today
            );
          }).length
        );
      } catch (error) {
        console.error("Customer dashboard ticket stats:", error);
      }
    };

    loadTicketStats();
  }, []);

  return (
    <div className="dashboard-page">
      <Navbar />
      <div className="dashboard-container">
        <div className="dashboard-header">

          
          <div>
            <span className="section-label">
              CUSTOMER DASHBOARD
            </span>
            <h1>Welcome, {user.firstName || "Customer"}!</h1>
            <p>
              Discover events, book your perfect seats and manage your tickets.
            </p>
          </div>

          <Link to="/" className="dashboard-home">
            ← Home
          </Link>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-stat">
            <span>🎟️</span>
            <strong>{upcomingTickets}</strong>
            <small>Upcoming Tickets</small>
          </div>

          <div className="dashboard-stat">
            <span>❤️</span>
            <strong>{wishlistCount}</strong>
            <small>Wishlisted Events</small>
          </div>

          <div className="dashboard-stat">
            <span>📍</span>
            <strong>0</strong>
            <small>Favourite Venues</small>
          </div>

          <div className="dashboard-stat">
            <span>✓</span>
            <strong>{pastEvents}</strong>
            <small>Past Events</small>
          </div>
        </div>

        <div className="dashboard-section">
          <h2>Quick Actions</h2>

          <div className="dashboard-actions">
            <Link to="/" className="dashboard-action">
              <span>🎫</span>
              <strong>Browse Events</strong>
              <small>Find your next experience</small>
            </Link>

            <Link
              to="/customer/tickets"
              className="dashboard-action"
            >
              <div className="action-icon">🎟️</div>
              <h3>My Tickets</h3>
              <p>View your booked tickets</p>
            </Link>

            <Link
              to="/customer/wishlist"
              className="dashboard-action"
            >
              <span>❤️</span>
              <strong>Wishlist</strong>
              <small>Your favourite events</small>
            </Link>

            <Link
              to="/customer/profile"
              className="dashboard-action"
            >
              <span>👤</span>
              <strong>My Profile</strong>
              <small>Manage your account</small>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CustomerDashboard;
