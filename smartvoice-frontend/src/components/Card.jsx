import React from "react";
import { theme } from "../theme";

export default function Card({ title, right, children, style }) {
  return (
    <div
      style={{
        background: theme.card,
        border: `1px solid ${theme.border}`,
        borderRadius: 16,
        padding: 16,
        boxShadow: "0 10px 20px rgba(2, 6, 23, 0.05)",
        ...style,
      }}
    >
      {(title || right) && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontWeight: 900, color: theme.text }}>{title}</div>
          <div>{right}</div>
        </div>
      )}
      {children}
    </div>
  );
}

