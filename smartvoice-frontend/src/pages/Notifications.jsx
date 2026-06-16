import React, { useEffect, useRef, useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const nav = useNavigate();
  const fetchedOnce = useRef(false);

  const fireRefresh = () => {
    window.dispatchEvent(new Event("notifications-updated"));
  };

  const load = async () => {
    setErr("");
    setLoading(true);
    try {
      const res = await api.get("/api/notifications/me");
      setItems(res.data || []);
      fireRefresh();
    } catch (e) {
      const code = e?.response?.status;
      if (code === 401) return nav("/login", { replace: true });
      if (code === 403) return setErr("Forbidden");
      setErr(e?.response?.data?.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    try {
      await api.patch("/api/notifications/me/read-all");
      await load();
      fireRefresh();
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to mark all as read");
    }
  };

  const markRead = async (id) => {
    try {
      await api.patch(`/api/notifications/${id}/read`);
      await load();
      fireRefresh();
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to mark notification as read");
    }
  };

  useEffect(() => {
    if (fetchedOnce.current) return;
    fetchedOnce.current = true;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const unreadCount = items.filter((n) => !n.read).length;

  return (
    <div className="container" style={{ padding: "24px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <h2 style={{ marginTop: 0 }}>Notifications</h2>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            className="btn"
            onClick={load}
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            Refresh
          </button>

          <button className="btn btn-primary" onClick={markAllRead}>
            Mark all read ({unreadCount})
          </button>
        </div>
      </div>

      {err && (
        <div className="card" style={{ padding: 12, borderColor: "#fecaca", background: "#fff5f5", color: "#991b1b", marginTop: 10 }}>
          {err}
        </div>
      )}

      {loading ? (
        <div className="card" style={{ padding: 16, marginTop: 12 }}>Loading notifications...</div>
      ) : (
        <div style={{ display: "grid", gap: 14, marginTop: 12 }}>
          {items.map((n) => (
            <div
              key={n.id}
              className="card"
              style={{
                padding: 18,
                background: n.read ? "white" : "#f0f9ff",
                border: "1px solid var(--border)",
                cursor: "pointer",
              }}
              onClick={() => !n.read && markRead(n.id)}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div style={{ fontWeight: 900, fontSize: 18 }}>
                  {n.title} {!n.read && <span style={{ color: "#dc2626", fontSize: 14 }}>• NEW</span>}
                </div>
                <div style={{ color: "var(--muted)" }}>
                  {n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}
                </div>
              </div>

              <div style={{ marginTop: 10, fontSize: 16, color: "#475569" }}>
                {n.message}
              </div>

              <div style={{ marginTop: 10, fontWeight: 700 }}>
                Status: {n.read ? <span style={{ color: "#16a34a" }}>Read</span> : <span style={{ color: "#dc2626" }}>Unread</span>}
              </div>
            </div>
          ))}

          {items.length === 0 && (
            <div className="card" style={{ padding: 16, color: "var(--muted)" }}>
              No notifications yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

