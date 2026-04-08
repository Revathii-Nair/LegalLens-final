import React, { useState } from "react";
import { UserMinus, Search, UserPlus } from "lucide-react";
import api from "../../api.js";
import "../../components/Components.css";

const ROLE_COLORS = {
  Lead_Investigator: { color: "#34d399", bg: "rgba(52,211,153,0.1)" },
  Forensic_Officer: { color: "#fbbf24", bg: "rgba(251,191,36,0.1)" },
  Police_Officer: { color: "#60a5fa", bg: "rgba(96,165,250,0.1)" },
  Supervising_Officer: { color: "#818cf8", bg: "rgba(129,140,248,0.1)" },
};

export default function MembersTab({ members, leadInvestigators, memberDetails, caseId, isAdmin, onRefresh, onActivity }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addMsg, setAddMsg] = useState("");

  const handleSearch = async (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    if (val.length >= 1) {
      try {
        const res = await api.get(`/users/search?q=${encodeURIComponent(val)}`);
        setSearchResults(Array.isArray(res.data) ? res.data : []);
      } catch {
        setSearchResults([]);
      }
    } else {
      setSearchResults([]);
    }
  };

  const handleAddMember = async (userId, userName) => {
    setAdding(true);
    setAddMsg("");
    try {
      await api.post(`/case/${caseId}/member`, { user_id: userId });
      setSearchTerm("");
      setSearchResults([]);
      setShowSearch(false);
      setAddMsg(`${userName} added successfully`);
      onRefresh?.();
      onActivity?.();
      setTimeout(() => setAddMsg(""), 3000);
    } catch (err) {
      setAddMsg(err.response?.data?.message || "Failed to add member");
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveMember = async (userId, name) => {
    if (!window.confirm(`Remove ${name} from this case?`)) return;
    try {
      await api.delete(`/case/${caseId}/member/${userId}`);
      onRefresh?.();
      onActivity?.();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to remove member");
    }
  };
  const details = memberDetails?.length > 0 ? memberDetails : members.map((name) => ({ name, role: null, id: null }));

  return (
    <div className="memberTabContainer">
      {isAdmin && (
        <div className="memberTabAdminSection">
          <button
            className="memberTabAddBtn"
            onClick={() => {
              setShowSearch((v) => !v);
              setSearchTerm("");
              setSearchResults([]);
              setAddMsg("");
            }}
          >
            <UserPlus size={15} /> {showSearch ? "Cancel" : "Add Member"}
          </button>

          {addMsg && (
            <p className={`memberTabMsg ${addMsg.includes("success") || addMsg.includes("added") ? "memberTabMsgSuccess" : "memberTabMsgError"}`}>
              {addMsg}
            </p>
          )}

          {showSearch && (
            <div className="memberTabSearchWrapper">
              <div className="membersSearch memberTabSearchInputWrap">
                <Search size={16} color="#475569" />
                <input
                  type="text"
                  className="memberTabSearchInput"
                  value={searchTerm}
                  onChange={handleSearch}
                  placeholder="Search members by name or role..."
                  autoFocus
                />
              </div>

              {searchResults.length > 0 && (
                <div className="searchDropdown memberTabSearchDropdown">
                  {searchResults.map((u) => (
                    <div key={u._id} className="searchItem memberTabSearchItem">
                      <div>
                        <p className="memberTabSearchName">{u.name}</p>
                        <p className="memberTabSearchRole">
                          {u.role_id && u.role_id.role_name ? u.role_id.role_name.replace(/_/g, " ") : ""} • {u.Region || "—"}
                        </p>
                      </div>
                      <button className="memberTabSearchAddBtn" onClick={() => handleAddMember(u._id, u.name)} disabled={adding}>
                        {adding ? "Adding..." : "Add"}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {searchTerm.length >= 1 && searchResults.length === 0 && <p className="memberTabSearchEmpty">No users found matching "{searchTerm}"</p>}
            </div>
          )}
        </div>
      )}

      {/* Member List */}
      {details.length === 0 ? (
        <p className="memberTabEmpty">No members assigned to this case</p>
      ) : (
        details.map((member, i) => {
          const isLead = leadInvestigators.includes(member.name);
          const roleStyle = ROLE_COLORS[member.role];

          return (
            <div key={member.id || i} className="memberTabRow">
              <div className="memberTabRowLeft">
                <div className="avatarCircle">{member.name?.charAt(0)?.toUpperCase()}</div>
                <div>
                  <p className="memberTabRowName">
                    {member.name}
                    {isLead && <span className="memberTabRowLead">★ Lead</span>}
                  </p>
                  <span
                    className="memberTabRowRole"
                    style={{
                      background: roleStyle.bg,
                      color: roleStyle.color,
                    }}
                  >
                    {member.role.replace(/_/g, " ")}
                  </span>
                </div>
              </div>

              {isAdmin && member.id && (
                <button
                  className="actionCircle memberTabRemoveBtn"
                  onClick={() => handleRemoveMember(member.id, member.name)}
                  title="Remove from case"
                >
                  <UserMinus size={15} style={{ color: "#f87171" }} />
                </button>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
