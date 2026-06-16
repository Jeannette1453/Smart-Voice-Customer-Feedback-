import React, { useEffect, useState } from "react";
import { Users, Mail, X, RefreshCw, Search } from "lucide-react";
import api from "../api/axios";

export default function Customers() {
  const [items, setItems] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [outreachUser, setOutreachUser] = useState(null);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const load = async () => {
    setLoading(true); setErr("");
    try {
      const res = await api.get("/api/users/by-role?role=CUSTOMER");
      setItems(res.data || []);
      setFiltered(res.data || []);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load customers");
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const q = search.trim().toLowerCase();
    setFiltered(!q ? items : items.filter(u =>
      u.fullName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
    ));
  }, [search, items]);

  const openOutreach = (u) => { setOutreachUser(u); setSubject(""); setMessage(""); };

  const sendMessage = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await api.post("/api/users/outreach", {
        customerId: outreachUser.id,
        subject,
        message,
      });
      alert(res.data?.message || "Message sent!");
      setOutreachUser(null);
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to send message");
    } finally { setSending(false); }
  };

  return (
    <div style={{ padding: "24px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Users size={22} color="var(--primary)" />
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>Customers</h2>
          <span style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 999, padding: "2px 12px", fontSize: 13, fontWeight: 700, color: "var(--muted)" }}>
            {filtered.length}
          </span>
        </div>
        <button className="btn" onClick={load} style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--card)", border: "1px solid var(--border)" }}>
          <RefreshCw size={14} /> {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {err && <div style={{ background: "#fff1f2", border: "1px solid #fecdd3", color: "#b91c1c", padding: 12, borderRadius: 12, marginBottom: 16, fontSize: 14 }}>{err}</div>}

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 16, maxWidth: 400 }}>
        <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
        <input className="input" placeholder="Search by name or email..." value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ paddingLeft: 36, width: "100%" }} />
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>
            <Users size={36} style={{ marginBottom: 12, opacity: 0.3 }} />
            <div>No customers found.</div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table width="100%" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--card-2, #f8fafc)", borderBottom: "2px solid var(--border)" }}>
                  {["#", "Customer", "Email", "Action"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => (
                  <tr key={u.id} style={{ borderBottom: "1px solid var(--border)", background: i % 2 === 0 ? "transparent" : "rgba(0,0,0,0.01)" }}>
                    <td style={{ padding: "12px 16px", color: "var(--muted)", fontSize: 13 }}>{i + 1}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg, var(--primary), var(--accent))", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
                          {u.fullName?.[0]?.toUpperCase() || "?"}
                        </div>
                        <span style={{ fontWeight: 700, color: "var(--text)" }}>{u.fullName}</span>
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px", color: "var(--muted)", fontSize: 14 }}>{u.email}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <button onClick={() => openOutreach(u)}
                        style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid #bbf7d0", background: "#f0fdf4", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: "#16a34a" }}>
                        <Mail size={14} /> Send Message
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Outreach Modal */}
      {outreachUser && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "grid", placeItems: "center", zIndex: 1000, padding: 16 }}>
          <div className="card" style={{ width: "100%", maxWidth: 480, padding: 28, borderRadius: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 900, fontSize: 18 }}>
                <Mail size={18} color="var(--primary)" /> Contact Customer
              </div>
              <button onClick={() => setOutreachUser(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }}><X size={20} /></button>
            </div>
            <div style={{ background: "#f8fafc", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 14, color: "#475569" }}>
              To: <strong>{outreachUser.fullName}</strong> — {outreachUser.email}
            </div>
            <form onSubmit={sendMessage} style={{ display: "grid", gap: 14 }}>
              <div>
                <div className="label">Subject</div>
                <input className="input" value={subject} onChange={e => setSubject(e.target.value)}
                  placeholder="e.g. Follow-up on your account" required />
              </div>
              <div>
                <div className="label">Message</div>
                <textarea className="input" value={message} onChange={e => setMessage(e.target.value)}
                  placeholder="Write your message..." required rows={5} style={{ resize: "vertical" }} />
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn btn-primary" type="submit" disabled={sending} style={{ flex: 1 }}>
                  {sending ? "Sending..." : "Send Message"}
                </button>
                <button className="btn" type="button" onClick={() => setOutreachUser(null)}
                  style={{ flex: 1, background: "var(--card)", border: "1px solid var(--border)" }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
