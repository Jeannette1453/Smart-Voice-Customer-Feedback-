import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import LOLCLogo from "./LOLCLogo";
import useUnreadCount from "../hooks/useUnreadCount";

export default function Topbar() {
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);
  const { count } = useUnreadCount();

  useEffect(() => {
    const onResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const isMobile = screenWidth <= 768;

  return (
    <div
      style={{
        minHeight: isMobile ? 72 : 72,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        borderBottom: "1px solid var(--border)",
        background: "var(--card)",
        position: "sticky",
        top: 0,
        zIndex: 10,
        boxShadow: "0 2px 10px rgba(0,0,0,0.02)"
      }}
    >
      <LOLCLogo scale={0.45} />
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <Link 
          to="/notifications" 
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: "var(--bg)",
            color: "var(--text)",
            textDecoration: "none",
            border: "1px solid var(--border)",
            transition: "all 0.2s ease"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "var(--shadow)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
          {count > 0 && (
            <span
              style={{
                position: "absolute",
                top: -2,
                right: -4,
                background: "var(--danger-text)",
                color: "white",
                borderRadius: 999,
                padding: "2px 6px",
                fontSize: 10,
                fontWeight: 900,
                minWidth: 18,
                textAlign: "center",
                border: "2px solid var(--card)"
              }}
              title={`${count} unread`}
            >
              {count}
            </span>
          )}
        </Link>
      </div>
    </div>
  );
}
