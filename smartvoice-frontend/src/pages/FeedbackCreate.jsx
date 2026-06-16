import React, { useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";

export default function FeedbackCreate() {
  const nav = useNavigate();
  const [type, setType] = useState("COMPLAINT");
  const [category, setCategory] = useState("Loans");
  const [subCategory, setSubCategory] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [message, setMessage] = useState("");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setOk("");
    setLoading(true);

    try {
      // 🔥 STEP 1: CALL AI (FastAPI)
      const aiResponse = await fetch("http://127.0.0.1:8000/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          category,
          subCategory,
        }),
      });

      const aiData = await aiResponse.json();

      // 🔥 STEP 2: USE AI RESULTS
      const finalType = aiData.feedbackType || type;
      const finalPriority = aiData.priority || priority;

      // 🔥 STEP 3: SEND TO SPRING BOOT
      await api.post("/api/feedback", {
        type: finalType,
        category,
        subCategory,
        priority: finalPriority,
        message,
      });

      setOk("Feedback submitted successfully!");
      setMessage("");
      setSubCategory("");
      setPriority("MEDIUM");

      setTimeout(() => nav("/feedback/me"), 900);
    } catch (error) {
      setErr(error?.response?.data?.message || "Failed to submit feedback");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: "24px 0" }}>
      <h2 style={{ marginTop: 0 }}>Submit Feedback</h2>

      <div className="card" style={{ padding: 18, maxWidth: 680 }}>
        <form onSubmit={submit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div className="label">Type</div>
              <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="COMPLAINT">Complaint</option>
                <option value="COMPLIMENT">Compliment</option>
                <option value="SUGGESTION">Suggestion</option>
                <option value="SURVEY">Survey</option>
              </select>
            </div>

            <div>
              <div className="label">Priority</div>
              <select className="input" value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div>
              <div className="label">Category</div>
              <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="Loans">Loans</option>
                <option value="Customer Care">Customer Care</option>
                <option value="Mobile App">Mobile App</option>
                <option value="Branch Services">Branch Services</option>
                <option value="ATM / Cards">ATM / Cards</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <div className="label">Sub-category</div>
              <input
                className="input"
                value={subCategory}
                onChange={(e) => setSubCategory(e.target.value)}
                placeholder="e.g. Delayed Approval"
              />
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <div className="label">Message</div>
            <textarea
              className="input"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your feedback here..."
              rows={6}
              style={{ resize: "vertical" }}
              required
            />
          </div>

          {err && (
            <div style={{ marginTop: 12, background: "#fff5f5", border: "1px solid #fecaca", color: "#991b1b", padding: 10, borderRadius: 12 }}>
              {err}
            </div>
          )}

          {ok && (
            <div style={{ marginTop: 12, background: "#ecfdf5", border: "1px solid #bbf7d0", color: "#065f46", padding: 10, borderRadius: 12 }}>
              {ok}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <button className="btn btn-primary" disabled={loading}>
              {loading ? "Submitting..." : "Submit"}
            </button>

            <button
              type="button"
              className="btn"
              onClick={() => nav("/feedback/me")}
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}