import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import CaseRow from "../../components/cases/CaseRow.js";
import "../dashboard/Dashboard.css";
import "./CasesPage.css";
import api from "../../api.js";
import { Plus, Search, X } from "lucide-react";

export default function CasesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user"));
  const isAdmin = user?.role_id === 1;
  const [allCases, setAll] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState(() => {
    const params = new URLSearchParams(location.search);
    return params.get("q") || "";
  });
  const [statusFilter, setStatus] = useState("All");
  const [priorityFilter, setPriority] = useState("All");
  const getPriorityLabel = (num) => ({ 3: "High", 2: "Medium", 1: "Low" })[num] || "Unknown";

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const res = await api.get("/cases");
        const data = Array.isArray(res.data) ? res.data : [];
        setAll(data);
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/", { replace: true });
        } else {
        }
      }
    };
    fetchCases();
  });

  useEffect(() => {
    let result = allCases;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((c) => c.title?.toLowerCase().includes(q) || String(c.caseId).includes(q));
    }
    if (statusFilter !== "All") result = result.filter((c) => c.status === statusFilter);
    if (priorityFilter !== "All") result = result.filter((c) => getPriorityLabel(c.priority) === priorityFilter);
    setFiltered(result);
  }, [search, statusFilter, priorityFilter, allCases]);

  const status_tabs = [
    { label: "All", value: "All" },
    { label: "Open", value: "Open" },
    { label: "Closed", value: "Close" },
    { label: "Archived", value: "Archived" },
  ];
  const getCount = (v) => (v === "All" ? allCases.length : allCases.filter((c) => c.status === v).length);

  return (
    <div className="dashboardMain">
      <header className="dashboardHeader">
        <div className="headerBranding">
          <h1 className="logoText">
            <span>LEGALLENS</span> Cases
          </h1>
          <p className="systemStatus">
            {isAdmin ? "All cases in the system" : "Your assigned cases"} • <span className="highlightText">{allCases.length} total</span>
          </p>
        </div>
        {isAdmin && (
          <button className="primaryActionBtn casesHeaderBtn" onClick={() => navigate("/create-case")}>
            <Plus size={16} /> Create Case
          </button>
        )}
      </header>

      {/* Status Filter Tabs */}
      <div className="notifFilterTabs casesFilterTabs">
        {status_tabs.map(({ label, value }) => (
          <button key={value} className={`notifFilterTab ${statusFilter === value ? "notifFilterTabActive" : ""}`} onClick={() => setStatus(value)}>
            {label} ({getCount(value)})
          </button>
        ))}
      </div>

      {/* Search + Priority */}
      <div className="casesFilterBar">
        <div className="membersSearch casesSearchContainer">
          <Search size={16} color="#475569" />
          <input
            type="text"
            className="casesSearchInput"
            placeholder="Search by title or case ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="casesSearchClearBtn" onClick={() => setSearch("")}>
              <X size={14} />
            </button>
          )}
        </div>
        <select value={priorityFilter} onChange={(e) => setPriority(e.target.value)} className="casesPrioritySelect">
          <option value="All">All Priorities</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
      </div>

      {/* Cases List */}
      <div className="formSectionCard">
        <div className="sectionHeader">
          <div className="indicatorDot" />
          <h2>CASE RECORDS</h2>
          <span className="casesResultCount">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="casesListWrapper">
          {filtered.length === 0 ? (
            <div className="casesMessageState">
              <p>{search ? `No cases matching "${search}"` : "No cases found"}</p>
            </div>
          ) : (
            filtered.map((c) => (
              <CaseRow key={c.id || c.caseId} id={c.caseId} title={c.title} priority={getPriorityLabel(c.priority)} status={c.status} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
