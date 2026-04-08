import React from "react";
import { useNavigate } from "react-router-dom";
import "../../components/Components.css";

const pri_cls = {
  High: "rowPriorityHigh",
  Medium: "rowPriorityMedium",
  Low: "rowPriorityLow",
};
const stats_cls = {
  Open: "rowStatusOpen",
  Close: "rowStatusClose",
  Archived: "rowStatusArchived",
};

export default function CaseRow({ id, title, priority, status }) {
  const navigate = useNavigate();
  return (
    <div className="caseRowItem" onClick={() => navigate(`/cases/${id}`)}>
      <div className="caseRowInfo">
        <span className="caseRowId">#{id}</span>
        <span className="caseRowTitle">{title}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span className={`caseRowBadge ${pri_cls[priority] || ""}`}>{priority}</span>
        <span className={`caseRowBadge ${stats_cls[status] || ""}`}>{status}</span>
      </div>
    </div>
  );
}
