import React, { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { Mail, Lock, Eye, EyeOff, KeyRound, ArrowLeft } from "lucide-react";
import api from "../api/axios";
import { saveToken } from "../auth/auth";
import { useNavigate, Link } from "react-router-dom";
import LOLCLogo from "../components/LOLCLogo";

/*
 * ── LOGIN PAGE COLOR REFERENCE ─────────────────────────────────────────────
 * #0f172a  → Page title text (Welcome back)
 * #334155  → Input label text
 * #94a3b8  → Input icon color, placeholder text
 * #2563eb  → Links (Forgot password, Create account)
 * #b91c1c  → Error message text (red)
 * #fff1f2  → Error message background
 * #fecdd3  → Error message border
 * var(--primary) → Continue button background (change in index.css)
 * ──────────────────────────────────────────────────────────────────────────
 */

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

export default function Login() {
  const nav = useNavigate();
  const [step, setStep] = useState("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [otp, setOtp] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submitCredentials = async (e) => {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      await api.post("/api/auth/login", { email, password });
      setStep("otp");
    } catch (error) {
      setErr(error?.response?.data?.message || error.message || "Login failed");
    } finally { setLoading(false); }
  };

  const submitOtp = async (e) => {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      const res = await api.post("/api/auth/verify-otp", { email, code: otp });
      const token = res.data.token || res.data.accessToken || res.data.jwt;
      if (!token) throw new Error("No token returned");
      saveToken(token);
      localStorage.setItem("role", res.data.role || "");
      localStorage.setItem("email", res.data.email || email);
      localStorage.setItem("fullName", res.data.fullName || "");
      nav("/dashboard", { replace: true });
    } catch (error) {
      setErr(error?.response?.data?.message || error.message || "Invalid code");
    } finally { setLoading(false); }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setErr(""); setLoading(true);
    try {
      const res = await api.post("/api/auth/google", { idToken: credentialResponse.credential });
      const token = res.data.token || res.data.accessToken || res.data.jwt;
      if (!token) throw new Error("No token returned");
      saveToken(token);
      localStorage.setItem("role", res.data.role || "");
      localStorage.setItem("email", res.data.email || "");
      localStorage.setItem("fullName", res.data.fullName || "");
      nav("/dashboard", { replace: true });
    } catch (error) {
      setErr(error?.response?.data?.message || error.message || "Google login failed");
    } finally { setLoading(false); }
  };

  const inputStyle = { width: "100%", height: 48, borderRadius: 14, paddingLeft: 42 };

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "20px", background: "linear-gradient(135deg, #eff6ff 0%, #ffffff 50%, #f8fafc 100%)" }}>
      <div className="card" style={{ width: "100%", maxWidth: 460, padding: 30, borderRadius: 24, border: "1px solid var(--border)", boxShadow: "0 18px 50px rgba(15,23,42,0.10)", background: "rgba(255,255,255,0.96)" }}>
        <div style={{ marginBottom: 28, display: "flex", flexDirection: "column", gap: 12, alignItems: "center", textAlign: "center" }}>
          <Link to="/" style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", color: "var(--muted)", textDecoration: "none", marginBottom: 4 }}>
            <ArrowLeft size={18} />
          </Link>
          <LOLCLogo scale={0.7} />
          <div style={{ fontSize: 28, fontWeight: 900, color: "#0f172a" }}>
            {step === "otp" ? "Check your email" : "Welcome back"}
          </div>
          <div style={{ color: "#64748b", fontSize: 14 }}>
            {step === "otp" ? `We sent a 6-digit code to ${email}` : "Sign in to continue to your SmartVoice dashboard."}
          </div>
        </div>

        {step === "credentials" ? (
          <>
            {/* ── Credentials Form Section ── */}
            <form onSubmit={submitCredentials} style={{ display: "grid", gap: 14 }}>
              <div>
                <div style={{ marginBottom: 6, fontWeight: 700, color: "#334155" }}>Email Address</div>
                <InputIcon icon={<Mail size={16} />}>
                  <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email" autoComplete="email" required style={inputStyle} />
                </InputIcon>
              </div>
              <div>
                <div style={{ marginBottom: 6, fontWeight: 700, color: "#334155" }}>Password</div>
                <InputIcon icon={<Lock size={16} />}>
                  <input className="input" type={showPw ? "text" : "password"} value={password}
                    onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password"
                    autoComplete="current-password" required style={{ ...inputStyle, paddingRight: 42 }} />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex" }}>
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </InputIcon>
              </div>

              {err && <div style={{ background: "#fff1f2", border: "1px solid #fecdd3", color: "#b91c1c", padding: 12, borderRadius: 14, fontSize: 14 }}>{err}</div>}

              <button className="btn btn-primary" type="submit" disabled={loading}
                style={{ width: "100%", height: 50, borderRadius: 14, fontWeight: 800, fontSize: 15 }}>
                {loading ? "Sending code..." : "Continue"}
              </button>
            </form>

            {/* ── Google Login Section ── */}
            <div style={{ margin: "20px 0", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>or</div>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setErr("Google login failed")}
                theme="outline" size="large" text="signin_with" shape="rectangular" />
            </div>

            <div style={{ marginTop: 18, display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", fontSize: 14 }}>
              <Link to="/forgot-password" style={{ color: "#2563eb", fontWeight: 700 }}>Forgot password?</Link>
              <Link to="/signup" style={{ color: "#2563eb", fontWeight: 700 }}>Create account</Link>
            </div>
          </>
        ) : (
          <>
            {/* ── OTP Section ── */}
            <form onSubmit={submitOtp} style={{ display: "grid", gap: 14 }}>
              <div>
                <div style={{ marginBottom: 6, fontWeight: 700, color: "#334155" }}>Verification Code</div>
                <InputIcon icon={<KeyRound size={16} />}>
                  <input className="input" type="text" value={otp} onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter 6-digit code" maxLength={6} required autoFocus
                    style={{ width: "100%", height: 56, borderRadius: 14, fontSize: 24, textAlign: "center", letterSpacing: 8, fontWeight: 800, paddingLeft: 0 }} />
                </InputIcon>
              </div>

              {err && <div style={{ background: "#fff1f2", border: "1px solid #fecdd3", color: "#b91c1c", padding: 12, borderRadius: 14, fontSize: 14 }}>{err}</div>}

              <button className="btn btn-primary" type="submit" disabled={loading}
                style={{ width: "100%", height: 50, borderRadius: 14, fontWeight: 800, fontSize: 15 }}>
                {loading ? "Verifying..." : "Verify & Login"}
              </button>
              <button type="button" onClick={() => { setStep("credentials"); setErr(""); setOtp(""); }}
                style={{ background: "none", border: "none", color: "#2563eb", fontWeight: 700, fontSize: 14, cursor: "pointer", textAlign: "center" }}>
                ← Back to login
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
