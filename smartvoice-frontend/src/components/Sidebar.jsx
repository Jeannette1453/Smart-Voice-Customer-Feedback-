import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { getRole, getEmail, logout } from "../auth/auth";
import { getTheme, toggleTheme } from "../theme/theme";
import {
  Home, LayoutDashboard, HelpCircle, MessageSquare, PlusSquare,
  ClipboardList, BarChart2, Settings, Users, Bell, User,
  LogOut, Moon, Sun, BookOpen, CheckSquare, UserCircle
} from "lucide-react";

/*
 * ── SIDEBAR COLOR REFERENCE ────────────────────────────────────────────────
 * var(--primary)  → Active nav item background (blue highlight) — change in index.css
 * var(--card)     → Sidebar background — change in index.css
 * var(--border)   → Sidebar right border — change in index.css
 * var(--muted)    → Inactive nav item text color — change in index.css
 * var(--danger-bg)  → Logout button background — change in index.css
 * var(--danger-text)→ Logout button text color — change in index.css
 * The user card gradient (top of sidebar) uses: var(--primary) and var(--accent)
 * To change the gradient: find "linear-gradient(135deg, var(--primary), var(--accent))"
 * ──────────────────────────────────────────────────────────────────────────
 */

const linkStyle = ({ isActive }) => ({
  padding: "12px 16px",
  borderRadius: 14,
  textDecoration: "none",
  fontWeight: 600,
  fontSize: 15,
  color: isActive ? "white" : "var(--muted)",
  background: isActive ? "var(--primary)" : "transparent",
  display: "flex",
  alignItems: "center",
  gap: 12,
  transition: "all 0.2s ease"
});

export default function Sidebar({ mobileOpen = false, onClose = () => {} }) {
  const role = String(getRole() || "");
  const email = getEmail() || "No email";
  const nav = useNavigate();

  const isCustomer = role.includes("CUSTOMER");
  const isStaff = role.includes("STAFF");
  const isManager = role.includes("MANAGER");
  const isAdmin = role.includes("ADMIN");

  const [theme, setThemeState] = useState(getTheme());
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 900;

  useEffect(() => {
    // Ensure accurate theme on mount
    setThemeState(getTheme());
  }, []);

  const handleNavigate = () => {
    if (isMobile) onClose();
  };

  const onLogout = () => {
    logout();
    nav("/login", { replace: true });
    handleNavigate();
  };

  const onToggleTheme = () => {
    const newTheme = toggleTheme();
    setThemeState(newTheme);
  };

  const asideContent = (
    <aside
      style={{
        width: 280,
        borderRight: "1px solid var(--border)",
        padding: "24px 20px",
        background: "var(--card)",
        color: "var(--text)",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflowY: "hidden",
        boxShadow: isMobile ? "0 10px 40px rgba(0,0,0,0.2)" : "none",
      }}
    >
      <div
        style={{
          padding: "20px",
          borderRadius: 20,
          background: "linear-gradient(135deg, var(--primary), var(--accent))",
          color: "white",
          marginBottom: 24,
          boxShadow: "0 8px 20px rgba(29, 78, 216, 0.25)"
        }}
      >
        <div style={{ fontSize: 13, opacity: 0.8, textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>
          Welcome back
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {email.split('@')[0]}
        </div>
        <div style={{ marginTop: 12, display: "inline-block", background: "rgba(255,255,255,0.2)", padding: "4px 10px", borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
          {role || "UNKNOWN"}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1, overflowY: "auto", paddingRight: 2 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1, margin: "8px 0 4px 12px" }}>Menu</div>
        
        <NavLink to="/" style={linkStyle} onClick={handleNavigate}>
          <Home size={18} /> Home
        </NavLink>

        <NavLink to="/dashboard" style={linkStyle} onClick={handleNavigate}>
          <LayoutDashboard size={18} /> Dashboard
        </NavLink>

        {isCustomer && (
          <>
            <NavLink to="/faqs" style={linkStyle} onClick={handleNavigate}><HelpCircle size={18} /> FAQs</NavLink>
            <NavLink to="/feedback/me" style={linkStyle} onClick={handleNavigate}><MessageSquare size={18} /> My Feedback</NavLink>
            <NavLink to="/feedback/new" style={linkStyle} onClick={handleNavigate}><PlusSquare size={18} /> Submit Feedback</NavLink>
            <NavLink to="/surveys" style={linkStyle} onClick={handleNavigate}><ClipboardList size={18} /> Surveys</NavLink>
          </>
        )}

        {isStaff && (
          <>
            <NavLink to="/faqs" style={linkStyle} onClick={handleNavigate}><HelpCircle size={18} /> FAQs</NavLink>
            <NavLink to="/feedback/assigned" style={linkStyle} onClick={handleNavigate}><CheckSquare size={18} /> My Assigned Feedback</NavLink>
          </>
        )}

        {(isManager || isAdmin) && (
          <>
            <NavLink to="/faqs" style={linkStyle} onClick={handleNavigate}><HelpCircle size={18} /> FAQs</NavLink>
            <NavLink to="/admin/faqs" style={linkStyle} onClick={handleNavigate}><BookOpen size={18} /> Manage FAQs</NavLink>
            <NavLink to="/feedback" end style={linkStyle} onClick={handleNavigate}><MessageSquare size={18} /> All Feedback</NavLink>
            {isManager && (
              <NavLink to="/feedback/assigned" style={linkStyle} onClick={handleNavigate}><CheckSquare size={18} /> My Assigned Feedback</NavLink>
            )}
            <NavLink to="/reports" style={linkStyle} onClick={handleNavigate}><BarChart2 size={18} /> Reports</NavLink>
            {isAdmin && <NavLink to="/admin/settings" style={linkStyle} onClick={handleNavigate}><Settings size={18} /> Admin Settings</NavLink>}
            <NavLink to="/surveys" style={linkStyle} onClick={handleNavigate}><ClipboardList size={18} /> Surveys</NavLink>
            <NavLink to="/customers" style={linkStyle} onClick={handleNavigate}><UserCircle size={18} /> Customers</NavLink>
            {isAdmin && <NavLink to="/users" style={linkStyle} onClick={handleNavigate}><Users size={18} /> Users</NavLink>}
          </>
        )}

        <div style={{ fontSize: 12, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1, margin: "12px 0 4px 12px" }}>Account</div>
        <NavLink to="/profile" style={linkStyle} onClick={handleNavigate}>
          <User size={18} /> Profile Setup
        </NavLink>
        <NavLink to="/notifications" style={linkStyle} onClick={handleNavigate}>
          <Bell size={18} /> Notifications
        </NavLink>
      </div>

      <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16, marginTop: 8, display: "flex", flexDirection: "column", gap: 10 }}>
        <button
          onClick={onToggleTheme}
          style={{
            ...linkStyle({ isActive: false }),
            background: "var(--card-2)",
            border: "1px solid var(--border)",
            textAlign: "left",
            width: "100%",
            cursor: "pointer",
            justifyContent: "space-between"
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {theme === "dark" ? <Moon size={18} /> : <Sun size={18} />}
            Dark Mode
          </span>
          <div style={{
            width: 44, height: 24, background: theme === "dark" ? "var(--primary)" : "var(--border)", borderRadius: 12, position: "relative", transition: "all 0.3s ease"
          }}>
            <div style={{
              width: 20, height: 20, background: "var(--card)", borderRadius: "50%", position: "absolute", top: 2, left: theme === "dark" ? 22 : 2, transition: "all 0.3s ease"
            }} />
          </div>
        </button>

        <button
          onClick={onLogout}
          style={{
            ...linkStyle({ isActive: false }),
            border: "none",
            width: "100%",
            cursor: "pointer",
            color: "var(--danger-text)",
            background: "var(--danger-bg)"
          }}
        >
          <LogOut size={18} /> Logout User
        </button>
      </div>
    </aside>
  );

  if (!isMobile) {
    return (
      <div
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          flexShrink: 0,
        }}
      >
        {asideContent}
      </div>
    );
  }

  return (
    <>
      {mobileOpen && (
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 99,
          }}
        />
      )}

      <div
        style={{
          position: "fixed",
          top: 0,
          left: mobileOpen ? 0 : -300,
          height: "100vh",
          zIndex: 100,
          transition: "left 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {asideContent}
      </div>
    </>
  );
}
