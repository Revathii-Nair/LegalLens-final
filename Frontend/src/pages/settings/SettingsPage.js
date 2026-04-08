import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Moon, Sun, Bell, Shield, Lock, Eye, EyeOff, ChevronRight, Monitor } from "lucide-react";
import api from "../../api.js";
import "../dashboard/Dashboard.css";
import "../../components/Components.css";

export default function SettingsPage() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const [theme, setTheme] = useState(localStorage.getItem("ll_theme") || "dark");
  const [notifications, setNotifications] = useState({
    caseAssigned: JSON.parse(localStorage.getItem("ll_notif_caseAssigned") ?? "true"),
    evidenceUploaded: JSON.parse(localStorage.getItem("ll_notif_evidenceUploaded") ?? "true"),
    statusChanged: JSON.parse(localStorage.getItem("ll_notif_statusChanged") ?? "true"),
    auditAlerts: JSON.parse(localStorage.getItem("ll_notif_auditAlerts") ?? "true"),
  });
  const [privacy, setPrivacy] = useState({
    showEmail: JSON.parse(localStorage.getItem("ll_priv_showEmail") ?? "false"),
    twoFactor: JSON.parse(localStorage.getItem("ll_priv_twoFactor") ?? "false"),
    sessionTimeout: localStorage.getItem("ll_priv_timeout") || "60",
  });
  const [changePassForm, setChangePassForm] = useState({
    current: "",
    newPass: "",
    confirm: "",
  });
  const [showPassFields, setShowPassFields] = useState(false);
  const [passError, setPassError] = useState("");
  const [passSuccess, setPassSuccess] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleTogglePassFields = (show) => {
    setShowPassFields(show);
    setPassError("");
    setPassSuccess("");
  };

  const applyTheme = (t) => {
    document.documentElement.setAttribute("data-theme", t);
    localStorage.setItem("ll_theme", t);
    setTheme(t);
  };

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const saveNotifPref = (key, value) => {
    const updated = { ...notifications, [key]: value };
    setNotifications(updated);
    localStorage.setItem(`ll_notif_${key}`, JSON.stringify(value));
  };

  const savePrivacyPref = (key, value) => {
    const updated = { ...privacy, [key]: value };
    setPrivacy(updated);
    localStorage.setItem(`ll_priv_${key}`, JSON.stringify(value));
  };

  const handleChangePassword = async () => {
    setPassError("");
    setPassSuccess("");
    if (!changePassForm.current || !changePassForm.newPass || !changePassForm.confirm) return setPassError("Please fill all fields");
    if (changePassForm.newPass !== changePassForm.confirm) return setPassError("Passwords do not match");
    if (changePassForm.newPass.length < 6) return setPassError("Password must be at least 6 characters");
    setSaving(true);
    try {
      await api.post("/change-password", {
        currentPassword: changePassForm.current,
        newPassword: changePassForm.newPass,
      });
      setPassSuccess("Password changed successfully!");
      setChangePassForm({ current: "", newPass: "", confirm: "" });
    } catch (err) {
      setPassError(err.response?.data?.message || err.message || "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  const ToggleSwitch = ({ value, onChange }) => (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`settingsToggleBtn ${value ? "settingsToggleBtnActive" : "settingsToggleBtnInactive"}`}
    >
      <span className="settingsToggleDot" style={{ left: value ? "calc(100% - 21px)" : "3px" }} />
    </button>
  );

  const SettingRow = ({ icon, title, description, children }) => (
    <div className="settingRow">
      <div className="settingRowLeft">
        <div className="settingRowIcon">{icon}</div>
        <div>
          <p className="settingRowTitle">{title}</p>
          {description && <p className="settingRowDesc">{description}</p>}
        </div>
      </div>
      <div className="settingRowRight">{children}</div>
    </div>
  );

  const SectionCard = ({ title, dot, children }) => (
    <div className="formSectionCard settingsSectionCard">
      <div className="sectionHeader">
        <div className="indicatorDot" style={{ background: dot || "#3b82f6" }} />
        <h2>{title}</h2>
      </div>
      <div className="settingsSectionBody">{children}</div>
    </div>
  );

  return (
    <div className="dashboardMain">
      <header className="dashboardHeader">
        <div className="headerBranding">
          <h1 className="logoText">
            <span>LEGALLENS</span> Settings
          </h1>
          <p className="systemStatus">Manage your preferences and account settings</p>
        </div>
      </header>

      <div className="settingsContainer">
        {/* Profile Quick Access */}
        <SectionCard title="PROFILE" dot="#818cf8">
          <div className="settingRow settingRowClickable settingsProfileRow" onClick={() => navigate("/profile")}>
            <div className="settingRowLeft">
              <div className="avatarCircle settingsProfileAvatar">
                {user?.avatar ? (
                  <img src={`http://localhost:5000${user.avatar}`} alt="" className="settingsAvatarImg" />
                ) : (
                  user?.name?.charAt(0)?.toUpperCase()
                )}
              </div>
              <div>
                <p className="settingRowTitle">{user?.name || "User"}</p>
                <p className="settingRowDesc">
                  {user?.email} · {user?.role_name?.replace(/_/g, " ")}
                </p>
              </div>
            </div>
            <div className="settingRowRight settingsProfileEditWrap">
              <span className="settingsProfileEditText">Edit Profile</span>
              <ChevronRight size={16} color="#818cf8" />
            </div>
          </div>
        </SectionCard>

        {/* Appearance */}
        <SectionCard title="APPEARANCE" dot="#34d399">
          <SettingRow icon={<Monitor size={18} color="#94a3b8" />} title="Theme" description="Choose your preferred color scheme">
            <div className="themeSelector">
              {[
                { value: "dark", icon: <Moon size={14} />, label: "Dark" },
                { value: "light", icon: <Sun size={14} />, label: "Light" },
              ].map((t) => (
                <button
                  type="button"
                  key={t.value}
                  onClick={() => applyTheme(t.value)}
                  className={`themeBtn ${theme === t.value ? "themeBtnActive" : ""}`}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </SettingRow>
        </SectionCard>

        {/* Notifications */}
        <SectionCard title="NOTIFICATIONS" dot="#fbbf24">
          {[
            {
              key: "caseAssigned",
              title: "Case Assigned",
              desc: "When you are assigned to a new case",
            },
            {
              key: "evidenceUploaded",
              title: "Evidence Uploaded",
              desc: "When new evidence is added to your cases",
            },
            {
              key: "statusChanged",
              title: "Status Changes",
              desc: "When a case status is updated",
            },
            ...(user?.role_id === 1
              ? [
                  {
                    key: "auditAlerts",
                    title: "Audit Alerts",
                    desc: "Critical system activity alerts",
                  },
                ]
              : []),
          ].map(({ key, title, desc }) => (
            <SettingRow key={key} icon={<Bell size={18} color="#94a3b8" />} title={title} description={desc}>
              <ToggleSwitch value={notifications[key]} onChange={(v) => saveNotifPref(key, v)} />
            </SettingRow>
          ))}
        </SectionCard>

        {/* Privacy & Security */}
        <SectionCard title="PRIVACY & SECURITY" dot="#f87171">
          <SettingRow icon={<Eye size={18} color="#94a3b8" />} title="Show Email to Team" description="Other members can see your email address">
            <ToggleSwitch value={privacy.showEmail} onChange={(v) => savePrivacyPref("showEmail", v)} />
          </SettingRow>

          <SettingRow icon={<Shield size={18} color="#94a3b8" />} title="Session Timeout" description="Auto logout after inactivity">
            <select
              value={privacy.sessionTimeout}
              onChange={(e) => savePrivacyPref("sessionTimeout", e.target.value)}
              className="modalInput settingsTimeoutSelect"
            >
              {[15, 30, 60, 120, 240].map((v) => (
                <option key={v} value={String(v)}>
                  {v < 60 ? `${v} minutes` : `${v / 60} hour${v > 60 ? "s" : ""}`}
                </option>
              ))}
            </select>
          </SettingRow>

          {/* Change Password */}
          <SettingRow icon={<Lock size={18} color="#94a3b8" />} title="Change Password" description="Update your account password">
            <button
              type="button"
              className="secondaryActionBtn settingsChangePassBtn"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleTogglePassFields(!showPassFields);
              }}
            >
              {showPassFields ? "Cancel" : "Change"}
            </button>
          </SettingRow>
        </SectionCard>

        {/* Change Password Modal */}
        {showPassFields && (
          <div className="modalOverlay" onClick={() => handleTogglePassFields(false)}>
            <div className="modalBox settingsPassModal" onClick={(e) => e.stopPropagation()}>
              <div className="modalHeader">
                <div>
                  <h2 className="modalTitle">Change Password</h2>
                  <p className="modalSubtitle">Update your account password</p>
                </div>
                <button type="button" className="modalCloseBtn" onClick={() => handleTogglePassFields(false)}>
                  ×
                </button>
              </div>

              <div className="modalBody">
                {passError && <div className="alertBanner alertError">{passError}</div>}
                {passSuccess && <div className="alertBanner alertSuccess">{passSuccess}</div>}

                {[
                  {
                    label: "Current Password",
                    key: "current",
                    show: showCurrentPass,
                    toggle: () => setShowCurrentPass((v) => !v),
                  },
                  {
                    label: "New Password",
                    key: "newPass",
                    show: showNewPass,
                    toggle: () => setShowNewPass((v) => !v),
                  },
                  {
                    label: "Confirm New Password",
                    key: "confirm",
                    show: showNewPass,
                    toggle: null,
                  },
                ].map(({ label, key, show, toggle }) => (
                  <div key={key} className="modalField">
                    <label>{label}</label>
                    <div className="settingsPassInputWrap">
                      <input
                        className="modalInput"
                        type={show ? "text" : "password"}
                        value={changePassForm[key]}
                        onChange={(e) => {
                          setChangePassForm((p) => ({
                            ...p,
                            [key]: e.target.value,
                          }));
                        }}
                        placeholder={`Enter ${label.toLowerCase()}`}
                        style={{ paddingRight: toggle ? "2.5rem" : "1rem" }}
                      />
                      {toggle && (
                        <button
                          type="button"
                          className="settingsPassToggleBtn"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggle();
                          }}
                        >
                          {show ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="modalFooter">
                <button type="button" className="secondaryActionBtn" onClick={() => handleTogglePassFields(false)}>
                  Cancel
                </button>
                <button type="button" className="btnCreate" onClick={handleChangePassword} disabled={saving}>
                  {saving ? "Saving..." : "Update Password"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* System Info */}
        <SectionCard title="SYSTEM INFO" dot="#475569">
          {[
            { label: "Version", value: "LegalLens v1.0.0" },
            { label: "Role", value: user?.role_name?.replace(/_/g, " ") },
            { label: "User ID", value: user?.id?.slice(-8)?.toUpperCase() },
            { label: "Session", value: "Active" },
          ].map(({ label, value }) => (
            <div key={label} className="settingRow">
              <p className="settingRowTitle settingsInfoLabel">{label}</p>
              <p className={`settingsInfoValue ${label === "Session" ? "settingsInfoSession" : label === "User ID" ? "settingsInfoUserId" : ""}`}>
                {value}
              </p>
            </div>
          ))}
        </SectionCard>
      </div>
    </div>
  );
}
