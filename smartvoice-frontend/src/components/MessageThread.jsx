import React, { useEffect, useRef, useState } from "react";
import api from "../api/axios";

export default function MessageThread({ feedbackId }) {
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const fetchedOnce = useRef(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/feedback/${feedbackId}/messages`);
      setItems(res.data || []);
    } catch (e) {
      console.error("Failed to load messages", e);
    } finally {
      setLoading(false);
    }
  };

  const send = async () => {
    if (!message.trim()) return;
    try {
      await api.post(`/api/feedback/${feedbackId}/messages`, {
        message: message.trim(),
      });
      setMessage("");
      await load();
      window.dispatchEvent(new Event("notifications-updated"));
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to send message");
    }
  };

  useEffect(() => {
    if (fetchedOnce.current) return;
    fetchedOnce.current = true;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedbackId]);

  return (
    <div>
      {loading ? (
        <div style={{ color: "var(--muted)" }}>Loading messages...</div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {items.map((m) => (
            <div
              key={m.id}
              className="card"
              style={{ padding: 12, border: "1px solid var(--border)" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div style={{ fontWeight: 900 }}>
                  {m.senderName} <span style={{ color: "var(--muted)", fontWeight: 500 }}>({m.senderRole})</span>
                </div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>
                  {m.createdAt ? new Date(m.createdAt).toLocaleString() : ""}
                </div>
              </div>
              <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>
                {m.senderEmail}
              </div>
              <div style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>
                {m.message}
              </div>
            </div>
          ))}

          {items.length === 0 && (
            <div style={{ color: "var(--muted)" }}>No messages yet.</div>
          )}
        </div>
      )}

      <div style={{ marginTop: 12 }}>
        <div className="label">Send Message</div>
        <textarea
          className="input"
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write a reply..."
          style={{ resize: "vertical" }}
        />
        <button className="btn btn-primary" style={{ marginTop: 10 }} onClick={send}>
          Send
        </button>
      </div>
    </div>
  );
}
