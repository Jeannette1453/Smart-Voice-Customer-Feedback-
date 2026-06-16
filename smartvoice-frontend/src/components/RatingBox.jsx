import React, { useEffect, useState } from "react";
import api from "../api/axios";
import { getRole } from "../auth/auth";

export default function RatingBox({ feedbackId, feedbackStatus, readOnly = false }) {
  const role = String(getRole() || "");
  const isCustomer = role.includes("CUSTOMER");

  const [existing, setExisting] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setErr("");
    try {
      const res = await api.get(`/api/feedback/${feedbackId}/rating`);
      setExisting(res.data || null);
    } catch (e) {
      // If no rating yet, don't show hard error
      if (e?.response?.status === 400 || e?.response?.status === 404) {
        setExisting(null);
        return;
      }
      setErr(e?.response?.data?.message || "Failed to load rating");
    }
  };

  useEffect(() => {
    if (!feedbackId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedbackId]);

  const submit = async () => {
    if (!isCustomer || readOnly) return;

    setLoading(true);
    setErr("");

    try {
      const res = await api.post(`/api/feedback/${feedbackId}/rating`, {
        rating,
        comment,
      });

      setExisting(res.data);
      setComment("");
      alert("Thanks! Rating submitted.");
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to submit rating");
    } finally {
      setLoading(false);
    }
  };

  const canRate =
    !readOnly &&
    isCustomer &&
    feedbackStatus === "RESOLVED" &&
    !existing;

  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ fontWeight: 900 }}>Satisfaction Rating</div>

      {err && (
        <div
          style={{
            marginTop: 10,
            color: "#991b1b",
            background: "#fff5f5",
            border: "1px solid #fecaca",
            padding: 10,
            borderRadius: 12,
          }}
        >
          {err}
        </div>
      )}

      {existing ? (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 16, fontWeight: 800 }}>
            {"★".repeat(existing.rating)}
            {"☆".repeat(5 - existing.rating)}{" "}
            <span style={{ color: "var(--muted)", fontWeight: 600 }}>
              ({existing.rating}/5)
            </span>
          </div>

          {existing.comment && (
            <div style={{ marginTop: 6, color: "var(--text)" }}>{existing.comment}</div>
          )}

          <div style={{ marginTop: 8, fontSize: 12, color: "var(--muted)" }}>
            Submitted on: {existing.createdAt ? new Date(existing.createdAt).toLocaleString() : ""}
          </div>
        </div>
      ) : canRate ? (
        <div style={{ marginTop: 12 }}>
          <div className="label">How satisfied are you?</div>

          <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                className="btn"
                onClick={() => setRating(n)}
                style={{
                  background: n <= rating ? "var(--primary)" : "white",
                  color: n <= rating ? "white" : "var(--text)",
                  border: "1px solid var(--border)",
                  fontWeight: 900,
                  minWidth: 44,
                }}
                type="button"
              >
                {n}
              </button>
            ))}
          </div>

          <div className="label">Comment (optional)</div>
          <textarea
            className="input"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell us what we did well or what to improve..."
            rows={3}
            style={{ resize: "vertical" }}
          />

          <button
            className="btn btn-primary"
            style={{ marginTop: 10, width: "100%" }}
            onClick={submit}
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit Rating"}
          </button>
        </div>
      ) : (
        <div style={{ marginTop: 12, color: "var(--muted)" }}>
          {readOnly
            ? "Ratings are submitted by customers after resolution."
            : isCustomer
            ? "You can rate only after your feedback is RESOLVED."
            : "Ratings are submitted by customers after resolution."}
        </div>
      )}
    </div>
  );
}
