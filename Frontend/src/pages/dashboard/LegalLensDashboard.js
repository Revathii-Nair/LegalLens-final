import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import StatCard from "../../components/common/StatCard.js";
import CaseRow from "../../components/cases/CaseRow.js";
import { Plus, FolderOpen, Bell, Search, Check, ClipboardList } from "lucide-react";
import "./Dashboard.css";

export default function LegalLensDashboard() {
  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [assignedCases, setAssigned] = useState([]);
  const [recentCases, setRecent] = useState([]);
  const [notifications, setNotifs] = useState([]);
  const [showPanel, setShowPanel] = useState(false);
  const [unreadCount, setUnread] = useState(0);
  const [auditPreview, setAudit] = useState([]);
  const [searchVal, setSearch] = useState("");
  const notifRef = useRef(null);
  const [caseStats, setStats] = useState({
    totalAssigned: 0,
    activeCases: 0,
    closedCases: 0,
    highPriorityCases: 0,
  });
  const isAdmin = user?.role_id === 1;
  const isLead = user?.role_id === 2;

  useEffect(() => {
    const fetchCaseDetail = async () => {
      try {
        const dashRes = await api.get("/dashboard");
        setMessage(dashRes.data.message || "");

        const casesRes = await api.get("/assigned-cases");
        if (casesRes.data.message === "no assigned cases") {
          setAssigned([]);
        } else {
          setAssigned(casesRes.data.cases || casesRes.data);
        }

        const recentRes = await api.get("/recent-cases");
        if (recentRes.data.message === "no recent cases") {
          setRecent([]);
        } else {
          setRecent(recentRes.data.cases || recentRes.data);
        }

        const statsRes = await api.get("/case-stats");
        if (statsRes.data) {
          setStats(statsRes.data);
        }

        if (user?.role_id === 2) {
          try {
            const auditRes = await api.get("/audit-logs?page=1&limit=5");
            setAudit(auditRes.data.logs || []);
          } catch (auditErr) {}
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/", { replace: true });
        }
      }
    };

    const fetchNotifications = async () => {
      try {
        const notifRes = await api.get("/notifications");
        const arr = Array.isArray(notifRes.data) ? notifRes.data : [];
        setNotifs(arr);
        setUnread(arr.filter((n) => !n.read).length);
      } catch (err) {}
    };

    fetchCaseDetail();
    fetchNotifications();

    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [navigate, user?.role_id]);

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowPanel(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifs((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
      setUnread((c) => Math.max(0, c - 1));
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch("/notifications/read-all");
      setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnread(0);
    } catch {}
  };

  const getPriorityLabel = (num) => ({ 3: "High", 2: "Medium", 1: "Low" })[num] || "Unknown";

  const formatTime = (ts) => {
    if (!ts) return "";
    const diff = Date.now() - new Date(ts).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "Just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  const ACTION_COLORS = {
    created: "#60a5fa",
    assigned: "#a78bfa",
    uploaded: "#34d399",
    verified: "#fbbf24",
    deleted: "#f87171",
    updated: "#fb923c",
    removed: "#f87171",
    added: "#a78bfa",
  };

  const getActionColor = (action = "") => {
    const lower = action.toLowerCase();
    for (const [k, c] of Object.entries(ACTION_COLORS)) if (lower.includes(k)) return c;
    return "#94a3b8";
  };

  return (
    <div className="dashboardMain">
      <header className="dashboardHeader">
        <div className="headerBranding">
          <h1 className="logoText">
            <span>LEGALLENS</span> Dashboard
          </h1>
          <p className="systemStatus">
            Welcome back, <span className="highlightText">{user?.name || "User"}</span>
            {message ? ` • ${message}` : ""}
          </p>
        </div>

        <div className="headerActions">
          {/* Search */}
          <div className="searchContainer">
            <Search className="searchIcon" size={16} />
            <input
              type="text"
              placeholder="Search cases..."
              className="searchInput"
              value={searchVal}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && searchVal.trim())
                  navigate(`/cases?q=${encodeURIComponent(searchVal.trim())}`);
              }}
            />
          </div>

          {/* Notification bell */}
          <div ref={notifRef} className="notifContainer">
            <button
              className="notificationBtn"
              onClick={() => setShowPanel((v) => !v)}
              title="Notifications"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="badge notifBadgeRed">{unreadCount > 9 ? "9+" : unreadCount}</span>
              )}
              {unreadCount === 0 && notifications.length > 0 && (
                <span className="badge notifBadgeGreen" />
              )}
            </button>

            {showPanel && (
              <div className="notifDropdown">
                <div className="notifDropdownHeader">
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <button className="markAllReadBtn" onClick={handleMarkAllRead}>
                      <Check size={12} /> Mark all read
                    </button>
                  )}
                </div>
                <div className="notifDropdownList">
                  {notifications.length === 0 ? (
                    <p className="noNotifsMsg">No notifications yet</p>
                  ) : (
                    notifications.slice(0, 10).map((n) => (
                      <div
                        key={n._id}
                        className={`notifDropItem ${n.read ? "notifRead" : "notifUnread"}`}
                      >
                        <div className={`notifDotIndicator ${n.read ? "dotGreen" : "dotRed"}`} />
                        <div className="notifDropContent">
                          <p className="notifDropText">{n.message}</p>
                          <span className="notifDropTime">{formatTime(n.created_at)}</span>
                        </div>
                        {!n.read && (
                          <button
                            className="notifReadBtn"
                            onClick={() => handleMarkRead(n._id)}
                            title="Mark as read"
                          >
                            <Check size={12} />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
                <div className="notifDropdownFooter">
                  <button
                    onClick={() => {
                      navigate("/notifications");
                      setShowPanel(false);
                    }}
                  >
                    View all notifications →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Avatar */}
          <div className="userAvatar" onClick={() => navigate("/profile")} title="View Profile">
            {user?.avatar ? (
              <img
                src={`http://localhost:5000${user.avatar}`}
                alt="avatar"
                className="userAvatarImg"
              />
            ) : (
              <span className="userAvatarFallback">{user?.name?.charAt(0)?.toUpperCase()}</span>
            )}
          </div>
        </div>
      </header>

      {/* ── STATS ── */}
      <div className="statsGrid">
        <StatCard title="Total Cases" value={caseStats.totalAssigned} type="total" />
        <StatCard title="Active Cases" value={caseStats.activeCases} type="active" />
        <StatCard title="Closed Cases" value={caseStats.closedCases} type="closed" />
        <StatCard title="High Priority" value={caseStats.highPriorityCases} type="priority" />
      </div>

      <div className="middleSection">
        {/* Recent Open Cases */}
        <section className="glassCard">
          <div className="sectionHeader">
            <h2>Recent Open Cases</h2>
            <button className="viewAllBtn" onClick={() => navigate("/cases")}>
              View All ›
            </button>
          </div>
          <div className="caseList">
            {recentCases.length === 0 ? (
              <div className="dashEmptyState">
                <FolderOpen size={28} />
                <p>No recent open cases</p>
              </div>
            ) : (
              recentCases.map((c) => (
                <CaseRow
                  key={c.caseId}
                  id={c.caseId}
                  title={c.title}
                  priority={getPriorityLabel(c.priority)}
                  status={c.status}
                />
              ))
            )}
          </div>
        </section>

        {/* My Assigned Cases  */}
        {!isAdmin ? (
          <section className="glassCard">
            <div className="sectionHeader">
              <h2>My Assigned Cases</h2>
              <button className="viewAllBtn" onClick={() => navigate("/cases")}>
                View All ›
              </button>
            </div>
            <div className="caseList">
              {assignedCases.length === 0 ? (
                <div className="dashEmptyState">
                  <FolderOpen size={28} />
                  <p>No cases assigned to you yet</p>
                </div>
              ) : (
                assignedCases.map((c) => (
                  <CaseRow
                    key={c.id || c.caseId}
                    id={c.caseId}
                    title={c.title}
                    priority={getPriorityLabel(c.priority)}
                    status={c.status}
                  />
                ))
              )}
            </div>
          </section>
        ) : (
          <section className="glassCard">
            <h2 className="sectionTitle quickActionsTitle">Quick Actions</h2>
            <div className="actionsGrid">
              <button className="primaryActionBtn" onClick={() => navigate("/create-case")}>
                <Plus size={18} /> Create New Case
              </button>
              <button className="secondaryActionBtn" onClick={() => navigate("/add-members")}>
                <FolderOpen size={18} /> Manage Members
              </button>
              <button className="secondaryActionBtn" onClick={() => navigate("/audit-log")}>
                <ClipboardList size={18} /> View Audit Log
              </button>
            </div>
          </section>
        )}
      </div>

      <div className="bottomSection">
        <section className="glassCard">
          <div className="sectionHeader">
            <h2 className="sectionTitle">Recent Notifications</h2>
            <button className="viewAllBtn" onClick={() => navigate("/notifications")}>
              View All ›
            </button>
          </div>
          <div className="notificationList">
            {notifications.length === 0 ? (
              <div className="dashEmptyState">
                <Bell size={28} />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.slice(0, 5).map((n) => (
                <div key={n._id} className={`notifItem ${n.read ? "" : "notifItemUnread"}`}>
                  <div className="notifItemWrapper">
                    <div className={`notifDotIndicator ${n.read ? "dotGreen" : "dotRed"}`} />
                    <div>
                      <p className="notifText">{n.message}</p>
                      <span className="notifTime">{formatTime(n.created_at)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* audit for lead */}
        {isLead && (
          <section className="glassCard">
            <div className="sectionHeader">
              <h2 className="sectionTitle">My Cases — Recent Activity</h2>
              <button className="viewAllBtn" onClick={() => navigate("/audit-log")}>
                View Full Log ›
              </button>
            </div>
            <div className="auditPreviewList">
              {auditPreview.length === 0 ? (
                <div className="dashEmptyState">
                  <ClipboardList size={28} />
                  <p>No audit activity for your cases yet</p>
                </div>
              ) : (
                auditPreview.map((log) => (
                  <div key={log._id} className="auditPreviewItem">
                    <div
                      className="notifDotIndicator"
                      style={{ backgroundColor: getActionColor(log.action) }}
                    />
                    <div className="auditPreviewContent">
                      <p className="auditPreviewAction">{log.action}</p>
                      <span className="auditPreviewMeta">
                        {log.user?.name} •{" "}
                        {new Date(log.timestamp).toLocaleDateString({
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
