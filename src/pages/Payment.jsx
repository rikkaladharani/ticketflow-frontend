import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

function Payment() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadBooking();
  }, [bookingId]);

  const loadBooking = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
  `http://localhost:8080/api/bookings/${bookingId}`,
  {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("ticketflowToken")}`,
    },
  }
);

      if (!response.ok) {
        throw new Error("Unable to load booking details.");
      }

      const data = await response.json();

      setBooking(data);
    } catch (err) {
      console.error(err);
      setError(
        err.message ||
        "Unable to load payment details."
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!booking) {
      return;
    }

    try {
      setPaying(true);
      setError("");

      const response = await fetch(
        "http://localhost:8080/api/payments",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            bookingId: Number(bookingId),
            paymentMethod: paymentMethod,
          }),
          headers: {
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("ticketflowToken")}`,
},
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          data.error ||
          "Payment could not be completed."
        );
      }

      navigate(
        `/customer/payment-success/${bookingId}`
      );
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
        "Payment failed."
      );
    } finally {
      setPaying(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "";

    return new Date(
      `${date}T00:00:00`
    ).toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    );
  };

  const formatTime = (time) => {
    if (!time) return "";

    const [hours, minutes] =
      time.split(":");

    const date = new Date();

    date.setHours(
      Number(hours),
      Number(minutes),
      0
    );

    return date.toLocaleTimeString(
      "en-IN",
      {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }
    );
  };

  const formatCurrency = (amount) => {
    return `₹${Number(
      amount || 0
    ).toLocaleString("en-IN")}`;
  };

  if (loading) {
    return (
      <div className="payment-page">
        <div className="payment-loading">
          <div className="payment-spinner"></div>

          <h2>
            Loading payment...
          </h2>

          <p>
            Please wait while we prepare
            your payment.
          </p>
        </div>
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="payment-page">
        <div className="payment-error">

          <div className="payment-error-icon">
            ⚠️
          </div>

          <h2>
            Unable to load payment
          </h2>

          <p>{error}</p>

          <Link
            to="/customer/dashboard"
            className="payment-back-button"
          >
            ← Back to Dashboard
          </Link>

        </div>
      </div>
    );
  }

  const subtotalAmount =
    booking?.subtotalAmount ??
    booking?.totalAmount ??
    0;

  const discountAmount =
    booking?.discountAmount ?? 0;

  const totalAmount =
    booking?.totalAmount ?? 0;

  const hasCoupon =
    booking?.couponCode &&
    discountAmount > 0;

  return (
    <div className="payment-page">

      <header className="payment-header">
        <div className="payment-header-inner">

          <Link
            to="/"
            className="payment-logo"
          >
            TICKET<span>FLOW</span>
          </Link>

          <div className="payment-secure">
            🔒 Secure Payment
          </div>

        </div>
      </header>

      <div className="payment-progress">
        <div className="payment-progress-inner">

          <div className="payment-step completed">
            <div className="payment-step-number">
              ✓
            </div>
            <span>Seats</span>
          </div>

          <div className="payment-line completed"></div>

          <div className="payment-step completed">
            <div className="payment-step-number">
              ✓
            </div>
            <span>Checkout</span>
          </div>

          <div className="payment-line active"></div>

          <div className="payment-step active">
            <div className="payment-step-number">
              3
            </div>
            <span>Payment</span>
          </div>

        </div>
      </div>

      <main className="payment-main">

        <div className="payment-container">

          <div className="payment-title-section">

            <h1>
              Complete Payment
            </h1>

            <p>
              Choose your preferred payment
              method to confirm your booking.
            </p>

          </div>

          {error && (
            <div className="payment-alert">
              <span>⚠️</span>
              <p>{error}</p>
            </div>
          )}

          <div className="payment-grid">

            <section className="payment-left">

              <div className="payment-card">

                <div className="payment-card-title">

                  <span className="payment-card-icon">
                    💳
                  </span>

                  <div>
                    <h2>
                      Payment Method
                    </h2>

                    <p>
                      Select how you want to pay
                    </p>
                  </div>

                </div>

                <div className="payment-methods">

                  <button
                    type="button"
                    className={`payment-method ${
                      paymentMethod === "UPI"
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      setPaymentMethod("UPI")
                    }
                  >

                    <div className="payment-method-icon">
                      📱
                    </div>

                    <div className="payment-method-content">

                      <strong>
                        UPI
                      </strong>

                      <span>
                        Google Pay, PhonePe,
                        Paytm, etc.
                      </span>

                    </div>

                    <div className="payment-radio">
                      {paymentMethod === "UPI" &&
                        "✓"}
                    </div>

                  </button>

                  <button
                    type="button"
                    className={`payment-method ${
                      paymentMethod === "CARD"
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      setPaymentMethod("CARD")
                    }
                  >

                    <div className="payment-method-icon">
                      💳
                    </div>

                    <div className="payment-method-content">

                      <strong>
                        Credit / Debit Card
                      </strong>

                      <span>
                        Visa, Mastercard, RuPay
                      </span>

                    </div>

                    <div className="payment-radio">
                      {paymentMethod === "CARD" &&
                        "✓"}
                    </div>

                  </button>

                  <button
                    type="button"
                    className={`payment-method ${
                      paymentMethod ===
                      "NET_BANKING"
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      setPaymentMethod(
                        "NET_BANKING"
                      )
                    }
                  >

                    <div className="payment-method-icon">
                      🏦
                    </div>

                    <div className="payment-method-content">

                      <strong>
                        Net Banking
                      </strong>

                      <span>
                        Pay using your bank account
                      </span>

                    </div>

                    <div className="payment-radio">
                      {paymentMethod ===
                        "NET_BANKING" && "✓"}
                    </div>

                  </button>

                </div>

              </div>

            </section>

            <aside className="payment-right">

              <div className="payment-card payment-summary">

                <div className="payment-summary-header">
                  <h2>
                    Booking Summary
                  </h2>
                </div>

                <div className="payment-summary-reference">

                  <span>
                    Booking Reference
                  </span>

                  <strong>
                    {booking?.bookingReference ||
                      `TF-${bookingId}`}
                  </strong>

                </div>

                {booking?.event && (
                  <div className="payment-event">

                    <h3>
                      {booking.event.title}
                    </h3>

                    <div className="payment-event-row">

                      <span>📅</span>

                      <div>

                        <strong>
                          {formatDate(
                            booking.event.eventDate
                          )}
                        </strong>

                        <small>
                          {formatTime(
                            booking.event.startTime
                          )}
                        </small>

                      </div>

                    </div>

                    {booking.event.venue && (
                      <div className="payment-event-row">

                        <span>📍</span>

                        <div>

                          <strong>
                            {booking.event.venue.name}
                          </strong>

                          <small>
                            {booking.event.venue.city}
                          </small>

                        </div>

                      </div>
                    )}

                  </div>
                )}

                <div className="payment-divider"></div>

                <div className="payment-price-breakdown">

                  <div className="payment-price-row">

                    <span>
                      Ticket Subtotal
                    </span>

                    <strong>
                      {formatCurrency(
                        subtotalAmount
                      )}
                    </strong>

                  </div>

                  {hasCoupon && (
                    <div className="payment-price-row payment-coupon-row">

                      <span>
                        Coupon{" "}
                        <strong>
                          {booking.couponCode}
                        </strong>
                      </span>

                      <strong>
                        -{formatCurrency(
                          discountAmount
                        )}
                      </strong>

                    </div>
                  )}

                </div>

                <div className="payment-divider"></div>

                <div className="payment-amount-row">

                  <span>
                    Amount to Pay
                  </span>

                  <strong>
                    {formatCurrency(
                      totalAmount
                    )}
                  </strong>

                </div>

                {hasCoupon && (
                  <div className="payment-savings">

                    🎉 You saved{" "}
                    {formatCurrency(
                      discountAmount
                    )}

                  </div>
                )}

                <button
                  className="pay-now-button"
                  onClick={handlePayment}
                  disabled={paying}
                >

                  {paying ? (
                    <>
                      <span className="pay-spinner"></span>
                      Processing Payment...
                    </>
                  ) : (
                    <>
                      Pay{" "}
                      {formatCurrency(
                        totalAmount
                      )}

                      <span>→</span>
                    </>
                  )}

                </button>

                <div className="payment-security">
                  🔒
                  <span>
                    Secure and encrypted payment
                  </span>
                </div>

              </div>

            </aside>

          </div>

        </div>

      </main>

    </div>
  );
}

export default Payment;