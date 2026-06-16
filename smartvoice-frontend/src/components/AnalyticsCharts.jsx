import React from "react";
import {
  ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, Legend,
  CartesianGrid,
} from "recharts";
import { mapToChartData } from "../utils/chart";

const Card = ({ title, children }) => (
  <div className="card" style={{ padding: 16, minWidth: 0 }}>
    <h3 style={{ marginTop: 0, marginBottom: 10 }}>{title}</h3>
    {children}
  </div>
);

const Empty = ({ text = "No data yet." }) => (
  <div style={{ padding: 14, border: "1px dashed var(--border)", borderRadius: 14, color: "var(--muted)" }}>
    {text}
  </div>
);

export default function AnalyticsCharts({ analytics }) {
  const statusData = mapToChartData(analytics?.byStatus);
  const typeData = mapToChartData(analytics?.byType);
  const priorityData = mapToChartData(analytics?.byPriority);

  const pieColors = ["#0b5ed7", "#198754", "#ffc107", "#dc3545", "#6f42c1", "#20c997", "#0dcaf0"];

  const tooltipStyle = {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: 12,
    boxShadow: "0 10px 30px rgba(0,0,0,.08)",
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 12, marginTop: 12 }}>
      {/* Status */}
      <Card title="Feedback by Status">
        {statusData.length === 0 ? (
          <Empty />
        ) : (
          <div style={{ width: "100%", height: 320, minHeight: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tickMargin={8} />
                <YAxis allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" radius={[10, 10, 0, 0]} fill="var(--primary)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Type Pie */}
      <Card title="Feedback by Type">
        {typeData.length === 0 ? (
          <Empty />
        ) : (
          <div style={{ width: "100%", height: 320, minHeight: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={105}
                  innerRadius={55}
                  paddingAngle={3}
                  label
                >
                  {typeData.map((_, index) => (
                    <Cell key={index} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Priority */}
      <div style={{ gridColumn: "1 / -1" }}>
        <Card title="Feedback by Priority">
          {priorityData.length === 0 ? (
            <Empty />
          ) : (
            <div style={{ width: "100%", height: 280, minHeight: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tickMargin={8} />
                  <YAxis allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="value" radius={[10, 10, 0, 0]} fill="var(--accent)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

