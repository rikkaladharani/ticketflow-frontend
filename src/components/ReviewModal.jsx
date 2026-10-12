import { useState } from "react";
import api from "../services/api";

function ReviewModal({ eventId, eventTitle, onClose, onReviewSubmitted }) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating || rating < 1 || rating > 5) {
      setError("Please select a rating between 1 and 5 stars");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await api.post("/reviews", {
        eventId,
        rating,
        comment: comment.trim(),
      });

      setSuccess(true);
      setTimeout(() => {
        if (onReviewSubmitted) onReviewSubmitted();
        onClose();
      }, 1200);
    } catch (err) {
      console.error("Submit review error:", err);
      setError(err.response?.data?.message || err.message || "Failed to submit review");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog review-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Rate & Review Event</h3>
          <button type="button" className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        {success ? (
          <div className="review-success-state">
            <span className="success-icon">⭐</span>
            <h4>Thank You!</h4>
            <p>Your feedback for <strong>{eventTitle}</strong> has been submitted.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="modal-body">
            <p className="review-event-subtitle">
              How was your experience at <strong>{eventTitle}</strong>?
            </p>

            <div className="star-rating-picker">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  className={`star-btn ${star <= (hoverRating || rating) ? "active" : ""}`}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                >
                  ★
                </button>
              ))}
              <span className="star-score-label">{rating} / 5</span>
            </div>

            <div className="form-group">
              <label htmlFor="reviewComment">Your Feedback (Optional)</label>
              <textarea
                id="reviewComment"
                rows="4"
                placeholder="Share what you liked, venue atmosphere, food stalls, or sound quality..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>

            {error && <div className="form-error">{error}</div>}

            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? "Submitting..." : "Submit Review"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default ReviewModal;
