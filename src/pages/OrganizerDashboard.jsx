import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import "../styles.css";

function OrganizerDashboard() {
  const user = JSON.parse(
    localStorage.getItem("ticketflowUser") || "{}"
  );

  const organizerId = user.id;

  const [bookings, setBookings] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Coupons state
  const [coupons, setCoupons] = useState([]);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [couponSubmitting, setCouponSubmitting] = useState(false);
  const [couponFormError, setCouponFormError] = useState("");
  const [couponSuccessMessage, setCouponSuccessMessage] = useState("");
  const [copiedCode, setCopiedCode] = useState("");

  const initialCouponForm = {
    code: "",
    discountType: "PERCENTAGE",
    discountValue: "",
    eventId: "",
    minOrderAmount: "0",
    maxDiscount: "",
    usageLimit: "",
  };
  const [couponForm, setCouponForm] = useState(initialCouponForm);

  // =========================================================
  // LOAD ORGANIZER DATA
  // =========================================================

  const loadOrganizerData = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("ticketflowToken");

      if (!token) {
        throw new Error("Login token missing. Please log in again.");
      }

      if (!organizerId) {
        throw new Error(
          "Organizer information not found. Please login again."
        );
      }

      const [bookingsResponse, eventsResponse, couponsResponse] = await Promise.all([
        fetch(
          `http://localhost:8080/api/bookings/organizer/${organizerId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        ),
        fetch(
          `http://localhost:8080/api/events/organizer/${organizerId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        ),
        fetch(
          `http://localhost:8080/api/coupons/organizer/${organizerId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        ).catch(() => null),
      ]);

      if (!bookingsResponse.ok) {
        throw new Error(
          "Failed to load organizer bookings."
        );
      }

      if (!eventsResponse.ok) {
        throw new Error(
          "Failed to load organizer events."
        );
      }

      const bookingsData =
        await bookingsResponse.json();

      const eventsData =
        await eventsResponse.json();

      setBookings(
        Array.isArray(bookingsData)
          ? bookingsData
          : []
      );

      setEvents(
        Array.isArray(eventsData)
          ? eventsData
          : []
      );

      if (couponsResponse && couponsResponse.ok) {
        const couponsData = await couponsResponse.json();
        setCoupons(Array.isArray(couponsData) ? couponsData : []);
      }
    } catch (err) {
      console.error(
        "Organizer dashboard error:",
        err
      );

      setError(
        err.message ||
          "Unable to load organizer dashboard."
      );
    } finally {
      setLoading(false);
    }
  };

  const loadCoupons = async () => {
    try {
      const token = localStorage.getItem("ticketflowToken");
      if (!token || !organizerId) return;
      const res = await fetch(
        `http://localhost:8080/api/coupons/organizer/${organizerId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        const data = await res.json();
        setCoupons(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error("Failed to load coupons", e);
    }
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    setCouponFormError("");
    setCouponSuccessMessage("");

    if (!couponForm.code.trim()) {
      setCouponFormError("Please enter a coupon code (e.g. VIP20).");
      return;
    }

    const val = parseFloat(couponForm.discountValue);
    if (isNaN(val) || val <= 0) {
      setCouponFormError("Please enter a valid discount amount greater than 0.");
      return;
    }

    if (couponForm.discountType === "PERCENTAGE" && val > 100) {
      setCouponFormError("Percentage discount cannot exceed 100%.");
      return;
    }

    try {
      setCouponSubmitting(true);
      const token = localStorage.getItem("ticketflowToken");

      let selectedEventTitle = null;
      if (couponForm.eventId) {
        const matched = events.find(
          (ev) => String(ev.id) === String(couponForm.eventId)
        );
        if (matched) selectedEventTitle = matched.title;
      }

      const payload = {
        code: couponForm.code.trim().toUpperCase(),
        discountType: couponForm.discountType,
        discountValue: val,
        eventId: couponForm.eventId ? Number(couponForm.eventId) : null,
        eventTitle: selectedEventTitle,
        minOrderAmount: couponForm.minOrderAmount
          ? parseFloat(couponForm.minOrderAmount)
          : 0,
        maxDiscount: couponForm.maxDiscount
          ? parseFloat(couponForm.maxDiscount)
          : null,
        usageLimit: couponForm.usageLimit
          ? parseInt(couponForm.usageLimit, 10)
          : null,
        active: true,
      };

      const res = await fetch(
        `http://localhost:8080/api/coupons/organizer/${organizerId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to create coupon code.");
      }

      setCouponSuccessMessage(
        `Coupon "${data.code}" created successfully! Share it with your customers.`
      );
      setCouponForm(initialCouponForm);
      setIsCouponModalOpen(false);
      loadCoupons();
    } catch (err) {
      setCouponFormError(err.message || "Could not create coupon.");
    } finally {
      setCouponSubmitting(false);
    }
  };

  const handleToggleCoupon = async (couponId) => {
    try {
      const token = localStorage.getItem("ticketflowToken");
      const res = await fetch(
        `http://localhost:8080/api/coupons/${couponId}/toggle?organizerId=${organizerId}`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        loadCoupons();
      }
    } catch (e) {
      console.error("Failed to toggle coupon status", e);
    }
  };

  const handleDeleteCoupon = async (couponId, code) => {
    if (
      !window.confirm(
        `Are you sure you want to delete coupon "${code}"? Customers will no longer be able to use it.`
      )
    ) {
      return;
    }
    try {
      const token = localStorage.getItem("ticketflowToken");
      const res = await fetch(
        `http://localhost:8080/api/coupons/${couponId}?organizerId=${organizerId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        loadCoupons();
      }
    } catch (e) {
      console.error("Failed to delete coupon", e);
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(""), 2000);
  };

  useEffect(() => {
    loadOrganizerData();
  }, [organizerId]);

  // =========================================================
  // STATISTICS
  // =========================================================

  const statistics = useMemo(() => {
    const confirmedBookings = bookings.filter(
      (booking) =>
        booking.bookingStatus === "CONFIRMED"
    );

    const ticketsSold =
      confirmedBookings.reduce(
        (total, booking) =>
          total +
          (Array.isArray(booking.seats)
            ? booking.seats.length
            : 0),
        0
      );

    const revenue =
      confirmedBookings.reduce(
        (total, booking) =>
          total +
          Number(
            booking.totalAmount || 0
          ),
        0
      );

    return {
      eventCount: events.length,
      ticketsSold,
      attendees: confirmedBookings.length,
      revenue,
    };
  }, [bookings, events]);

  // =========================================================
  // EVENT STATISTICS
  // =========================================================

  const eventStatistics = useMemo(() => {
    return events.map((event) => {
      const eventBookings =
        bookings.filter(
          (booking) =>
            Number(booking.eventId) ===
            Number(event.id)
        );

      const confirmedBookings =
        eventBookings.filter(
          (booking) =>
            booking.bookingStatus ===
            "CONFIRMED"
        );

      const ticketsSold =
        confirmedBookings.reduce(
          (total, booking) =>
            total +
            (Array.isArray(booking.seats)
              ? booking.seats.length
              : 0),
          0
        );

      const revenue =
        confirmedBookings.reduce(
          (total, booking) =>
            total +
            Number(
              booking.totalAmount || 0
            ),
          0
        );

      return {
        ...event,
        bookingCount:
          eventBookings.length,
        ticketsSold,
        revenue,
      };
    });
  }, [events, bookings]);

  // =========================================================
  // FORMATTERS
  // =========================================================

  const formatCurrency = (amount) => {
    return `₹${Number(
      amount || 0
    ).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (date) => {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  const formatTime = (time) => {
    if (!time) return "-";

    return String(time).substring(0, 5);
  };

  const getStatusClass = (status) => {
    if (status === "CONFIRMED") {
      return "organizer-status confirmed";
    }

    if (status === "PAYMENT_PENDING") {
      return "organizer-status pending";
    }

    if (
      status === "CANCELLED" ||
      status === "FAILED"
    ) {
      return "organizer-status cancelled";
    }

    return "organizer-status";
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-container">
          <div className="dashboard-header">
            <div>
              <span className="section-label">
                ORGANIZER DASHBOARD
              </span>

              <h1>
                Welcome,{" "}
                {user.firstName ||
                  user.name ||
                  "Organizer"}
                !
              </h1>

              <p>
                Loading your organizer data...
              </p>
            </div>

            <Link
              to="/"
              className="dashboard-home"
            >
              ← Home
            </Link>
          </div>

          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              padding: "50px",
              textAlign: "center",
              boxShadow:
                "0 10px 30px rgba(15, 23, 42, 0.08)",
            }}
          >
            <div
              style={{
                fontSize: "42px",
                marginBottom: "15px",
              }}
            >
              ⏳
            </div>

            <h2>Loading Dashboard</h2>

            <p
              style={{
                color: "#64748b",
              }}
            >
              Fetching your events and
              bookings...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (error) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-container">
          <div className="dashboard-header">
            <div>
              <span className="section-label">
                ORGANIZER DASHBOARD
              </span>

              <h1>
                Welcome,{" "}
                {user.firstName ||
                  user.name ||
                  "Organizer"}
                !
              </h1>

              <p>
                Create events, manage venues,
                tickets and attendees.
              </p>
            </div>

            <Link
              to="/"
              className="dashboard-home"
            >
              ← Home
            </Link>
          </div>

          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              padding: "40px",
              textAlign: "center",
              border:
                "1px solid #fecaca",
              boxShadow:
                "0 10px 30px rgba(15, 23, 42, 0.08)",
            }}
          >
            <div
              style={{
                fontSize: "42px",
                marginBottom: "15px",
              }}
            >
              ⚠️
            </div>

            <h2>
              Unable to Load Dashboard
            </h2>

            <p
              style={{
                color: "#dc2626",
                marginBottom: "20px",
              }}
            >
              {error}
            </p>

            <button
              onClick={loadOrganizerData}
              style={{
                border: "none",
                background: "#2563eb",
                color: "#ffffff",
                padding: "12px 22px",
                borderRadius: "10px",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // MAIN DASHBOARD
  // =========================================================

  return (
    <div className="dashboard-page">
      <Navbar />
      <div className="dashboard-container">

        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <div className="dashboard-header">
          <div>
            <span className="section-label">
              ORGANIZER DASHBOARD
            </span>

            <h1>
              Welcome,{" "}
              {user.firstName ||
                user.name ||
                "Organizer"}
              !
            </h1>

            <p>
              Create events, manage venues,
              tickets and attendees.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={loadOrganizerData}
              style={{
                border:
                  "1px solid #e2e8f0",
                background: "#ffffff",
                color: "#0f172a",
                padding: "10px 16px",
                borderRadius: "10px",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              ↻ Refresh
            </button>

            <Link
              to="/"
              className="dashboard-home"
            >
              ← Home
            </Link>
          </div>
        </div>

        {/* ================================================= */}
        {/* STATISTICS */}
        {/* ================================================= */}

        <div className="dashboard-grid">

          <div className="dashboard-stat">
            <span>🎤</span>

            <strong>
              {statistics.eventCount}
            </strong>

            <small>Events</small>
          </div>

          <div className="dashboard-stat">
            <span>🎟️</span>

            <strong>
              {statistics.ticketsSold}
            </strong>

            <small>Tickets Sold</small>
          </div>

          <div className="dashboard-stat">
            <span>👥</span>

            <strong>
              {statistics.attendees}
            </strong>

            <small>Attendees</small>
          </div>

          <div className="dashboard-stat">
            <span>₹</span>

            <strong>
              {formatCurrency(
                statistics.revenue
              )}
            </strong>

            <small>Total Revenue</small>
          </div>

        </div>

        {/* ================================================= */}
        {/* EVENT MANAGEMENT */}
        {/* ================================================= */}

        <div className="dashboard-section">
          <h2>Event Management</h2>

          <div className="dashboard-actions">

            {/* QR GATE CHECK-IN */}
            <Link
              to="/organizer/check-in"
              className="dashboard-action"
              style={{
                textDecoration: "none",
                color: "inherit",
                cursor: "pointer",
                background: "linear-gradient(135deg, rgba(37,99,235,0.06), rgba(37,99,235,0.14))",
                borderColor: "#2563eb",
              }}
            >
              <span>📲</span>

              <strong>
                QR Gate Check-In
              </strong>

              <small style={{ color: "#2563eb", fontWeight: "600" }}>
                Scan tickets at gate
              </small>
            </Link>

            {/* CREATE EVENT */}
            <Link
              to="/organizer/create-event"
              className="dashboard-action"
              style={{
                textDecoration: "none",
                color: "inherit",
                cursor: "pointer",
              }}
            >
              <span>➕</span>

              <strong>
                Create Event
              </strong>

              <small>
                Create a new event
              </small>
            </Link>

            {/* MY EVENTS */}
            <div
              className="dashboard-action"
              onClick={() =>
                document
                  .getElementById(
                    "organizer-events"
                  )
                  ?.scrollIntoView({
                    behavior: "smooth",
                  })
              }
              style={{
                cursor: "pointer",
              }}
            >
              <span>📅</span>

              <strong>
                My Events
              </strong>

              <small>
                Manage your events
              </small>
            </div>

            {/* BOOKINGS */}
            <div
              className="dashboard-action"
              onClick={() =>
                document
                  .getElementById(
                    "organizer-bookings"
                  )
                  ?.scrollIntoView({
                    behavior: "smooth",
                  })
              }
              style={{
                cursor: "pointer",
              }}
            >
              <span>🎟️</span>

              <strong>
                Bookings
              </strong>

              <small>
                View customer bookings
              </small>
            </div>

            {/* STALLS */}
            
<Link
  to="/organizer/stall-applications"
  className="dashboard-action"
  style={{
    textDecoration: "none",
    color: "inherit",
    cursor: "pointer",
  }}
>
  <span>🏪</span>
  <strong>Stalls</strong>
  <small>Review and manage stall applications</small>
</Link>

            {/* EVENT COUPONS */}
            <div
              className="dashboard-action"
              onClick={() =>
                document
                  .getElementById("organizer-coupons")
                  ?.scrollIntoView({
                    behavior: "smooth",
                  })
              }
              style={{
                cursor: "pointer",
                background: "linear-gradient(135deg, rgba(37,99,235,0.06), rgba(37,99,235,0.14))",
                borderColor: "#2563eb",
              }}
            >
              <span>🏷️</span>
              <strong>Event Coupons</strong>
              <small style={{ color: "#2563eb", fontWeight: "600" }}>
                Secret promo discounts ({coupons.length})
              </small>
            </div>

<Link
  to="/organizer/profile"
  className="dashboard-action"
  style={{
    textDecoration: "none",
    color: "inherit",
    cursor: "pointer",
  }}
>
  <span>👤</span>
  <strong>My Profile</strong>
  <small>Edit personal details & password</small>
</Link>
          </div>
        </div>

        {/* ================================================= */}
        {/* MY EVENTS */}
        {/* ================================================= */}

        <div
          className="dashboard-section"
          id="organizer-events"
          style={{
            marginTop: "30px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              gap: "15px",
              marginBottom: "20px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <span className="section-label">
                YOUR EVENTS
              </span>

              <h2
                style={{
                  marginBottom: "5px",
                }}
              >
                My Events
              </h2>

              <p
                style={{
                  margin: 0,
                  color: "#64748b",
                }}
              >
                Events created by you
              </p>
            </div>

            <span
              style={{
                background: "#eff6ff",
                color: "#2563eb",
                padding: "8px 14px",
                borderRadius: "999px",
                fontWeight: "700",
              }}
            >
              {events.length} Event
              {events.length !== 1
                ? "s"
                : ""}
            </span>
          </div>

          {eventStatistics.length === 0 ? (
            <div
              style={{
                background: "#ffffff",
                border:
                  "1px solid #e2e8f0",
                borderRadius: "16px",
                padding: "35px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "40px",
                  marginBottom: "10px",
                }}
              >
                🎤
              </div>

              <h3>
                No Events Yet
              </h3>

              <p
                style={{
                  color: "#64748b",
                }}
              >
                You have not created any
                events yet.
              </p>

              <Link
                to="/organizer/create-event"
                style={{
                  display: "inline-block",
                  marginTop: "10px",
                  padding:
                    "10px 18px",
                  background:
                    "#2563eb",
                  color: "#ffffff",
                  borderRadius:
                    "10px",
                  textDecoration:
                    "none",
                  fontWeight: "600",
                }}
              >
                + Create Your First Event
              </Link>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "20px",
              }}
            >
              {eventStatistics.map(
                (event) => (
                  <div
                    key={event.id}
                    style={{
                      background:
                        "#ffffff",
                      border:
                        "1px solid #e2e8f0",
                      borderRadius:
                        "16px",
                      padding: "22px",
                      boxShadow:
                        "0 8px 24px rgba(15, 23, 42, 0.06)",
                    }}
                  >
                    <div
                      style={{
                        display:
                          "flex",
                        justifyContent:
                          "space-between",
                        gap: "10px",
                        marginBottom:
                          "15px",
                      }}
                    >
                      <span
                        style={{
                          background:
                            "#eff6ff",
                          color:
                            "#2563eb",
                          padding:
                            "6px 10px",
                          borderRadius:
                            "8px",
                          fontSize:
                            "12px",
                          fontWeight:
                            "700",
                        }}
                      >
                        {event.category ||
                          "EVENT"}
                      </span>

                      <span
                        style={{
                          fontSize:
                            "12px",
                          color:
                            "#64748b",
                        }}
                      >
                        #{event.id}
                      </span>
                    </div>

                    <h3
                      style={{
                        margin:
                          "0 0 10px",
                        color:
                          "#0f172a",
                      }}
                    >
                      {event.title}
                    </h3>

                    <p
                      style={{
                        color:
                          "#64748b",
                        fontSize:
                          "14px",
                        marginBottom:
                          "15px",
                      }}
                    >
                      📅{" "}
                      {formatDate(
                        event.eventDate
                      )}
                      <br />

                      🕐{" "}
                      {formatTime(
                        event.startTime
                      )}{" "}
                      -{" "}
                      {formatTime(
                        event.endTime
                      )}
                    </p>

                    <div
                      style={{
                        display:
                          "grid",
                        gridTemplateColumns:
                          "repeat(3, 1fr)",
                        gap: "8px",
                        marginTop:
                          "15px",
                      }}
                    >
                      <div
                        style={{
                          background:
                            "#f8fafc",
                          borderRadius:
                            "10px",
                          padding:
                            "10px",
                          textAlign:
                            "center",
                        }}
                      >
                        <strong>
                          {
                            event.bookingCount
                          }
                        </strong>

                        <small
                          style={{
                            display:
                              "block",
                            color:
                              "#64748b",
                            fontSize:
                              "11px",
                          }}
                        >
                          Bookings
                        </small>
                      </div>

                      <div
                        style={{
                          background:
                            "#f8fafc",
                          borderRadius:
                            "10px",
                          padding:
                            "10px",
                          textAlign:
                            "center",
                        }}
                      >
                        <strong>
                          {
                            event.ticketsSold
                          }
                        </strong>

                        <small
                          style={{
                            display:
                              "block",
                            color:
                              "#64748b",
                            fontSize:
                              "11px",
                          }}
                        >
                          Tickets
                        </small>
                      </div>

                      <div
                        style={{
                          background:
                            "#f8fafc",
                          borderRadius:
                            "10px",
                          padding:
                            "10px",
                          textAlign:
                            "center",
                        }}
                      >
                        <strong
                          style={{
                            fontSize:
                              "13px",
                          }}
                        >
                          {formatCurrency(
                            event.revenue
                          )}
                        </strong>

                        <small
                          style={{
                            display:
                              "block",
                            color:
                              "#64748b",
                            fontSize:
                              "11px",
                          }}
                        >
                          Revenue
                        </small>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* ================================================= */}
        {/* CUSTOMER BOOKINGS */}
        {/* ================================================= */}

        <div
          className="dashboard-section"
          id="organizer-bookings"
          style={{
            marginTop: "30px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              gap: "15px",
              marginBottom: "20px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <span className="section-label">
                CUSTOMER BOOKINGS
              </span>

              <h2
                style={{
                  marginBottom: "5px",
                }}
              >
                Booking Management
              </h2>

              <p
                style={{
                  margin: 0,
                  color: "#64748b",
                }}
              >
                View customer tickets,
                seats and food orders.
              </p>
            </div>

            <span
              style={{
                background: "#f0fdf4",
                color: "#16a34a",
                padding: "8px 14px",
                borderRadius:
                  "999px",
                fontWeight: "700",
              }}
            >
              {bookings.length} Booking
              {bookings.length !== 1
                ? "s"
                : ""}
            </span>
          </div>

          {bookings.length === 0 ? (
            <div
              style={{
                background: "#ffffff",
                border:
                  "1px solid #e2e8f0",
                borderRadius: "16px",
                padding: "35px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "40px",
                  marginBottom: "10px",
                }}
              >
                🎟️
              </div>

              <h3>
                No Bookings Yet
              </h3>

              <p
                style={{
                  color: "#64748b",
                }}
              >
                Customer bookings will
                appear here.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection:
                  "column",
                gap: "15px",
              }}
            >
              {bookings.map(
                (booking) => (
                  <div
                    key={
                      booking.bookingId
                    }
                    style={{
                      background:
                        "#ffffff",
                      border:
                        "1px solid #e2e8f0",
                      borderRadius:
                        "16px",
                      padding: "20px",
                      boxShadow:
                        "0 6px 20px rgba(15, 23, 42, 0.05)",
                    }}
                  >
                    <div
                      style={{
                        display:
                          "flex",
                        justifyContent:
                          "space-between",
                        alignItems:
                          "flex-start",
                        gap: "15px",
                        flexWrap:
                          "wrap",
                      }}
                    >
                      <div>
                        <h3
                          style={{
                            margin:
                              "0 0 6px",
                          }}
                        >
                          {booking.eventTitle ||
                            "Event"}
                        </h3>

                        <p
                          style={{
                            margin:
                              "0 0 5px",
                            color:
                              "#64748b",
                            fontSize:
                              "14px",
                          }}
                        >
                          Booking:{" "}
                          <strong>
                            {
                              booking.bookingReference
                            }
                          </strong>
                        </p>

                        <p
                          style={{
                            margin: 0,
                            color:
                              "#64748b",
                            fontSize:
                              "14px",
                          }}
                        >
                          📅{" "}
                          {formatDate(
                            booking.eventDate
                          )}{" "}
                          •{" "}
                          {formatTime(
                            booking.startTime
                          )}{" "}
                          -{" "}
                          {formatTime(
                            booking.endTime
                          )}
                        </p>
                      </div>

                      <div
                        style={{
                          display:
                            "flex",
                          alignItems:
                            "center",
                          gap: "10px",
                          flexWrap:
                            "wrap",
                        }}
                      >
                        <span
                          className={getStatusClass(
                            booking.bookingStatus
                          )}
                        >
                          {
                            booking.bookingStatus
                          }
                        </span>

                        <strong
                          style={{
                            fontSize:
                              "18px",
                            color:
                              "#0f172a",
                          }}
                        >
                          {formatCurrency(
                            booking.totalAmount
                          )}
                        </strong>
                      </div>
                    </div>

                    {/* CUSTOMER INFO */}
                    <div
                      style={{
                        display:
                          "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(180px, 1fr))",
                        gap: "10px",
                        marginTop:
                          "18px",
                      }}
                    >
                      <div
                        style={{
                          background:
                            "#f8fafc",
                          borderRadius:
                            "10px",
                          padding:
                            "12px",
                        }}
                      >
                        <small
                          style={{
                            color:
                              "#64748b",
                          }}
                        >
                          Customer
                        </small>

                        <div
                          style={{
                            fontWeight:
                              "700",
                            marginTop:
                              "4px",
                          }}
                        >
                          {booking.customerName ||
                            "Customer"}
                        </div>
                      </div>

                      <div
                        style={{
                          background:
                            "#f8fafc",
                          borderRadius:
                            "10px",
                          padding:
                            "12px",
                        }}
                      >
                        <small
                          style={{
                            color:
                              "#64748b",
                          }}
                        >
                          Email
                        </small>

                        <div
                          style={{
                            fontWeight:
                              "600",
                            marginTop:
                              "4px",
                            wordBreak:
                              "break-word",
                          }}
                        >
                          {
                            booking.customerEmail
                          }
                        </div>
                      </div>

                      <div
                        style={{
                          background:
                            "#f8fafc",
                          borderRadius:
                            "10px",
                          padding:
                            "12px",
                        }}
                      >
                        <small
                          style={{
                            color:
                              "#64748b",
                          }}
                        >
                          Phone
                        </small>

                        <div
                          style={{
                            fontWeight:
                              "600",
                            marginTop:
                              "4px",
                          }}
                        >
                          {booking.customerPhone ||
                            "-"}
                        </div>
                      </div>

                      <div
                        style={{
                          background:
                            "#f8fafc",
                          borderRadius:
                            "10px",
                          padding:
                            "12px",
                        }}
                      >
                        <small
                          style={{
                            color:
                              "#64748b",
                          }}
                        >
                          Tickets
                        </small>

                        <div
                          style={{
                            fontWeight:
                              "700",
                            marginTop:
                              "4px",
                          }}
                        >
                          {Array.isArray(
                            booking.seats
                          )
                            ? booking.seats
                                .length
                            : 0}
                        </div>
                      </div>
                    </div>

                    {/* BOTTOM */}
                    <div
                      style={{
                        display:
                          "flex",
                        justifyContent:
                          "space-between",
                        alignItems:
                          "center",
                        gap: "15px",
                        marginTop:
                          "18px",
                        flexWrap:
                          "wrap",
                      }}
                    >
                      <div
                        style={{
                          color:
                            "#64748b",
                          fontSize:
                            "14px",
                        }}
                      >
                        🎟️{" "}
                        {booking.ticketNumber ||
                          "Ticket not generated yet"}
                      </div>

                      <button
                        onClick={() =>
                          setSelectedBooking(
                            booking
                          )
                        }
                        style={{
                          border:
                            "none",
                          background:
                            "#2563eb",
                          color:
                            "#ffffff",
                          padding:
                            "10px 18px",
                          borderRadius:
                            "9px",
                          cursor:
                            "pointer",
                          fontWeight:
                            "600",
                        }}
                      >
                        View Details →
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* ================================================= */}
        {/* EVENT COUPONS & SECRET DISCOUNTS */}
        {/* ================================================= */}

        <div
          className="dashboard-section"
          id="organizer-coupons"
          style={{
            marginTop: "30px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "15px",
              marginBottom: "20px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <span className="section-label">
                PROMOTIONS & DISCOUNTS
              </span>

              <h2
                style={{
                  marginBottom: "5px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                🏷️ Event Coupons & Secret Codes
              </h2>

              <p
                style={{
                  color: "#64748b",
                  margin: 0,
                  fontSize: "14px",
                }}
              >
                Create custom promo codes to share with select customers.
                Only customers who know and enter your coupon code at checkout receive the discount!
              </p>
            </div>

            <button
              onClick={() => {
                setCouponFormError("");
                setIsCouponModalOpen(true);
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "#2563eb",
                color: "#ffffff",
                border: "none",
                padding: "12px 22px",
                borderRadius: "10px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "15px",
                boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)",
              }}
            >
              <span>➕</span> Create New Coupon
            </button>
          </div>

          {couponSuccessMessage && (
            <div
              style={{
                background: "#f0fdf4",
                border: "1px solid #86efac",
                color: "#166534",
                padding: "14px 18px",
                borderRadius: "10px",
                marginBottom: "20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span>✅</span>
                <span>{couponSuccessMessage}</span>
              </div>
              <button
                onClick={() => setCouponSuccessMessage("")}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#166534",
                  fontWeight: "bold",
                }}
              >
                ✕
              </button>
            </div>
          )}

          {coupons.length === 0 ? (
            <div
              style={{
                background: "#ffffff",
                borderRadius: "16px",
                padding: "45px 30px",
                textAlign: "center",
                boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
                border: "1px dashed #cbd5e1",
              }}
            >
              <div
                style={{
                  fontSize: "44px",
                  marginBottom: "12px",
                }}
              >
                🏷️
              </div>

              <h3 style={{ marginBottom: "8px", color: "#0f172a" }}>
                No Coupons Created Yet
              </h3>

              <p
                style={{
                  color: "#64748b",
                  maxWidth: "520px",
                  margin: "0 auto 20px auto",
                  fontSize: "14px",
                }}
              >
                Create your first secret promo code (e.g., <strong>EARLYBIRD20</strong>, <strong>VIP150</strong>, <strong>SPECIAL10</strong>) to offer discounts to customers who enter the code at checkout!
              </p>

              <button
                onClick={() => {
                  setCouponFormError("");
                  setIsCouponModalOpen(true);
                }}
                style={{
                  background: "#2563eb",
                  color: "#ffffff",
                  border: "none",
                  padding: "12px 24px",
                  borderRadius: "10px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                + Create Coupon Code
              </button>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: "20px",
              }}
            >
              {coupons.map((c) => {
                const isPercentage = c.discountType === "PERCENTAGE";
                const isLimitReached =
                  c.usageLimit != null && c.usedCount >= c.usageLimit;

                return (
                  <div
                    key={c.id}
                    style={{
                      background: "#ffffff",
                      borderRadius: "16px",
                      padding: "22px",
                      boxShadow: "0 10px 25px rgba(15, 23, 42, 0.06)",
                      border: c.active ? "1px solid #e2e8f0" : "1px solid #f1f5f9",
                      opacity: c.active ? 1 : 0.75,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      transition: "transform 0.15s ease",
                    }}
                  >
                    <div>
                      {/* TOP BAR: CODE + STATUS */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "16px",
                        }}
                      >
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            background: "#eff6ff",
                            border: "1.5px dashed #2563eb",
                            padding: "6px 14px",
                            borderRadius: "8px",
                            fontWeight: "700",
                            fontSize: "17px",
                            color: "#1d4ed8",
                            letterSpacing: "1px",
                          }}
                        >
                          <span>🏷️</span>
                          <span>{c.code}</span>
                          <button
                            onClick={() => handleCopyCode(c.code)}
                            title="Copy code to clipboard"
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              padding: "0 2px",
                              fontSize: "13px",
                              color: copiedCode === c.code ? "#16a34a" : "#2563eb",
                              fontWeight: "600",
                            }}
                          >
                            {copiedCode === c.code ? "✓ Copied" : "📋"}
                          </button>
                        </div>

                        <div>
                          {isLimitReached ? (
                            <span
                              style={{
                                background: "#fee2e2",
                                color: "#b91c1c",
                                padding: "4px 10px",
                                borderRadius: "20px",
                                fontSize: "12px",
                                fontWeight: "600",
                              }}
                            >
                              Limit Reached
                            </span>
                          ) : c.active ? (
                            <span
                              style={{
                                background: "#dcfce7",
                                color: "#15803d",
                                padding: "4px 10px",
                                borderRadius: "20px",
                                fontSize: "12px",
                                fontWeight: "600",
                              }}
                            >
                              Active
                            </span>
                          ) : (
                            <span
                              style={{
                                background: "#f1f5f9",
                                color: "#64748b",
                                padding: "4px 10px",
                                borderRadius: "20px",
                                fontSize: "12px",
                                fontWeight: "600",
                              }}
                            >
                              Paused
                            </span>
                          )}
                        </div>
                      </div>

                      {/* DISCOUNT DISPLAY */}
                      <div style={{ marginBottom: "14px" }}>
                        <div
                          style={{
                            fontSize: "26px",
                            fontWeight: "800",
                            color: "#0f172a",
                          }}
                        >
                          {isPercentage
                            ? `${c.discountValue}% OFF`
                            : `₹${c.discountValue} OFF`}
                        </div>
                        {isPercentage && c.maxDiscount && (
                          <div
                            style={{
                              fontSize: "13px",
                              color: "#64748b",
                              marginTop: "2px",
                            }}
                          >
                            Up to ₹{c.maxDiscount} max discount
                          </div>
                        )}
                      </div>

                      {/* DETAILS LIST */}
                      <div
                        style={{
                          background: "#f8fafc",
                          borderRadius: "10px",
                          padding: "12px 14px",
                          fontSize: "13px",
                          color: "#334155",
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                          marginBottom: "16px",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "#64748b" }}>Event Scope:</span>
                          <strong style={{ maxWidth: "180px", textAlign: "right", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {c.eventTitle || "All My Events"}
                          </strong>
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "#64748b" }}>Min Order:</span>
                          <strong>
                            {c.minOrderAmount > 0
                              ? `₹${c.minOrderAmount}`
                              : "No Minimum"}
                          </strong>
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "#64748b" }}>Usage:</span>
                          <strong style={{ color: isLimitReached ? "#dc2626" : "#2563eb" }}>
                            {c.usedCount || 0}
                            {c.usageLimit ? ` / ${c.usageLimit} used` : " used (Unlimited)"}
                          </strong>
                        </div>
                      </div>
                    </div>

                    {/* ACTIONS */}
                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        borderTop: "1px solid #f1f5f9",
                        paddingTop: "14px",
                      }}
                    >
                      <button
                        onClick={() => handleToggleCoupon(c.id)}
                        style={{
                          flex: 1,
                          padding: "8px 12px",
                          borderRadius: "8px",
                          border: "1px solid #cbd5e1",
                          background: "#ffffff",
                          color: "#0f172a",
                          cursor: "pointer",
                          fontWeight: "600",
                          fontSize: "13px",
                        }}
                      >
                        {c.active ? "⏸️ Pause" : "▶️ Activate"}
                      </button>

                      <button
                        onClick={() => handleDeleteCoupon(c.id, c.code)}
                        style={{
                          padding: "8px 12px",
                          borderRadius: "8px",
                          border: "1px solid #fee2e2",
                          background: "#fef2f2",
                          color: "#dc2626",
                          cursor: "pointer",
                          fontWeight: "600",
                          fontSize: "13px",
                        }}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ================================================= */}
        {/* CREATE COUPON MODAL */}
        {/* ================================================= */}

        {isCouponModalOpen && (
          <div
            onClick={() => setIsCouponModalOpen(false)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              background: "rgba(15, 23, 42, 0.6)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
              zIndex: 1000,
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "#ffffff",
                borderRadius: "18px",
                width: "100%",
                maxWidth: "520px",
                maxHeight: "90vh",
                overflowY: "auto",
                boxShadow: "0 20px 45px rgba(15, 23, 42, 0.25)",
                padding: "28px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "18px",
                }}
              >
                <div>
                  <h3
                    style={{
                      margin: "0 0 6px 0",
                      fontSize: "20px",
                      color: "#0f172a",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    🏷️ Create Event Coupon
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      color: "#64748b",
                      fontSize: "13px",
                    }}
                  >
                    Set coupon code & discount amount for select customers.
                  </p>
                </div>

                <button
                  onClick={() => setIsCouponModalOpen(false)}
                  style={{
                    background: "#f1f5f9",
                    border: "none",
                    borderRadius: "50%",
                    width: "32px",
                    height: "32px",
                    cursor: "pointer",
                    fontSize: "16px",
                    color: "#64748b",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  ✕
                </button>
              </div>

              {couponFormError && (
                <div
                  style={{
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    color: "#b91c1c",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    fontSize: "13px",
                    marginBottom: "16px",
                  }}
                >
                  ⚠️ {couponFormError}
                </div>
              )}

              <form onSubmit={handleCreateCoupon}>
                {/* COUPON CODE */}
                <div style={{ marginBottom: "16px" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#334155",
                      marginBottom: "6px",
                    }}
                  >
                    Coupon Code *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SPECIAL20, EARLYBIRD, VIP100"
                    value={couponForm.code}
                    onChange={(e) =>
                      setCouponForm({
                        ...couponForm,
                        code: e.target.value.toUpperCase().replace(/\s+/g, ""),
                      })
                    }
                    required
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: "10px",
                      border: "1.5px solid #cbd5e1",
                      fontSize: "15px",
                      fontWeight: "700",
                      letterSpacing: "0.5px",
                      color: "#1e293b",
                      outline: "none",
                      textTransform: "uppercase",
                      boxSizing: "border-box",
                    }}
                  />
                  <small style={{ color: "#64748b", fontSize: "11px" }}>
                    Customers will enter this secret code at checkout to claim the discount.
                  </small>
                </div>

                {/* DISCOUNT TYPE & VALUE */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                    marginBottom: "16px",
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "13px",
                        fontWeight: "600",
                        color: "#334155",
                        marginBottom: "6px",
                      }}
                    >
                      Discount Type *
                    </label>
                    <select
                      value={couponForm.discountType}
                      onChange={(e) =>
                        setCouponForm({
                          ...couponForm,
                          discountType: e.target.value,
                        })
                      }
                      style={{
                        width: "100%",
                        padding: "12px 14px",
                        borderRadius: "10px",
                        border: "1.5px solid #cbd5e1",
                        fontSize: "14px",
                        color: "#1e293b",
                        background: "#ffffff",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    >
                      <option value="PERCENTAGE">Percentage (% Off)</option>
                      <option value="FIXED">Flat Amount (₹ Off)</option>
                    </select>
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "13px",
                        fontWeight: "600",
                        color: "#334155",
                        marginBottom: "6px",
                      }}
                    >
                      Discount Amount *
                    </label>
                    <div style={{ position: "relative" }}>
                      <input
                        type="number"
                        min="1"
                        max={couponForm.discountType === "PERCENTAGE" ? "100" : "50000"}
                        placeholder={couponForm.discountType === "PERCENTAGE" ? "20" : "150"}
                        value={couponForm.discountValue}
                        onChange={(e) =>
                          setCouponForm({
                            ...couponForm,
                            discountValue: e.target.value,
                          })
                        }
                        required
                        style={{
                          width: "100%",
                          padding: "12px 14px",
                          paddingRight: "35px",
                          borderRadius: "10px",
                          border: "1.5px solid #cbd5e1",
                          fontSize: "14px",
                          color: "#1e293b",
                          outline: "none",
                          boxSizing: "border-box",
                        }}
                      />
                      <span
                        style={{
                          position: "absolute",
                          right: "12px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "#64748b",
                          fontWeight: "600",
                        }}
                      >
                        {couponForm.discountType === "PERCENTAGE" ? "%" : "₹"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* TARGET EVENT */}
                <div style={{ marginBottom: "16px" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#334155",
                      marginBottom: "6px",
                    }}
                  >
                    Applicable Event
                  </label>
                  <select
                    value={couponForm.eventId}
                    onChange={(e) =>
                      setCouponForm({
                        ...couponForm,
                        eventId: e.target.value,
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: "10px",
                      border: "1.5px solid #cbd5e1",
                      fontSize: "14px",
                      color: "#1e293b",
                      background: "#ffffff",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  >
                    <option value="">All My Events (Universal)</option>
                    {events.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.title} ({formatDate(ev.eventDate)})
                      </option>
                    ))}
                  </select>
                </div>

                {/* MIN ORDER AMOUNT & USAGE LIMIT */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                    marginBottom: "16px",
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "13px",
                        fontWeight: "600",
                        color: "#334155",
                        marginBottom: "6px",
                      }}
                    >
                      Min Order Amount (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0 (No minimum)"
                      value={couponForm.minOrderAmount}
                      onChange={(e) =>
                        setCouponForm({
                          ...couponForm,
                          minOrderAmount: e.target.value,
                        })
                      }
                      style={{
                        width: "100%",
                        padding: "12px 14px",
                        borderRadius: "10px",
                        border: "1.5px solid #cbd5e1",
                        fontSize: "14px",
                        color: "#1e293b",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "13px",
                        fontWeight: "600",
                        color: "#334155",
                        marginBottom: "6px",
                      }}
                    >
                      Max Total Uses
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="Unlimited (e.g. 50)"
                      value={couponForm.usageLimit}
                      onChange={(e) =>
                        setCouponForm({
                          ...couponForm,
                          usageLimit: e.target.value,
                        })
                      }
                      style={{
                        width: "100%",
                        padding: "12px 14px",
                        borderRadius: "10px",
                        border: "1.5px solid #cbd5e1",
                        fontSize: "14px",
                        color: "#1e293b",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                </div>

                {/* MAX DISCOUNT (ONLY FOR PERCENTAGE) */}
                {couponForm.discountType === "PERCENTAGE" && (
                  <div style={{ marginBottom: "20px" }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: "13px",
                        fontWeight: "600",
                        color: "#334155",
                        marginBottom: "6px",
                      }}
                    >
                      Maximum Discount Cap (₹) - Optional
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 500 (No maximum if blank)"
                      value={couponForm.maxDiscount}
                      onChange={(e) =>
                        setCouponForm({
                          ...couponForm,
                          maxDiscount: e.target.value,
                        })
                      }
                      style={{
                        width: "100%",
                        padding: "12px 14px",
                        borderRadius: "10px",
                        border: "1.5px solid #cbd5e1",
                        fontSize: "14px",
                        color: "#1e293b",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                )}

                {/* MODAL ACTION BUTTONS */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "12px",
                    marginTop: "24px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setIsCouponModalOpen(false)}
                    style={{
                      padding: "11px 20px",
                      borderRadius: "10px",
                      border: "1px solid #cbd5e1",
                      background: "#ffffff",
                      color: "#334155",
                      cursor: "pointer",
                      fontWeight: "600",
                      fontSize: "14px",
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={couponSubmitting}
                    style={{
                      padding: "11px 22px",
                      borderRadius: "10px",
                      border: "none",
                      background: "#2563eb",
                      color: "#ffffff",
                      cursor: couponSubmitting ? "not-allowed" : "pointer",
                      fontWeight: "600",
                      fontSize: "14px",
                      boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)",
                    }}
                  >
                    {couponSubmitting ? "Creating..." : "Save & Activate Coupon"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ================================================= */}
        {/* BOOKING DETAIL MODAL */}
        {/* ================================================= */}

        {selectedBooking && (
          <div
            onClick={() =>
              setSelectedBooking(null)
            }
            style={{
              position: "fixed",
              inset: 0,
              background:
                "rgba(15, 23, 42, 0.65)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
              zIndex: 1000,
            }}
          >
            <div
              onClick={(event) =>
                event.stopPropagation()
              }
              style={{
                width:
                  "min(850px, 100%)",
                maxHeight: "90vh",
                overflowY: "auto",
                background:
                  "#ffffff",
                borderRadius:
                  "20px",
                padding: "28px",
                boxShadow:
                  "0 25px 60px rgba(0, 0, 0, 0.25)",
              }}
            >
              {/* MODAL HEADER */}
              <div
                style={{
                  display:
                    "flex",
                  justifyContent:
                    "space-between",
                  alignItems:
                    "flex-start",
                  gap: "15px",
                  marginBottom:
                    "20px",
                }}
              >
                <div>
                  <span className="section-label">
                    BOOKING DETAILS
                  </span>

                  <h2
                    style={{
                      margin:
                        "5px 0",
                    }}
                  >
                    {
                      selectedBooking.eventTitle
                    }
                  </h2>

                  <p
                    style={{
                      margin: 0,
                      color:
                        "#64748b",
                    }}
                  >
                    {
                      selectedBooking.bookingReference
                    }
                  </p>
                </div>

                <button
                  onClick={() =>
                    setSelectedBooking(
                      null
                    )
                  }
                  style={{
                    border: "none",
                    background:
                      "#f1f5f9",
                    width: "38px",
                    height: "38px",
                    borderRadius:
                      "50%",
                    cursor:
                      "pointer",
                    fontSize:
                      "20px",
                  }}
                >
                  ×
                </button>
              </div>

              {/* CUSTOMER */}
              <div
                style={{
                  background:
                    "#f8fafc",
                  borderRadius:
                    "14px",
                  padding: "18px",
                  marginBottom:
                    "18px",
                }}
              >
                <h3>
                  Customer
                </h3>

                <p>
                  <strong>
                    Name:
                  </strong>{" "}
                  {
                    selectedBooking.customerName
                  }
                </p>

                <p>
                  <strong>
                    Email:
                  </strong>{" "}
                  {
                    selectedBooking.customerEmail
                  }
                </p>

                <p>
                  <strong>
                    Phone:
                  </strong>{" "}
                  {
                    selectedBooking.customerPhone ||
                    "-"
                  }
                </p>
              </div>

              {/* SEATS */}
              <div
                style={{
                  marginBottom:
                    "18px",
                }}
              >
                <h3>
                  🎟️ Seats
                </h3>

                {Array.isArray(
                  selectedBooking.seats
                ) &&
                selectedBooking.seats
                  .length > 0 ? (
                  <div
                    style={{
                      display:
                        "flex",
                      flexWrap:
                        "wrap",
                      gap: "10px",
                    }}
                  >
                    {selectedBooking.seats.map(
                      (
                        seat,
                        index
                      ) => (
                        <div
                          key={`${seat.eventSeatId}-${index}`}
                          style={{
                            background:
                              "#eff6ff",
                            border:
                              "1px solid #bfdbfe",
                            borderRadius:
                              "10px",
                            padding:
                              "10px 14px",
                          }}
                        >
                          <strong>
                            {
                              seat.seatRow
                            }
                            {
                              seat.seatNumber
                            }
                          </strong>

                          <div
                            style={{
                              fontSize:
                                "12px",
                              color:
                                "#64748b",
                            }}
                          >
                            {
                              seat.seatType
                            }{" "}
                            •{" "}
                            {formatCurrency(
                              seat.price
                            )}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <p
                    style={{
                      color:
                        "#64748b",
                    }}
                  >
                    No seat information.
                  </p>
                )}
              </div>

              {/* FOOD */}
              <div
                style={{
                  marginBottom:
                    "18px",
                }}
              >
                <h3>
                  🍔 Food Orders
                </h3>

                {Array.isArray(
                  selectedBooking.foodItems
                ) &&
                selectedBooking.foodItems
                  .length > 0 ? (
                  <div
                    style={{
                      display:
                        "flex",
                      flexDirection:
                        "column",
                      gap: "10px",
                    }}
                  >
                    {selectedBooking.foodItems.map(
                      (
                        food,
                        index
                      ) => (
                        <div
                          key={`${food.stallItemId}-${index}`}
                          style={{
                            display:
                              "flex",
                            justifyContent:
                              "space-between",
                            alignItems:
                              "center",
                            gap: "15px",
                            background:
                              "#f8fafc",
                            borderRadius:
                              "10px",
                            padding:
                              "12px 15px",
                          }}
                        >
                          <div>
                            <strong>
                              {
                                food.itemName
                              }
                            </strong>

                            <div
                              style={{
                                color:
                                  "#64748b",
                                fontSize:
                                  "13px",
                              }}
                            >
                              {
                                food.stallName ||
                                "Stall"
                              }{" "}
                              • Qty{" "}
                              {
                                food.quantity
                              }
                            </div>
                          </div>

                          <strong>
                            {formatCurrency(
                              food.totalPrice
                            )}
                          </strong>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <p
                    style={{
                      color:
                        "#64748b",
                    }}
                  >
                    No food items ordered.
                  </p>
                )}
              </div>

              {/* PAYMENT */}
              <div
                style={{
                  background:
                    "#f8fafc",
                  borderRadius:
                    "14px",
                  padding: "18px",
                }}
              >
                <h3>
                  Payment Summary
                </h3>

                <div
                  style={{
                    display:
                      "flex",
                    justifyContent:
                      "space-between",
                    marginBottom:
                      "8px",
                  }}
                >
                  <span>
                    Ticket Subtotal
                  </span>

                  <strong>
                    {formatCurrency(
                      selectedBooking.ticketSubtotal
                    )}
                  </strong>
                </div>

                <div
                  style={{
                    display:
                      "flex",
                    justifyContent:
                      "space-between",
                    marginBottom:
                      "8px",
                  }}
                >
                  <span>
                    Food Subtotal
                  </span>

                  <strong>
                    {formatCurrency(
                      selectedBooking.foodSubtotal
                    )}
                  </strong>
                </div>

                {Number(
                  selectedBooking.discountAmount ||
                    0
                ) > 0 && (
                  <div
                    style={{
                      display:
                        "flex",
                      justifyContent:
                        "space-between",
                      marginBottom:
                        "8px",
                      color:
                        "#16a34a",
                    }}
                  >
                    <span>
                      Discount
                      {selectedBooking.couponCode
                        ? ` (${selectedBooking.couponCode})`
                        : ""}
                    </span>

                    <strong>
                      -
                      {formatCurrency(
                        selectedBooking.discountAmount
                      )}
                    </strong>
                  </div>
                )}

                <hr
                  style={{
                    border: "none",
                    borderTop:
                      "1px solid #e2e8f0",
                    margin:
                      "14px 0",
                  }}
                />

                <div
                  style={{
                    display:
                      "flex",
                    justifyContent:
                      "space-between",
                    fontSize:
                      "18px",
                  }}
                >
                  <strong>
                    Total
                  </strong>

                  <strong
                    style={{
                      color:
                        "#2563eb",
                    }}
                  >
                    {formatCurrency(
                      selectedBooking.totalAmount
                    )}
                  </strong>
                </div>

                <div
                  style={{
                    marginTop:
                      "15px",
                    fontSize:
                      "14px",
                    color:
                      "#64748b",
                  }}
                >
                  Ticket:{" "}
                  {
                    selectedBooking.ticketNumber ||
                    "Not generated"
                  }
                </div>

                <div
                  style={{
                    fontSize:
                      "14px",
                    color:
                      "#64748b",
                  }}
                >
                  Status:{" "}
                  {
                    selectedBooking.bookingStatus
                  }
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default OrganizerDashboard;