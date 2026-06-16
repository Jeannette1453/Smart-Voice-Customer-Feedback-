import React, { useMemo, useState } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";
import api from "../api/axios";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import LOLCLogo from "../components/LOLCLogo";

export default function ResetPassword() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const token = useMemo(() => params.get("token") || "", [params]);

  const [newPassword, setNewPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setOk(""); setLoading(true);
    try {
      await api.post("/api/auth/reset-password", { token, newPassword });
      setOk("Password reset successful!");
      setTimeout(() => nav("/login"), 900);
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Reset failed");
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "20px", background: "linear-gradient(135deg, #eff6ff 0%, #ffffff 50%, #f8fafc 100%)" }}>
      <div className="card" style={{ width: "100%", maxWidth: 500, padding: 24, borderRadius: 24, border: "1px solid var(--border)", boxShadow: "0 18px 50px rgba(15,23,42,0.10)", background: "rgba(255,255,255,0.96)" }}>
        <div style={{ marginBottom: 20, display: "flex", flexDirection: "column", gap: 12, alignItems: "center", textAlign: "center" }}>
          <LOLCLogo scale={0.7} />
          <div style={{ fontSize: 26, fontWeight: 900, color: "#0f172a" }}>Reset Password</div>
          <div style={{ color: "#64748b", fontSize: 14 }}>Enter your new password to complete the reset process.</div>
        </div>

        {!token ? (
          <div style={{ background: "#fff1f2", border: "1px solid #fecdd3", color: "#b91c1c", padding: 12, borderRadius: 14 }}>
            Missing reset token.
          </div>
        ) : (
          <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
            <div>
              <div style={{ marginBottom: 6, fontWeight: 700, color: "#334155" }}>New Password</div>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", display: "flex" }}>
                  <Lock size={16} />
                </div>
                <input className="input" type={showPw ? "text" : "password"} value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password"
                  required style={{ width: "100%", height: 48, borderRadius: 14, paddingLeft: 42, paddingRight: 42 }} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex" }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {err && <div style={{ background: "#fff1f2", border: "1px solid #fecdd3", color: "#b91c1c", padding: 12, borderRadius: 14 }}>{err}</div>}
            {ok && <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534", padding: 12, borderRadius: 14 }}>{ok}</div>}

            <button className="btn btn-primary" disabled={loading}
              style={{ width: "100%", height: 50, borderRadius: 14, fontWeight: 800 }}>
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}

        <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid #e2e8f0", fontSize: 14 }}>
          <Link to="/login" style={{ color: "#2563eb", fontWeight: 700 }}>← Back to Login</Link>
        </div>
      </div>
    </div>
  );
}
