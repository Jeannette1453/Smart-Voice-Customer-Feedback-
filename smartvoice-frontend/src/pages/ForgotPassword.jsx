import React, { useState } from "react";
import { Mail } from "lucide-react";
import api from "../api/axios";
import { Link } from "react-router-dom";
import LOLCLogo from "../components/LOLCLogo";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setOk(""); setLoading(true);
    try {
      await api.post("/api/auth/forgot-password", { email });
      setOk("If the email exists, a reset link has been sent.");
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Request failed");
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "20px", background: "linear-gradient(135deg, #eff6ff 0%, #ffffff 50%, #f8fafc 100%)" }}>
      <div className="card" style={{ width: "100%", maxWidth: 500, padding: 24, borderRadius: 24, border: "1px solid var(--border)", boxShadow: "0 18px 50px rgba(15,23,42,0.10)", background: "rgba(255,255,255,0.96)" }}>
        {/* ── Header Section ── */}
        <div style={{ marginBottom: 20, display: "flex", flexDirection: "column", gap: 12, alignItems: "center", textAlign: "center" }}>
          <LOLCLogo scale={0.7} />
          {/* ── Page Title ── */}
          <div style={{ fontSize: 26, fontWeight: 900, color: "#0f172a" }}>Forgot Password</div>
          {/* ── Subtitle ── */}
          <div style={{ color: "#64748b", fontSize: 14 }}>Enter your email to receive a password reset link.</div>
        </div>

        {/* ── Form Section ── */}
        <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
          <div>
            <div style={{ marginBottom: 6, fontWeight: 700, color: "#334155" }}>Email</div>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", display: "flex" }}>
                <Mail size={16} />
              </div>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email" required
                style={{ width: "100%", height: 48, borderRadius: 14, paddingLeft: 42 }} />
            </div>
          </div>

          {err && <div style={{ background: "#fff1f2", border: "1px solid #fecdd3", color: "#b91c1c", padding: 12, borderRadius: 14 }}>{err}</div>}
          {ok && <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534", padding: 12, borderRadius: 14 }}>{ok}</div>}

          <button className="btn btn-primary" disabled={loading}
            style={{ width: "100%", height: 50, borderRadius: 14, fontWeight: 800 }}>
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        {/* ── Back Link ── */}
        <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid #e2e8f0", fontSize: 14 }}>
          <Link to="/login" style={{ color: "#2563eb", fontWeight: 700 }}>← Back to Login</Link>
        </div>
      </div>
    </div>
  );
}
