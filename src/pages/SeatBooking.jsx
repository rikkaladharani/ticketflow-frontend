import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

function SeatBooking() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  const [zoom, setZoom] = useState(1);

  // Each held seat gets its own expiry time.
  const [holdExpiry, setHoldExpiry] = useState({});

  // --------------------------------------------------
  // GET LOGGED-IN CUSTOMER
  // --------------------------------------------------

  const getCurrentUser = () => {
    const savedUser = localStorage.getItem("ticketflowUser");

    if (!savedUser) {
      return null;
    }

    try {
      return JSON.parse(savedUser);
    } catch (err) {
      console.error("Invalid saved user:", err);
      return null;
    }
  };

  // --------------------------------------------------
  // LOAD EVENT + SEATS
  // --------------------------------------------------

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        const [eventResponse, seatsResponse] =
          await Promise.all([
            fetch(
              `http://localhost:8080/api/events/${eventId}`
            ),
            fetch(
              `http://localhost:8080/api/event-seats/event/${eventId}`
            ),
          ]);

        if (!eventResponse.ok) {
          throw new Error("Unable to load event.");
        }

        if (!seatsResponse.ok) {
          throw new Error("Unable to load seats.");
        }

        const eventData = await eventResponse.json();
        const seatsData = await seatsResponse.json();

        setEvent(eventData);
        setSeats(
          Array.isArray(seatsData)
            ? seatsData
            : []
        );
      } catch (err) {
        console.error(err);
        setError(
          err.message ||
            "Unable to load booking page."
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [eventId]);

  // --------------------------------------------------
  // REFRESH SEATS
  // --------------------------------------------------

  const refreshSeats = async () => {
    try {
      const response = await fetch(
        `http://localhost:8080/api/event-seats/event/${eventId}`
      );

      if (!response.ok) {
        throw new Error("Unable to refresh seats.");
      }

      const data = await response.json();

      setSeats(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (err) {
      console.error(err);
    }
  };

  // --------------------------------------------------
  // SELECTED TOTAL
  // --------------------------------------------------

  const selectedTotal = useMemo(() => {
    return selectedSeats.reduce(
      (total, seat) =>
        total + Number(seat.price || 0),
      0
    );
  }, [selectedSeats]);

  // --------------------------------------------------
  // HOLD A SEAT
  // --------------------------------------------------

  const holdSeat = async (seat) => {
    const user = getCurrentUser();

    if (!user) {
      setActionError(
        "Please login before selecting seats."
      );
      return false;
    }

    if (!user.id) {
      setActionError(
        "Unable to identify your account."
      );
      return false;
    }

    try {
      setActionError("");

      const response = await fetch(
        `http://localhost:8080/api/event-seats/${seat.id}/hold?customerId=${user.id}`,
        {
  method: "POST",
  headers: {
    Authorization: `Bearer ${localStorage.getItem("ticketflowToken")}`,
  },
}
      );

      const text = await response.text();

      if (!response.ok) {
        throw new Error(
          text || "Unable to hold this seat."
        );
      }

      const heldSeat = JSON.parse(text);

      // Add the selected seat.
      setSelectedSeats((current) => [
        ...current,
        {
          ...seat,
          ...heldSeat,
        },
      ]);

      // Backend hold duration is 10 minutes.
      const expiry =
        Date.now() + 10 * 60 * 1000;

      setHoldExpiry((current) => ({
        ...current,
        [seat.id]: expiry,
      }));

      // Refresh actual database state.
      await refreshSeats();

      return true;
    } catch (err) {
      console.error("Hold error:", err);

      setActionError(
        err.message ||
          "Unable to hold this seat."
      );

      // Refresh in case another customer
      // took the seat.
      await refreshSeats();

      return false;
    }
  };

  // --------------------------------------------------
  // RELEASE A SEAT
  // --------------------------------------------------

  const releaseSeat = async (seat) => {
    const user = getCurrentUser();

    if (!user || !user.id) {
      return;
    }

    try {
      setActionError("");

      const response = await fetch(
        `http://localhost:8080/api/event-seats/${seat.id}/release?customerId=${user.id}`,
        {
  method: "POST",
  headers: {
    Authorization: `Bearer ${localStorage.getItem("ticketflowToken")}`,
  },
}
      );

      const text = await response.text();

      if (!response.ok) {
        throw new Error(
          text || "Unable to release seat."
        );
      }

      setSelectedSeats((current) =>
        current.filter(
          (item) => item.id !== seat.id
        )
      );

      setHoldExpiry((current) => {
        const updated = { ...current };
        delete updated[seat.id];
        return updated;
      });

      await refreshSeats();
    } catch (err) {
      console.error(
        "Release error:",
        err
      );

      setActionError(
        err.message ||
          "Unable to release this seat."
      );
    }
  };

  // --------------------------------------------------
  // TOGGLE SEAT
  // --------------------------------------------------

  const toggleSeat = async (seat) => {
    // If already selected, release it.
    const alreadySelected =
      selectedSeats.some(
        (item) => item.id === seat.id
      );

    if (alreadySelected) {
      await releaseSeat(seat);
      return;
    }

    // Only available seats can be selected.
    if (seat.status !== "AVAILABLE") {
      return;
    }

    await holdSeat(seat);
  };

  // --------------------------------------------------
  // CHECK IF SELECTED
  // --------------------------------------------------

  const isSelected = (seatId) => {
    return selectedSeats.some(
      (seat) => seat.id === seatId
    );
  };

  // --------------------------------------------------
  // GROUP SEATS
  // --------------------------------------------------

  const groupedSeats = useMemo(() => {
    const groups = {};

    seats.forEach((eventSeat) => {
      const physicalSeat =
        eventSeat.seat;

      if (!physicalSeat) {
        return;
      }

      const sectionName =
        physicalSeat.section?.name ||
        physicalSeat.seatType ||
        "General";

      if (!groups[sectionName]) {
        groups[sectionName] = [];
      }

      groups[sectionName].push({
        ...eventSeat,

        seatRow:
          physicalSeat.seatRow,

        seatNumber:
          physicalSeat.seatNumber,

        seatType:
          physicalSeat.seatType,

        price:
          eventSeat.price,

        section:
          physicalSeat.section,
      });
    });

    Object.values(groups).forEach(
      (sectionSeats) => {
        sectionSeats.sort((a, b) => {
          const rowA =
            String(a.seatRow || "");

          const rowB =
            String(b.seatRow || "");

          if (rowA !== rowB) {
            return rowA.localeCompare(
              rowB,
              undefined,
              { numeric: true }
            );
          }

          return (
            Number(
              a.seatNumber || 0
            ) -
            Number(
              b.seatNumber || 0
            )
          );
        });
      }
    );

    return groups;
  }, [seats]);

  // --------------------------------------------------
  // GROUP BY ROW
  // --------------------------------------------------

  const groupByRow = (
    sectionSeats
  ) => {
    const rows = {};

    sectionSeats.forEach((seat) => {
      const row =
        seat.seatRow || "?";

      if (!rows[row]) {
        rows[row] = [];
      }

      rows[row].push(seat);
    });

    Object.values(rows).forEach(
      (rowSeats) => {
        rowSeats.sort(
          (a, b) =>
            Number(
              a.seatNumber || 0
            ) -
            Number(
              b.seatNumber || 0
            )
        );
      }
    );

    return rows;
  };

  // --------------------------------------------------
  // SEAT CLASS
  // --------------------------------------------------

  const getSeatClass = (seat) => {
    if (isSelected(seat.id)) {
      return "seat selected";
    }

    if (seat.status === "BOOKED") {
      return "seat booked";
    }

    if (seat.status === "HELD") {
      return "seat held";
    }

    if (
      seat.status ===
      "UNAVAILABLE"
    ) {
      return "seat unavailable";
    }

    return "seat available";
  };

  // --------------------------------------------------
  // COUNTDOWN
  // --------------------------------------------------

  const getRemainingTime = (
    seatId
  ) => {
    const expiry =
      holdExpiry[seatId];

    if (!expiry) {
      return null;
    }

    const remaining = Math.max(
      0,
      expiry - Date.now()
    );

    const totalSeconds =
      Math.floor(
        remaining / 1000
      );

    const minutes =
      Math.floor(
        totalSeconds / 60
      );

    const seconds =
      totalSeconds % 60;

    return `${String(
      minutes
    ).padStart(2, "0")}:${String(
      seconds
    ).padStart(2, "0")}`;
  };

  // Force countdown updates.
  const [, setClock] =
    useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setClock(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // --------------------------------------------------
  // AUTOMATIC EXPIRY
  // --------------------------------------------------

  useEffect(() => {
    const checkExpiredHolds =
      async () => {
        const now = Date.now();

        const expiredSeats =
          selectedSeats.filter(
            (seat) => {
              const expiry =
                holdExpiry[seat.id];

              return (
                expiry &&
                expiry <= now
              );
            }
          );

        for (const seat of expiredSeats) {
          setSelectedSeats(
            (current) =>
              current.filter(
                (item) =>
                  item.id !==
                  seat.id
              )
          );

          setHoldExpiry(
            (current) => {
              const updated = {
                ...current,
              };

              delete updated[
                seat.id
              ];

              return updated;
            }
          );
        }

        if (
          expiredSeats.length > 0
        ) {
          await refreshSeats();

          setActionError(
            "One or more seat holds expired."
          );
        }
      };

    const timer =
      setInterval(
        checkExpiredHolds,
        1000
      );

    return () =>
      clearInterval(timer);
  }, [
    selectedSeats,
    holdExpiry,
  ]);

  // --------------------------------------------------
  // CONTINUE TO CHECKOUT
  // --------------------------------------------------

  const continueBooking = () => {
    if (
      selectedSeats.length === 0
    ) {
      return;
    }

    const seatIds =
      selectedSeats.map(
        (seat) => seat.id
      );

    navigate(
      `/customer/checkout/${eventId}?seats=${seatIds.join(",")}`
    );
  };

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  if (loading) {
    return (
      <div className="seat-booking-loading">
        <div className="ticket-spinner"></div>

        <h2>
          Loading seat map...
        </h2>

        <p>
          Preparing the seating
          arrangement for this event.
        </p>
      </div>
    );
  }

  // --------------------------------------------------
  // ERROR
  // --------------------------------------------------

  if (error) {
    return (
      <div className="seat-booking-error-page">
        <div className="seat-error-card">

          <div className="seat-error-icon">
            !
          </div>

          <h2>
            Unable to load booking page
          </h2>

          <p>{error}</p>

          <Link
            to="/"
            className="seat-error-back"
          >
            ← Back to events
          </Link>

        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // PAGE
  // --------------------------------------------------

  return (
    <div className="seat-booking-page">

      {/* HEADER */}

      <header className="seat-booking-header">

        <div className="seat-booking-header-inner">

          <Link
            to="/"
            className="seat-booking-logo"
          >
            TICKET<span>FLOW</span>
          </Link>

          <div className="seat-booking-header-title">
            Select Your Seats
          </div>

          <Link
            to="/customer/dashboard"
            className="seat-booking-back"
          >
            ← Dashboard
          </Link>

        </div>

      </header>

      {/* EVENT INFORMATION */}

      <section className="booking-event-info">

        <div className="booking-event-details">

          <span className="booking-event-category">
            {event?.category ||
              "EVENT"}
          </span>

          <h1>
            {event?.title}
          </h1>

          <div className="booking-event-meta">

            <span>
              📅 {event?.eventDate}
            </span>

            <span>
              🕐 {event?.startTime}
              {" – "}
              {event?.endTime}
            </span>

          </div>

          {event?.venue && (
            <p className="booking-venue-name">
              📍 {event.venue.name},{" "}
              {event.venue.city}
            </p>
          )}

        </div>

        {/* PROGRESS */}

        <div className="booking-progress">

          <div className="progress-step active">
            <span>1</span>
            Seats
          </div>

          <div className="progress-line"></div>

          <div className="progress-step">
            <span>2</span>
            Checkout
          </div>

          <div className="progress-line"></div>

          <div className="progress-step">
            <span>3</span>
            Payment
          </div>

        </div>

      </section>

      {/* MAIN */}

      <main className="seat-booking-main">

        {/* SEAT MAP */}

        <section className="seat-map-panel">

          <div className="seat-map-toolbar">

            <div>

              <h2>
                Choose your seats
              </h2>

              <p>
                Click an available
                seat to hold it for
                10 minutes.
              </p>

            </div>

            <div className="seat-zoom-controls">

              <button
                type="button"
                onClick={() =>
                  setZoom(
                    (value) =>
                      Math.max(
                        0.6,
                        value - 0.1
                      )
                  )
                }
              >
                −
              </button>

              <span>
                {Math.round(
                  zoom * 100
                )}
                %
              </span>

              <button
                type="button"
                onClick={() =>
                  setZoom(
                    (value) =>
                      Math.min(
                        1.5,
                        value + 0.1
                      )
                  )
                }
              >
                +
              </button>

              <button
                type="button"
                className="zoom-reset"
                onClick={() =>
                  setZoom(1)
                }
              >
                Reset
              </button>

            </div>

          </div>

          {/* ACTION ERROR */}

          {actionError && (
            <div
              style={{
                margin: "15px 25px 0",
                padding: "12px 15px",
                borderRadius: "10px",
                background: "#fef2f2",
                color: "#b91c1c",
                fontSize: "13px",
              }}
            >
              {actionError}
            </div>
          )}

          {/* LEGEND */}

          <div className="seat-legend">

            <div className="legend-item">
              <span className="legend-seat available"></span>
              Available
            </div>

            <div className="legend-item">
              <span className="legend-seat selected"></span>
              Selected / Held
            </div>

            <div className="legend-item">
              <span className="legend-seat booked"></span>
              Booked
            </div>

            <div className="legend-item">
              <span className="legend-seat held"></span>
              Held
            </div>

          </div>

          {/* MAP */}

          <div className="seat-map-container">

            <div className="stage">

              <div className="stage-light left"></div>

              <span>
                STAGE
              </span>

              <div className="stage-light right"></div>

            </div>

            <div
              className="seat-map"
              style={{
                transform:
                  `scale(${zoom})`,
                transformOrigin:
                  "top center",
              }}
            >

              {Object.entries(
                groupedSeats
              ).map(
                ([
                  sectionName,
                  sectionSeats,
                ]) => {

                  const rows =
                    groupByRow(
                      sectionSeats
                    );

                  const firstSeat =
                    sectionSeats[0];

                  const availableCount =
                    sectionSeats.filter(
                      (seat) =>
                        seat.status ===
                        "AVAILABLE"
                    ).length;

                  return (
                    <div
                      className={`seat-section section-${String(
                        sectionName
                      )
                        .toLowerCase()
                        .replace(
                          /\s+/g,
                          "-"
                        )}`}
                      key={sectionName}
                    >

                      <div className="seat-section-header">

                        <div>

                          <strong>
                            {sectionName}
                          </strong>

                          <span>
                            {firstSeat?.seatType ||
                              sectionName}
                          </span>

                        </div>

                        <div className="section-price">

                          <strong>
                            ₹
                            {Number(
                              firstSeat?.price ||
                                0
                            ).toLocaleString(
                              "en-IN"
                            )}
                          </strong>

                          <small>
                            {availableCount}
                            {" "}
                            available
                          </small>

                        </div>

                      </div>

                      <div className="seat-rows">

                        {Object.entries(
                          rows
                        ).map(
                          ([
                            rowName,
                            rowSeats,
                          ]) => (

                            <div
                              className="seat-row"
                              key={rowName}
                            >

                              <div className="row-label">
                                {rowName}
                              </div>

                              <div className="seat-row-items">

                                {rowSeats.map(
                                  (seat) => (

                                    <button
                                      key={
                                        seat.id
                                      }
                                      type="button"
                                      className={getSeatClass(
                                        seat
                                      )}
                                      disabled={
                                        seat.status !==
                                          "AVAILABLE" &&
                                        !isSelected(
                                          seat.id
                                        )
                                      }
                                      onClick={() =>
                                        toggleSeat(
                                          seat
                                        )
                                      }
                                      title={`${seat.seatRow}${seat.seatNumber} • ₹${Number(
                                        seat.price ||
                                          0
                                      ).toLocaleString(
                                        "en-IN"
                                      )}`}
                                    >
                                      <span>
                                        {
                                          seat.seatNumber
                                        }
                                      </span>
                                    </button>

                                  )
                                )}

                              </div>

                            </div>

                          )
                        )}

                      </div>

                    </div>
                  );
                }
              )}

            </div>

          </div>

        </section>

        {/* SUMMARY */}

        <aside className="seat-summary">

          <div className="seat-summary-header">

            <div>

              <span className="summary-label">
                YOUR BOOKING
              </span>

              <h2>
                Your Selection
              </h2>

            </div>

            <span className="seat-count">
              {selectedSeats.length}
              {" "}
              {selectedSeats.length === 1
                ? "seat"
                : "seats"}
            </span>

          </div>

          {selectedSeats.length === 0 ? (

            <div className="empty-seat-selection">

              <div className="empty-seat-icon">
                💺
              </div>

              <h3>
                No seats selected
              </h3>

              <p>
                Select your preferred
                seats from the seating
                map.
              </p>

            </div>

          ) : (

            <div className="selected-seat-list">

              {selectedSeats.map(
                (seat) => {

                  const remaining =
                    getRemainingTime(
                      seat.id
                    );

                  return (
                    <div
                      className="selected-seat-item"
                      key={seat.id}
                    >

                      <div className="selected-seat-info">

                        <div className="selected-seat-number">
                          {seat.seatRow}
                          {seat.seatNumber}
                        </div>

                        <div>

                          <strong>
                            {seat.seatType}
                          </strong>

                          <span>
                            {seat.section?.name ||
                              seat.seatType}
                          </span>

                          {remaining && (
                            <span
                              style={{
                                color:
                                  "#f59e0b",
                                fontWeight:
                                  "800",
                              }}
                            >
                              Held for{" "}
                              {remaining}
                            </span>
                          )}

                        </div>

                      </div>

                      <div className="selected-seat-price">

                        <strong>
                          ₹
                          {Number(
                            seat.price ||
                              0
                          ).toLocaleString(
                            "en-IN"
                          )}
                        </strong>

                        <button
                          type="button"
                          onClick={() =>
                            releaseSeat(
                              seat
                            )
                          }
                          title="Release seat"
                        >
                          ×
                        </button>

                      </div>

                    </div>
                  );
                }
              )}

            </div>

          )}

          <div className="seat-summary-divider"></div>

          <div className="seat-summary-row">

            <span>
              Seats
            </span>

            <strong>
              {selectedSeats.length}
            </strong>

          </div>

          <div className="seat-summary-row">

            <span>
              Ticket total
            </span>

            <strong className="summary-total">
              ₹
              {selectedTotal.toLocaleString(
                "en-IN"
              )}
            </strong>

          </div>

          <div className="summary-note">

            <span>
              🔒
            </span>

            Selected seats are
            temporarily held for
            10 minutes.

          </div>

          <button
            type="button"
            className="continue-booking-btn"
            disabled={
              selectedSeats.length === 0
            }
            onClick={
              continueBooking
            }
          >
            Continue to Checkout

            <span>
              →
            </span>

          </button>

        </aside>

      </main>

    </div>
  );
}

export default SeatBooking;