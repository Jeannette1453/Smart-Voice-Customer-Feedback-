import React, { useEffect, useRef, useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";

export default function FeedbackNew() {
  const nav = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const fetchedOnce = useRef(false);

  const [type, setType] = useState("COMPLAINT");
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [message, setMessage] = useState("");

  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const loadCategories = async () => {
    setLoadingCategories(true);
    try {
      const res = await api.get("/api/categories");
      const data = res.data || [];
      setCategories(data);

      if (data.length > 0 && !category) {
        setCategory(data[0].name);
      }
    } catch (e) {
      console.error("Failed to load categories", e);
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    if (fetchedOnce.current) return;
    fetchedOnce.current = true;
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    setErr("");
    setOk("");

    if (!category.trim()) return setErr("Category is required");
    if (!message.trim()) return setErr("Message is required");

    setSubmitting(true);
    try {
      await api.post("/api/feedback", {
        type,
        category: category.trim(),
        subCategory: subCategory.trim() || null,
        priority,
        message: message.trim(),
      });

      setOk("Feedback submitted successfully! Our agents will review it shortly.");
      setSubCategory("");
      setPriority("MEDIUM");
      setType("COMPLAINT");
      setMessage("");

      if (categories.length > 0) {
        setCategory(categories[0].name);
      } else {
        setCategory("");
      }

      setTimeout(() => nav("/feedback/me"), 1500);
    } catch (e2) {
      const status = e2?.response?.status;

      if (status === 401) return nav("/login", { replace: true });
      if (status === 403) return nav("/unauthorized", { replace: true });

      setErr(e2?.response?.data?.message || "Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ padding: "24px 0" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
        }}
      >
        <h2 style={{ marginTop: 0 }}>Submit Feedback</h2>

        <button
          className="btn"
          onClick={() => nav("/feedback/me")}
          style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text)" }}
        >
          Back
        </button>
      </div>

      {err && (
        <div
          className="card"
          style={{
            padding: 12,
            borderColor: "var(--danger-text)",
            background: "var(--danger-bg)",
            color: "var(--danger-text)",
            marginBottom: 12,
          }}
        >
          {err}
        </div>
      )}

      {ok && (
        <div
          className="card"
          style={{
            padding: 12,
            borderColor: "var(--success-text)",
            background: "var(--success-bg)",
            color: "var(--success-text)",
            marginBottom: 12,
            fontWeight: 800,
          }}
        >
          {ok}
        </div>
      )}

      <form onSubmit={submit} className="card" style={{ padding: 20, maxWidth: 820, border: "1px solid var(--border)", background: "var(--card)", borderRadius: "16px", boxShadow: "var(--shadow)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <div className="label">Feedback Type</div>
            <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="COMPLAINT">COMPLAINT</option>
              <option value="COMPLIMENT">COMPLIMENT</option>
              <option value="SUGGESTION">SUGGESTION</option>
              <option value="SURVEY">SURVEY</option>
            </select>
          </div>

          <div>
            <div className="label">Initial Priority</div>
            <select className="input" value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="URGENT">URGENT</option>
            </select>
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <div className="label">Category</div>

            {loadingCategories ? (
              <div className="input" style={{ color: "var(--muted)" }}>
                Loading categories...
              </div>
            ) : categories.length > 0 ? (
              <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                className="input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Example: Loans, Customer Care, Mobile App, ATM..."
              />
            )}
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <div className="label">SubCategory (optional)</div>
            <input
              className="input"
              value={subCategory}
              onChange={(e) => setSubCategory(e.target.value)}
              placeholder="Example: Delayed Approval, Incorrect Charges..."
            />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <div className="label">Message</div>
            <textarea
              className="input"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your feedback details here. Our AI engine will automatically analyze your message once submitted."
              rows={6}
              style={{ resize: "vertical" }}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 24, flexWrap: "wrap" }}>
          <button className="btn btn-primary" type="submit" disabled={submitting} style={{ padding: "12px 24px", fontSize: 16 }}>
            {submitting ? "Analyzing with AI..." : "Submit Feedback"}
          </button>

          <button
            className="btn"
            type="button"
            onClick={() => nav("/feedback/me")}
            style={{ background: "var(--card-2)", border: "1px solid var(--border)", color: "var(--text)" }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
