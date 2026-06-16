import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import PaginationBar from "../components/PaginationBar";

function Badge({ text }) {
  const bg =
    text === "URGENT" ? "#fee2e2" :
    text === "HIGH" ? "#ffedd5" :
    text === "MEDIUM" ? "#e0f2fe" :
    text === "LOW" ? "#dcfce7" :
    text === "NEW" ? "#e0f2fe" :
    text === "ASSIGNED" ? "#fef9c3" :
    text === "IN_PROGRESS" ? "#ffedd5" :
    text === "RESOLVED" ? "#dcfce7" :
    text === "REJECTED" ? "#f3f4f6" :
    text === "CLOSED" ? "#dcfce7" :
    "#f3f4f6";

  const color =
    text === "URGENT" ? "#991b1b" :
    text === "HIGH" ? "#9a3412" :
    text === "MEDIUM" ? "#075985" :
    text === "LOW" ? "#166534" :
    text === "NEW" ? "#075985" :
    text === "ASSIGNED" ? "#854d0e" :
    text === "IN_PROGRESS" ? "#9a3412" :
    text === "RESOLVED" ? "#166534" :
    text === "REJECTED" ? "#111827" :
    text === "CLOSED" ? "#166534" :
    "#111827";

  return (
    <span
      style={{
        padding: "4px 10px",
        borderRadius: 999,
        background: bg,
        color,
        fontWeight: 900,
        fontSize: 12,
      }}
    >
      {text}
    </span>
  );
}

export default function AssignedFeedback() {
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const [statusMap, setStatusMap] = useState({});
  const [noteMap, setNoteMap] = useState({});

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const nav = useNavigate();
  const fetchedOnce = useRef(false);
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);

  useEffect(() => {
    const onResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const isMobile = screenWidth <= 768;

  const fetchAssigned = async () => {
    setErr("");
    setLoading(true);
    try {
      const res = await api.get("/api/feedback/assigned/me");
      const data = res.data || [];
      setItems(data);

      const nextStatusMap = {};
      const nextNoteMap = {};

      data.forEach((f) => {
        nextStatusMap[f.id] = f.status || "ASSIGNED";
        nextNoteMap[f.id] = "";
      });

      setStatusMap(nextStatusMap);
      setNoteMap(nextNoteMap);
    } catch (e) {
      const code = e?.response?.status;
      if (code === 401) return nav("/login", { replace: true });
      if (code === 403) return setErr("Forbidden: only staff/manager can view assigned feedback.");
      setErr(e?.response?.data?.message || "Failed to load assigned feedback");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (fetchedOnce.current) return;
    fetchedOnce.current = true;
    fetchAssigned();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, priorityFilter]);

  const updateStatus = async (feedbackId) => {
    try {
      await api.patch(`/api/feedback/${feedbackId}/status`, {
        status: statusMap[feedbackId],
        note: noteMap[feedbackId] || "",
      });

      alert("Status updated successfully");
      await fetchAssigned();
      window.dispatchEvent(new Event("notifications-updated"));
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to update status");
    }
  };

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();

    return items.filter((f) => {
      const matchesSearch =
        !q ||
        String(f.customerName || "").toLowerCase().includes(q) ||
        String(f.customerEmail || "").toLowerCase().includes(q) ||
        String(f.category || "").toLowerCase().includes(q) ||
        String(f.departmentName || "").toLowerCase().includes(q) ||
        String(f.status || "").toLowerCase().includes(q) ||
        String(f.priority || "").toLowerCase().includes(q);

      const matchesStatus = !statusFilter || f.status === statusFilter;
      const matchesPriority = !priorityFilter || f.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [items, search, statusFilter, priorityFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const paginatedItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, safePage, pageSize]);

  return (
    <div className="container" style={{ padding: "24px 0" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: isMobile ? "stretch" : "center",
          flexDirection: isMobile ? "column" : "row",
          gap: 12,
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: 0 }}>My Assigned Feedback</h2>

        <button
          className="btn"
          onClick={fetchAssigned}
          disabled={loading}
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {err && (
        <div
          className="card"
          style={{
            padding: 12,
            borderColor: "#fecaca",
            background: "#fff5f5",
            color: "#991b1b",
            marginTop: 10,
          }}
        >
          {err}
        </div>
      )}

      <div className="card" style={{ padding: 16, marginTop: 12 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr 1fr",
            gap: 10,
            marginBottom: 14,
          }}
        >
          <input
            className="input"
            placeholder="Search customer, category, department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="ASSIGNED">ASSIGNED</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="RESOLVED">RESOLVED</option>
            <option value="CLOSED">CLOSED</option>
          </select>

          <select className="input" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
            <option value="">All Priority</option>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="URGENT">URGENT</option>
          </select>
        </div>

        {loading ? (
          <div style={{ color: "var(--muted)" }}>Loading assigned feedback…</div>
        ) : (
          <>
            <div style={{ overflowX: "auto" }}>
              <table width="100%" cellPadding="10" style={{ borderCollapse: "collapse", minWidth: 980 }}>
                <thead>
                  <tr style={{ background: "var(--card-2, #f8fafc)", borderBottom: "2px solid var(--border)" }}>
                    {["#", "Customer", "Category", "Priority", "Status", "Department", "Change Status", "Note", "Actions"].map(h => (
                      <th key={h} style={{ padding: "12px 10px", textAlign: "left", fontSize: 12, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.map((f, idx) => (
                    <tr key={f.id} style={{ borderBottom: "1px solid var(--border)", background: idx % 2 === 0 ? "transparent" : "rgba(0,0,0,0.01)" }}>
                      <td style={{ padding: "12px 10px", fontFamily: "monospace", fontSize: 13, color: "var(--muted)" }}>
                        {(safePage - 1) * pageSize + idx + 1}
                      </td>
                      <td style={{ padding: "12px 10px", fontWeight: 700 }}>{f.customerName || f.customerEmail || "—"}</td>
                      <td style={{ padding: "12px 10px" }}>{f.category || "—"}</td>
                      <td style={{ padding: "12px 10px" }}><Badge text={String(f.priority)} /></td>
                      <td style={{ padding: "12px 10px" }}><Badge text={String(f.status)} /></td>
                      <td style={{ padding: "12px 10px", color: "var(--muted)", fontSize: 13 }}>{f.departmentName || "—"}</td>

                      <td style={{ padding: "12px 10px" }}>
                        <select
                          className="input"
                          value={statusMap[f.id] || "ASSIGNED"}
                          onChange={(e) =>
                            setStatusMap((prev) => ({ ...prev, [f.id]: e.target.value }))
                          }
                        >
                          <option value="IN_PROGRESS">IN_PROGRESS</option>
                          <option value="RESOLVED">RESOLVED</option>
                        </select>
                      </td>

                      <td style={{ padding: "12px 10px" }}>
                        <input
                          className="input"
                          value={noteMap[f.id] || ""}
                          onChange={(e) =>
                            setNoteMap((prev) => ({ ...prev, [f.id]: e.target.value }))
                          }
                          placeholder="Optional note"
                        />
                      </td>

                      <td style={{ padding: "12px 10px" }}>
                        <div style={{ display: "flex", gap: 8, flexDirection: isMobile ? "column" : "row" }}>
                          <button className="btn btn-primary" onClick={() => updateStatus(f.id)}>
                            Save
                          </button>

                          <button
                            className="btn"
                            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                            onClick={() => nav(`/feedback/${f.id}`)}
                          >
                            Open
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredItems.length === 0 && (
                    <tr>
                      <td colSpan={9} style={{ color: "var(--muted)", padding: 14 }}>
                        No matching assigned feedback found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <PaginationBar
              totalItems={filteredItems.length}
              page={safePage}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}
