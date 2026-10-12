import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles.css";

function AddStall() {
  const navigate = useNavigate();

  const user = JSON.parse(
    localStorage.getItem("ticketflowUser") || "{}"
  );

  const [formData, setFormData] = useState({
    stallName: "",
    description: "",
    location: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!user.id) {
      setMessage("Please log in again.");
      return;
    }

    setLoading(true);

    try {
const token = localStorage.getItem("ticketflowToken");

if (!token) {
  setMessage("Login token missing. Please log in again.");
  setLoading(false);
  return;
}

const response = await fetch("http://localhost:8080/api/stalls", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  },
  body: JSON.stringify({
    ...formData,
    ownerId: Number(user.id),
  }),
});


      if (!response.ok) {
        throw new Error("Unable to create stall. Please try again.");
      }

      setMessage("Stall submitted successfully! Awaiting approval.");

      setFormData({
        stallName: "",
        description: "",
        location: "",
      });

      setTimeout(() => {
        navigate("/stall-owner/dashboard");
      }, 1500);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div>
            <span className="section-label">STALL MANAGEMENT</span>
            <h1>Add Stall</h1>
            <p>Submit your stall details for approval.</p>
          </div>

          <Link to="/stall-owner" className="dashboard-home">
            ← Dashboard
          </Link>
        </div>

        <div className="dashboard-section">
          <form onSubmit={handleSubmit}>
            <div className="profile-form-group">
              <label>Stall Name</label>
              <input
                type="text"
                name="stallName"
                value={formData.stallName}
                onChange={handleChange}
                placeholder="Enter stall name"
                required
              />
            </div>

            <div className="profile-form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe your stall"
                rows="4"
                required
              />
            </div>

            <div className="profile-form-group">
              <label>Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Enter preferred stall location"
                required
              />
            </div>

            {message && <p role="status">{message}</p>}

            <button
              type="submit"
              className="register-btn"
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit Stall"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AddStall;
