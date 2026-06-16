import React, { useEffect, useState } from "react";
import api from "../api/axios";

export default function AttachmentBox({ feedbackId }) {
  const [items, setItems] = useState([]);
  const [file, setFile] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setErr("");
    try {
      const res = await api.get(`/api/feedback/${feedbackId}/attachments`);
      setItems(res.data || []);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load attachments");
    }
  };

  useEffect(() => {
    if (!feedbackId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedbackId]);

  const upload = async () => {
    if (!file) return alert("Choose a file first");

    setLoading(true);
    setErr("");
    try {
      const fd = new FormData();
      fd.append("file", file);

      await api.post(`/api/feedback/${feedbackId}/attachments`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setFile(null);
      await load();
      alert("Uploaded!");
    } catch (e) {
      setErr(e?.response?.data?.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const download = async (id, originalName) => {
    try {
      const res = await api.get(`/api/attachments/${id}/download`, { responseType: "blob" });
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

  const remove = async (id) => {
    if (!confirm("Delete this attachment?")) return;
    try {
      await api.delete(`/api/attachments/${id}`);
      await load();
    } catch (e) {
      alert(e?.response?.data?.message || "Delete failed");
    }
  };

  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div style={{ fontWeight: 900 }}>Attachments / Evidence</div>
        <button className="btn" onClick={load} style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          Refresh
        </button>
      </div>

      {err && (
        <div style={{ marginTop: 10, color: "#991b1b", background: "#fff5f5", border: "1px solid #fecaca", padding: 10, borderRadius: 12 }}>
          {err}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 12, alignItems: "center", flexWrap: "wrap" }}>
        <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        <button className="btn btn-primary" onClick={upload} disabled={loading}>
          {loading ? "Uploading..." : "Upload"}
        </button>
        <div style={{ fontSize: 12, color: "var(--muted)" }}>
          Allowed: images, PDF, Word, Excel (max 10MB)
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        {items.length === 0 ? (
          <div style={{ color: "var(--muted)" }}>No attachments yet.</div>
        ) : (
          <table width="100%" cellPadding="10" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", color: "var(--muted)" }}>
                <th>Name</th>
                <th>Type</th>
                <th>Size</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <tr key={a.id} style={{ borderTop: "1px solid var(--border)" }}>
                  <td>{a.originalName}</td>
                  <td>{a.contentType}</td>
                  <td>{Math.round(a.size / 1024)} KB</td>
                  <td style={{ display: "flex", gap: 8 }}>
                    <button
                      className="btn"
                      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                      onClick={() => download(a.id, a.originalName)}
                    >
                      Download
                    </button>
                    <button
                      className="btn"
                      style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--danger)" }}
                      onClick={() => remove(a.id)}
                    >
                      Delete
                    </button>
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
