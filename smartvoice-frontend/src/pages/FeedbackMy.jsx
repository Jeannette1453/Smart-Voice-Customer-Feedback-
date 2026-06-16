import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import AttachmentBox from "../components/AttachmentBox";
import RatingBox from "../components/RatingBox";
import MessageThread from "../components/MessageThread";
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
        display: "inline-block",
      }}
    >
      {text}
    </span>
  );
}

function Modal({ open, onClose, children }) {
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);

  useEffect(() => {
    const onResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  if (!open) return null;

  const isMobile = screenWidth <= 768;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.35)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: isMobile ? 8 : 14,
        zIndex: 50,
      }}
      onMouseDown={onClose}
    >
      <div
        className="card"
        style={{
          width: "min(1000px, 100%)",
          maxHeight: "90vh",
          overflow: "auto",
          padding: isMobile ? 12 : 16,
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export default function FeedbackMy() {
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const nav = useNavigate();
  const fetchedOnce = useRef(false);

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(null);
  const [activeIndex, setActiveIndex] = useState(null);

  const [history, setHistory] = useState([]);
  const [historyErr, setHistoryErr] = useState("");

  const [screenWidth, setScreenWidth] = useState(window.innerWidth);

  useEffect(() => {
    const onResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const isMobile = screenWidth <= 768;

  const load = async () => {
    setErr("");
    setLoading(true);
    try {
      const res = await api.get("/api/feedback/me");
      setItems(res.data || []);
    } catch (e) {
      const status = e?.response?.status;
      if (status === 401) return nav("/login", { replace: true });
      if (status === 403) return nav("/unauthorized", { replace: true });
      setErr(e?.response?.data?.message || "Failed to load my feedback");
    } finally {
      setLoading(false);
    }
  };

  const openDetails = async (f, index) => {
    setActive(f);
    setActiveIndex(index);
    setHistory([]);
    setHistoryErr("");
    setOpen(true);

    try {
      const res = await api.get(`/api/feedback/${f.id}/history`);
      setHistory(res.data || []);
    } catch (e) {
      const status = e?.response?.status;
      if (status === 401) return nav("/login", { replace: true });
      if (status === 403) return nav("/unauthorized", { replace: true });
      setHistoryErr(e?.response?.data?.message || "Failed to load history");
    }
  };

  useEffect(() => {
    if (fetchedOnce.current) return;
    fetchedOnce.current = true;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, priorityFilter, typeFilter]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();

    return items.filter((f) => {
      const matchesSearch =
        !q ||
        String(f.category || "").toLowerCase().includes(q) ||
        String(f.subCategory || "").toLowerCase().includes(q) ||
        String(f.message || "").toLowerCase().includes(q) ||
        String(f.type || "").toLowerCase().includes(q) ||
        String(f.status || "").toLowerCase().includes(q) ||
        String(f.priority || "").toLowerCase().includes(q) ||
        String(f.departmentName || "").toLowerCase().includes(q);

      const matchesStatus = !statusFilter || f.status === statusFilter;
      const matchesPriority = !priorityFilter || f.priority === priorityFilter;
      const matchesType = !typeFilter || f.type === typeFilter;

      return matchesSearch && matchesStatus && matchesPriority && matchesType;
    });
  }, [items, search, statusFilter, priorityFilter, typeFilter]);

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
          alignItems: isMobile ? "stretch" : "center",
          justifyContent: "space-between",
          flexDirection: isMobile ? "column" : "row",
          gap: 12,
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: 0 }}>My Feedback</h2>

        <div style={{ display: "flex", gap: 10, flexDirection: isMobile ? "column" : "row" }}>
          <button
            className="btn"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            onClick={load}
            disabled={loading}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>

          <button className="btn btn-primary" onClick={() => nav("/feedback/new")}>
            + Submit Feedback
          </button>
        </div>
      </div>

      {err && (
        <div
          className="card"
          style={{
            padding: 12,
            borderColor: "#fecaca",
            background: "#fff5f5",
            color: "#991b1b",
            marginBottom: 12,
            marginTop: 12,
          }}
        >
          {err}
        </div>
      )}

      <div className="card" style={{ padding: 16, marginTop: 12 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr 1fr 1fr",
            gap: 10,
            marginBottom: 14,
          }}
        >
          <input
            className="input"
            placeholder="Search category, message, status..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="NEW">NEW</option>
            <option value="ASSIGNED">ASSIGNED</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="RESOLVED">RESOLVED</option>
            <option value="CLOSED">CLOSED</option>
            <option value="REJECTED">REJECTED</option>
          </select>

          <select className="input" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
            <option value="">All Priority</option>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="URGENT">URGENT</option>
          </select>

          <select className="input" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">All Type</option>
            <option value="COMPLAINT">COMPLAINT</option>
            <option value="COMPLIMENT">COMPLIMENT</option>
            <option value="SUGGESTION">SUGGESTION</option>
            <option value="SURVEY">SURVEY</option>
          </select>
        </div>

        {loading ? (
          <div style={{ color: "var(--muted)" }}>Loading your feedback…</div>
        ) : (
          <>
            <div style={{ overflowX: "auto" }}>
              <table
                className="table-hover"
                width="100%"
                cellPadding="10"
                style={{ borderCollapse: "collapse", minWidth: 720 }}
              >
                <thead>
                  <tr style={{ textAlign: "left", color: "var(--muted)" }}>
                    <th>Select</th>
                    <th>No.</th>
                    <th>Type</th>
                    <th>Category</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Escalated</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.map((f, index) => (
                    <tr
                      key={f.id}
                      style={{ borderTop: "1px solid var(--border)", cursor: "pointer" }}
                      onClick={() => openDetails(f, (safePage - 1) * pageSize + index + 1)}
                      title="Click to open details"
                    >
                      <td onClick={(e) => e.stopPropagation()}>
                        <input type="radio" name="myFeedbackSelected" readOnly checked={active?.id === f.id} onChange={() => openDetails(f, (safePage - 1) * pageSize + index + 1)} />
                      </td>
                      <td style={{ color: "#0f172a", fontWeight: 800 }}>
                        {(safePage - 1) * pageSize + index + 1}
                      </td>
                      <td style={{ fontWeight: 900 }}>{f.type}</td>

                      <td>
                        {f.category}
                        {f.subCategory ? (
                          <div style={{ color: "var(--muted)", fontSize: 12 }}>
                            {f.subCategory}
                          </div>
                        ) : null}
                      </td>

                      <td><Badge text={f.priority} /></td>
                      <td><Badge text={f.status} /></td>

                      <td style={{ fontWeight: 900 }}>
                        {f.escalated ? (
                          <span style={{ color: "#b91c1c" }}>⚠ ESCALATED</span>
                        ) : (
                          <span style={{ color: "var(--muted)" }}>NO</span>
                        )}
                      </td>
                    </tr>
                  ))}

                  {filteredItems.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ color: "var(--muted)", padding: 14 }}>
                        No matching feedback found.
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

      <Modal open={open} onClose={() => setOpen(false)}>
        {!active ? null : (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: isMobile ? "flex-start" : "center",
                flexDirection: isMobile ? "column" : "row",
                gap: 12,
              }}
            >
              <div>
                <div style={{ fontWeight: 900, fontSize: 18 }}>Feedback Details</div>
                <div style={{ color: "var(--muted)", fontSize: 12 }}>
                  Reference No: {activeIndex ?? "-"}
                </div>
              </div>

              <button
                className="btn"
                onClick={() => setOpen(false)}
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  width: isMobile ? "100%" : "auto",
                }}
              >
                Close
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                gap: 12,
                marginTop: 12,
              }}
            >
              <div className="card" style={{ padding: 12, border: "1px solid var(--border)" }}>
                <div style={{ fontWeight: 900 }}>Info</div>
                <div style={{ marginTop: 8, lineHeight: 1.7 }}>
                  <div><b>Type:</b> {active.type}</div>
                  <div><b>Category:</b> {active.category}</div>
                  <div><b>SubCategory:</b> {active.subCategory || "—"}</div>
                  <div><b>Priority:</b> <Badge text={active.priority} /></div>
                  <div><b>Status:</b> <Badge text={active.status} /></div>
                  <div><b>Escalated:</b> {active.escalated ? "YES" : "NO"}</div>
                  <div><b>Department:</b> {active.departmentName || "—"}</div>
                  <div><b>Assigned Staff:</b> {active.assignedStaffEmail || "—"}</div>
                </div>
              </div>

              <div className="card" style={{ padding: 12, border: "1px solid var(--border)" }}>
                <div style={{ fontWeight: 900 }}>Message</div>
                <div style={{ marginTop: 8, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                  {active.message}
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: 12, border: "1px solid var(--border)", marginTop: 12 }}>
              <div style={{ fontWeight: 900, marginBottom: 8 }}>Communication Thread</div>
              <MessageThread feedbackId={active.id} />
            </div>

            <div style={{ marginTop: 12 }}>
              <AttachmentBox feedbackId={active.id} />
            </div>

            <div style={{ marginTop: 12 }}>
              <RatingBox feedbackId={active.id} feedbackStatus={active.status} />
            </div>

            <div className="card" style={{ padding: 12, border: "1px solid var(--border)", marginTop: 12 }}>
              <div style={{ fontWeight: 900, marginBottom: 8 }}>History</div>

              {historyErr && <div style={{ color: "#991b1b" }}>{historyErr}</div>}

              {history.length === 0 && !historyErr ? (
                <div style={{ color: "var(--muted)" }}>No history yet.</div>
              ) : (
                <div style={{ display: "grid", gap: 8 }}>
                  {history.map((h) => (
                    <div key={h.id} className="card" style={{ padding: 10, border: "1px solid var(--border)" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          flexDirection: isMobile ? "column" : "row",
                          gap: 8,
                        }}
                      >
                        <div style={{ fontWeight: 900 }}>
                          {h.fromStatus} → {h.toStatus}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--muted)" }}>
                          {h.createdAt ? new Date(h.createdAt).toLocaleString() : ""}
                        </div>
                      </div>
                      <div style={{ marginTop: 4, color: "var(--muted)" }}>
                        by <b>{h.actorEmail || "unknown"}</b>
                      </div>
                      {h.note && <div style={{ marginTop: 6 }}>{h.note}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
