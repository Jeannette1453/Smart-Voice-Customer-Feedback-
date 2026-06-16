import React from "react";
import { Link } from "react-router-dom";
import { Shield, Zap, BarChart2, MessageSquare, Bell, Users, CheckCircle } from "lucide-react";
import LOLCLogo from "../components/LOLCLogo";

export default function Landing() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)", color: "var(--text)" }}>

      {/* ── Navbar ── */}
      <header style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "18px 40px", background: "#ffffff", borderBottom: "1px solid #e2e8f0",
        position: "sticky", top: 0, zIndex: 50, boxShadow: "0 2px 12px rgba(0,0,0,0.06)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <LOLCLogo scale={0.5} />
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
            <span style={{ fontSize: 16, fontWeight: 400, color: "#2563a8", letterSpacing: 1 }}>LOLC</span>
            <span style={{ fontSize: 14, fontWeight: 400, color: "#e8192c", letterSpacing: 2 }}>UNGUKA FINANCE</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Link to="/login" style={{ textDecoration: "none", color: "var(--text)", fontWeight: 700, padding: "9px 20px", borderRadius: 8, border: "1px solid var(--border)" }}>
            Sign In
          </Link>
          <Link to="/signup" style={{ textDecoration: "none", background: "#2563a8", color: "white", fontWeight: 700, padding: "9px 22px", borderRadius: 8, boxShadow: "0 4px 12px rgba(37,99,168,0.3)" }}>
            Sign Up
          </Link>
        </div>
      </header>

      <main style={{ flex: 1 }}>

        {/* ── Hero ── */}
        <section style={{ position: "relative", overflow: "hidden", padding: "80px 24px 40px", textAlign: "center" }}>
          <div style={{ position: "absolute", top: -200, left: "5%", width: 600, height: 600, background: "#2563a8", filter: "blur(180px)", opacity: 0.04, borderRadius: "50%", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: -100, right: "5%", width: 400, height: 400, background: "#e8192c", filter: "blur(180px)", opacity: 0.04, borderRadius: "50%", pointerEvents: "none" }} />

          <div style={{ maxWidth: 800, margin: "0 auto", position: "relative", zIndex: 1 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 30, color: "#475569", fontWeight: 700, fontSize: 13, marginBottom: 28 }}>
              <CheckCircle size={14} /> LOLC Unguka Finance — SmartVoice Platform
            </div>

            <h1 style={{ fontSize: "clamp(28px, 4.5vw, 52px)", fontWeight: 900, lineHeight: 1.2, letterSpacing: -1, margin: "0 0 22px 0", color: "var(--text)" }}>
              <span style={{ color: "#0f172a" }}>SmartVoice</span>
              <br />
              <span style={{ background: "linear-gradient(135deg, #2563a8, #e8192c)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Customer Feedback
              </span>
              <br />
              <span style={{ background: "linear-gradient(135deg, #2563a8, #e8192c)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                and Service Tracker
              </span>
            </h1>

            <p style={{ fontSize: "clamp(16px, 2vw, 20px)", color: "var(--muted)", maxWidth: 620, margin: "0 auto 40px", lineHeight: 1.7 }}>
              Submit feedback, track resolution in real-time, and communicate directly with our support team — all in one place.
            </p>

            <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
              <Link to="/signup" style={{ textDecoration: "none", background: "#2563a8", color: "white", fontWeight: 800, fontSize: 16, padding: "14px 36px", borderRadius: 12, boxShadow: "0 4px 14px rgba(37,99,168,0.3)", display: "inline-block" }}>
                Sign Up
              </Link>
              <Link to="/login" style={{ textDecoration: "none", background: "var(--card)", color: "var(--text)", border: "2px solid var(--border)", fontWeight: 800, fontSize: 16, padding: "14px 36px", borderRadius: 12, display: "inline-block" }}>
                Sign In
              </Link>
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section style={{ padding: "48px 24px 80px", maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <h2 style={{ fontSize: "clamp(26px, 4vw, 38px)", fontWeight: 900, color: "var(--text)", marginBottom: 14 }}>
              Why SmartVoice?
            </h2>
            <p style={{ fontSize: 17, color: "var(--muted)", maxWidth: 580, margin: "0 auto", lineHeight: 1.7 }}>
              Built specifically for LOLC Unguka Finance to handle customer feedback efficiently and transparently.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 28 }}>
            {[
              { icon: <Shield size={24} />, color: "#2563a8", bg: "#eef4fb", title: "Role-Based Access", desc: "Separate dashboards and permissions for Customers, Staff, Managers, and Admins." },
              { icon: <Zap size={24} />, color: "#d97706", bg: "#fffbeb", title: "Real-Time Tracking", desc: "Live status updates, instant notifications, and email alerts at every step." },
              { icon: <BarChart2 size={24} />, color: "#16a34a", bg: "#f0fdf4", title: "Analytics & Reports", desc: "Exportable PDF and Excel reports with charts, trends, and performance metrics." },
              { icon: <MessageSquare size={24} />, color: "#7c3aed", bg: "#f5f3ff", title: "Communication Thread", desc: "Direct messaging between customers and staff on every feedback case." },
              { icon: <Bell size={24} />, color: "#e8192c", bg: "#fff1f2", title: "Smart Notifications", desc: "In-app and email notifications keep everyone informed automatically." },
              { icon: <Users size={24} />, color: "#0891b2", bg: "#ecfeff", title: "Team Management", desc: "Assign feedback to departments and staff, escalate urgent cases instantly." },
            ].map((f, i) => (
              <div key={i} style={{ background: "var(--card)", padding: "32px", borderRadius: 20, border: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: f.bg, display: "flex", alignItems: "center", justifyContent: "center", color: f.color }}>
                  {f.icon}
                </div>
                <div style={{ fontWeight: 800, fontSize: 17, color: "var(--text)" }}>{f.title}</div>
                <div style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── How it works ── */}
        <section style={{ background: "#f1f5f9", borderTop: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0", padding: "80px 24px" }}>
          <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
            <h2 style={{ fontSize: "clamp(26px, 4vw, 38px)", fontWeight: 900, color: "var(--text)", marginBottom: 14 }}>How It Works</h2>
            <p style={{ fontSize: 17, color: "var(--muted)", marginBottom: 56, lineHeight: 1.7 }}>Three simple steps to get your issue resolved.</p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 32 }}>
              {[
                { step: "1", title: "Submit Feedback", desc: "Create an account and submit your feedback with details, category, and attachments." },
                { step: "2", title: "Track Progress", desc: "Get notified as your feedback is assigned, reviewed, and resolved by our team." },
                { step: "3", title: "Rate & Close", desc: "Once resolved, rate your experience and close the case. Your voice matters." },
              ].map((s, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                  <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#2563a8", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 900, boxShadow: "0 4px 12px rgba(37,99,168,0.3)" }}>
                    {s.step}
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 17, color: "var(--text)" }}>{s.title}</div>
                  <div style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.6 }}>{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>

      {/* ── Footer ── */}
      <footer style={{ borderTop: "1px solid #e2e8f0", background: "#ffffff", padding: "20px 40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
            <LOLCLogo scale={0.5} />
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
              <span style={{ fontSize: 16, fontWeight: 400, color: "#2563a8", letterSpacing: 1 }}>LOLC</span>
              <span style={{ fontSize: 14, fontWeight: 400, color: "#e8192c", letterSpacing: 2 }}>UNGUKA FINANCE</span>
              <span style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>SmartVoice — Customer Feedback and Service Tracker</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 24, fontSize: 14 }}>
            <Link to="/login" style={{ color: "#64748b", textDecoration: "none", fontWeight: 600 }}>Sign In</Link>
            <Link to="/signup" style={{ color: "#64748b", textDecoration: "none", fontWeight: 600 }}>Sign Up</Link>
          </div>
          <div style={{ fontSize: 13, color: "#94a3b8", textAlign: "right", flexShrink: 0 }}>
            © {new Date().getFullYear()} LOLC Unguka Finance. All rights reserved.
          </div>
        </div>
      </footer>

    </div>
  );
}
