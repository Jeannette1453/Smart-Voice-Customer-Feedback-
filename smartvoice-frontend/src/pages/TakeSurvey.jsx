import React, { useState } from "react";
import api from "../api/axios";
import { useNavigate, useParams } from "react-router-dom";

export default function TakeSurvey() {
  const { id } = useParams();
  const nav = useNavigate();

  const [survey, setSurvey] = useState(null);
  const [answers, setAnswers] = useState({});
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      setErr("");
      setLoading(true);
      const res = await api.get(`/api/surveys/${id}`);
      setSurvey(res.data);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load survey");
    } finally {
      setLoading(false);
    }
  };

  const setAnswer = (qid, val) => setAnswers((p) => ({ ...p, [qid]: val }));

  const submit = async () => {
    try {
      setErr("");
      await api.post(`/api/surveys/${id}/submit`, {
        answers: Object.entries(answers).map(([questionId, answerText]) => ({
          questionId,
          answerText,
        })),
      });
      alert("Thank you! Survey submitted.");
      nav("/dashboard");
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to submit survey");
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <h2 style={{ marginTop: 0 }}>Take Survey</h2>
        <button className="btn" onClick={load} style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          {loading ? "Loading..." : "Load Survey"}
        </button>
      </div>

      {err && (
        <div className="card" style={{ padding: 12, borderColor: "#fecaca", background: "#fff5f5", color: "#991b1b", marginBottom: 12 }}>
          {err}
        </div>
      )}

      {!survey && !err && (
        <div className="card" style={{ padding: 16 }}>
          Click <b>Load Survey</b> to start.
        </div>
      )}

      {survey && (
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 900, fontSize: 18 }}>{survey.title}</div>
          <div style={{ color: "var(--muted)", marginTop: 6 }}>{survey.description}</div>

          <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
            {survey.questions?.map((q) => (
              <div key={q.id} className="card" style={{ padding: 12, border: "1px solid var(--border)" }}>
                <div style={{ fontWeight: 800 }}>{q.questionText}</div>

                {q.type === "TEXT" && (
                  <input className="input" value={answers[q.id] || ""} onChange={(e) => setAnswer(q.id, e.target.value)} />
                )}

                {q.type === "YES_NO" && (
                  <select className="input" value={answers[q.id] || ""} onChange={(e) => setAnswer(q.id, e.target.value)}>
                    <option value="">Select</option>
                    <option value="YES">YES</option>
                    <option value="NO">NO</option>
                  </select>
                )}

                {q.type === "RATING" && (
                  <select className="input" value={answers[q.id] || ""} onChange={(e) => setAnswer(q.id, e.target.value)}>
                    <option value="">Select rating</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                  </select>
                )}

                {q.type === "MULTIPLE_CHOICE" && (
                  <select className="input" value={answers[q.id] || ""} onChange={(e) => setAnswer(q.id, e.target.value)}>
                    <option value="">Select</option>
                    {(q.options || []).map((op) => (
                      <option key={op} value={op}>{op}</option>
                    ))}
                  </select>
                )}
              </div>
            ))}
          </div>

          <button className="btn btn-primary" onClick={submit} style={{ marginTop: 14 }}>
            Submit Survey
          </button>
        </div>
      )}
    </div>
  );
}

