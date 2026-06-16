import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Mail, X } from "lucide-react";
import api from "../api/axios";
import RatingBox from "../components/RatingBox";
import MessageThread from "../components/MessageThread";
import { getRole } from "../auth/auth";

export default function FeedbackDetails() {
  const { id } = useParams();
  const role = String(getRole() || "");
  const canContact = role.includes("MANAGER") || role.includes("ADMIN");

  const [item, setItem] = useState(null);
  const [history, setHistory] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [file, setFile] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const [showOutreach, setShowOutreach] = useState(false);
  const [outSubject, setOutSubject] = useState("");
  const [outMessage, setOutMessage] = useState("");
  const [outSending, setOutSending] = useState(false);

  const sendOutreach = async (e) => {
    e.preventDefault();
    setOutSending(true);
    try {
      const res = await api.post("/api/users/outreach", {
        customerId: item.customerId,
        subject: outSubject,
        message: outMessage,
      });
      alert(res.data?.message || "Message sent!");
      setShowOutreach(false);
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to send");
    } finally { setOutSending(false); }
  };

  const fetchedOnce = useRef(false);

  const loadAll = async () => {
    setErr("");
    setLoading(true);

    try {
      const [fRes, hRes, aRes] = await Promise.all([
        api.get(`/api/feedback/${id}`),
        api.get(`/api/feedback/${id}/history`),
        api.get(`/api/feedback/${id}/attachments`),
      ]);

      setItem(fRes.data);
      setHistory(hRes.data || []);
      setAttachments(aRes.data || []);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load feedback details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (fetchedOnce.current) return;
    fetchedOnce.current = true;
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const upload = async () => {
    if (!file) return alert("Choose a file first");

    try {
      const form = new FormData();
      form.append("file", file);

      await api.post(`/api/feedback/${id}/attachments`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setFile(null);
      await loadAll();
      alert("Uploaded!");
    } catch (e) {
      alert(e?.response?.data?.message || "Upload failed");
    }
  };

  const download = async (attachmentId, originalName) => {
    try {
      const res = await api.get(`/api/attachments/${attachmentId}/download`, {
        responseType: "blob",
      });

      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = originalName || "file";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert(e?.response?.data?.message || "Download failed");
    }
  };

  const remove = async (attachmentId) => {
    if (!confirm("Delete this attachment?")) return;

    try {
      await api.delete(`/api/attachments/${attachmentId}`);
      await loadAll();
    } catch (e) {
      alert(e?.response?.data?.message || "Delete failed");
    }
  };

  return (
    <div className="container" style={{ padding: "24px 0" }}>
      <h2 style={{ marginTop: 0 }}>Feedback Details</h2>

      {err && (
        <div
          className="card"
          style={{
            padding: 12,
            borderColor: "#fecaca",
            background: "#fff5f5",
            color: "#991b1b",
          }}
        >
          {err}
        </div>
      )}

      {loading && !err && (
        <div className="card" style={{ padding: 16 }}>
          Loading...
        </div>
      )}

      {item && !loading && (
        <>
          {/* Details */}
          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <div><b>Type:</b> {item.type}</div>
                <div><b>Category:</b> {item.category}</div>
                <div><b>SubCategory:</b> {item.subCategory || "—"}</div>
                <div><b>Priority:</b> {item.priority}</div>
                <div><b>Status:</b> {item.status}</div>
              </div>

              <div>
                <div><b>Customer:</b> {item.customerName || item.customerEmail || "—"}
                  {canContact && item.customerId && (
                    <button onClick={() => { setShowOutreach(true); setOutSubject(""); setOutMessage(""); }}
                      style={{ marginLeft: 10, padding: "3px 10px", borderRadius: 6, border: "1px solid #bbf7d0", background: "#f0fdf4", cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#16a34a", display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <Mail size={12} /> Contact
                    </button>
                  )}
                </div>
                <div><b>Escalated:</b> {item.escalated ? "YES" : "NO"}</div>
                <div><b>Department:</b> {item.departmentName || "—"}</div>
                <div><b>Assigned Staff:</b> {item.assignedStaffName || item.assignedStaffEmail || "—"}</div>
              </div>
            </div>

            <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "14px 0" }} />

            <div><b>Message:</b></div>
            <div style={{ color: "var(--muted)", marginTop: 6 }}>{item.message}</div>
          </div>

          {/* AI Analysis */}
          {(item.aiSummary || item.aiSentiment || item.aiSuggestedDepartment) && (
            <div className="card" style={{ padding: 16, marginTop: 12 }}>
              <h3 style={{ marginTop: 0 }}>AI Analysis</h3>
              <div><b>Summary:</b> {item.aiSummary || "—"}</div>
              <div><b>Sentiment:</b> {item.aiSentiment || "—"}</div>
              <div><b>Suggested Department:</b> {item.aiSuggestedDepartment || "—"}</div>
            </div>
          )}

          {/* Rating */}
          <div style={{ marginTop: 12 }}>
            <RatingBox feedbackId={item.id} feedbackStatus={item.status} />
          </div>

          {/* Communication Thread */}
          <div className="card" style={{ padding: 16, marginTop: 12 }}>
            <h3 style={{ marginTop: 0 }}>Communication Thread</h3>
            <MessageThread feedbackId={id} />
          </div>

          {/* Attachments */}
          <div className="card" style={{ padding: 16, marginTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0 }}>Attachments / Evidence</h3>
              <button
                className="btn"
                style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                onClick={loadAll}
              >
                Refresh
              </button>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 12 }}>
              <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              <button className="btn btn-primary" onClick={upload}>Upload</button>
              <div style={{ color: "var(--muted)", fontSize: 13 }}>
                Allowed: images, PDF, Word, Excel (max 10MB)
              </div>
            </div>

            <table width="100%" cellPadding="10" style={{ borderCollapse: "collapse", marginTop: 12 }}>
              <thead>
                <tr style={{ textAlign: "left", color: "var(--muted)" }}>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Size</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {attachments.map((a) => (
                  <tr key={a.id} style={{ borderTop: "1px solid var(--border)" }}>
                    <td>{a.originalName}</td>
                    <td>{a.contentType}</td>
                    <td>{Math.round((a.size || 0) / 1024)} KB</td>
                    <td style={{ display: "flex", gap: 10 }}>
                      <button className="btn" onClick={() => download(a.id, a.originalName)}>
                        Download
                      </button>
                      <button
                        className="btn"
                        style={{ border: "1px solid #fecaca", color: "#b91c1c", background: "var(--card)" }}
                        onClick={() => remove(a.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}

                {attachments.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ color: "var(--muted)" }}>
                      No attachments yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* History */}
          <div className="card" style={{ padding: 16, marginTop: 12 }}>
            <h3 style={{ marginTop: 0 }}>History</h3>

            {history.length === 0 && (
              <div style={{ color: "var(--muted)" }}>No history yet.</div>
            )}

            {history.map((h) => (
              <div key={h.id} style={{ padding: "10px 0", borderTop: "1px solid var(--border)" }}>
                <div style={{ fontWeight: 900 }}>
                  {h.fromStatus} → {h.toStatus}
                </div>
                <div style={{ color: "var(--muted)", fontSize: 13 }}>
                  by {h.actorEmail || "system"} • {new Date(h.createdAt).toLocaleString()}
                </div>
                {h.note && <div style={{ marginTop: 6 }}>{h.note}</div>}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Contact Customer Modal */}
      {showOutreach && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "grid", placeItems: "center", zIndex: 1000, padding: 16 }}>
          <div className="card" style={{ width: "100%", maxWidth: 480, padding: 28, borderRadius: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 900, fontSize: 18 }}>
                <Mail size={18} color="var(--primary)" /> Contact Customer
              </div>
              <button onClick={() => setShowOutreach(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }}><X size={20} /></button>
            </div>
            <div style={{ background: "#f8fafc", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 14, color: "#475569" }}>
              To: <strong>{item?.customerName}</strong> — {item?.customerEmail}
            </div>
            <form onSubmit={sendOutreach} style={{ display: "grid", gap: 14 }}>
              <div>
                <div className="label">Subject</div>
                <input className="input" value={outSubject} onChange={e => setOutSubject(e.target.value)}
                  placeholder="e.g. Regarding your feedback" required />
              </div>
              <div>
                <div className="label">Message</div>
                <textarea className="input" value={outMessage} onChange={e => setOutMessage(e.target.value)}
                  placeholder="Write your message..." required rows={5} style={{ resize: "vertical" }} />
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn btn-primary" type="submit" disabled={outSending} style={{ flex: 1 }}>
                  {outSending ? "Sending..." : "Send Message"}
                </button>
                <button className="btn" type="button" onClick={() => setShowOutreach(false)}
                  style={{ flex: 1, background: "var(--card)", border: "1px solid var(--border)" }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
