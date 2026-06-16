import React, { useEffect, useRef, useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import { Filter, Download, RefreshCw, FileText, FileSpreadsheet, Calendar, BarChart2 } from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";

const STATUS_COLORS = { NEW:"#2563eb", ASSIGNED:"#06b6d4", IN_PROGRESS:"#f59e0b", RESOLVED:"#16a34a", CLOSED:"#64748b", REJECTED:"#dc2626" };
const TYPE_COLORS   = { COMPLAINT:"#2563eb", COMPLIMENT:"#16a34a", SUGGESTION:"#f59e0b", SURVEY:"#7c3aed" };
const PRIORITY_COLORS = { LOW:"#16a34a", MEDIUM:"#06b6d4", HIGH:"#f59e0b", URGENT:"#dc2626" };
const SENTIMENT_COLORS = { POSITIVE:"#16a34a", NEUTRAL:"#64748b", NEGATIVE:"#dc2626", UNKNOWN:"#94a3b8" };
const DEPT_COLORS = ["#2563a8","#06b6d4","#16a34a","#f59e0b","#7c3aed","#dc2626","#14b8a6","#64748b"];

const REPORT_TYPES = [
  { key: "all",        label: "All Reports" },
  { key: "byStatus",   label: "By Status" },
  { key: "byType",     label: "By Type" },
  { key: "byPriority", label: "By Priority" },
  { key: "bySentiment",label: "By Sentiment" },
  { key: "byDepartment",label:"By Department" },
  { key: "topCategories",label:"Top Categories" },
];

const card = (extra = {}) => ({
  background: "var(--card)", border: "1px solid var(--border)",
  borderRadius: 16, boxShadow: "0 2px 10px rgba(15,23,42,0.06)", padding: 20, ...extra,
});

const mapToChartData = (obj) => Object.entries(obj || {}).map(([name, count]) => ({ name, count }));

function StatCard({ title, value, sub, color }) {
  return (
    <div style={card()}>
      <div style={{ color:"#64748b", fontWeight:700, fontSize:13, textTransform:"uppercase", letterSpacing:0.5 }}>{title}</div>
      <div style={{ fontSize:36, fontWeight:900, marginTop:8, color: color || "#0f172a" }}>{value}</div>
      {sub && <div style={{ color:"#94a3b8", fontSize:13, marginTop:4 }}>{sub}</div>}
    </div>
  );
}

function NumberedTable({ title, data, colorMap }) {
  const entries = Object.entries(data || {}).filter(([,v]) => v > 0);
  const total = entries.reduce((s,[,v]) => s + v, 0);
  return (
    <div style={card()}>
      <div style={{ fontWeight:900, fontSize:17, marginBottom:14, color:"#0f172a" }}>{title}</div>
      <div style={{ overflowX:"auto" }}>
        <table width="100%" style={{ borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ background:"#f8fafc", borderBottom:"2px solid #e2e8f0" }}>
              {["#","Name","Count","%"].map(h => (
                <th key={h} style={{ padding:"10px 12px", textAlign:"left", fontSize:11, fontWeight:800, color:"#64748b", textTransform:"uppercase", letterSpacing:0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries.map(([k, v], i) => (
              <tr key={k} style={{ borderBottom:"1px solid #f1f5f9", background: i%2===0?"transparent":"rgba(0,0,0,0.01)" }}>
                <td style={{ padding:"10px 12px", color:"#94a3b8", fontSize:13, fontWeight:700 }}>{i+1}</td>
                <td style={{ padding:"10px 12px" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    {colorMap && <span style={{ width:10, height:10, borderRadius:"50%", background: colorMap[k] || "#94a3b8", flexShrink:0 }} />}
                    <span style={{ fontWeight:600, color:"#0f172a" }}>{k}</span>
                  </div>
                </td>
                <td style={{ padding:"10px 12px", fontWeight:900, color:"#0f172a" }}>{v}</td>
                <td style={{ padding:"10px 12px", color:"#64748b", fontSize:13 }}>
                  {total > 0 ? ((v/total)*100).toFixed(1)+"%" : "—"}
                </td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr><td colSpan={4} style={{ padding:16, color:"#94a3b8", textAlign:"center" }}>No data</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div style={card()}>
      <div style={{ fontWeight:900, fontSize:17, marginBottom:14, color:"#0f172a" }}>{title}</div>
      {children}
    </div>
  );
}

export default function Reports() {
  const [analytics, setAnalytics] = useState(null);
  const [trend, setTrend] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [dateErr, setDateErr] = useState("");

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reportType, setReportType] = useState("all");
  const [filterRole, setFilterRole] = useState("");
  const [filterUserId, setFilterUserId] = useState("");
  const [userOptions, setUserOptions] = useState([]);
  const [filterType, setFilterType] = useState("");
  const [filterSentiment, setFilterSentiment] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [filterCategory, setFilterCategory] = useState(""); // "type" | "sentiment" | "department" | "customer"
  const [filterValue, setFilterValue] = useState("");

  const nav = useNavigate();
  const fetchedOnce = useRef(false);
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);

  useEffect(() => {
    const onResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const isMobile = screenWidth <= 768;
  const twoGrid = isMobile ? "1fr" : "1fr 1fr";
  const threeGrid = isMobile ? "1fr" : screenWidth <= 1100 ? "1fr 1fr" : "repeat(3,1fr)";

  // Load users when role filter changes
  useEffect(() => {
    if (!filterRole) { setUserOptions([]); setFilterUserId(""); return; }
    api.get(`/api/reports/users-by-role?role=${filterRole}`)
      .then(res => { setUserOptions(res.data || []); setFilterUserId(""); })
      .catch(() => setUserOptions([]));
  }, [filterRole]);

  // Sync filterCategory/filterValue to specific filter states
  useEffect(() => {
    setFilterType(""); setFilterSentiment(""); setFilterDepartment(""); setFilterValue("");
  }, [filterCategory]);

  const validateDates = () => {
    if (!fromDate && !toDate) return true;
    if (fromDate && !toDate) { setDateErr("Please select an end date"); return false; }
    if (!fromDate && toDate) { setDateErr("Please select a start date"); return false; }
    if (new Date(fromDate) > new Date(toDate)) { setDateErr("Start date must be before end date"); return false; }
    if (new Date(toDate) > new Date()) { setDateErr("End date cannot be in the future"); return false; }
    setDateErr(""); return true;
  };

  const load = async () => {
    if (!validateDates()) return;
    setErr(""); setLoading(true);
    try {
      const params = new URLSearchParams();
      if (fromDate) params.set("from", fromDate);
      if (toDate) params.set("to", toDate);
      if (filterUserId) params.set("userId", filterUserId);
      const query = params.toString() ? "?" + params.toString() : "";

      const [aRes, tRes] = await Promise.all([
        api.get("/api/reports/analytics" + query),
        api.get("/api/reports/trend?days=30"),
      ]);
      setAnalytics(aRes.data);
      setTrend((tRes.data || []).map(x => ({ date: x.date, count: x.count })));
    } catch (e) {
      const code = e?.response?.status;
      if (code === 401) return nav("/login", { replace: true });
      if (code === 403) return nav("/unauthorized", { replace: true });
      setErr(e?.response?.data?.message || "Failed to load reports");
    } finally { setLoading(false); }
  };

  const clearFilters = () => {
    setFromDate(""); setToDate(""); setDateErr(""); setReportType("all");
    setFilterRole(""); setFilterUserId(""); setUserOptions([]);
    setFilterType(""); setFilterSentiment(""); setFilterDepartment("");
    setFilterCategory(""); setFilterValue("");
    setTimeout(load, 0);
  };

  const downloadPdf = async () => {
    try {
      const params = new URLSearchParams();
      if (fromDate) params.set("from", fromDate);
      if (toDate) params.set("to", toDate);
      if (filterUserId) params.set("userId", filterUserId);
      // Map filterCategory to analytics reportType
      const analyticsType = filterCategory === "type" ? "byType"
        : filterCategory === "sentiment" ? "bySentiment"
        : filterCategory === "department" ? "byDepartment"
        : filterCategory === "status" ? "byStatus"
        : filterCategory === "priority" ? "byPriority"
        : (reportType !== "all" ? reportType : null);
      if (analyticsType) params.set("reportType", analyticsType);
      const query = params.toString() ? "?" + params.toString() : "";
      const res = await api.get("/api/reports/export/pdf" + query, { responseType:"blob" });
      const url = window.URL.createObjectURL(new Blob([res.data], { type:"application/pdf" }));
      const a = document.createElement("a"); a.href=url; a.download="smartvoice-report.pdf";
      document.body.appendChild(a); a.click(); a.remove(); window.URL.revokeObjectURL(url);
    } catch (e) { alert("Failed to download PDF"); }
  };

  const downloadDetailedPdf = async () => {
    try {
      const params = new URLSearchParams();
      if (fromDate) params.set("from", fromDate);
      if (toDate) params.set("to", toDate);
      if (filterUserId) params.set("userId", filterUserId);
      if (filterType) params.set("filterType", filterType);
      if (filterSentiment) params.set("filterSentiment", filterSentiment);
      if (filterDepartment) params.set("filterDepartment", filterDepartment);
      const query = params.toString() ? "?" + params.toString() : "";
      const res = await api.get("/api/reports/export/pdf/detailed" + query, { responseType:"blob" });
      const url = window.URL.createObjectURL(new Blob([res.data], { type:"application/pdf" }));
      const a = document.createElement("a"); a.href=url; a.download="smartvoice-feedback-report.pdf";
      document.body.appendChild(a); a.click(); a.remove(); window.URL.revokeObjectURL(url);
    } catch (e) { alert("Failed to download detailed PDF"); }
  };

  const downloadExcel = async () => {
    try {
      const res = await api.get("/api/reports/export/excel", { responseType:"blob" });
      const url = window.URL.createObjectURL(new Blob([res.data], { type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
      const a = document.createElement("a"); a.href=url; a.download="smartvoice-report.xlsx";
      document.body.appendChild(a); a.click(); a.remove(); window.URL.revokeObjectURL(url);
    } catch (e) { alert("Failed to download Excel"); }
  };

  useEffect(() => {
    if (fetchedOnce.current) return;
    fetchedOnce.current = true;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusData    = mapToChartData(analytics?.byStatus);
  const typeData      = mapToChartData(analytics?.byType);
  const priorityData  = mapToChartData(analytics?.byPriority);
  const sentimentData = mapToChartData(analytics?.bySentiment);
  const deptData      = mapToChartData(analytics?.byDepartment);
  const catData       = mapToChartData(analytics?.topCategories);

  const showSection = (key) => reportType === "all" || reportType === key;

  const isFiltered = fromDate || toDate || filterUserId || filterType || filterSentiment || filterDepartment;

  return (
    <div className="container" style={{ padding:"24px 0" }}>

      {/* ── Header ── */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12, marginBottom:20 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <BarChart2 size={22} color="#2563a8" />
          <h2 style={{ margin:0, color:"#0f172a" }}>Reports & Analytics</h2>
          {isFiltered && (
            <span style={{ background:"#eff6ff", color:"#2563a8", border:"1px solid #bfdbfe", borderRadius:999, padding:"2px 10px", fontSize:12, fontWeight:700 }}>
              Filtered
            </span>
          )}
        </div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          <button className="btn" onClick={load} style={{ display:"flex", alignItems:"center", gap:6, background:"var(--card)", border:"1px solid var(--border)" }}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={downloadPdf} style={{ display:"flex", alignItems:"center", gap:6 }}>
            <FileText size={14} /> Summary Report (PDF)
          </button>
          <button className="btn" onClick={downloadDetailedPdf} style={{ display:"flex", alignItems:"center", gap:6, background:"#f0fdf4", border:"1px solid #bbf7d0", color:"#16a34a" }}>
            <FileText size={14} /> Feedback List (PDF)
          </button>
          <button className="btn" onClick={downloadExcel} style={{ display:"flex", alignItems:"center", gap:6, background:"var(--card)", border:"1px solid var(--border)" }}>
            <FileSpreadsheet size={14} /> Excel
          </button>
        </div>
      </div>

      {/* ── Filter Panel ── */}
      <div style={{ ...card(), marginBottom:20, background:"#f8fafc" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14, fontWeight:800, fontSize:15, color:"#0f172a" }}>
          <Filter size={16} color="#2563a8" /> Filters
        </div>

        {/* Row 1: From Date | To Date | Apply */}
        <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr auto", gap:12, alignItems:"end" }}>
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:"#64748b", marginBottom:6, textTransform:"uppercase", letterSpacing:0.5 }}>
              <Calendar size={12} style={{ marginRight:4 }} />From Date
            </div>
            <input type="date" className="input" value={fromDate}
              onChange={e => { setFromDate(e.target.value); setDateErr(""); }}
              max={toDate || new Date().toISOString().split("T")[0]}
              style={{ width:"100%" }} />
          </div>
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:"#64748b", marginBottom:6, textTransform:"uppercase", letterSpacing:0.5 }}>
              <Calendar size={12} style={{ marginRight:4 }} />To Date
            </div>
            <input type="date" className="input" value={toDate}
              onChange={e => { setToDate(e.target.value); setDateErr(""); }}
              min={fromDate} max={new Date().toISOString().split("T")[0]}
              style={{ width:"100%" }} />
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button className="btn btn-primary" onClick={load} style={{ whiteSpace:"nowrap" }}>Apply</button>
            {isFiltered && (
              <button className="btn" onClick={clearFilters} style={{ background:"var(--card)", border:"1px solid var(--border)", whiteSpace:"nowrap" }}>Clear</button>
            )}
          </div>
        </div>

        {/* Row 2: Report Type | Select Value */}
        <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap:12, marginTop:12 }}>
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:"#64748b", marginBottom:6, textTransform:"uppercase", letterSpacing:0.5 }}>Report Type</div>
            <select className="input" value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={{ width:"100%" }}>
              <option value="">— All Reports —</option>
              <option value="type">Feedback Type</option>
              <option value="sentiment">Sentiment</option>
              <option value="department">Department</option>
              <option value="status">Status</option>
              <option value="priority">Priority</option>
            </select>
          </div>
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:"#64748b", marginBottom:6, textTransform:"uppercase", letterSpacing:0.5 }}>Select Value</div>
            {filterCategory === "type" && (
              <select className="input" value={filterType} onChange={e => setFilterType(e.target.value)} style={{ width:"100%" }}>
                <option value="">— All Types —</option>
                <option value="COMPLAINT">Complaint</option>
                <option value="COMPLIMENT">Compliment</option>
                <option value="SUGGESTION">Suggestion</option>
                <option value="SURVEY">Survey</option>
              </select>
            )}
            {filterCategory === "sentiment" && (
              <select className="input" value={filterSentiment} onChange={e => setFilterSentiment(e.target.value)} style={{ width:"100%" }}>
                <option value="">— All Sentiments —</option>
                <option value="POSITIVE">Positive</option>
                <option value="NEGATIVE">Negative</option>
                <option value="NEUTRAL">Neutral</option>
                <option value="UNKNOWN">Unknown</option>
              </select>
            )}
            {filterCategory === "department" && (
              <input className="input" value={filterDepartment} onChange={e => setFilterDepartment(e.target.value)}
                placeholder="e.g. Loans, IT, Accounts..." style={{ width:"100%" }} />
            )}
            {filterCategory === "status" && (
              <select className="input" value={filterType} onChange={e => setFilterType(e.target.value)} style={{ width:"100%" }}>
                <option value="">— All Statuses —</option>
                <option value="NEW">New</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
                <option value="REJECTED">Rejected</option>
              </select>
            )}
            {filterCategory === "priority" && (
              <select className="input" value={filterType} onChange={e => setFilterType(e.target.value)} style={{ width:"100%" }}>
                <option value="">— All Priorities —</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            )}
            {!filterCategory && (
              <select className="input" disabled style={{ width:"100%" }}>
                <option>— Select Report Type first —</option>
              </select>
            )}
          </div>
        </div>

        {/* Row 3: Filter by Customer | Select Customer */}
        <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap:12, marginTop:12 }}>
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:"#64748b", marginBottom:6, textTransform:"uppercase", letterSpacing:0.5 }}>Filter by Customer</div>
            <select className="input" value={filterRole} onChange={e => setFilterRole(e.target.value)} style={{ width:"100%" }}>
              <option value="">— All Customers —</option>
              <option value="CUSTOMER">Customer</option>
            </select>
          </div>
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:"#64748b", marginBottom:6, textTransform:"uppercase", letterSpacing:0.5 }}>Select Customer</div>
            <select className="input" value={filterUserId} onChange={e => setFilterUserId(e.target.value)} style={{ width:"100%" }} disabled={!filterRole}>
              <option value="">— {filterRole ? "Select customer" : "Select filter first"} —</option>
              {userOptions.map(u => (
                <option key={u.id} value={u.id}>{u.fullName} ({u.email})</option>
              ))}
            </select>
          </div>
        </div>
        {dateErr && <div style={{ color:"#dc2626", fontSize:13, marginTop:10, fontWeight:600 }}>⚠ {dateErr}</div>}
        {isFiltered && !dateErr && (
          <div style={{ color:"#2563a8", fontSize:13, marginTop:10, fontWeight:600, display:"flex", flexWrap:"wrap", gap:8 }}>
            {fromDate && toDate && <span style={{ background:"#eff6ff", padding:"2px 8px", borderRadius:6 }}>📅 {fromDate} → {toDate}</span>}
            {filterUserId && userOptions.length > 0 && <span style={{ background:"#eff6ff", padding:"2px 8px", borderRadius:6 }}>👤 {userOptions.find(u=>u.id===filterUserId)?.fullName}</span>}
            {filterType && <span style={{ background:"#eff6ff", padding:"2px 8px", borderRadius:6 }}>Type: {filterType}</span>}
            {filterSentiment && <span style={{ background:"#eff6ff", padding:"2px 8px", borderRadius:6 }}>Sentiment: {filterSentiment}</span>}
            {filterDepartment && <span style={{ background:"#eff6ff", padding:"2px 8px", borderRadius:6 }}>Dept: {filterDepartment}</span>}
          </div>
        )}
      </div>

      {err && <div style={{ ...card(), borderColor:"#fecaca", background:"#fff5f5", color:"#991b1b", marginBottom:16 }}>{err}</div>}

      {loading ? (
        <div style={card()}>Loading reports...</div>
      ) : analytics ? (
        <>
          {/* ── Summary KPIs ── */}
          <div style={{ display:"grid", gridTemplateColumns:threeGrid, gap:16, marginBottom:20 }}>
            <StatCard title="Total Feedback" value={analytics.total} sub="All submitted cases" color="#2563a8" />
            <StatCard title="Resolved" value={analytics.resolvedCases} sub={`${analytics.resolutionRate}% resolution rate`} color="#16a34a" />
            <StatCard title="Escalated / Urgent" value={analytics.escalated} sub="Needs attention" color="#dc2626" />
          </div>

          {/* ── Report Tables ── */}
          {showSection("byStatus") && (
            <div style={{ marginBottom:16 }}>
              <NumberedTable title="Feedback by Status" data={analytics.byStatus} colorMap={STATUS_COLORS} />
            </div>
          )}

          {showSection("byType") && (
            <div style={{ marginBottom:16 }}>
              <NumberedTable title="Feedback by Type" data={analytics.byType} colorMap={TYPE_COLORS} />
            </div>
          )}

          {(showSection("byStatus") || showSection("byType")) && reportType === "all" && (
            <div style={{ display:"grid", gridTemplateColumns:twoGrid, gap:16, marginBottom:16 }}>
              {showSection("byPriority") && <NumberedTable title="By Priority" data={analytics.byPriority} colorMap={PRIORITY_COLORS} />}
              {showSection("bySentiment") && <NumberedTable title="By Sentiment" data={analytics.bySentiment} colorMap={SENTIMENT_COLORS} />}
            </div>
          )}

          {reportType !== "all" && showSection("byPriority") && (
            <div style={{ marginBottom:16 }}><NumberedTable title="By Priority" data={analytics.byPriority} colorMap={PRIORITY_COLORS} /></div>
          )}
          {reportType !== "all" && showSection("bySentiment") && (
            <div style={{ marginBottom:16 }}><NumberedTable title="By Sentiment" data={analytics.bySentiment} colorMap={SENTIMENT_COLORS} /></div>
          )}

          {showSection("byDepartment") && (
            <div style={{ marginBottom:16 }}>
              <NumberedTable title="By Department" data={analytics.byDepartment} colorMap={Object.fromEntries(Object.keys(analytics.byDepartment||{}).map((k,i)=>[k,DEPT_COLORS[i%DEPT_COLORS.length]]))} />
            </div>
          )}

          {showSection("topCategories") && (
            <div style={{ marginBottom:16 }}>
              <NumberedTable title="Top Categories" data={analytics.topCategories} />
            </div>
          )}

          {/* ── Charts ── */}
          {reportType === "all" && (
            <>
              <div style={{ display:"grid", gridTemplateColumns:twoGrid, gap:16, marginBottom:16 }}>
                <ChartCard title="Status Distribution">
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={statusData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fill:"#475569", fontSize:11 }} />
                      <YAxis allowDecimals={false} tick={{ fill:"#475569", fontSize:11 }} />
                      <Tooltip />
                      <Bar dataKey="count" radius={[6,6,0,0]}>
                        {statusData.map((e,i) => <Cell key={i} fill={STATUS_COLORS[e.name]||"#2563a8"} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Type Distribution">
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={typeData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`}>
                        {typeData.map((e,i) => <Cell key={i} fill={TYPE_COLORS[e.name]||"#2563a8"} />)}
                      </Pie>
                      <Tooltip /><Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:twoGrid, gap:16, marginBottom:16 }}>
                <ChartCard title="Priority Breakdown">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={priorityData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fill:"#475569", fontSize:11 }} />
                      <YAxis allowDecimals={false} tick={{ fill:"#475569", fontSize:11 }} />
                      <Tooltip />
                      <Bar dataKey="count" radius={[6,6,0,0]}>
                        {priorityData.map((e,i) => <Cell key={i} fill={PRIORITY_COLORS[e.name]||"#2563a8"} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Sentiment Analysis">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={sentimentData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fill:"#475569", fontSize:11 }} />
                      <YAxis allowDecimals={false} tick={{ fill:"#475569", fontSize:11 }} />
                      <Tooltip />
                      <Bar dataKey="count" radius={[6,6,0,0]}>
                        {sentimentData.map((e,i) => <Cell key={i} fill={SENTIMENT_COLORS[e.name]||"#64748b"} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:twoGrid, gap:16, marginBottom:16 }}>
                <ChartCard title="By Department">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={deptData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fill:"#475569", fontSize:11 }} />
                      <YAxis allowDecimals={false} tick={{ fill:"#475569", fontSize:11 }} />
                      <Tooltip />
                      <Bar dataKey="count" radius={[6,6,0,0]}>
                        {deptData.map((e,i) => <Cell key={i} fill={DEPT_COLORS[i%DEPT_COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Top Categories">
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={catData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`}>
                        {catData.map((e,i) => <Cell key={i} fill={DEPT_COLORS[i%DEPT_COLORS.length]} />)}
                      </Pie>
                      <Tooltip /><Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>

              <ChartCard title="Feedback Trend (Last 30 days)">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fill:"#475569", fontSize:11 }} />
                    <YAxis allowDecimals={false} tick={{ fill:"#475569", fontSize:11 }} />
                    <Tooltip /><Legend />
                    <Line type="monotone" dataKey="count" stroke="#2563a8" strokeWidth={3} dot={{ r:4 }} activeDot={{ r:6 }} name="Feedback Count" />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            </>
          )}
        </>
      ) : null}
    </div>
  );
}
