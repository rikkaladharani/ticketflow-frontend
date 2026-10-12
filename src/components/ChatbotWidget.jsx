import { useState, useEffect, useRef } from "react";
import api from "../services/api";

const WELCOME_MESSAGE = {
  id: "welcome",
  sender: "bot",
  text: "Hi! 👋 How can I help you today? You can ask me about upcoming events, venues, ticket booking, or food stalls.",
  time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
};

const QUICK_QUESTIONS = [
  "Upcoming Events",
  "How to Book",
  "Food Stalls",
  "Venues",
];

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(() => {
    try {
      const saved = sessionStorage.getItem("ticketflow_simple_chat");
      return saved ? JSON.parse(saved) : [WELCOME_MESSAGE];
    } catch {
      return [WELCOME_MESSAGE];
    }
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    try {
      sessionStorage.setItem("ticketflow_simple_chat", JSON.stringify(messages));
    } catch (e) {
      console.error(e);
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, messages]);

  const handleSend = async (customText) => {
    const textToSend = (customText || input).trim();
    if (!textToSend || loading) return;

    const userMsg = {
      id: `u-${Date.now()}`,
      sender: "user",
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await api.post("/ai/chat", {
        message: textToSend,
        history: messages.slice(-4).map((m) => ({ sender: m.sender, text: m.text })),
      });

      const botReply = {
        id: `b-${Date.now()}`,
        sender: "bot",
        text: res.data?.response || "I could not find an answer to that question. Please try asking about events or booking.",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, botReply]);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: `b-${Date.now()}`,
          sender: "bot",
          text: "Sorry, I am having trouble connecting right now. Please try again in a moment.",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleReset = () => {
    const reset = [WELCOME_MESSAGE];
    setMessages(reset);
    sessionStorage.setItem("ticketflow_simple_chat", JSON.stringify(reset));
  };

  // Simple text renderer with bold and newline support
  const renderText = (str) => {
    if (!str) return null;
    const parts = str.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="simple-chat-container">
      {/* Floating Chat Icon Button */}
      {!isOpen && (
        <button
          className="simple-chat-toggle-btn"
          onClick={() => setIsOpen(true)}
          title="Open Chat"
          aria-label="Open Chat"
        >
          <span className="simple-chat-toggle-icon">💬</span>
          <span className="simple-chat-toggle-label">Chat</span>
        </button>
      )}

      {/* Simple Chat Box */}
      {isOpen && (
        <div className="simple-chat-box">
          {/* Header */}
          <div className="simple-chat-header">
            <div className="simple-chat-header-title">
              <span className="simple-chat-avatar">💬</span>
              <div>
                <strong>TicketFlow Assistant</strong>
                <div className="simple-chat-status">
                  <span className="simple-chat-dot"></span> Online
                </div>
              </div>
            </div>
            <div className="simple-chat-header-actions">
              <button
                className="simple-chat-icon-btn"
                onClick={handleReset}
                title="Restart Chat"
              >
                🔄
              </button>
              <button
                className="simple-chat-icon-btn"
                onClick={() => setIsOpen(false)}
                title="Close"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="simple-chat-body">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`simple-msg-row ${m.sender === "user" ? "user-row" : "bot-row"}`}
              >
                <div className={`simple-msg-bubble ${m.sender === "user" ? "user-bubble" : "bot-bubble"}`}>
                  <div className="simple-msg-text">{renderText(m.text)}</div>
                  <div className="simple-msg-time">{m.time}</div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="simple-msg-row bot-row">
                <div className="simple-msg-bubble bot-bubble simple-loading-bubble">
                  <span className="simple-dot"></span>
                  <span className="simple-dot"></span>
                  <span className="simple-dot"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions */}
          <div className="simple-chat-suggestions">
            {QUICK_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                className="simple-suggestion-chip"
                onClick={() => handleSend(q)}
                disabled={loading}
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Area */}
          <div className="simple-chat-footer">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question..."
              disabled={loading}
              className="simple-chat-input"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="simple-chat-send"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
