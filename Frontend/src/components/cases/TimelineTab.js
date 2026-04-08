import React, { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, Calendar } from "lucide-react";
import api from "../../api.js";
import "../../components/Components.css";

export default function TimelineTab({ caseId, caseData, refreshKey = 0 }) {
  const user = JSON.parse(localStorage.getItem("user"));
  const isAdminOrLead = user?.role_id === 1 || user?.role_id === 2;

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", event_date: "", description: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const fetchEvents = useCallback(async () => {
    try {
      const res = await api.get(`/case/${caseId}/events`);
      setEvents(Array.isArray(res.data) ? res.data : []);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!active) return;
      await fetchEvents();
    };
    load();
    const interval = setInterval(load, 5000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [fetchEvents, refreshKey]);

  const handleAdd = async () => {
    if (!form.title.trim()) return setError("Event title is required");
    setError("");
    setSubmitting(true);
    try {
      await api.post(`/case/${caseId}/events`, {
        title: form.title.trim(),
        event_date: form.event_date ? new Date(form.event_date).toISOString() : new Date().toISOString(),
        description: form.description,
      });
      setForm({ title: "", event_date: "", description: "" });
      setShowForm(false);
      setSuccessMsg("Event added successfully");
      fetchEvents();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add event");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (eventId) => {
    if (!window.confirm("Delete this timeline event?")) return;
    try {
      await api.delete(`/case/${caseId}/events/${eventId}`);
      setEvents((prev) => prev.filter((e) => e._id !== eventId));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete event");
    }
  };

  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—";

  const isRealDbEvent = (event) => {
    if (event.isSystem) return false;
    const id = String(event._id || "");
    if (id.startsWith("legacy-") || id.startsWith("case-open") || id.startsWith("case-close") || id.startsWith("lead-assign")) return false;

    return /^[a-f0-9]{24}$/i.test(id);
  };

  const baseEvents = [];
  if (caseData?.start_date) {
    baseEvents.push({
      _id: "case-open",
      title: `Case opened: "${caseData.title}"`,
      event_date: caseData.start_date,
      isSystem: true,
      color: "#4f46e5",
    });
  }
  if (caseData?.leadInvestigators?.length) {
    baseEvents.push({
      _id: "lead-assign",
      title: `Lead Investigator: ${caseData.leadInvestigators.join(", ")}`,
      event_date: caseData.start_date,
      isSystem: true,
      color: "#34d399",
    });
  }

  const allEvents = [...baseEvents, ...events.map((e) => ({ ...e, color: "#818cf8" }))];

  if (caseData?.status === "Close" && caseData?.end_date) {
    allEvents.push({
      _id: "case-close",
      title: "Case closed",
      event_date: caseData.end_date,
      isSystem: true,
      color: "#f87171",
    });
  }

  allEvents.sort((a, b) => new Date(a.event_date || 0) - new Date(b.event_date || 0));

  return (
    <div className="timelineContainer">
      {isAdminOrLead && (
        <div className="timelineAddSection">
          <button
            className="timelineAddBtn"
            onClick={() => {
              setShowForm((v) => !v);
              setError("");
            }}
          >
            <Plus size={15} />
            {showForm ? "Cancel" : "Add Timeline Event"}
          </button>

          {successMsg && <p className="timelineSuccessMsg">{successMsg}</p>}

          {showForm && (
            <div className="timelineFormBox">
              {error && <p className="timelineErrorMsg">{error}</p>}
              <div className="timelineFormGrid">
                <div className="inputGroup">
                  <label>Event Title *</label>
                  <input
                    type="text"
                    placeholder="e.g. Witness interviewed"
                    value={form.title}
                    onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  />
                </div>
                <div className="inputGroup">
                  <label>Date</label>
                  <input type="date" value={form.event_date} onChange={(e) => setForm((p) => ({ ...p, event_date: e.target.value }))} />
                </div>
                <div className="inputGroup timelineDescGroup">
                  <label>Description</label>
                  <input
                    type="text"
                    placeholder="Optional details..."
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  />
                </div>
              </div>
              <div className="timelineFormActions">
                <button
                  className="btnCancel"
                  onClick={() => {
                    setShowForm(false);
                    setError("");
                  }}
                >
                  Cancel
                </button>
                <button className="btnCreate" onClick={handleAdd} disabled={submitting}>
                  {submitting ? "Adding..." : "Add Event"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="timelineLoadingState">
          <div className="miniSpinner timelineSpinner" />
          Loading timeline...
        </div>
      ) : allEvents.length === 0 ? (
        <p className="timelineEmptyState">No timeline events yet</p>
      ) : (
        allEvents.map((event, i) => (
          <div key={event._id} className="timelineEntry">
            <div className="timelineConnectorCol">
              <div className="timelineDot" style={{ background: event.color }} />
              {i < allEvents.length - 1 && <div className="timelineLine" />}
            </div>
            <div className="timelineContentCol" style={{ paddingBottom: i < allEvents.length - 1 ? "1.25rem" : 0 }}>
              <div>
                <p className="timelineInfo">{event.title}</p>
                {event.description && <p className="timelineItemDesc">{event.description}</p>}
                <div className="timelineItemMeta">
                  <Calendar size={10} color="#334155" />
                  <span className="timelineItemMetaText">
                    {formatDate(event.event_date)}
                    {event.created_by?.name && <span> • Added by {event.created_by.name}</span>}
                  </span>
                </div>
              </div>

              {isAdminOrLead && isRealDbEvent(event) && (
                <button className="actionCircle timelineDeleteBtn" onClick={() => handleDelete(event._id)} title="Delete event">
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
