import React, { useState } from "react";
import api from "../api/axios";
import { useParams } from "react-router-dom";

export default function SurveyResults() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      setErr("");
      setLoading(true);
      const res = await api.get(`/api/surveys/${id}/results`);
      setData(res.data);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load results (Manager/Admin only)");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <h2 style={{ marginTop: 0 }}>Survey Results</h2>
        <button className="btn" onClick={load} style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          {loading ? "Loading..." : "Load Results"}
        </button>
      </div>

      {err && (
        <div className="card" style={{ padding: 12, borderColor: "#fecaca", background: "#fff5f5", color: "#991b1b", marginBottom: 12 }}>
          {err}
        </div>
      )}

      {!data && !err && (
        <div className="card" style={{ padding: 16 }}>
          Click <b>Load Results</b>.
        </div>
      )}

      {data && (
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 900 }}>{data.title}</div>
          <div style={{ marginTop: 6, color: "var(--muted)" }}>
            Total responses: <b>{data.totalResponses}</b>
          </div>

          <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
            {data.questions?.map((q) => (
              <div key={q.questionId} className="card" style={{ padding: 12, border: "1px solid var(--border)" }}>
                <div style={{ fontWeight: 900 }}>{q.questionText}</div>

                <table width="100%" cellPadding="10" style={{ borderCollapse: "collapse", marginTop: 8 }}>
                  <thead>
                    <tr style={{ textAlign: "left", color: "var(--muted)" }}>
                      <th>Answer</th>
                      <th>Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(q.counts || {}).map(([a, c]) => (
                      <tr key={a} style={{ borderTop: "1px solid var(--border)" }}>
                        <td>{a}</td>
                        <td style={{ fontWeight: 900 }}>{c}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

