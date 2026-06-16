import React from "react";
import { logout, getRole } from "../auth/auth";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const nav = useNavigate();
  const role = getRole();

  const doLogout = () => {
    logout();
    nav("/login");
  };

  return (
    <div style={{
      position: "sticky",
      top: 0,
      zIndex: 10,
      background: "rgba(246,248,251,0.9)",
      backdropFilter: "blur(10px)",
      borderBottom: "1px solid var(--border)"
    }}>
      <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 12,
            background: "linear-gradient(135deg, var(--primary), var(--accent))"
          }} />
          <div>
            <div style={{ fontWeight: 900, letterSpacing: 0.2 }}>SmartVoice</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>
              Role: <b>{String(role || "UNKNOWN")}</b>
            </div>
          </div>
        </div>

        <button className="btn" onClick={doLogout} style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          Logout
        </button>
      </div>
    </div>
  );
}

