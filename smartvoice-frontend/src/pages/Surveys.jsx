// src/pages/Surveys.jsx
import React, { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import { getRole } from "../auth/auth";
import { useNavigate } from "react-router-dom";

export default function Surveys() {
  const nav = useNavigate();

  const role = String(getRole() || "").toUpperCase();

  const isAdmin = role.includes("ADMIN");
  const isManager = role.includes("MANAGER");
  const isStaff = role.includes("STAFF");
  const isCustomer = role.includes("CUSTOMER");

  // ✅ Only manager/admin can manage surveys (create + results + activate)
  const canManage = isAdmin || isManager;

  // ✅ Who can take survey?
  // (customer can take; staff can also take if you want internal staff surveys)
  const canTake = isCustomer || isStaff;

  // ✅ Which endpoint to load?
  const listUrl = useMemo(() => {
    // Managers/Admins see all
    if (canManage) return "/api/surveys";
    // Customers/Staff see active only
    return "/api/surveys/active";
  }, [canManage]);

  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  // create form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState([
    { questionText: "How satisfied are you?", type: "RATING", options: [], optionsRaw: "", orderIndex: 1 },
  ]);

  const load = async (signal) => {
    try {
      setErr("");
      setLoading(true);
      const res = await api.get(listUrl, { signal });
      setItems(res.data || []);
    } catch (e) {
      // ignore abort
      if (e?.name === "CanceledError" || e?.code === "ERR_CANCELED") return;
      setErr(e?.response?.data?.message || "Failed to load surveys");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Auto load when page opens
  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listUrl]);

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      { questionText: "", type: "TEXT", options: [], optionsRaw: "", orderIndex: prev.length + 1 },
    ]);
  };

  const updateQ = (i, field, value) => {
    setQuestions((prev) => prev.map((q, idx) => (idx === i ? { ...q, [field]: value } : q)));
  };

  const createSurvey = async (e) => {
    e.preventDefault();
    try {
      setErr("");

      await api.post("/api/surveys", {
        title,
        description,
        active: true,
        questions: questions.map((q, idx) => ({
          questionText: q.questionText,
          type: q.type,
          orderIndex: idx + 1,
          options: q.type === "MULTIPLE_CHOICE"
            ? (q.optionsRaw || "").split(",").map(x => x.trim()).filter(Boolean)
            : [],
        })),
      });

      setTitle("");
      setDescription("");
      setQuestions([{ questionText: "How satisfied are you?", type: "RATING", options: [], optionsRaw: "", orderIndex: 1 }]);

      await load();
      alert("Survey created!");
    } catch (e2) {
      const msg = e2?.response?.data?.message || e2?.response?.data?.error || JSON.stringify(e2?.response?.data) || "Failed to create survey";
      setErr(msg);
    }
  };

  // ✅ Activate/Deactivate (Manager/Admin)
  const toggleActive = async (surveyId, currentActive) => {
    try {
      setErr("");
      await api.patch(`/api/surveys/${surveyId}/active`, { active: !currentActive });
      await load();
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to update survey status");
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <h2 style={{ marginTop: 0 }}>Surveys</h2>

        <button
          className="btn"
          onClick={() => load()}
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {err && (
        <div
          className="card"
          style={{
            padding: 12,
            borderColor: "#fecaca",
            background: "#fff5f5",
            color: "#991b1b",
            marginBottom: 12,
          }}
        >
          {err}
        </div>
      )}

      {/* Manager/Admin create */}
      {canManage && (
        <div className="card" style={{ padding: 16, marginBottom: 12 }}>
          <div style={{ fontWeight: 900, marginBottom: 10 }}>Create Survey</div>

          <form onSubmit={createSurvey} style={{ display: "grid", gap: 10 }}>
            <div style={{ maxWidth: 650 }}>
              <div className="label">Title</div>
              <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>

            <div style={{ maxWidth: 650 }}>
              <div className="label">Description</div>
              <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            <div style={{ marginTop: 6, fontWeight: 800 }}>Questions</div>

            {questions.map((q, i) => (
              <div key={i} className="card" style={{ padding: 12, border: "1px solid var(--border)" }}>
                <div className="label">Question {i + 1}</div>
                <input
                  className="input"
                  value={q.questionText}
                  onChange={(e) => updateQ(i, "questionText", e.target.value)}
                  required
                />

                <div className="label" style={{ marginTop: 10 }}>
                  Type
                </div>
                <select className="input" value={q.type} onChange={(e) => updateQ(i, "type", e.target.value)}>
                  <option value="TEXT">TEXT</option>
                  <option value="RATING">RATING (1-5)</option>
                  <option value="YES_NO">YES/NO</option>
                  <option value="MULTIPLE_CHOICE">MULTIPLE CHOICE</option>
                </select>

                {q.type === "MULTIPLE_CHOICE" && (
                  <>
                    <div className="label" style={{ marginTop: 10 }}>
                      Options (separate by comma)
                    </div>
                    <input
                      className="input"
                      value={q.optionsRaw || ""}
                      onChange={(e) => updateQ(i, "optionsRaw", e.target.value)}
                      placeholder="e.g. App, Branch, ATM"
                    />
                  </>
                )}
              </div>
            ))}

            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                className="btn"
                onClick={addQuestion}
                style={{ background: "var(--card)", border: "1px solid var(--border)" }}
              >
                + Add Question
              </button>
              <button className="btn btn-primary">Create Survey</button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      <div className="card" style={{ padding: 16 }}>
        {items.length === 0 ? (
          <div style={{ color: "var(--muted)" }}>
            {canManage
              ? "No surveys yet. Create one above."
              : "No active surveys right now. (Ask Manager/Admin to activate a survey)."}
          </div>
        ) : (
          <table width="100%" cellPadding="10" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", color: "var(--muted)" }}>
                <th>Title</th>
                <th>Active</th>
                <th>Created</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((s) => (
                <tr key={s.id} style={{ borderTop: "1px solid var(--border)" }}>
                  <td style={{ fontWeight: 800 }}>{s.title}</td>
                  <td>{String(s.active)}</td>
                  <td>{s.createdAt ? new Date(s.createdAt).toLocaleString() : ""}</td>
                  <td>
                    {canManage ? (
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <button
                          className="btn"
                          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                          onClick={() => nav(`/surveys/${s.id}/results`)}
                        >
                          Results
                        </button>

                        <button className="btn btn-primary" onClick={() => nav(`/surveys/${s.id}/take`)}>
                          Preview
                        </button>

                        <button
                          className="btn"
                          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                          onClick={() => toggleActive(s.id, s.active)}
                        >
                          {s.active ? "Close Survey" : "Activate Survey"}
                        </button>
                      </div>
                    ) : canTake ? (
                      <button className="btn btn-primary" onClick={() => nav(`/surveys/${s.id}/take`)}>
                        Take Survey
                      </button>
                    ) : (
                      <span style={{ color: "var(--muted)" }}>No access</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
