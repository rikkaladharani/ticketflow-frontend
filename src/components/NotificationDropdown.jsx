import { useState, useEffect, useRef } from "react";
import api from "../services/api";

function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("ticketflowToken");
      if (!token) return;

      const res = await api.get("/notifications");
      const list = Array.isArray(res.data) ? res.data : [];
      setNotifications(list);
      setUnreadCount(list.filter((n) => !n.read).length);
    } catch (err) {
      console.warn("Failed to load notifications:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // Polling every 15s

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      clearInterval(interval);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark notification read", err);
    }
  };

  const markAllRead = async () => {
    try {
      await api.put("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all read", err);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case "BOOKING":
        return "🎟️";
      case "CANCELLATION":
        return "⚠️";
      case "REFUND":
        return "💰";
      case "STALL":
        return "🏪";
      default:
        return "🔔";
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return "";
    const date = new Date(timeString);
    return date.toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="notification-dropdown-container" ref={dropdownRef}>
      <button
        type="button"
        className="notification-bell-btn"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        title="Notifications"
        aria-label="Notifications"
      >
        <span className="bell-icon">🔔</span>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown-menu">
          <div className="notification-header">
            <h4>Notifications</h4>
            {unreadCount > 0 && (
              <button type="button" onClick={markAllRead} className="mark-all-read-btn">
                Mark all as read
              </button>
            )}
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="notification-empty">
                <span>🔕</span>
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`notification-item ${!n.read ? "unread" : ""}`}
                  onClick={() => !n.read && markAsRead(n.id)}
                >
                  <div className="notification-item-icon">{getIcon(n.type)}</div>
                  <div className="notification-item-content">
                    <strong className="notification-item-title">{n.title}</strong>
                    <p className="notification-item-msg">{n.message}</p>
                    <small className="notification-item-time">{formatTime(n.createdAt)}</small>
                  </div>
                  {!n.read && <span className="unread-dot"></span>}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationDropdown;
