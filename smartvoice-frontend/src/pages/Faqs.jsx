import React, { useEffect, useMemo, useState } from "react";
import api from "../api/axios";

export default function Faqs() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("ALL");
  const [openId, setOpenId] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setErr("");
    setLoading(true);
    try {
      const res = await api.get("/api/faqs/active");
      setItems(res.data || []);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load FAQs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const categories = useMemo(() => {
    const set = new Set(items.map((x) => (x.category || "General").trim()));
    return ["ALL", ...Array.from(set).filter(Boolean)];
  }, [items]);

  const filtered = useMemo(() => {
    const text = q.trim().toLowerCase();
    return items.filter((f) => {
      const cat = (f.category || "General").trim();
      const catOk = category === "ALL" || cat === category;
      if (!catOk) return false;

      if (!text) return true;
      return (
        (f.question || "").toLowerCase().includes(text) ||
        (f.answer || "").toLowerCase().includes(text) ||
        (cat || "").toLowerCase().includes(text)
      );
    });
  }, [items, q, category]);

  return (
    <div className="container" style={{ padding: "24px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0 }}>FAQs (Knowledge Base)</h2>
          <div style={{ color: "var(--muted)", marginTop: 6 }}>
            Quick answers for common questions.
          </div>
        </div>
        <button
          className="btn"
          onClick={load}
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          disabled={loading}
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      <div className="card" style={{ padding: 14, marginTop: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: 10 }}>
          <input
            className="input"
            placeholder="Search: loans, mobile app, charges..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {err && (
        <div className="card" style={{ padding: 12, borderColor: "#fecaca", background: "#fff5f5", color: "#991b1b", marginTop: 12 }}>
          {err}
        </div>
      )}

      <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
        {loading ? (
          <div className="card" style={{ padding: 16, color: "var(--muted)" }}>Loading FAQs...</div>
        ) : filtered.length === 0 ? (
          <div className="card" style={{ padding: 16, color: "var(--muted)" }}>No FAQs found.</div>
        ) : (
          filtered.map((f) => {
            const cat = (f.category || "General").trim();
            const isOpen = openId === f.id;
            return (
              <div key={f.id} className="card" style={{ padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 900, fontSize: 16 }}>{f.question}</div>
                    <div style={{ marginTop: 6, fontSize: 12, color: "var(--muted)" }}>
                      Category: <span style={{ fontWeight: 800 }}>{cat || "General"}</span>
                    </div>
                  </div>
                  <button
                    className="btn"
                    onClick={() => setOpenId(isOpen ? null : f.id)}
                    style={{ background: "var(--card)", border: "1px solid var(--border)", height: 40 }}
                  >
                    {isOpen ? "Hide" : "View"}
                  </button>
                </div>

                {isOpen && (
                  <div style={{ marginTop: 12, lineHeight: 1.5 }}>
                    {f.answer}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
