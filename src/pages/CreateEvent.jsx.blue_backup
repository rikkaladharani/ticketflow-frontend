import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles.css";

function CreateEvent() {
  const navigate = useNavigate();

  const user = JSON.parse(
    localStorage.getItem("ticketflowUser") || "{}"
  );

  const [venues, setVenues] = useState([]);

  const [loadingVenues, setLoadingVenues] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] =
    useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "MUSIC",
    imageUrl: "",
    eventDate: "",
    startTime: "",
    endTime: "",
    venueId: "",
    hasStalls: false,
  });

  // =========================================================
  // LOAD VENUES
  // =========================================================

  useEffect(() => {
    loadVenues();
  }, []);

  const loadVenues = async () => {
    try {
      setLoadingVenues(true);
      setError("");

      const response = await fetch(
        "http://localhost:8080/api/venues"
      );

      if (!response.ok) {
        throw new Error(
          "Unable to load venues."
        );
      }

      const data = await response.json();

      setVenues(
        Array.isArray(data) ? data : []
      );
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Unable to load venues."
      );
    } finally {
      setLoadingVenues(false);
    }
  };

  // =========================================================
  // HANDLE INPUT
  // =========================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  // =========================================================
  // SUBMIT EVENT
  // =========================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    // -------------------------------------------------------
    // LOGIN CHECK
    // -------------------------------------------------------

    if (!user.id) {
      setError(
        "Organizer information is missing. Please login again."
      );
      return;
    }

    if (user.role !== "ORGANIZER") {
      setError(
        "Only organizers can create events."
      );
      return;
    }

    // -------------------------------------------------------
    // VALIDATION
    // -------------------------------------------------------

    if (!formData.title.trim()) {
      setError("Please enter an event title.");
      return;
    }

    if (!formData.description.trim()) {
      setError(
        "Please enter an event description."
      );
      return;
    }

    if (!formData.eventDate) {
      setError("Please select an event date.");
      return;
    }

    if (!formData.startTime) {
      setError("Please select a start time.");
      return;
    }

    if (!formData.endTime) {
      setError("Please select an end time.");
      return;
    }

    if (!formData.venueId) {
      setError("Please select a venue.");
      return;
    }

    // -------------------------------------------------------
    // TIME VALIDATION
    // -------------------------------------------------------

    if (
      formData.startTime >=
      formData.endTime
    ) {
      setError(
        "End time must be later than start time."
      );
      return;
    }

    // -------------------------------------------------------
    // DATE VALIDATION
    // -------------------------------------------------------

    const today =
      new Date().toISOString().split("T")[0];

    if (formData.eventDate < today) {
      setError(
        "Event date cannot be in the past."
      );
      return;
    }

    // -------------------------------------------------------
    // REQUEST
    // -------------------------------------------------------

    const requestBody = {
      title: formData.title.trim(),

      description:
        formData.description.trim(),

      category: formData.category,

      imageUrl:
        formData.imageUrl.trim(),

      eventDate:
        formData.eventDate,

      startTime:
        formData.startTime,

      endTime:
        formData.endTime,

      organizerId:
        Number(user.id),

      venueId:
        Number(formData.venueId),

      hasStalls:
        Boolean(formData.hasStalls),
    };

    try {
      setSubmitting(true);

      const response = await fetch(
        "http://localhost:8080/api/events",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("ticketflowToken") || ""}`,
          },

          body: JSON.stringify(
            requestBody
          ),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to create event."
        );
      }

      console.log(
        "Created event:",
        data
      );

      setSuccess(
        "Event created successfully!"
      );

      // -----------------------------------------------------
      // RESET FORM
      // -----------------------------------------------------

      setFormData({
        title: "",
        description: "",
        category: "MUSIC",
        imageUrl: "",
        eventDate: "",
        startTime: "",
        endTime: "",
        venueId: "",
        hasStalls: false,
      });

      // -----------------------------------------------------
      // GO BACK TO DASHBOARD
      // -----------------------------------------------------

      setTimeout(() => {
        navigate(
          "/organizer/dashboard"
        );
      }, 1200);

    } catch (err) {
      console.error(
        "Create event error:",
        err
      );

      setError(
        err.message ||
          "Unable to create event."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // =========================================================
  // SELECTED VENUE
  // =========================================================

  const selectedVenue =
    venues.find(
      (venue) =>
        Number(venue.id) ===
        Number(formData.venueId)
    );

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="dashboard-page">
      <div
        className="dashboard-container"
        style={{
          maxWidth: "1000px",
        }}
      >

        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <div className="dashboard-header">
          <div>
            <span className="section-label">
              ORGANIZER
            </span>

            <h1>
              Create Event
            </h1>

            <p>
              Create a new event and select
              its venue.
            </p>
          </div>

          <Link
            to="/organizer/dashboard"
            className="dashboard-home"
          >
            ← Dashboard
          </Link>
        </div>

        {/* ================================================= */}
        {/* FORM CARD */}
        {/* ================================================= */}

        <div
          style={{
            background:
              "#ffffff",
            border:
              "1px solid #e2e8f0",
            borderRadius:
              "20px",
            padding:
              "30px",
            boxShadow:
              "0 10px 30px rgba(15, 23, 42, 0.08)",
          }}
        >

          {/* ================================================= */}
          {/* ERROR */}
          {/* ================================================= */}

          {error && (
            <div
              style={{
                background:
                  "#fef2f2",
                border:
                  "1px solid #fecaca",
                color:
                  "#dc2626",
                padding:
                  "14px 16px",
                borderRadius:
                  "10px",
                marginBottom:
                  "20px",
                fontWeight:
                  "600",
              }}
            >
              ⚠️ {error}
            </div>
          )}

          {/* ================================================= */}
          {/* SUCCESS */}
          {/* ================================================= */}

          {success && (
            <div
              style={{
                background:
                  "#f0fdf4",
                border:
                  "1px solid #bbf7d0",
                color:
                  "#15803d",
                padding:
                  "14px 16px",
                borderRadius:
                  "10px",
                marginBottom:
                  "20px",
                fontWeight:
                  "600",
              }}
            >
              ✓ {success}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
          >

            {/* ================================================= */}
            {/* EVENT TITLE */}
            {/* ================================================= */}

            <div
              style={{
                marginBottom:
                  "20px",
              }}
            >
              <label
                style={{
                  display:
                    "block",
                  fontWeight:
                    "700",
                  marginBottom:
                    "8px",
                }}
              >
                Event Title *
              </label>

              <input
                type="text"
                name="title"
                value={
                  formData.title
                }
                onChange={
                  handleChange
                }
                placeholder="e.g. TICKETFLOW Summer Music Festival"
                style={{
                  width:
                    "100%",
                  boxSizing:
                    "border-box",
                  padding:
                    "13px 14px",
                  border:
                    "1px solid #cbd5e1",
                  borderRadius:
                    "10px",
                  fontSize:
                    "15px",
                  outline:
                    "none",
                }}
              />
            </div>

            {/* ================================================= */}
            {/* DESCRIPTION */}
            {/* ================================================= */}

            <div
              style={{
                marginBottom:
                  "20px",
              }}
            >
              <label
                style={{
                  display:
                    "block",
                  fontWeight:
                    "700",
                  marginBottom:
                    "8px",
                }}
              >
                Description *
              </label>

              <textarea
                name="description"
                value={
                  formData.description
                }
                onChange={
                  handleChange
                }
                placeholder="Describe your event..."
                rows="5"
                style={{
                  width:
                    "100%",
                  boxSizing:
                    "border-box",
                  padding:
                    "13px 14px",
                  border:
                    "1px solid #cbd5e1",
                  borderRadius:
                    "10px",
                  fontSize:
                    "15px",
                  resize:
                    "vertical",
                  outline:
                    "none",
                }}
              />
            </div>

            {/* ================================================= */}
            {/* CATEGORY */}
            {/* ================================================= */}

            <div
              style={{
                marginBottom:
                  "20px",
              }}
            >
              <label
                style={{
                  display:
                    "block",
                  fontWeight:
                    "700",
                  marginBottom:
                    "8px",
                }}
              >
                Category *
              </label>

              <select
                name="category"
                value={
                  formData.category
                }
                onChange={
                  handleChange
                }
                style={{
                  width:
                    "100%",
                  boxSizing:
                    "border-box",
                  padding:
                    "13px 14px",
                  border:
                    "1px solid #cbd5e1",
                  borderRadius:
                    "10px",
                  fontSize:
                    "15px",
                  background:
                    "#ffffff",
                  outline:
                    "none",
                }}
              >
                <option value="MUSIC">
                  Music
                </option>

                <option value="COMEDY">
                  Comedy
                </option>

                <option value="SPORTS">
                  Sports
                </option>

                <option value="THEATRE">
                  Theatre
                </option>

                <option value="CONFERENCE">
                  Conference
                </option>

                <option value="FESTIVAL">
                  Festival
                </option>

                <option value="OTHER">
                  Other
                </option>
              </select>
            </div>

            {/* ================================================= */}
            {/* IMAGE URL */}
            {/* ================================================= */}

            <div
              style={{
                marginBottom:
                  "25px",
              }}
            >
              <label
                style={{
                  display:
                    "block",
                  fontWeight:
                    "700",
                  marginBottom:
                    "8px",
                }}
              >
                Event Image URL
              </label>

              <input
                type="url"
                name="imageUrl"
                value={
                  formData.imageUrl
                }
                onChange={
                  handleChange
                }
                placeholder="https://example.com/event-image.jpg"
                style={{
                  width:
                    "100%",
                  boxSizing:
                    "border-box",
                  padding:
                    "13px 14px",
                  border:
                    "1px solid #cbd5e1",
                  borderRadius:
                    "10px",
                  fontSize:
                    "15px",
                  outline:
                    "none",
                }}
              />

              <small
                style={{
                  display:
                    "block",
                  marginTop:
                    "7px",
                  color:
                    "#64748b",
                }}
              >
                Optional. You can add an
                image later.
              </small>
            </div>

            {/* ================================================= */}
            {/* DATE + TIME */}
            {/* ================================================= */}

            <div
              style={{
                display:
                  "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(200px, 1fr))",
                gap:
                  "18px",
                marginBottom:
                  "25px",
              }}
            >

              {/* DATE */}

              <div>
                <label
                  style={{
                    display:
                      "block",
                    fontWeight:
                      "700",
                    marginBottom:
                      "8px",
                  }}
                >
                  Event Date *
                </label>

                <input
                  type="date"
                  name="eventDate"
                  value={
                    formData.eventDate
                  }
                  onChange={
                    handleChange
                  }
                  min={
                    new Date()
                      .toISOString()
                      .split("T")[0]
                  }
                  style={{
                    width:
                      "100%",
                    boxSizing:
                      "border-box",
                    padding:
                      "13px 14px",
                    border:
                      "1px solid #cbd5e1",
                    borderRadius:
                      "10px",
                    fontSize:
                      "15px",
                  }}
                />
              </div>

              {/* START */}

              <div>
                <label
                  style={{
                    display:
                      "block",
                    fontWeight:
                      "700",
                    marginBottom:
                      "8px",
                  }}
                >
                  Start Time *
                </label>

                <input
                  type="time"
                  name="startTime"
                  value={
                    formData.startTime
                  }
                  onChange={
                    handleChange
                  }
                  style={{
                    width:
                      "100%",
                    boxSizing:
                      "border-box",
                    padding:
                      "13px 14px",
                    border:
                      "1px solid #cbd5e1",
                    borderRadius:
                      "10px",
                    fontSize:
                      "15px",
                  }}
                />
              </div>

              {/* END */}

              <div>
                <label
                  style={{
                    display:
                      "block",
                    fontWeight:
                      "700",
                    marginBottom:
                      "8px",
                  }}
                >
                  End Time *
                </label>

                <input
                  type="time"
                  name="endTime"
                  value={
                    formData.endTime
                  }
                  onChange={
                    handleChange
                  }
                  style={{
                    width:
                      "100%",
                    boxSizing:
                      "border-box",
                    padding:
                      "13px 14px",
                    border:
                      "1px solid #cbd5e1",
                    borderRadius:
                      "10px",
                    fontSize:
                      "15px",
                  }}
                />
              </div>

            </div>

            {/* ================================================= */}
            {/* VENUE */}
            {/* ================================================= */}

            <div
              style={{
                marginBottom:
                  "25px",
              }}
            >
              <label
                style={{
                  display:
                    "block",
                  fontWeight:
                    "700",
                  marginBottom:
                    "8px",
                }}
              >
                Venue *
              </label>

              {loadingVenues ? (
                <div
                  style={{
                    background:
                      "#f8fafc",
                    padding:
                      "14px",
                    borderRadius:
                      "10px",
                    color:
                      "#64748b",
                  }}
                >
                  Loading venues...
                </div>
              ) : (
                <select
                  name="venueId"
                  value={
                    formData.venueId
                  }
                  onChange={
                    handleChange
                  }
                  style={{
                    width:
                      "100%",
                    boxSizing:
                      "border-box",
                    padding:
                      "13px 14px",
                    border:
                      "1px solid #cbd5e1",
                    borderRadius:
                      "10px",
                    fontSize:
                      "15px",
                    background:
                      "#ffffff",
                  }}
                >
                  <option value="">
                    Select a venue
                  </option>

                  {venues.map(
                    (venue) => (
                      <option
                        key={
                          venue.id
                        }
                        value={
                          venue.id
                        }
                      >
                        {venue.name} —{" "}
                        {venue.city} —{" "}
                        Capacity:{" "}
                        {
                          venue.capacity
                        }
                      </option>
                    )
                  )}
                </select>
              )}
            </div>

            {/* ================================================= */}
            {/* SELECTED VENUE PREVIEW */}
            {/* ================================================= */}

            {selectedVenue && (
              <div
                style={{
                  background:
                    "#eff6ff",
                  border:
                    "1px solid #bfdbfe",
                  borderRadius:
                    "14px",
                  padding:
                    "18px",
                  marginBottom:
                    "25px",
                }}
              >
                <h3
                  style={{
                    margin:
                      "0 0 8px",
                    color:
                      "#1d4ed8",
                  }}
                >
                  📍{" "}
                  {
                    selectedVenue.name
                  }
                </h3>

                <p
                  style={{
                    margin:
                      "4px 0",
                    color:
                      "#475569",
                  }}
                >
                  {
                    selectedVenue.address
                  }
                  ,{" "}
                  {
                    selectedVenue.city
                  }
                </p>

                <p
                  style={{
                    margin:
                      "4px 0",
                    color:
                      "#475569",
                  }}
                >
                  Capacity:{" "}
                  <strong>
                    {Number(
                      selectedVenue.capacity
                    ).toLocaleString(
                      "en-IN"
                    )}
                  </strong>
                </p>

                <p
                  style={{
                    margin:
                      "4px 0",
                    color:
                      "#475569",
                  }}
                >
                  Layout:{" "}
                  <strong>
                    {
                      selectedVenue.layoutType
                    }
                  </strong>
                </p>
              </div>
            )}

            {/* ================================================= */}
            {/* WANT STALLS FOR THIS EVENT */}
            {/* ================================================= */}

            <div
              style={{
                marginBottom: "25px",
                padding: "20px",
                borderRadius: "14px",
                border: formData.hasStalls ? "2px solid #10b981" : "1px solid #cbd5e1",
                background: formData.hasStalls ? "#f0fdf4" : "#f8fafc",
                transition: "all 0.2s ease",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "12px",
                  marginBottom: "8px",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontWeight: "700",
                      fontSize: "16px",
                      color: "#0f172a",
                    }}
                  >
                    🏪 Want food / merchandise stalls for this event?
                  </label>
                  <p
                    style={{
                      margin: "4px 0 0",
                      fontSize: "13px",
                      color: formData.hasStalls ? "#15803d" : "#64748b",
                    }}
                  >
                    {formData.hasStalls
                      ? "✓ Yes selected: All registered Stall Owners will be automatically notified so they can view details, apply with their approved stalls, and attach their menu."
                      : "No: Continue normally. Customers will book standard tickets without stalls."}
                  </p>
                </div>

                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, hasStalls: true }))}
                    style={{
                      padding: "10px 18px",
                      borderRadius: "10px",
                      fontWeight: "700",
                      fontSize: "14px",
                      cursor: "pointer",
                      border: formData.hasStalls ? "2px solid #10b981" : "1px solid #cbd5e1",
                      background: formData.hasStalls ? "#10b981" : "#ffffff",
                      color: formData.hasStalls ? "#ffffff" : "#475569",
                      boxShadow: formData.hasStalls ? "0 4px 12px rgba(16, 185, 129, 0.25)" : "none",
                      transition: "all 0.2s ease",
                    }}
                  >
                    ✓ Yes (Allow Stalls)
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, hasStalls: false }))}
                    style={{
                      padding: "10px 18px",
                      borderRadius: "10px",
                      fontWeight: "700",
                      fontSize: "14px",
                      cursor: "pointer",
                      border: !formData.hasStalls ? "2px solid #64748b" : "1px solid #cbd5e1",
                      background: !formData.hasStalls ? "#334155" : "#ffffff",
                      color: !formData.hasStalls ? "#ffffff" : "#475569",
                      transition: "all 0.2s ease",
                    }}
                  >
                    ✗ No (Leave & Continue)
                  </button>
                </div>
              </div>
            </div>

            {/* ================================================= */}
            {/* BUTTONS */}
            {/* ================================================= */}

            <div
              style={{
                display:
                  "flex",
                justifyContent:
                  "flex-end",
                gap:
                  "12px",
                flexWrap:
                  "wrap",
              }}
            >
              <Link
                to="/organizer/dashboard"
                style={{
                  textDecoration:
                    "none",
                  border:
                    "1px solid #cbd5e1",
                  color:
                    "#334155",
                  background:
                    "#ffffff",
                  padding:
                    "12px 22px",
                  borderRadius:
                    "10px",
                  fontWeight:
                    "600",
                }}
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={
                  submitting ||
                  loadingVenues
                }
                style={{
                  border:
                    "none",
                  background:
                    submitting
                      ? "#94a3b8"
                      : "#2563eb",
                  color:
                    "#ffffff",
                  padding:
                    "12px 24px",
                  borderRadius:
                    "10px",
                  fontWeight:
                    "700",
                  cursor:
                    submitting
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                {submitting
                  ? "Creating Event..."
                  : "Create Event"}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}

export default CreateEvent;