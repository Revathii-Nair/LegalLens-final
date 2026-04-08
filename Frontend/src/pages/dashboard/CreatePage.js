import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Search, Plus, UserPlus } from "lucide-react";
import "./Dashboard.css";
import "../../App.css";
import api from "../../api";

export default function CreatePage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDesc] = useState("");
  const [crimeDate, setCrimeDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [priority, setPriority] = useState("High");
  const [status, setStatus] = useState("Open");
  const [leader, setLeader] = useState("");
  const [leaders, setLeaders] = useState([]);
  const [searchTerm, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [searchResults, setResults] = useState([]);
  const [assignedMembers, setMembers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [roles, setRoles] = useState([]);
  const [regions, setRegions] = useState([]);

  useEffect(() => {
  const loadData = async () => {
    try {
      const [leadsRes, rolesRes, regionsRes] = await Promise.all([
        api.get("/users/leads"),
        api.get("/roles"),
        api.get("/regions"),
      ]);
      setLeaders(Array.isArray(leadsRes.data) ? leadsRes.data : []);
      setRoles(Array.isArray(rolesRes.data) ? rolesRes.data : []);
      setRegions(Array.isArray(regionsRes.data) ? regionsRes.data : []);
    } catch (err) {
      console.error("Setup load error:", err);
    }
  };
  loadData(); 
  }, []);

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!searchTerm && !roleFilter && !regionFilter) {
        setResults([]);
        return;
      }
      try {
        const params = new URLSearchParams();
        if (searchTerm) params.append("q", searchTerm);
        if (roleFilter) params.append("role", roleFilter);
        if (regionFilter) params.append("region", regionFilter);
        const res = await api.get(`/users/search?${params}`);
        const existingIds = new Set(assignedMembers.map((m) => m._id));
        setResults((Array.isArray(res.data) ? res.data : []).filter((u) => !existingIds.has(u._id)));
      } catch {
        setResults([]);
      }
    };

    fetchSearchResults();
  }, [searchTerm, roleFilter, regionFilter, assignedMembers]);

  const addMember = (member) => {
    if (!assignedMembers.find((m) => m._id === member._id)) setMembers((p) => [...p, member]);
    setSearch("");
    setResults([]);
  };

  const removeMember = (id) => setMembers((p) => p.filter((m) => m._id !== id));

  const handleCreate = async () => {
    if (!title.trim()) return alert("Case title is required");
    if (!description.trim()) return alert("Description is required");
    setSubmitting(true);
    try {
      await api.post("/create-case", {
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
        start_date: startDate ? new Date(startDate).toISOString() : new Date().toISOString(),
        crime_date: crimeDate ? new Date(crimeDate).toISOString() : undefined,
        leader_id: leader || undefined,
        member_ids: assignedMembers.map((m) => m._id),
      });
      navigate("/cases");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create case");
    } finally {
      setSubmitting(false);
    }
  };

  const priorityColor = priority === "High" ? "#f87171" : priority === "Medium" ? "#fbbf24" : "#34d399";

  return (
    <div className="dashboardMain">
      <header className="dashboardHeader">
        <div className="headerBranding">
          <h1 className="logoText">
            <span>LEGALLENS</span> Create Case
          </h1>
          <p className="systemStatus">Fill in the details below to open a new investigation case</p>
        </div>
        <div className="createHeaderActions">
          <button className="secondaryActionBtn createHeaderCancelBtn" onClick={() => navigate("/cases")} disabled={submitting}>
            Cancel
          </button>
          <button className="primaryActionBtn createHeaderSubmitBtn" onClick={handleCreate} disabled={submitting}>
            <Plus size={15} />
            {submitting ? "Creating..." : "Create Case"}
          </button>
        </div>
      </header>

      <div className="createPanelsContainer">
        <div className="createCasePanel">
          <div className="sectionHeader">
            <h2>CASE DETAILS</h2>
          </div>

          <div className="createHPanel">
            <div className="createHRow">
              <label className="createHLabel">
                Case Title <span className="createRequiredStar">*</span>
              </label>
              <input
                className="createHInput"
                type="text"
                placeholder="e.g. Downtown Bank Robbery"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="createHRow createRowAlignTop">
              <label className="createHLabel createLabelPadTop">
                Description <span className="createRequiredStar">*</span>
              </label>
              <textarea
                className="createHInput createTextarea"
                placeholder="Describe the case in detail..."
                value={description}
                onChange={(e) => setDesc(e.target.value)}
                rows={3}
              />
            </div>

            <div className="createHRow">
              <label className="createHLabel">Date of Crime</label>
              <input className="createHInput" type="date" value={crimeDate} max={new Date().toISOString().split("T")[0]} onChange={(e) => setCrimeDate(e.target.value)} />
            </div>

            <div className="createHRow">
              <label className="createHLabel">Case Start Date</label>
              <input
                className="createHInput"
                type="date"
                value={startDate}
                max={new Date().toISOString().split("T")[0]}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="createCasePanel">
          <div className="sectionHeader">
            <h2>ASSIGN MEMBERS</h2>
          </div>

          <div className="createHPanel">
            <div className="createHRow">
              <label className="createHLabel">Filter by Role</label>
              <select className="createHInput createFilterSelect" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                <option value="">All Roles</option>
                {roles.map((r) => (
                  <option key={r._id} value={r.role_name}>
                    {r.role_name.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>

            <div className="createHRow">
              <label className="createHLabel">Filter by Region</label>
              <div className="createRegionFilterWrap">
                <select
                  className="createHInput createFilterSelect createRegionSelect"
                  value={regionFilter}
                  onChange={(e) => setRegionFilter(e.target.value)}
                >
                  <option value="">All Regions</option>
                  {regions.map((r) => (<option key={r} value={r}>{r}</option>))}
                </select>
                {(roleFilter || regionFilter) && (
                  <button type="button" className="createFilterClear" onClick={() => {setRoleFilter("");setRegionFilter("");}}>
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            <div className="createHRow">
              <label className="createHLabel">Search Members</label>
              <div className="createSearchWrapper">
                <div className="membersSearch">
                  <Search size={16} color="#475569" />
                  <input
                    type="text"
                    placeholder="Search by name..."
                    value={searchTerm}
                    onChange={(e) => setSearch(e.target.value)}
                    className="createSearchInput"
                  />
                  {searchTerm && (
                    <button type="button" onClick={() => setSearch("")} className="createSearchClearBtn">
                      <X size={14} />
                    </button>
                  )}
                </div>
                {searchResults.length > 0 && (
                  <div className="createSearchResults">
                    {searchResults.map((u) => (
                      <div key={u._id} className="createSearchItem">
                        <div className="createSearchTextWrap">
                          <p className="createSearchName">{u.name}</p>
                          <p className="createSearchRole">
                            {u.role_id?.role_name?.replace(/_/g, " ")}
                            {u.Region ? ` · ${u.Region}` : ""}
                          </p>
                        </div>
                        <button type="button" className="createAddBtn" onClick={() => addMember(u)}>
                          <Plus size={12} /> Add
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {searchTerm && searchResults.length === 0 && <p className="createSearchEmpty">No members found.</p>}
              </div>
            </div>

            <div className="createHRow">
              <label className="createHLabel">Lead Investigator</label>
              <select
                className={`createHInput createFilterSelect `}
                value={leader}
                onChange={(e) => setLeader(e.target.value)}
              >
                <option value="">— Select Lead Investigator —</option>
                {leaders.map((l) => (<option key={l._id} value={l._id}>{l.name}</option>))}
              </select>
            </div>

            <div className="createHRow createRowAlignTop">
              <label className="createHLabel createLabelPadTop">Assigned ({assignedMembers.length})</label>
              {assignedMembers.length > 0 ? (
                <div className="createChipsWrap">
                  {assignedMembers.map((m) => (
                    <span key={m._id} className="memberChip">
                      {m.name}
                      <button type="button" onClick={() => removeMember(m._id)} className="memberChipRemove">
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (<div className="createEmptyAssigned">Search above to add team members</div>)}
            </div>
          </div>
        </div>

        <div className="createCasePanel">
          <div className="sectionHeader">
            
            <h2>CASE SETTINGS</h2>
          </div>
          <div className="createHPanel">
            <div className="createHRow">
              <label className="createHLabel">Priority Level</label>
              <div className="createBtnGroup">
                {["High", "Medium", "Low"].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`createGroupBtn ${priority === p ? "createGroupBtnActive" : ""}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="createHRow">
              <label className="createHLabel">Initial Status</label>
              <div className="createBtnGroup">
                {["Open","Close","Archived"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={`createGroupBtn ${status === s? "createGroupBtnActive" : ""}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="createHRow createRowAlignTop">
              <label className="createHLabel createLabelPadTop">Summary</label>
              <div className="createSummaryBox createSummaryBoxFixed">
                <div className="createSummaryRow">
                  <span>Title</span>
                  <span>{title.trim() || <em className="createSummaryEmpty">Not set</em>}</span>
                </div>
                <div className="createSummaryRow">
                  <span>Crime Date</span>
                  <span>{crimeDate || <em className="createSummaryEmpty">Not set</em>}</span>
                </div>
                <div className="createSummaryRow">
                  <span>Start Date</span>
                  <span>{startDate || "Today"}</span>
                </div>
                <div className="createSummaryRow">
                  <span>Priority</span>
                  <span style={{ color: priorityColor }}>{priority}</span>
                </div>
                <div className="createSummaryRow">
                  <span>Status</span>
                  <span className="createSummaryStatus">{status}</span>
                </div>
                <div className="createSummaryRow">
                  <span>Lead</span>
                  <span>{leaders.find((l) => l._id === leader)?.name || <em className="createSummaryEmpty">None</em>}</span>
                </div>
                <div className="createSummaryRow">
                  <span>Members</span>
                  <span className="createSummaryMembers">{assignedMembers.length} assigned</span>
                </div>
              </div>
            </div>

            <div className="createHRow">
              <label className="createHLabel" />
              <div className="createSubmitWrap">
                <button type="button" className="btnCancel createSubmitCancel" onClick={() => navigate("/cases")} disabled={submitting}>
                  Cancel
                </button>
                <button type="button" className="btnCreate createSubmitConfirm" onClick={handleCreate} disabled={submitting}>
                  <Plus size={15} />
                  {submitting ? "Creating..." : "Create Case"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}