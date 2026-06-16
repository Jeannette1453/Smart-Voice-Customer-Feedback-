import React, { useEffect, useRef, useState } from "react";
import { User, Mail, Shield, CheckCircle, Lock, Eye, EyeOff, Phone } from "lucide-react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const nav = useNavigate();
  const fetchedOnce = useRef(false);

  const [profile, setProfile] = useState(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const loadProfile = async () => {
    setErr("");
    setOk("");
    setLoading(true);

    try {
      const res = await api.get("/api/profile/me");
      setProfile(res.data);
      setFullName(res.data?.fullName || "");
      setPhone(res.data?.phone || "");
    } catch (e) {
      const code = e?.response?.status;
      if (code === 401) return nav("/login", { replace: true });
      setErr(e?.response?.data?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (fetchedOnce.current) return;
    fetchedOnce.current = true;
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveProfile = async (e) => {
    e.preventDefault();
    setErr("");
    setOk("");
    setSavingProfile(true);

    try {
      const res = await api.put("/api/profile/me", { fullName, phone });
      setProfile(res.data);
      localStorage.setItem("fullName", res.data?.fullName || "");
      setOk("Profile updated successfully");
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setErr("");
    setOk("");
    setSavingPassword(true);

    try {
      await api.patch("/api/profile/change-password", {
        currentPassword,
        newPassword,
      });

      setCurrentPassword("");
      setNewPassword("");
      setOk("Password changed successfully");
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to change password");
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: "24px 0" }}>
        <div className="card" style={{ padding: 16 }}>Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: "24px 0" }}>
      <h2 style={{ marginTop: 0 }}>My Profile</h2>

      {err && (
        <div className="alert-error" style={{ marginBottom: 12 }}>
          {err}
        </div>
      )}

      {ok && (
        <div className="alert-success" style={{ marginBottom: 12 }}>
          {ok}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: window.innerWidth <= 900 ? "1fr" : "1fr 1fr",
          gap: 16,
        }}
      >
        <div className="card" style={{ padding: 18 }}>
          {/* ── Account Info Form ── */}
          <h3 style={{ marginTop: 0 }}>Account Information</h3>

          <form onSubmit={saveProfile} style={{ display: "grid", gap: 12 }}>
            <div>
              <div className="label">Full Name</div>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", display: "flex" }}><User size={15} /></div>
                <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} required style={{ paddingLeft: 36 }} />
              </div>
            </div>

            <div>
              <div className="label">Phone Number</div>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", display: "flex" }}><Phone size={15} /></div>
                <input className="input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +250 7XX XXX XXX" style={{ paddingLeft: 36 }} />
              </div>
            </div>

            <div>
              <div className="label">Email</div>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", display: "flex" }}><Mail size={15} /></div>
                <input className="input" value={profile?.email || ""} disabled style={{ paddingLeft: 36 }} />
              </div>
            </div>

            <div>
              <div className="label">Role</div>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", display: "flex" }}><Shield size={15} /></div>
                <input className="input" value={profile?.role || ""} disabled style={{ paddingLeft: 36 }} />
              </div>
            </div>

            <div>
              <div className="label">Account Status</div>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", display: "flex" }}><CheckCircle size={15} /></div>
                <input className="input" value={profile?.enabled ? "Enabled" : "Disabled"} disabled style={{ paddingLeft: 36 }} />
              </div>
            </div>

            <button className="btn btn-primary" disabled={savingProfile}>
              {savingProfile ? "Saving..." : "Save Profile"}
            </button>
          </form>
        </div>

        <div className="card" style={{ padding: 18 }}>
          {/* ── Change Password Form ── */}
          <h3 style={{ marginTop: 0 }}>Change Password</h3>

          <form onSubmit={changePassword} style={{ display: "grid", gap: 12 }}>
            <div>
              <div className="label">Current Password</div>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", display: "flex" }}><Lock size={15} /></div>
                <input className="input" type={showCurrent ? "text" : "password"} value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)} required style={{ paddingLeft: 36, paddingRight: 36 }} />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex" }}>
                  {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div>
              <div className="label">New Password</div>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", display: "flex" }}><Lock size={15} /></div>
                <input className="input" type={showNew ? "text" : "password"} value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)} required style={{ paddingLeft: 36, paddingRight: 36 }} />
                <button type="button" onClick={() => setShowNew(!showNew)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex" }}>
                  {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button className="btn btn-primary" disabled={savingPassword}>
              {savingPassword ? "Updating..." : "Change Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
