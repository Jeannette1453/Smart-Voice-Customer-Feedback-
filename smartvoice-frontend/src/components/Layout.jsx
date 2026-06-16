import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { getTheme, setTheme } from "../theme/theme";

export default function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);

  useEffect(() => {
    setTheme(getTheme());
  }, []);

  useEffect(() => {
    const onResize = () => {
      setScreenWidth(window.innerWidth);
      if (window.innerWidth > 900) {
        setMobileOpen(false);
      }
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const isMobile = screenWidth <= 900;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div style={{ flex: 1, minHeight: "100vh", background: "var(--bg)", minWidth: 0, display: "flex", flexDirection: "column" }}>
        {isMobile && (
          <div
            style={{
              position: "sticky",
              top: 0,
              zIndex: 50,
              background: "var(--card)",
              borderBottom: "1px solid var(--border)",
              padding: "12px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
            }}
          >
            <button
              className="btn"
              onClick={() => setMobileOpen(true)}
              style={{
                background: "var(--card-2)",
                border: "1px solid var(--border)",
                padding: "8px 12px",
                fontWeight: 800,
                color: "var(--text)",
                borderRadius: 10
              }}
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            </button>

            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
              <span style={{ fontWeight: 400, fontSize: 14, color: "#2563a8", letterSpacing: 1 }}>LOLC</span>
              <span style={{ fontWeight: 400, fontSize: 13, color: "#e8192c", letterSpacing: 2 }}>UNGUKA FINANCE</span>
            </div>
          </div>
        )}

        {!isMobile && <Topbar />}

        <div style={{ padding: isMobile ? 16 : 32, flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
