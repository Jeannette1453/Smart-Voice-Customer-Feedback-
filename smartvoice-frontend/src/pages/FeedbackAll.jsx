import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import AttachmentBox from "../components/AttachmentBox";
import RatingBox from "../components/RatingBox";
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
    <span style={{ padding: "4px 10px", borderRadius: 999, background: bg, color, fontWeight: 900, fontSize: 12 }}>
      {text}
    </span>
  );
}

export default function FeedbackAll() {
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const [selectedId, setSelectedId] = useState("");
  const [selected, setSelected] = useState(null);

  const [status, setStatus] = useState("ASSIGNED");
  const [note, setNote] = useState("");
  const [escalated, setEscalated] = useState(false);

  const [departments, setDepartments] = useState([]);
  const [staffUsers, setStaffUsers] = useState([]);
  const [departmentId, setDepartmentId] = useState("");
  const [staffId, setStaffId] = useState("");

  const [history, setHistory] = useState([]);
  const [historyErr, setHistoryErr] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

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

  const isMobile = screenWidth <= 900;

  const handleApiError = (e, fallbackMsg) => {
    const code = e?.response?.status;
    if (code === 401) return nav("/login", { replace: true });
    if (code === 403) return setErr("Forbidden: you need MANAGER / ADMIN token.");
    setErr(e?.response?.data?.message || fallbackMsg);
  };

  const fetchDepartments = async () => {
    try {
      const res = await api.get("/api/departments");
      setDepartments(res.data || []);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load departments");
    }
  };

  const fetchStaffUsers = async () => {
    try {
      const res = await api.get("/api/users/staff");
      setStaffUsers(res.data || []);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load staff users");
    }
  };

  const fetchHistory = async (feedbackId) => {
    setHistory([]);
    setHistoryErr("");
    if (!feedbackId) return;

    try {
      const res = await api.get(`/api/feedback/${feedbackId}/history`);
      setHistory(res.data || []);
    } catch (e) {
      const code = e?.response?.status;
      if (code === 401) return nav("/login", { replace: true });
      if (code === 403) return setHistoryErr("Forbidden");
      setHistoryErr(e?.response?.data?.message || "Failed to load history");
    }
  };

  const fetchAll = async () => {
    setErr("");
    setLoading(true);
    try {
      const res = await api.get("/api/feedback");
      const data = res.data || [];
      setItems(data);

      if (selectedId) {
        const still = data.find((x) => x.id === selectedId);
        if (still) {
          setSelected(still);
          setEscalated(!!still.escalated);
          setStatus(still.status || "ASSIGNED");
          setDepartmentId(still.departmentId || "");
          setStaffId(still.assignedStaffId || "");
        } else {
          setSelectedId("");
          setSelected(null);
          setEscalated(false);
          setDepartmentId("");
          setStaffId("");
          setHistory([]);
          setHistoryErr("");
        }
      }
    } catch (e) {
      handleApiError(e, "Failed to load feedback list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (fetchedOnce.current) return;
    fetchedOnce.current = true;
    fetchAll();
    fetchDepartments();
    fetchStaffUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchStaffUsers();
    setStaffId("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departmentId]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, priorityFilter, typeFilter]);

  const onPick = async (f) => {
    setSelectedId(f.id);
    setSelected(f);
    setEscalated(!!f.escalated);
    setStatus(f.status || "ASSIGNED");
    setNote("");
    setDepartmentId(f.departmentId || "");
    setStaffId(f.assignedStaffId || "");
    await fetchHistory(f.id);
  };

  const assignFeedback = async () => {
    if (!selectedId) return alert("Select a feedback first");
    if (!departmentId && !staffId) return alert("Please select a department or staff member to assign");

    try {
      const body = {};
      if (departmentId) body.departmentId = departmentId;
      if (staffId) body.staffId = staffId;

      const res = await api.patch(`/api/feedback/${selectedId}/assign`, body);

      alert("Feedback assigned successfully!");

      const updated = res.data;
      setSelected(updated);
      setSelectedId(updated.id);
      setEscalated(!!updated.escalated);
      setDepartmentId(updated.departmentId || "");
      setStaffId(updated.assignedStaffId || "");

      await fetchAll();
      await fetchHistory(selectedId);
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to assign feedback");
    }
  };

  const updateStatus = async () => {
    if (!selectedId) return alert("Select a feedback first");
    try {
      await api.patch(`/api/feedback/${selectedId}/status`, { status, note });
      alert("Status updated!");
      setNote("");
      await fetchAll();
      await fetchHistory(selectedId);
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to update status");
    }
  };

  const doEscalate = async () => {
    if (!selectedId) return alert("Select a feedback first");
    try {
      await api.patch(`/api/feedback/${selectedId}/escalate`, { escalated });
      alert("Escalation updated!");
      await fetchAll();
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to escalate");
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
        String(f.subCategory || "").toLowerCase().includes(q) ||
        String(f.message || "").toLowerCase().includes(q) ||
        String(f.departmentName || "").toLowerCase().includes(q) ||
        String(f.type || "").toLowerCase().includes(q) ||
        String(f.priority || "").toLowerCase().includes(q) ||
        String(f.status || "").toLowerCase().includes(q);

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
          justifyContent: "space-between",
          alignItems: isMobile ? "stretch" : "center",
          flexDirection: isMobile ? "column" : "row",
          gap: 12,
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: 0 }}>All Feedback (Manager/Admin)</h2>

        <button
          className="btn"
          onClick={fetchAll}
          disabled={loading}
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {err && (
        <div className="card" style={{ padding: 12, borderColor: "#fecaca", background: "#fff5f5", color: "#991b1b", marginTop: 10 }}>
          {err}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1.4fr 0.9fr",
          gap: 14,
          marginTop: 12,
        }}
      >
        <div className="card" style={{ padding: 16 }}>
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
              placeholder="Search customer, message, category..."
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
            <div style={{ color: "var(--muted)" }}>Loading feedback…</div>
          ) : (
            <>
              <div style={{ overflowX: "auto" }}>
                <table width="100%" cellPadding="10" style={{ borderCollapse: "collapse", minWidth: 760 }}>
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
                    {paginatedItems.map((f, idx) => (
                      <tr
                        key={f.id}
                        style={{
                          borderTop: "1px solid var(--border)",
                          cursor: "pointer",
                          background: selectedId === f.id ? "#f1f5f9" : "transparent",
                        }}
                        onClick={() => onPick(f)}
                      >
                        <td onClick={(e) => e.stopPropagation()}>
                          <input type="radio" name="selected" checked={selectedId === f.id} onChange={() => onPick(f)} />
                        </td>
                        <td style={{ fontWeight: 800 }}>
                          {(safePage - 1) * pageSize + idx + 1}
                        </td>
                        <td style={{ fontWeight: 900 }}>{f.type}</td>
                        <td>
                          {f.category}
                          {f.subCategory ? <div style={{ color: "var(--muted)", fontSize: 12 }}>{f.subCategory}</div> : null}
                        </td>
                        <td><Badge text={String(f.priority)} /></td>
                        <td><Badge text={String(f.status)} /></td>
                        <td style={{ fontWeight: 900 }}>
                          {f.escalated ? <span style={{ color: "#b91c1c" }}>⚠ ESCALATED</span> : <span style={{ color: "var(--muted)" }}>NO</span>}
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

        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 900, marginBottom: 10 }}>Manage Selected</div>

          <div className="card" style={{ padding: 12, border: "1px solid var(--border)", marginBottom: 12 }}>
            {!selected ? (
              <div style={{ color: "var(--muted)" }}>Click a row to see details.</div>
            ) : (
              <div style={{ lineHeight: 1.6 }}>
                <div><b>Customer:</b> {selected.customerName || selected.customerEmail || "—"}</div>
                <div><b>Category:</b> {selected.category || "—"}</div>
                <div><b>SubCategory:</b> {selected.subCategory || "—"}</div>
                <div><b>Department:</b> {selected.departmentName || "—"}</div>
                <div><b>Assigned Staff:</b> {selected.assignedStaffName || selected.assignedStaffEmail || "—"}</div>

                <div style={{ marginTop: 8 }}>
                  <div style={{ fontWeight: 900, marginBottom: 4 }}>Message</div>
                  <div style={{ whiteSpace: "pre-wrap" }}>{selected.message || "—"}</div>
                </div>

                {selected.aiSummary && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontWeight: 900, marginBottom: 4 }}>AI Analysis</div>
                    <div><b>Summary:</b> {selected.aiSummary}</div>
                    <div><b>Sentiment:</b> {selected.aiSentiment || "—"}</div>
                    <div><b>Suggested Department:</b> {selected.aiSuggestedDepartment || "—"}</div>
                  </div>
                )}

                <div style={{ marginTop: 12 }}>
                  <div style={{ fontWeight: 900, marginBottom: 6 }}>Attachments</div>
                  <AttachmentBox feedbackId={selected.id} readOnly={false} onChanged={() => fetchAll()} />
                </div>

                <div style={{ marginTop: 12 }}>
                  <div style={{ fontWeight: 900, marginBottom: 6 }}>Satisfaction Rating</div>
                  <RatingBox feedbackId={selected.id} feedbackStatus={selected.status} readOnly />
                </div>

                <div style={{ marginTop: 12 }}>
                  <div style={{ fontWeight: 900, marginBottom: 6 }}>History</div>

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
                            <div style={{ fontWeight: 900 }}>{h.fromStatus} → {h.toStatus}</div>
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
              </div>
            )}
          </div>

          <div style={{ marginBottom: 12 }}>
            <div className="label">Assign Department</div>
            <select className="input" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} disabled={!selectedId}>
              <option value="">-- Select Department --</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>

            <div className="label" style={{ marginTop: 10 }}>Assign Staff</div>
            <select className="input" value={staffId} onChange={(e) => setStaffId(e.target.value)} disabled={!selectedId}>
              <option value="">-- Select Staff --</option>
              {staffUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName || u.email}
                </option>
              ))}
            </select>

            <button
              className="btn"
              style={{ marginTop: 10, width: "100%", background: "var(--card)", border: "1px solid var(--border)" }}
              onClick={assignFeedback}
              disabled={!selectedId}
            >
              Assign Feedback
            </button>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "14px 0" }} />

          <div style={{ marginBottom: 12 }}>
            <div className="label">Update Status</div>
            <select className="input" value={status} onChange={(e) => setStatus(e.target.value)} disabled={!selectedId}>
              <option value="NEW">NEW</option>
              <option value="ASSIGNED">ASSIGNED</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="CLOSED">CLOSED</option>
              <option value="REJECTED">REJECTED</option>
            </select>

            <div className="label" style={{ marginTop: 10 }}>Note (optional)</div>
            <input
              className="input"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Assigned to Loans team"
              disabled={!selectedId}
            />

            <button
              className="btn btn-primary"
              style={{ marginTop: 10, width: "100%" }}
              onClick={updateStatus}
              disabled={!selectedId}
            >
              Save Status
            </button>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "14px 0" }} />

          <div>
            <div className="label">Escalation</div>
            <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="checkbox" checked={escalated} onChange={(e) => setEscalated(e.target.checked)} disabled={!selectedId} />
              Mark as escalated
            </label>

            <button
              className="btn"
              style={{ marginTop: 10, width: "100%", background: "var(--card)", border: "1px solid var(--border)" }}
              onClick={doEscalate}
              disabled={!selectedId}
            >
              Save Escalation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
