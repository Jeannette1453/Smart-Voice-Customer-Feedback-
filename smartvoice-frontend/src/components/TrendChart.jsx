import React from "react";
import {
  ResponsiveContainer,
  LineChart, Line,
  XAxis, YAxis, Tooltip,
  CartesianGrid,
} from "recharts";

export default function TrendChart({ trend = [], days = 30 }) {
  const tooltipStyle = {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: 12,
    boxShadow: "0 10px 30px rgba(0,0,0,.08)",
  };

  if (!trend || trend.length === 0) {
    return (
      <div className="card" style={{ padding: 16, marginTop: 12 }}>
        <h3 style={{ marginTop: 0 }}>Feedback Trend (Last {days} days)</h3>
        <div style={{ padding: 14, border: "1px dashed var(--border)", borderRadius: 14, color: "var(--muted)" }}>
          No trend data yet.
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 16, marginTop: 12, minWidth: 0 }}>
      <h3 style={{ marginTop: 0 }}>Feedback Trend (Last {days} days)</h3>

      <div style={{ width: "100%", height: 320, minHeight: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trend} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tickMargin={8} />
            <YAxis allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="count" stroke="var(--primary)" strokeWidth={3} dot />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

