import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import Navbar from "../components/Navbar";
import "../styles.css";

function QrCheckInScanner() {
  const [ticketCode, setTicketCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [recentScans, setRecentScans] = useState([]);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
    return () => {
      stopCamera();
    };
  }, []);

  const handleVerify = async (codeToVerify) => {
    const code = (codeToVerify || ticketCode).trim();
    if (!code) return;

    try {
      setLoading(true);
      setResult(null);

      const res = await api.post("/tickets/check-in", { code });
      const data = res.data;
      setResult(data);

      if (data.status === "VALID") {
        setRecentScans((prev) => [
          {
            ticketNumber: data.ticketNumber,
            name: data.attendeeName,
            seats: data.seatNumbers?.join(", ") || "General",
            time: new Date().toLocaleTimeString(),
            status: "VALID",
          },
          ...prev.slice(0, 9),
        ]);
      }

      setTicketCode("");
      if (inputRef.current) inputRef.current.focus();
    } catch (err) {
      console.error("Check-in error:", err);
      setResult({
        success: false,
        status: "INVALID",
        message: err.response?.data?.message || err.message || "Failed to verify ticket",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleVerify();
    }
  };

  // Camera handling for QR scanning
  const startCamera = async () => {
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      console.error("Camera access error:", err);
      setCameraError("Camera access denied or not available. Use manual code or scanner gun.");
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // Upload image to test QR verification
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Simulate scanning or prompt ticket number from filename / prompt
    const reader = new FileReader();
    reader.onload = () => {
      // Allow user or fallback to parsing ticket number
      const manualPrompt = window.prompt("Extracted image loaded. Enter or confirm ticket number (e.g. TKT-XXXXXXXX):");
      if (manualPrompt) {
        handleVerify(manualPrompt);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="dashboard-page checkin-page">
      <Navbar />

      <div className="dashboard-container" style={{ maxWidth: "1000px" }}>
        <div className="dashboard-header">
          <div>
            <span className="section-label">GATE VALIDATION PORTAL</span>
            <h1>QR Ticket Check-In Scanner</h1>
            <p>Scan attendee QR codes or enter ticket numbers to verify entry.</p>
          </div>

          <Link to="/organizer/dashboard" className="dashboard-home">
            ← Organizer Dashboard
          </Link>
        </div>

        <div className="checkin-grid">
          {/* SCANNER INPUT CARD */}
          <div className="checkin-card">
            <h3>🎟️ Ticket Verification</h3>
            <p className="scanner-subtitle">
              Scan barcode/QR with hand scanner gun, webcam, or type ticket number:
            </p>

            <div className="checkin-input-group">
              <input
                ref={inputRef}
                type="text"
                placeholder="e.g. TKT-B7E20E2F or paste QR code data..."
                value={ticketCode}
                onChange={(e) => setTicketCode(e.target.value)}
                onKeyDown={handleKeyDown}
                className="checkin-input"
                disabled={loading}
              />
              <button
                type="button"
                className="btn-primary"
                onClick={() => handleVerify()}
                disabled={loading || !ticketCode.trim()}
              >
                {loading ? "Verifying..." : "Verify & Check-In"}
              </button>
            </div>

            <div className="scanner-alternatives">
              {!cameraActive ? (
                <button type="button" className="btn-secondary" onClick={startCamera}>
                  📹 Enable Webcam Scanner
                </button>
              ) : (
                <button type="button" className="btn-danger" onClick={stopCamera}>
                  ⏹️ Stop Camera
                </button>
              )}

              <label className="btn-secondary file-upload-btn">
                📁 Upload QR Image
                <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: "none" }} />
              </label>
            </div>

            {cameraError && <p className="form-error mt-2">{cameraError}</p>}

            {cameraActive && (
              <div className="camera-preview-container">
                <video ref={videoRef} playsInline className="camera-feed" />
                <canvas ref={canvasRef} style={{ display: "none" }} />
                <div className="camera-crosshair"></div>
                <p className="camera-tip">Point camera at QR Code on the attendee's phone</p>
              </div>
            )}
          </div>

          {/* VERIFICATION RESULT CARD */}
          <div className="checkin-card result-card">
            <h3>📋 Gate Status Result</h3>

            {!result && !loading && (
              <div className="result-idle">
                <span className="idle-icon">⚡</span>
                <p>Waiting for ticket scan...</p>
                <small>Entry status will display immediately upon scanning.</small>
              </div>
            )}

            {loading && (
              <div className="result-loading">
                <div className="spinner"></div>
                <p>Verifying ticket against database...</p>
              </div>
            )}

            {result && (
              <div className={`scan-result-box status-${result.status?.toLowerCase()}`}>
                <div className="result-icon-header">
                  {result.status === "VALID" && <span className="res-icon">✅</span>}
                  {result.status === "ALREADY_CHECKED_IN" && <span className="res-icon">⚠️</span>}
                  {(result.status === "CANCELLED" || result.status === "INVALID") && (
                    <span className="res-icon">❌</span>
                  )}
                  <h2>
                    {result.status === "VALID" && "ENTRY GRANTED"}
                    {result.status === "ALREADY_CHECKED_IN" && "ENTRY DENIED: ALREADY USED"}
                    {result.status === "CANCELLED" && "ENTRY DENIED: CANCELLED"}
                    {result.status === "INVALID" && "ENTRY DENIED: INVALID"}
                  </h2>
                </div>

                <p className="res-message">{result.message}</p>

                {result.ticketNumber && (
                  <div className="result-details-grid">
                    <div>
                      <span className="res-label">TICKET NUMBER</span>
                      <strong>{result.ticketNumber}</strong>
                    </div>
                    {result.bookingReference && (
                      <div>
                        <span className="res-label">BOOKING REF</span>
                        <strong>{result.bookingReference}</strong>
                      </div>
                    )}
                    {result.attendeeName && (
                      <div>
                        <span className="res-label">ATTENDEE</span>
                        <strong>{result.attendeeName}</strong>
                      </div>
                    )}
                    {result.seatNumbers && result.seatNumbers.length > 0 && (
                      <div>
                        <span className="res-label">ASSIGNED SEATS</span>
                        <strong>{result.seatNumbers.join(", ")}</strong>
                      </div>
                    )}
                    {result.eventTitle && (
                      <div>
                        <span className="res-label">EVENT</span>
                        <strong>{result.eventTitle}</strong>
                      </div>
                    )}
                    {result.checkedInAt && (
                      <div>
                        <span className="res-label">CHECK-IN TIME</span>
                        <strong>{new Date(result.checkedInAt).toLocaleTimeString()}</strong>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RECENT SCANS LOG */}
        <div className="dashboard-section mt-4">
          <h2>Recent Check-Ins (This Session)</h2>
          {recentScans.length === 0 ? (
            <p className="text-muted">No successful check-ins yet in this session.</p>
          ) : (
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Ticket #</th>
                    <th>Attendee</th>
                    <th>Seats</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentScans.map((scan, idx) => (
                    <tr key={idx}>
                      <td>{scan.time}</td>
                      <td>
                        <strong>{scan.ticketNumber}</strong>
                      </td>
                      <td>{scan.name}</td>
                      <td>{scan.seats}</td>
                      <td>
                        <span className="badge badge-success">✓ CHECKED IN</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default QrCheckInScanner;
