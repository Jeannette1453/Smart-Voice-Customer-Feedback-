import React, { useState } from "react";
import { User, Mail, Lock, Eye, EyeOff, Phone } from "lucide-react";
import api from "../api/axios";
import { Link, useNavigate } from "react-router-dom";
import LOLCLogo from "../components/LOLCLogo";

function InputIcon({ icon, children }) {
  return (
    <div style={{ position: "relative" }}>
      <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", display: "flex" }}>
        {icon}
      </div>
      {children}
    </div>
  );
}

export default function Signup() {
  const nav = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setOk(""); setLoading(true);
    try {
      await api.post("/api/auth/signup", { fullName, email, phone, password });
      setOk("Account created successfully!");
      setTimeout(() => nav("/login"), 900);
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Signup failed");
    } finally { setLoading(false); }
  };

  const inputStyle = { width: "100%", height: 48, borderRadius: 14, paddingLeft: 42 };

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "20px", background: "linear-gradient(135deg, #eff6ff 0%, #ffffff 50%, #f8fafc 100%)" }}>
      <div className="card" style={{ width: "100%", maxWidth: 520, padding: 24, borderRadius: 24, border: "1px solid var(--border)", boxShadow: "0 18px 50px rgba(15,23,42,0.10)", background: "rgba(255,255,255,0.96)" }}>
        {/* ── Header / Logo Section ── */}
        <div style={{ marginBottom: 20, display: "flex", flexDirection: "column", gap: 12, alignItems: "center", textAlign: "center" }}>
          <LOLCLogo scale={0.7} />
          {/* ── Page Title ── */}
          <div style={{ fontSize: 28, fontWeight: 900, color: "#0f172a" }}>Create Account</div>
          {/* ── Subtitle ── */}
          <div style={{ color: "#64748b", fontSize: 14 }}>Join SmartVoice to submit and track your feedback.</div>
        </div>

        {/* ── Form Section ── */}
        <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
          <div>
            <div style={{ marginBottom: 6, fontWeight: 700, color: "#334155" }}>Full Name</div>
            <InputIcon icon={<User size={16} />}>
              <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name" required style={inputStyle} />
            </InputIcon>
          </div>

          <div>
            <div style={{ marginBottom: 6, fontWeight: 700, color: "#334155" }}>Email</div>
            <InputIcon icon={<Mail size={16} />}>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email" required style={inputStyle} />
            </InputIcon>
          </div>

          <div>
            <div style={{ marginBottom: 6, fontWeight: 700, color: "#334155" }}>Phone Number</div>
            <InputIcon icon={<Phone size={16} />}>
              <input className="input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +250 7XX XXX XXX" style={inputStyle} />
            </InputIcon>
          </div>

          <div>
            <div style={{ marginBottom: 6, fontWeight: 700, color: "#334155" }}>Password</div>
            <InputIcon icon={<Lock size={16} />}>
              <input className="input" type={showPw ? "text" : "password"} value={password}
                onChange={(e) => setPassword(e.target.value)} placeholder="Create a password"
                required style={{ ...inputStyle, paddingRight: 42 }} />
              <button type="button" onClick={() => setShowPw(!showPw)}
                style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex" }}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </InputIcon>
          </div>

          {err && <div style={{ background: "#fff1f2", border: "1px solid #fecdd3", color: "#b91c1c", padding: 12, borderRadius: 14, fontSize: 14 }}>{err}</div>}
          {ok && <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534", padding: 12, borderRadius: 14, fontSize: 14 }}>{ok}</div>}

          <button className="btn btn-primary" disabled={loading}
            style={{ width: "100%", height: 50, borderRadius: 14, fontWeight: 800, fontSize: 15 }}>
            {loading ? "Creating..." : "Sign Up"}
          </button>
        </form>

        {/* ── Login Link ── */}
        <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid #e2e8f0", fontSize: 14, color: "#64748b" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "#2563eb", fontWeight: 700 }}>Login</Link>
        </div>
      </div>
    </div>
  );
}
