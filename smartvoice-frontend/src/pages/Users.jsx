import React, { useEffect, useState } from "react";
import { Users as UsersIcon, Plus, RefreshCw, Pencil, Trash2, UserCheck, UserX, X, User, Mail, Lock, ShieldCheck, Building2 } from "lucide-react";
import api from "../api/axios";
import { getRole } from "../auth/auth";
import PaginationBar from "../components/PaginationBar";

const ROLE_COLORS = {
  ADMIN:    { bg: "#fef3c7", color: "#92400e", border: "#fde68a" },
  MANAGER:  { bg: "#ede9fe", color: "#5b21b6", border: "#ddd6fe" },
  STAFF:    { bg: "#dbeafe", color: "#1e40af", border: "#bfdbfe" },
  CUSTOMER: { bg: "#dcfce7", color: "#166534", border: "#bbf7d0" },
};

function RoleBadge({ role }) {
  const c = ROLE_COLORS[role] || { bg: "#f1f5f9", color: "#475569", border: "#e2e8f0" };
  return (
    <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 800, background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
      {role}
    </span>
  );
}

function StatusDot({ enabled }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: enabled ? "#16a34a" : "#dc2626" }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: enabled ? "#16a34a" : "#dc2626", display: "inline-block" }} />
      {enabled ? "Active" : "Disabled"}
    </span>
  );
}

export default function Users() {
  const role = String(getRole() || "");
  const isAdmin = role.includes("ADMIN");

  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    api.get("/api/departments").then(r => setDepartments(r.data || [])).catch(() => {});
  }, []);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userRole, setUserRole] = useState("STAFF");
  const [deptId, setDeptId] = useState("");

  const [editUser, setEditUser] = useState(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editDeptId, setEditDeptId] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const loadUsers = async () => {
    try {
      setErr(""); setLoading(true);
      const res = await api.get("/api/users");
      setItems(res.data || []);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load users");
    } finally { setLoading(false); }
  };

  useEffect(() => { loadUsers(); }, []);

  const createUser = async (e) => {
    e.preventDefault();
    try {
      setErr("");
      await api.post("/api/users", { fullName, email, password, role: userRole, departmentId: deptId || null });
      setFullName(""); setEmail(""); setPassword(""); setUserRole("STAFF"); setDeptId("");
      setShowCreate(false);
      await loadUsers();
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Failed to create user");
    }
  };

  const toggleEnabled = async (id, current) => {
    try {
      await api.patch(`/api/users/${id}/enabled?value=${!current}`);
      await loadUsers();
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to update status");
    }
  };

  const removeUser = async (id) => {
    if (!confirm("Delete this user? This cannot be undone.")) return;
    try {
      await api.delete(`/api/users/${id}`);
      await loadUsers();
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to delete user");
    }
  };

  const openEdit = (u) => { setEditUser(u); setEditName(u.fullName); setEditRole(u.role); setEditPhone(u.phone || ""); setEditDeptId(u.departmentId || ""); setEditPassword(""); };

  const saveEdit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      const body = { fullName: editName, role: editRole };
      if (editPhone.trim()) body.phone = editPhone.trim();
      if (editDeptId) body.departmentId = editDeptId;
      if (editPassword.trim()) body.password = editPassword;
      await api.put(`/api/users/${editUser.id}`, body);
      setEditUser(null);
      await loadUsers();
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to update user");
    } finally { setEditLoading(false); }
  };

  if (!isAdmin) {
    return (
      <div className="card" style={{ padding: 24, textAlign: "center", color: "var(--muted)" }}>
        <ShieldCheck size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
        <div style={{ fontWeight: 700 }}>Admin access required.</div>
      </div>
    );
  }

  const inputStyle = { width: "100%", paddingLeft: 36 };

  return (
    <div style={{ padding: "24px 0" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <UsersIcon size={22} color="var(--primary)" />
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>User Management</h2>
          <span style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 999, padding: "2px 12px", fontSize: 13, fontWeight: 700, color: "var(--muted)" }}>
            {items.length} users
          </span>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn" onClick={loadUsers} style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--card)", border: "1px solid var(--border)" }}>
            <RefreshCw size={14} /> {loading ? "Loading..." : "Refresh"}
          </button>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Plus size={14} /> Add User
          </button>
        </div>
      </div>

      {err && (
        <div style={{ background: "#fff1f2", border: "1px solid #fecdd3", color: "#b91c1c", padding: 12, borderRadius: 12, marginBottom: 16, fontSize: 14 }}>
          {err}
        </div>
      )}

      {/* ── Table ── */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {items.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>
            <UsersIcon size={36} style={{ marginBottom: 12, opacity: 0.3 }} />
            <div>No users found.</div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table width="100%" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--card-2, #f8fafc)", borderBottom: "2px solid var(--border)" }}>
                  {["User", "Email", "Role", "Status", "Actions"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.slice((page - 1) * pageSize, page * pageSize).map((u, i) => (
                  <tr key={u.id} style={{ borderBottom: "1px solid var(--border)", background: i % 2 === 0 ? "transparent" : "rgba(0,0,0,0.01)" }}>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, var(--primary), var(--accent))", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: 14, flexShrink: 0 }}>
                          {u.fullName?.[0]?.toUpperCase() || "?"}
                        </div>
                        <span style={{ fontWeight: 700, color: "var(--text)" }}>{u.fullName}</span>
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px", color: "var(--muted)", fontSize: 14 }}>{u.email}</td>
                    <td style={{ padding: "14px 16px" }}><RoleBadge role={u.role} /></td>
                    <td style={{ padding: "14px 16px" }}><StatusDot enabled={u.enabled} /></td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button title={u.enabled ? "Disable" : "Enable"} onClick={() => toggleEnabled(u.id, u.enabled)}
                          style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--card)", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 700, color: u.enabled ? "#dc2626" : "#16a34a" }}>
                          {u.enabled ? <UserX size={14} /> : <UserCheck size={14} />}
                          {u.enabled ? "Disable" : "Enable"}
                        </button>
                        <button title="Edit" onClick={() => openEdit(u)}
                          style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #bfdbfe", background: "#eff6ff", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 700, color: "#1d4ed8" }}>
                          <Pencil size={14} /> Edit
                        </button>
                        <button title="Delete" onClick={() => removeUser(u.id)}
                          style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #fecaca", background: "#fff1f2", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 700, color: "#dc2626" }}>
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ padding: "0 16px 16px" }}>
              <PaginationBar
                totalItems={items.length}
                page={page}
                pageSize={pageSize}
                onPageChange={(p) => setPage(p)}
                onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Create Modal ── */}
      {showCreate && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "grid", placeItems: "center", zIndex: 1000, padding: 16 }}>
          <div className="card" style={{ width: "100%", maxWidth: 460, padding: 28, borderRadius: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 900, fontSize: 18 }}>
                <Plus size={18} color="var(--primary)" /> Add New User
              </div>
              <button onClick={() => setShowCreate(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }}><X size={20} /></button>
            </div>
            <form onSubmit={createUser} style={{ display: "grid", gap: 14 }}>
              {[
                { label: "Full Name", icon: <User size={14} />, value: fullName, set: setFullName, type: "text", placeholder: "Enter full name" },
                { label: "Email", icon: <Mail size={14} />, value: email, set: setEmail, type: "email", placeholder: "Enter email" },
                { label: "Password", icon: <Lock size={14} />, value: password, set: setPassword, type: "password", placeholder: "Set password" },
              ].map(f => (
                <div key={f.label}>
                  <div className="label">{f.label}</div>
                  <div style={{ position: "relative" }}>
                    <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", display: "flex" }}>{f.icon}</div>
                    <input className="input" type={f.type} value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.placeholder} required style={inputStyle} />
                  </div>
                </div>
              ))}
              <div>
                <div className="label">Role</div>
                <select className="input" value={userRole} onChange={e => { setUserRole(e.target.value); if (e.target.value !== "STAFF") setDeptId(""); }}>
                  <option value="STAFF">STAFF</option>
                  <option value="MANAGER">MANAGER</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="CUSTOMER">CUSTOMER</option>
                </select>
              </div>
              <div>
                <div className="label">Department <span style={{ color:"var(--muted)", fontWeight:400, fontSize:12 }}>(optional — for staff)</span></div>
                <div style={{ position:"relative" }}>
                  <div style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"#94a3b8", display:"flex" }}><Building2 size={14} /></div>
                  <select className="input" value={deptId} onChange={e => setDeptId(e.target.value)} style={{ paddingLeft:36 }}>
                    <option value="">— No Department —</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button className="btn btn-primary" type="submit" style={{ flex: 1 }}>Create User</button>
                <button className="btn" type="button" onClick={() => setShowCreate(false)} style={{ flex: 1, background: "var(--card)", border: "1px solid var(--border)" }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Modal ── */}
      {editUser && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "grid", placeItems: "center", zIndex: 1000, padding: 16 }}>
          <div className="card" style={{ width: "100%", maxWidth: 440, padding: 28, borderRadius: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 900, fontSize: 18 }}>
                <Pencil size={18} color="var(--primary)" /> Edit User
              </div>
              <button onClick={() => setEditUser(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }}><X size={20} /></button>
            </div>
            <form onSubmit={saveEdit} style={{ display: "grid", gap: 14 }}>
              <div>
                <div className="label">Full Name</div>
                <div style={{ position: "relative" }}>
                  <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", display: "flex" }}><User size={14} /></div>
                  <input className="input" value={editName} onChange={e => setEditName(e.target.value)} required style={inputStyle} />
                </div>
              </div>
              <div>
                <div className="label">Phone Number</div>
                <div style={{ position: "relative" }}>
                  <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", display: "flex" }}>📞</div>
                  <input className="input" type="tel" value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="e.g. +250 7XX XXX XXX" style={inputStyle} />
                </div>
              </div>
              <div>
                <div className="label">Role</div>
                <select className="input" value={editRole} onChange={e => { setEditRole(e.target.value); if (e.target.value !== "STAFF") setEditDeptId(""); }}>
                  <option value="STAFF">STAFF</option>
                  <option value="MANAGER">MANAGER</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="CUSTOMER">CUSTOMER</option>
                </select>
              </div>
              {editRole === "STAFF" && (
                <div>
                  <div className="label">Department <span style={{ color:"var(--muted)", fontWeight:400, fontSize:12 }}>(optional)</span></div>
                  <div style={{ position:"relative" }}>
                    <div style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"#94a3b8", display:"flex" }}><Building2 size={14} /></div>
                    <select className="input" value={editDeptId} onChange={e => setEditDeptId(e.target.value)} style={{ paddingLeft:36 }}>
                      <option value="">— No Department —</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                </div>
              )}
              <div>
                <div className="label">New Password <span style={{ color: "var(--muted)", fontWeight: 400, fontSize: 12 }}>(leave blank to keep current)</span></div>
                <div style={{ position: "relative" }}>
                  <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", display: "flex" }}><Lock size={14} /></div>
                  <input className="input" type="password" value={editPassword} onChange={e => setEditPassword(e.target.value)} placeholder="Optional" style={inputStyle} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button className="btn btn-primary" type="submit" disabled={editLoading} style={{ flex: 1 }}>
                  {editLoading ? "Saving..." : "Save Changes"}
                </button>
                <button className="btn" type="button" onClick={() => setEditUser(null)} style={{ flex: 1, background: "var(--card)", border: "1px solid var(--border)" }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
