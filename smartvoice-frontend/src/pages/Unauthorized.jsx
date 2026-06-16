import React from "react";
import { Link } from "react-router-dom";

export default function Unauthorized() {
  return (
    <div className="container" style={{ padding: "40px 0" }}>
      <div className="card" style={{ padding: 18 }}>
        <h2 style={{ marginTop: 0 }}>Unauthorized</h2>
        <p style={{ color: "var(--muted)" }}>
          You don’t have permission to access this page.
        </p>
        <Link to="/" className="btn btn-primary" style={{ display: "inline-block" }}>
          Go Home
        </Link>
      </div>
    </div>
  );
}

