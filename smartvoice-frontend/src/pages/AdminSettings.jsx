import React, { useEffect, useRef, useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";

function boxStyle(extra = {}) {
  return {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: 18,
    boxShadow: "0 4px 14px rgba(15, 23, 42, 0.06)",
    padding: 18,
    ...extra,
  };
}

export default function AdminSettings() {
  const [settings, setSettings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [err, setErr] = useState("");

  const [settingKey, setSettingKey] = useState("");
  const [settingValue, setSettingValue] = useState("");

  const [categoryName, setCategoryName] = useState("");

  const [escalationHours, setEscalationHours] = useState("48");
  const [urgentKeywords, setUrgentKeywords] = useState(
    "fraud,lost money,harassment,security,threat"
  );

  const [tplFeedbackReceived, setTplFeedbackReceived] = useState(
    "Hello {customerName}, your feedback has been received successfully."
  );
  const [tplFeedbackAssigned, setTplFeedbackAssigned] = useState(
    "Hello {customerName}, your feedback has been assigned to {staffName} in {departmentName}."
  );
  const [tplStatusUpdated, setTplStatusUpdated] = useState(
    "Hello {customerName}, your feedback status changed from {fromStatus} to {toStatus}."
  );

  const [tplNotifFeedbackReceived, setTplNotifFeedbackReceived] = useState(
    "Your feedback about {category} was submitted successfully."
  );
  const [tplNotifFeedbackAssigned, setTplNotifFeedbackAssigned] = useState(
    "Your feedback was assigned to {staffName} in {departmentName}."
  );
  const [tplNotifStatusUpdated, setTplNotifStatusUpdated] = useState(
    "Your feedback status changed from {fromStatus} to {toStatus}."
  );
  const [tplNotifEscalated, setTplNotifEscalated] = useState(
    "Your feedback about {category} has been escalated."
  );

  const nav = useNavigate();
  const fetchedOnce = useRef(false);

  const load = async () => {
    setErr("");
    try {
      const [sRes, cRes] = await Promise.all([
        api.get("/api/admin/settings"),
        api.get("/api/admin/categories"),
      ]);

      const loadedSettings = sRes.data || [];
      setSettings(loadedSettings);
      setCategories(cRes.data || []);

      const findVal = (key, fallback = "") =>
        loadedSettings.find((x) => x.settingKey === key)?.settingValue ?? fallback;

      setEscalationHours(findVal("escalation_overdue_hours", "48"));
      setUrgentKeywords(
        findVal("urgent_keywords", "fraud,lost money,harassment,security,threat")
      );

      setTplFeedbackReceived(
        findVal(
          "template_feedback_received",
          "Hello {customerName}, your feedback has been received successfully."
        )
      );

      setTplFeedbackAssigned(
        findVal(
          "template_feedback_assigned",
          "Hello {customerName}, your feedback has been assigned to {staffName} in {departmentName}."
        )
      );

      setTplStatusUpdated(
        findVal(
          "template_status_updated",
          "Hello {customerName}, your feedback status changed from {fromStatus} to {toStatus}."
        )
      );

      setTplNotifFeedbackReceived(
        findVal(
          "template_notification_feedback_received",
          "Your feedback about {category} was submitted successfully."
        )
      );

      setTplNotifFeedbackAssigned(
        findVal(
          "template_notification_feedback_assigned",
          "Your feedback was assigned to {staffName} in {departmentName}."
        )
      );

      setTplNotifStatusUpdated(
        findVal(
          "template_notification_status_updated",
          "Your feedback status changed from {fromStatus} to {toStatus}."
        )
      );

      setTplNotifEscalated(
        findVal(
          "template_notification_escalated",
          "Your feedback about {category} has been escalated."
        )
      );
    } catch (e) {
      const code = e?.response?.status;
      if (code === 401) return nav("/login", { replace: true });
      if (code === 403) return nav("/unauthorized", { replace: true });
      setErr(e?.response?.data?.message || "Failed to load admin settings");
    }
  };

  const saveSetting = async (key, value, successMsg = "Setting saved") => {
    try {
      await api.post("/api/admin/settings", {
        settingKey: key,
        settingValue: value,
      });

      await load();
      alert(successMsg);
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to save setting");
    }
  };

  const saveManualSetting = async () => {
    if (!settingKey.trim() || !settingValue.trim()) {
      return alert("Setting key and value are required");
    }

    await saveSetting(settingKey.trim(), settingValue.trim(), "Custom setting saved");
    setSettingKey("");
    setSettingValue("");
  };

  const saveEscalationRules = async () => {
    if (!escalationHours.trim()) {
      return alert("Escalation overdue hours is required");
    }

    await saveSetting("escalation_overdue_hours", escalationHours.trim(), "Escalation hours saved");
    await saveSetting("urgent_keywords", urgentKeywords.trim(), "Urgent keywords saved");
  };

  const saveTemplates = async () => {
    await saveSetting(
      "template_feedback_received",
      tplFeedbackReceived.trim(),
      "Feedback received email template saved"
    );

    await saveSetting(
      "template_feedback_assigned",
      tplFeedbackAssigned.trim(),
      "Feedback assigned email template saved"
    );

    await saveSetting(
      "template_status_updated",
      tplStatusUpdated.trim(),
      "Status updated email template saved"
    );

    await saveSetting(
      "template_notification_feedback_received",
      tplNotifFeedbackReceived.trim(),
      "Notification received template saved"
    );

    await saveSetting(
      "template_notification_feedback_assigned",
      tplNotifFeedbackAssigned.trim(),
      "Notification assigned template saved"
    );

    await saveSetting(
      "template_notification_status_updated",
      tplNotifStatusUpdated.trim(),
      "Notification status template saved"
    );

    await saveSetting(
      "template_notification_escalated",
      tplNotifEscalated.trim(),
      "Notification escalated template saved"
    );
  };

  const createCategory = async () => {
    if (!categoryName.trim()) return alert("Category name is required");

    try {
      await api.post("/api/admin/categories", {
        name: categoryName.trim(),
      });

      setCategoryName("");
      await load();
      alert("Category created");
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to create category");
    }
  };

  const deleteCategory = async (id) => {
    if (!confirm("Delete this category?")) return;

    try {
      await api.delete(`/api/admin/categories/${id}`);
      await load();
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to delete category");
    }
  };

  useEffect(() => {
    if (fetchedOnce.current) return;
    fetchedOnce.current = true;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="container" style={{ padding: "24px 0" }}>
      <h2 style={{ marginTop: 0, color: "#0f172a" }}>Admin Settings</h2>

      {err && (
        <div
          style={{
            ...boxStyle(),
            borderColor: "#fecaca",
            background: "#fff5f5",
            color: "#991b1b",
            marginBottom: 12,
          }}
        >
          {err}
        </div>
      )}

      <div style={{ display: "grid", gap: 16 }}>
        <div style={boxStyle()}>
          <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 12, color: "#0f172a" }}>
            Escalation Rules
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12 }}>
            <div>
              <div className="label">Overdue Hours</div>
              <input
                className="input"
                value={escalationHours}
                onChange={(e) => setEscalationHours(e.target.value)}
                placeholder="48"
              />
            </div>

            <div>
              <div className="label">Urgent Keywords</div>
              <input
                className="input"
                value={urgentKeywords}
                onChange={(e) => setUrgentKeywords(e.target.value)}
                placeholder="fraud,lost money,harassment,security"
              />
              <div style={{ color: "#64748b", fontSize: 13, marginTop: 6 }}>
                Separate keywords with commas
              </div>
            </div>
          </div>

          <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={saveEscalationRules}>
            Save Escalation Rules
          </button>
        </div>

        <div style={boxStyle()}>
          <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 12, color: "#0f172a" }}>
            Notification Templates
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            <div>
              <div className="label">Email: Feedback Received</div>
              <textarea
                className="input"
                rows={3}
                value={tplFeedbackReceived}
                onChange={(e) => setTplFeedbackReceived(e.target.value)}
              />
            </div>

            <div>
              <div className="label">Email: Feedback Assigned</div>
              <textarea
                className="input"
                rows={3}
                value={tplFeedbackAssigned}
                onChange={(e) => setTplFeedbackAssigned(e.target.value)}
              />
            </div>

            <div>
              <div className="label">Email: Status Updated</div>
              <textarea
                className="input"
                rows={3}
                value={tplStatusUpdated}
                onChange={(e) => setTplStatusUpdated(e.target.value)}
              />
            </div>

            <div>
              <div className="label">Notification: Feedback Received</div>
              <textarea
                className="input"
                rows={3}
                value={tplNotifFeedbackReceived}
                onChange={(e) => setTplNotifFeedbackReceived(e.target.value)}
              />
            </div>

            <div>
              <div className="label">Notification: Feedback Assigned</div>
              <textarea
                className="input"
                rows={3}
                value={tplNotifFeedbackAssigned}
                onChange={(e) => setTplNotifFeedbackAssigned(e.target.value)}
              />
            </div>

            <div>
              <div className="label">Notification: Status Updated</div>
              <textarea
                className="input"
                rows={3}
                value={tplNotifStatusUpdated}
                onChange={(e) => setTplNotifStatusUpdated(e.target.value)}
              />
            </div>

            <div>
              <div className="label">Notification: Escalated</div>
              <textarea
                className="input"
                rows={3}
                value={tplNotifEscalated}
                onChange={(e) => setTplNotifEscalated(e.target.value)}
              />
            </div>
          </div>

          <div style={{ marginTop: 10, color: "#64748b", fontSize: 13 }}>
            Example placeholders: {"{customerName}"}, {"{staffName}"}, {"{departmentName}"}, {"{category}"}, {"{fromStatus}"}, {"{toStatus}"}
          </div>

          <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={saveTemplates}>
            Save Templates
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={boxStyle()}>
            <div style={{ fontWeight: 900, marginBottom: 10, fontSize: 18, color: "#0f172a" }}>
              Custom System Settings
            </div>

            <input
              className="input"
              placeholder="Setting key (e.g. support_email)"
              value={settingKey}
              onChange={(e) => setSettingKey(e.target.value)}
              style={{ marginBottom: 10 }}
            />

            <input
              className="input"
              placeholder="Setting value"
              value={settingValue}
              onChange={(e) => setSettingValue(e.target.value)}
              style={{ marginBottom: 10 }}
            />

            <button className="btn btn-primary" onClick={saveManualSetting}>
              Save Setting
            </button>

            <div style={{ marginTop: 16 }}>
              <table width="100%" cellPadding="8" style={{ borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left", color: "#64748b" }}>
                    <th>Key</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {settings.map((s) => (
                    <tr key={s.id} style={{ borderTop: "1px solid #e2e8f0" }}>
                      <td>{s.settingKey}</td>
                      <td>{s.settingValue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={boxStyle()}>
            <div style={{ fontWeight: 900, marginBottom: 10, fontSize: 18, color: "#0f172a" }}>
              Feedback Categories
            </div>

            <input
              className="input"
              placeholder="Category name"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              style={{ marginBottom: 10 }}
            />

            <button className="btn btn-primary" onClick={createCategory}>
              Add Category
            </button>

            <div style={{ marginTop: 16 }}>
              <table width="100%" cellPadding="8" style={{ borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left", color: "#64748b" }}>
                    <th>Name</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((c) => (
                    <tr key={c.id} style={{ borderTop: "1px solid #e2e8f0" }}>
                      <td>{c.name}</td>
                      <td>
                        <button
                          className="btn"
                          style={{ border: "1px solid #fecaca", color: "#b91c1c", background: "var(--card)" }}
                          onClick={() => deleteCategory(c.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}

                  {categories.length === 0 && (
                    <tr>
                      <td colSpan={2} style={{ color: "#64748b" }}>
                        No categories yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
