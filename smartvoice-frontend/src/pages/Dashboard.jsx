import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { getRole } from "../auth/auth";
import useUnreadCount from "../hooks/useUnreadCount";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";

const STATUS_COLORS = {
  NEW: "#2563eb",
  ASSIGNED: "#06b6d4",
  IN_PROGRESS: "#f59e0b",
  RESOLVED: "#16a34a",
  CLOSED: "#64748b",
  REJECTED: "#dc2626",
};

function boxStyle(extra = {}) {
  return {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: 24,
    boxShadow: "var(--shadow)",
    padding: 24,
    transition: "all 0.3s ease",
    position: "relative",
    overflow: "hidden",
    ...extra,
  };
}

function Card({ title, value, subtitle, actionLabel, onAction, highlight = false }) {
  return (
    <div style={boxStyle({ 
      background: highlight ? "linear-gradient(135deg, var(--primary), var(--accent))" : "var(--card)"
    })}>
      {highlight && (
        <div style={{ position: "absolute", top: -50, right: -50, width: 150, height: 150, background: "rgba(255,255,255,0.1)", borderRadius: "50%" }}></div>
      )}
      <div style={{ color: highlight ? "rgba(255,255,255,0.9)" : "var(--muted)", fontWeight: 700, fontSize: 15, textTransform: "uppercase", letterSpacing: 1 }}>{title}</div>
      <div style={{ fontSize: 44, fontWeight: 900, marginTop: 12, color: highlight ? "white" : "var(--text)" }}>{value}</div>
      {subtitle && <div style={{ color: highlight ? "rgba(255,255,255,0.8)" : "var(--muted)", marginTop: 8, lineHeight: 1.5, fontSize: 14 }}>{subtitle}</div>}
      {actionLabel && (
        <div style={{ marginTop: 20 }}>
          <button
            className="btn"
            onClick={onAction}
            style={{ 
              background: highlight ? "white" : "var(--card-2)", 
              color: highlight ? "var(--primary)" : "var(--text)",
              border: highlight ? "none" : "1px solid var(--border)", 
              width: "100%",
              fontWeight: 800,
              padding: "12px",
              borderRadius: 12
            }}
          >
            {actionLabel}
          </button>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const nav = useNavigate();
  const role = String(getRole() || "");

  const isCustomer = role.includes("CUSTOMER");
  const isStaff = role.includes("STAFF");
  const isManager = role.includes("MANAGER");
  const isAdmin = role.includes("ADMIN");

  const { count: unreadCount, refresh: refreshUnread } = useUnreadCount();

  const [myFeedbackCount, setMyFeedbackCount] = useState(0);
  const [assignedCount, setAssignedCount] = useState(0);
  const [managerData, setManagerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [overdueFeedback, setOverdueFeedback] = useState([]);
  const [staffWorkload, setStaffWorkload] = useState([]);
  const [showOverdue, setShowOverdue] = useState(false);

  const fetchedOnce = useRef(false);
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);

  useEffect(() => {
    const onResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const isMobile = screenWidth <= 768;
  const isTablet = screenWidth > 768 && screenWidth <= 1100;

  const customerGrid = useMemo(() => {
    if (isMobile) return "1fr";
    if (isTablet) return "1fr 1fr";
    return "1fr 1fr 1fr";
  }, [isMobile, isTablet]);

  const managerTopGrid = useMemo(() => {
    if (isMobile) return "1fr";
    if (isTablet) return "1fr 1fr";
    return "repeat(3, 1fr)";
  }, [isMobile, isTablet]);

  const managerMidGrid = useMemo(() => {
    if (isMobile) return "1fr";
    if (isTablet) return "1fr 1fr";
    return "repeat(4, 1fr)";
  }, [isMobile, isTablet]);

  const chartGrid = isMobile ? "1fr" : "1fr 1fr";

  const load = async () => {
    setLoading(true);
    try {
      refreshUnread();

      if (isCustomer) {
        const res = await api.get("/api/feedback/me");
        const d = res.data || [];
        setMyFeedbackCount(d.length);
        const byStatus = {};
        d.forEach(f => { byStatus[f.status] = (byStatus[f.status] || 0) + 1; });
        setManagerData({ byStatus, isBasic: true });
      }

      if (isStaff) {
        const res = await api.get("/api/feedback/assigned/me");
        const d = res.data || [];
        setAssignedCount(d.length);
        const byStatus = {};
        d.forEach(f => { byStatus[f.status] = (byStatus[f.status] || 0) + 1; });
        setManagerData({ byStatus, isBasic: true });
      }

      if (isManager || isAdmin) {
        const [analyticsRes, trendRes, overdueRes, workloadRes] = await Promise.all([
          api.get("/api/reports/analytics"),
          api.get("/api/reports/trend?days=30"),
          api.get("/api/feedback/overdue"),
          api.get("/api/feedback/staff-workload"),
        ]);
        setOverdueFeedback(overdueRes.data || []);
        setStaffWorkload(workloadRes.data || []);

        const analytics = analyticsRes.data || {};
        const byStatus = analytics.byStatus || {};
        const byPriority = analytics.byPriority || {};

        const totalFeedback = analytics.total || 0;
        const escalated = analytics.escalated || 0;
        const urgent = byPriority.URGENT || 0;

        const openCases =
          (byStatus.NEW || 0) +
          (byStatus.ASSIGNED || 0) +
          (byStatus.IN_PROGRESS || 0);

        const resolvedCases =
          (byStatus.RESOLVED || 0) +
          (byStatus.CLOSED || 0);

        const resolutionRate =
          totalFeedback > 0 ? Math.round((resolvedCases / totalFeedback) * 100) : 0;

       setManagerData({
  unreadNotifications: unreadCount,
  totalFeedback,
  urgent,
  escalated,
  openCases: analytics.openCases || openCases,
  resolvedCases: analytics.resolvedCases || resolvedCases,
  overdueCases: analytics.overdueCases || 0,
  resolutionRate: analytics.resolutionRate || resolutionRate,
  averageHandlingHours: analytics.averageHandlingHours || 0,
  averageRating: analytics.averageRating || 0,
  byStatus,
  trend: trendRes.data || [],
});
      }
    } catch (e) {
      console.error("Dashboard load failed", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (fetchedOnce.current) return;
    fetchedOnce.current = true;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusData = Object.entries(managerData?.byStatus || {}).map(([name, count]) => ({
    name,
    count,
  }));

  const trendData = managerData?.trend || [];

  return (
    <div className="container" style={{ padding: "24px 0" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: isMobile ? "flex-start" : "center",
          flexDirection: isMobile ? "column" : "row",
          gap: 12,
        }}
      >
        <h2 style={{ marginTop: 0, color: "var(--text)", marginBottom: 0 }}>Dashboard</h2>

        <button
          className="btn"
          onClick={load}
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            color: "var(--text)",
            width: isMobile ? "100%" : "auto",
            fontWeight: 700
          }}
        >
          Refresh Data
        </button>
      </div>

      {loading ? (
        <div style={{ ...boxStyle(), marginTop: 12 }}>Loading dashboard...</div>
      ) : (
        <>
          {isCustomer && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: customerGrid, gap: 16, marginTop: 12 }}>
                <Card
                  title="Unread Notifications"
                  value={unreadCount}
                  subtitle="Unread alerts"
                  actionLabel="Open Notifications"
                  onAction={() => nav("/notifications")}
                  highlight={true}
                />
                <Card
                  title="My Feedback"
                  value={myFeedbackCount}
                  subtitle="Total submitted"
                  actionLabel="View My Feedback"
                  onAction={() => nav("/feedback/me")}
                />
                <div style={boxStyle()}>
                  <div style={{ color: "var(--muted)", fontWeight: 700, fontSize: 18 }}>Quick Actions</div>
                  <div style={{ display: "flex", gap: 10, marginTop: 22, flexDirection: isMobile ? "column" : "row" }}>
                    <button className="btn btn-primary" onClick={() => nav("/feedback/new")}>+ Submit Feedback</button>
                    <button className="btn" onClick={() => nav("/surveys")}
                      style={{ background: "var(--card)", color: "var(--text)", border: "1px solid var(--border)" }}>
                      Take a Survey
                    </button>
                  </div>
                  <div style={{ color: "var(--muted)", marginTop: 14 }}>New updates will appear in Notifications</div>
                </div>
              </div>

              {statusData.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, marginTop: 16 }}>
                  <div style={boxStyle()}>
                    <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 12, color: "var(--text)" }}>My Feedback by Status</div>
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={statusData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="name" tick={{ fill: "var(--muted)", fontSize: 12 }} />
                        <YAxis allowDecimals={false} tick={{ fill: "var(--muted)", fontSize: 12 }} />
                        <Tooltip contentStyle={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--text)" }} />
                        <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                          {statusData.map((entry, index) => (
                            <Cell key={index} fill={STATUS_COLORS[entry.name] || "var(--primary)"} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={boxStyle()}>
                    <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 12, color: "var(--text)" }}>Status Distribution</div>
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie data={statusData} dataKey="count" nameKey="name" cx="50%" cy="52%" outerRadius={75} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                          {statusData.map((entry, index) => (
                            <Cell key={index} fill={STATUS_COLORS[entry.name] || "#94a3b8"} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--text)" }} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </>
          )}

          {isStaff && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, marginTop: 12 }}>
                <Card
                  title="Unread Notifications"
                  value={unreadCount}
                  subtitle="Unread alerts"
                  actionLabel="Open Notifications"
                  onAction={() => nav("/notifications")}
                  highlight={true}
                />
                <Card
                  title="My Assigned Feedback"
                  value={assignedCount}
                  subtitle="Assigned to you"
                  actionLabel="Open Assigned Feedback"
                  onAction={() => nav("/feedback/assigned")}
                />
              </div>

              {statusData.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, marginTop: 16 }}>
                  <div style={boxStyle()}>
                    <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 12, color: "var(--text)" }}>Assigned Feedback by Status</div>
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={statusData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="name" tick={{ fill: "var(--muted)", fontSize: 12 }} />
                        <YAxis allowDecimals={false} tick={{ fill: "var(--muted)", fontSize: 12 }} />
                        <Tooltip contentStyle={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--text)" }} />
                        <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                          {statusData.map((entry, index) => (
                            <Cell key={index} fill={STATUS_COLORS[entry.name] || "var(--primary)"} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={boxStyle()}>
                    <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 12, color: "var(--text)" }}>Status Distribution</div>
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie data={statusData} dataKey="count" nameKey="name" cx="50%" cy="52%" outerRadius={75} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                          {statusData.map((entry, index) => (
                            <Cell key={index} fill={STATUS_COLORS[entry.name] || "#94a3b8"} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--text)" }} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </>
          )}

          {managerData && (
            <>
              {!managerData.isBasic && (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: managerTopGrid, gap: 16, marginTop: 12 }}>
                    <Card
                      title="Unread Notifications"
                      value={managerData.unreadNotifications || unreadCount}
                      subtitle="Unread alerts"
                      actionLabel="Open Notifications"
                      onAction={() => nav("/notifications")}
                      highlight={true}
                    />
                    <Card
                      title="Total Feedback"
                      value={managerData.totalFeedback}
                      subtitle="All cases in system"
                      actionLabel="View All Feedback"
                      onAction={() => nav("/feedback")}
                    />
                    <Card
                      title="Urgent / Escalated"
                      value={(managerData.urgent || 0) + (managerData.escalated || 0)}
                      subtitle="Needs fast attention"
                      actionLabel="Open Reports"
                      onAction={() => nav("/reports")}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: managerMidGrid, gap: 16, marginTop: 16 }}>
                    <Card title="Open Cases" value={managerData.openCases} subtitle="NEW / ASSIGNED / IN_PROGRESS" />
                    <Card title="Resolved Cases" value={managerData.resolvedCases} subtitle="Resolved and closed cases" />
                    <Card title="Overdue Cases" value={managerData.overdueCases} subtitle="Open more than 48 hours" />
                    <Card title="Resolution Rate" value={`${managerData.resolutionRate}%`} subtitle="Overall performance" />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: chartGrid, gap: 16, marginTop: 16 }}>
                    <div style={boxStyle()}>
                      <div style={{ fontWeight: 900, fontSize: 20, marginBottom: 12, color: "var(--text)" }}>Status Distribution</div>
                      <div style={{ width: "100%", overflowX: "auto" }}>
                        <ResponsiveContainer width="100%" height={280}>
                          <BarChart data={statusData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis dataKey="name" tick={{ fill: "var(--muted)", fontSize: 12 }} />
                            <YAxis allowDecimals={false} tick={{ fill: "var(--muted)", fontSize: 12 }} />
                            <Tooltip contentStyle={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--text)" }} />
                            <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                              {statusData.map((entry, index) => (
                                <Cell key={index} fill={STATUS_COLORS[entry.name] || "var(--primary)"} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {trendData.length > 0 && (
                      <div style={boxStyle()}>
                        <div style={{ fontWeight: 900, fontSize: 20, marginBottom: 12, color: "var(--text)" }}>Recent Trend</div>
                        <div style={{ width: "100%", overflowX: "auto" }}>
                          <ResponsiveContainer width="100%" height={280}>
                            <LineChart data={trendData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                              <XAxis dataKey="date" tick={{ fill: "var(--muted)", fontSize: 12 }} />
                              <YAxis allowDecimals={false} tick={{ fill: "var(--muted)", fontSize: 12 }} />
                              <Tooltip contentStyle={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--text)" }} />
                              <Line type="monotone" dataKey="count" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4, fill: "var(--primary)" }} activeDot={{ r: 6 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ ...boxStyle(), marginTop: 16 }}>
                    <div style={{ fontWeight: 900, fontSize: 18, color: "var(--text)" }}>Average Handling Time</div>
                    <div style={{ fontSize: isMobile ? 32 : 40, fontWeight: 900, marginTop: 8, color: "var(--primary)" }}>
                      {managerData.averageHandlingHours} hrs
                    </div>
                    <div style={{ color: "var(--muted)", marginTop: 6, lineHeight: 1.6 }}>
                      Average time from feedback creation to last update on resolved cases
                    </div>
                  </div>

                  {/* Staff Workload */}
                  {staffWorkload.length > 0 && (
                    <div style={{ ...boxStyle(), marginTop: 16 }}>
                      <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 14, color: "var(--text)" }}>Staff Workload</div>
                      <table width="100%" style={{ borderCollapse: "collapse" }}>
                        <thead>
                          <tr style={{ background: "var(--card-2, #f8fafc)", borderBottom: "2px solid var(--border)" }}>
                            {["Staff Member", "Email", "Open Cases", "Status"].map(h => (
                              <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 12, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {staffWorkload.map((s, i) => (
                            <tr key={s.staffId} style={{ borderBottom: "1px solid var(--border)", background: i%2===0?"transparent":"rgba(0,0,0,0.01)" }}>
                              <td style={{ padding: "10px 14px", fontWeight: 700 }}>{s.staffName}</td>
                              <td style={{ padding: "10px 14px", color: "var(--muted)", fontSize: 13 }}>{s.staffEmail}</td>
                              <td style={{ padding: "10px 14px" }}>
                                <span style={{ fontWeight: 900, fontSize: 18, color: s.openCases > 5 ? "#dc2626" : s.openCases > 2 ? "#f59e0b" : "#16a34a" }}>
                                  {s.openCases}
                                </span>
                              </td>
                              <td style={{ padding: "10px 14px" }}>
                                <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700,
                                  background: s.openCases === 0 ? "#dcfce7" : s.openCases > 5 ? "#fee2e2" : "#fef9c3",
                                  color: s.openCases === 0 ? "#166534" : s.openCases > 5 ? "#991b1b" : "#854d0e" }}>
                                  {s.openCases === 0 ? "Free" : s.openCases > 5 ? "Overloaded" : "Active"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Overdue Cases */}
                  {overdueFeedback.length > 0 && (
                    <div style={{ ...boxStyle(), marginTop: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                        <div style={{ fontWeight: 900, fontSize: 18, color: "#dc2626" }}>
                          ⚠ Overdue Cases ({overdueFeedback.length})
                        </div>
                        <button className="btn" onClick={() => setShowOverdue(!showOverdue)}
                          style={{ background: "var(--card)", border: "1px solid var(--border)", fontSize: 13 }}>
                          {showOverdue ? "Hide" : "Show All"}
                        </button>
                      </div>
                      {showOverdue && (
                        <table width="100%" style={{ borderCollapse: "collapse" }}>
                          <thead>
                            <tr style={{ background: "#fff1f2", borderBottom: "2px solid #fecaca" }}>
                              {["Customer", "Category", "Priority", "Assigned To", "Days Open"].map(h => (
                                <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 12, fontWeight: 800, color: "#991b1b", textTransform: "uppercase" }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {overdueFeedback.map((f, i) => {
                              const daysOpen = Math.floor((Date.now() - new Date(f.createdAt).getTime()) / (1000*60*60*24));
                              return (
                                <tr key={f.id} onClick={() => nav(`/feedback/${f.id}`)}
                                  style={{ borderBottom: "1px solid #fecaca", background: i%2===0?"transparent":"rgba(220,38,38,0.02)", cursor: "pointer" }}
                                  onMouseOver={e => e.currentTarget.style.background = "rgba(220,38,38,0.06)"}
                                  onMouseOut={e => e.currentTarget.style.background = i%2===0?"transparent":"rgba(220,38,38,0.02)"}>
                                  <td style={{ padding: "10px 14px", fontWeight: 700 }}>{f.customerName || f.customerEmail || "—"}</td>
                                  <td style={{ padding: "10px 14px" }}>{f.category || "—"}</td>
                                  <td style={{ padding: "10px 14px" }}>
                                    <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: 12, fontWeight: 700,
                                      background: f.priority === "URGENT" ? "#fee2e2" : "#ffedd5",
                                      color: f.priority === "URGENT" ? "#991b1b" : "#9a3412" }}>
                                      {f.priority}
                                    </span>
                                  </td>
                                  <td style={{ padding: "10px 14px", color: "var(--muted)", fontSize: 13 }}>
                                    {f.assignedStaffName || f.assignedStaffEmail || "Unassigned"}
                                  </td>
                                  <td style={{ padding: "10px 14px", fontWeight: 900, color: "#dc2626" }}>{daysOpen}d</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
