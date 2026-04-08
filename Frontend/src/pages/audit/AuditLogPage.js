import React, { useEffect, useState, useCallback, useRef } from "react";
import { Search, ChevronLeft, ChevronRight, Download, ClipboardList, Info, RefreshCw } from "lucide-react";
import api from "../../api.js";
import "../dashboard/Dashboard.css";
import "../../components/Components.css";

const action_colors = {
  created: { bg: "rgba(59,130,246,0.1)", color: "#60a5fa", label: "Created" },
  assigned: { bg: "rgba(139,92,246,0.1)", color: "#a78bfa", label: "Assigned" },
  uploaded: { bg: "rgba(16,185,129,0.1)", color: "#34d399", label: "Upload" },
  verified: { bg: "rgba(234,179,8,0.1)", color: "#fbbf24", label: "Verified" },
  deleted: { bg: "rgba(239,68,68,0.1)", color: "#f87171", label: "Deleted" },
  updated: { bg: "rgba(249,115,22,0.1)", color: "#fb923c", label: "Updated" },
  removed: { bg: "rgba(239,68,68,0.1)", color: "#f87171", label: "Removed" },
  added: { bg: "rgba(139,92,246,0.1)", color: "#a78bfa", label: "Added" },
  profile: { bg: "rgba(20,184,166,0.1)", color: "#2dd4bf", label: "Profile" },
  password: { bg: "rgba(249,115,22,0.1)", color: "#fb923c", label: "Password" },
  reset: { bg: "rgba(249,115,22,0.1)", color: "#fb923c", label: "Reset" },
};

function getActionTag(action = "") {
  const lower = action.toLowerCase();
  for (const [key, val] of Object.entries(action_colors)) {
    if (lower.includes(key)) return val;
  }
  return { bg: "rgba(148,163,184,0.1)", color: "#94a3b8", label: "Action" };
}

const role_colors = {
  Supervising_Officer: "#818cf8",
  Lead_Investigator: "#34d399",
  Forensic_Officer: "#fbbf24",
  Police_Officer: "#60a5fa",
  Administrator: "#a78bfa",
};

export default function AuditLogPage() {
  const user = JSON.parse(localStorage.getItem("user"));
  const isLead = user?.role_id === 2;

  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const debounceRef = useRef(null);

  const handleSearchChange = (val) => {
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(val);
      setPage(1);
    }, 400);
  };

  const fetchLogs = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      setError("");
      try {
        const res = await api.get(`/audit-logs?page=${page}&limit=15&search=${encodeURIComponent(debouncedSearch)}`);
        setLogs(res.data.logs || []);
        setTotalPages(res.data.pages || 1);
        setTotal(res.data.total || 0);
        setLastRefreshed(new Date());
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load audit logs");
        setLogs([]);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [page, debouncedSearch],
  );

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    const interval = setInterval(() => fetchLogs(true), 10000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  const fmtDate = (ts) =>
    new Date(ts).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  const fmtTime = (ts) =>
    new Date(ts).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

  const exportCSV = () => {
    const rows = [["Log ID", "User", "Role", "Action", "Date", "Time"]];
    logs.forEach((l) => rows.push([l.log_id, l.user?.name, l.role, l.action, fmtDate(l.timestamp), fmtTime(l.timestamp)]));
    const csv = rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = Object.assign(document.createElement("a"), {
      href: url,
      download: `audit-log-${new Date().toISOString().slice(0, 10)}.csv`,
    });
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="dashboardMain">
      <header className="dashboardHeader">
        <div className="headerBranding">
          <h1 className="logoText">
            <span>LEGALLENS</span> {isLead ? "My Cases — Audit Log" : "Audit Log"}
          </h1>
          <p className="systemStatus">
            {isLead ? (
              "Activity records for cases you are assigned to"
            ) : (
              <>
                Complete system history • <span className="highlightText">{total} total records</span>
              </>
            )}
          </p>
        </div>
        <div className="auditHeaderActions">
          <button className="secondaryActionBtn auditRefreshBtn" onClick={() => fetchLogs()} title="Refresh">
            <RefreshCw size={16} />
          </button>
          <button className="secondaryActionBtn auditExportBtn" onClick={exportCSV}>
            <Download size={16} /> Export CSV
          </button>
        </div>
      </header>

      {isLead && (
        <div className="auditLeadInfoBanner">
          <Info size={16} className="auditLeadInfoIcon" />
          <span>You can see audit activity for all cases you are assigned to. Contact your Administrator to view full system logs.</span>
        </div>
      )}

      {/* Search + Stats bar */}
      <div className="auditTopBar">
        <div className="membersSearch auditSearchBox">
          <Search size={16} color="#475569" />
          <input
            type="text"
            className="auditSearchInput"
            placeholder={isLead ? "Search actions in your cases..." : "Search by user or action..."}
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>

        <div className="auditStats">
          {[
            ["Created", "created"],
            ["Uploaded", "uploaded"],
            ["Deleted", "deleted"],
            ["Updated", "updated"],
          ].map(([label, key]) => {
            const count = logs.filter((l) => l.action?.toLowerCase().includes(key)).length;
            const tag = getActionTag(key);
            return (
              <div key={key} className="auditStatChip" style={{ background: tag.bg, color: tag.color }}>
                <span>{label}</span>
                <span className="auditStatCount">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {lastRefreshed && <p className="auditLastRefreshedText">Last updated: {lastRefreshed.toLocaleTimeString()}</p>}

      {/* Table */}
      <div className="formSectionCard auditTableCard">
        <div className="sectionHeader">
          <div className="indicatorDot" />
          <h2>Activity Records</h2>
          {total > 0 && (
            <span className="auditTotalCount">
              {total} record{total !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {error && <div className="alertBanner alertError auditErrorBanner">{error}</div>}

        <table className="legalTable">
          <thead>
            <tr>
              <th>#</th>
              <th>User</th>
              <th>Role</th>
              <th>Action</th>
              <th>Type</th>
              <th>Date</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="auditEmptyCell">
                  <div className="miniSpinner auditSpinner" />
                  Loading audit logs...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={7} className="auditEmptyCell">
                  <ClipboardList size={36} className="auditEmptyIcon" />
                  <p className="auditEmptyText">
                    {search ? `No records matching "${search}"` : isLead ? "No audit records for your assigned cases yet" : "No audit logs found"}
                  </p>
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const tag = getActionTag(log.action);
                return (
                  <tr key={log._id} className="auditRow">
                    <td className="mutedText auditIdCell">{String(log.log_id ?? "—").padStart(4, "0")}</td>
                    <td>
                      <div className="nameCell">
                        <div className="avatarCircle">{log.user?.name?.charAt(0)?.toUpperCase() || "?"}</div>
                        <div>
                          <p className="boldText auditNameText">{log.user?.name || "Unknown"}</p>
                          <p className="mutedText auditEmailText">{log.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="auditRoleText" style={{ color: role_colors[log.role] || "#94a3b8" }}>
                        {log.role?.replace(/_/g, " ") || "—"}
                      </span>
                    </td>
                    <td className="auditActionCell">{log.action}</td>
                    <td>
                      <span className="auditTypePill" style={{ background: tag.bg, color: tag.color }}>
                        {tag.label}
                      </span>
                    </td>
                    <td className="mutedText auditDateCell">{fmtDate(log.timestamp)}</td>
                    <td className="mutedText auditTimeCell">{fmtTime(log.timestamp)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="auditPagination">
            <button className="actionCircle" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
              <ChevronLeft size={16} />
            </button>
            <span className="auditPageText">
              Page <span className="highlightText">{page}</span> of {totalPages}
            </span>
            <button className="actionCircle" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
