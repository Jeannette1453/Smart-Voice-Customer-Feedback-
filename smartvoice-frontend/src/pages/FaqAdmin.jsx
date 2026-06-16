import React, { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import { getRole } from "../auth/auth";
import { useNavigate } from "react-router-dom";

export default function FaqAdmin() {
  const nav = useNavigate();
  const role = String(getRole() || "");
  const canManage = role === "ADMIN" || role === "MANAGER";

  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  // form
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [category, setCategory] = useState("General");

  const [editing, setEditing] = useState(null); // faq object

  const load = async () => {
    setErr("");
    setLoading(true);
    try {
      const res = await api.get("/api/faqs"); // admin/manager only
      setItems(res.data || []);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load (Admin/Manager only)");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!canManage) {
      nav("/unauthorized", { replace: true });
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canManage]);

  const resetForm = () => {
    setQuestion("");
    setAnswer("");
    setCategory("General");
    setEditing(null);
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr("");

    try {
      if (editing) {
        await api.put(`/api/faqs/${editing.id}`, { question, answer, category });
        alert("FAQ updated!");
      } else {
        await api.post("/api/faqs", { question, answer, category });
        alert("FAQ created!");
      }
      resetForm();
      await load();
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Failed to save FAQ");
    }
  };

  const toggleActive = async (faq) => {
    try {
      await api.put(`/api/faqs/${faq.id}`, { active: !faq.active });
      await load();
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to toggle active");
    }
  };

  const del = async (faq) => {
    if (!confirm("Delete this FAQ?")) return;
    try {
      await api.delete(`/api/faqs/${faq.id}`);
      await load();
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to delete FAQ");
    }
  };

  const stats = useMemo(() => {
    const total = items.length;
    const active = items.filter((x) => x.active).length;
    return { total, active };
  }, [items]);

  return (
    <div className="container" style={{ padding: "24px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0 }}>Manage FAQs</h2>
          <div style={{ color: "var(--muted)", marginTop: 6 }}>
            Total: <b>{stats.total}</b> • Active: <b>{stats.active}</b>
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

      {err && (
        <div className="card" style={{ padding: 12, borderColor: "#fecaca", background: "#fff5f5", color: "#991b1b", marginTop: 12 }}>
          {err}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: 12, marginTop: 12 }}>
        {/* form */}
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 900, marginBottom: 10 }}>
            {editing ? "Edit FAQ" : "Create FAQ"}
          </div>

          <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
            <div className="label">Question</div>
            <input className="input" value={question} onChange={(e) => setQuestion(e.target.value)} required />

            <div className="label">Answer</div>
            <textarea className="input" rows={6} style={{ resize: "vertical" }} value={answer} onChange={(e) => setAnswer(e.target.value)} required />

            <div className="label">Category</div>
            <input className="input" value={category} onChange={(e) => setCategory(e.target.value)} />

            <button className="btn btn-primary" type="submit">
              {editing ? "Save Changes" : "Create FAQ"}
            </button>

            {editing && (
              <button className="btn" type="button" onClick={resetForm} style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                Cancel Edit
              </button>
            )}
          </form>
        </div>

        {/* table */}
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 900, marginBottom: 10 }}>All FAQs</div>

          {loading ? (
            <div style={{ color: "var(--muted)" }}>Loading...</div>
          ) : (
            <table width="100%" cellPadding="10" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", color: "var(--muted)" }}>
                  <th>Question</th>
                  <th>Category</th>
                  <th>Active</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((f) => (
                  <tr key={f.id} style={{ borderTop: "1px solid var(--border)" }}>
                    <td style={{ fontWeight: 800 }}>{f.question}</td>
                    <td>{f.category || "General"}</td>
                    <td style={{ fontWeight: 900, color: f.active ? "var(--primary)" : "var(--muted)" }}>
                      {f.active ? "YES" : "NO"}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button
                          className="btn"
                          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                          onClick={() => {
                            setEditing(f);
                            setQuestion(f.question);
                            setAnswer(f.answer);
                            setCategory(f.category || "General");
                          }}
                        >
                          Edit
                        </button>

                        <button
                          className="btn"
                          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                          onClick={() => toggleActive(f)}
                        >
                          {f.active ? "Deactivate" : "Activate"}
                        </button>

                        <button
                          className="btn"
                          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                          onClick={() => del(f)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {items.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ padding: 14, color: "var(--muted)" }}>
                      No FAQs yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
