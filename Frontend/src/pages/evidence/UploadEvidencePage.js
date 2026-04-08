import React, { useEffect, useRef, useState } from "react";
import { Upload, FileText, Image, Film, File, CheckCircle, AlertCircle, X, FolderOpen, Paperclip, Shield } from "lucide-react";
import api from "../../api.js";
import "../dashboard/Dashboard.css";
import "../../components/Components.css";

function fileIcon(mime = "") {
  if (mime.startsWith("image/")) return <Image size={18} />;
  if (mime.startsWith("video/")) return <Film size={18} />;
  if (mime === "application/pdf") return <FileText size={18} />;
  return <File size={18} />;
}

function fmtSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadEvidencePage() {
  const user = JSON.parse(localStorage.getItem("user"));
  const [cases, setCases] = useState([]);
  const [casesLoading, setCasesLoading] = useState(true);
  const [selectedCase, setCase] = useState("");
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [history, setHistory] = useState([]);
  const [histLoading, setHistLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const fileRef = useRef(null);

  const flash = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: "", text: "" }), 5000);
  };

  useEffect(() => {
    const loadCases = async () => {
      setCasesLoading(true);
      try {
        await api.get("/assigned-cases?limit=50");
        const all = await api.get("/cases");
        const data = Array.isArray(all.data) ? all.data : [];
        setCases(data.filter((c) => c.status !== "Close" && c.status !== "Archived"));
      } catch {
        setCases([]);
      } finally {
        setCasesLoading(false);
      }
    };

    loadCases();
  }, []);

  useEffect(() => {
    const loadHistory = async () => {
      if (!selectedCase) {
        setHistory([]);
        return;
      }
      setHistLoading(true);
      try {
        const res = await api.get(`/case/${selectedCase}/evidence`);
        setHistory(Array.isArray(res.data) ? res.data : []);
      } catch {
        setHistory([]);
      } finally {
        setHistLoading(false);
      }
    };

    loadHistory();
  }, [selectedCase]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  };

  const handleUpload = async () => {
    if (!selectedCase) return flash("error", "Please select a case first.");
    if (!title.trim()) return flash("error", "Evidence title is required.");
    if (!file) return flash("error", "Please attach a file.");

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("title", title.trim());
      fd.append("description", desc.trim());
      fd.append("file", file);

      await api.post(`/case/${selectedCase}/evidence`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      flash("success", `Evidence "${title.trim()}" uploaded successfully!`);
      setTitle("");
      setDesc("");
      setFile(null);

      const res = await api.get(`/case/${selectedCase}/evidence`);
      setHistory(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      flash("error", err.response?.data?.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const selectedCaseData = cases.find((c) => String(c.case_id ?? c.caseId ?? c._id) === String(selectedCase));

  return (
    <div className="dashboardMain">
      <header className="dashboardHeader">
        <div className="headerBranding">
          <h1 className="logoText">
            <span>LEGALLENS</span> Upload Evidence
          </h1>
          <p className="systemStatus">
            Upload evidence files for your assigned cases • <span className="highlightText">{user?.name}</span>
          </p>
        </div>
      </header>

      {msg.text && (
        <div className={`alertBanner uploadAlertBanner ${msg.type === "success" ? "alertSuccess" : "alertError"}`}>
          {msg.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {msg.text}
        </div>
      )}

      <div className="uploadGridContainer">
        {/* Upload Form Panel */}
        <div className="formSectionCard">
          <div className="sectionHeader">
            <div className="indicatorDot uploadDotBlue" />
            <h2>NEW EVIDENCE</h2>
          </div>

          <div className="uploadFormPanel">
            <div className="inputGroup">
              <label>Select Case *</label>
              {casesLoading ? (
                <div className="uploadLoadingMsg">Loading your cases...</div>
              ) : cases.length === 0 ? (
                <div className="uploadErrorMsg">You have no active assigned cases.</div>
              ) : (
                <select
                  className={`uploadSelect ${selectedCase ? "uploadSelectActive" : "uploadSelectMuted"}`}
                  value={selectedCase}
                  onChange={(e) => setCase(e.target.value)}
                >
                  <option value="">— Choose a case —</option>
                  {cases.map((c) => (
                    <option key={c._id} value={String(c.case_id ?? c.caseId ?? c._id)}>
                      #{c.case_id ?? c.caseId} — {c.title}
                      {c.priority ? ` [${c.priority}]` : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {selectedCaseData && (
              <div className="uploadSelectedCaseBanner">
                <FolderOpen size={15} color="#60a5fa" />
                <span className="uploadSelectedCaseTitle">{selectedCaseData.title}</span>
                {selectedCaseData.status && <span className="uploadSelectedCaseStatus">{selectedCaseData.status}</span>}
              </div>
            )}

            <div className="inputGroup">
              <label>Evidence Title *</label>
              <input type="text" placeholder="e.g. CCTV Footage – 3rd Floor" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            <div className="inputGroup">
              <label>
                Description <span className="uploadDescOptional">(optional)</span>
              </label>
              <textarea
                className="uploadTextarea"
                placeholder="Add context, location, time of capture, etc."
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                rows={3}
              />
            </div>

            <div className="inputGroup">
              <label>Attach File *</label>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className="uploadDropZone"
                style={{
                  border: `2px dashed ${dragOver ? "#60a5fa" : file ? "#34d399" : "rgba(255,255,255,0.1)"}`,
                  background: dragOver ? "rgba(96,165,250,0.05)" : file ? "rgba(52,211,153,0.04)" : "rgba(255,255,255,0.02)",
                }}
              >
                <input ref={fileRef} type="file" className="uploadHiddenInput" onChange={(e) => e.target.files[0] && setFile(e.target.files[0])} />

                {file ? (
                  <div className="uploadFilePreview">
                    <span className="uploadFilePreviewIcon">{fileIcon(file.type)}</span>
                    <div className="uploadFilePreviewText">
                      <p className="uploadFilePreviewName">{file.name}</p>
                      <p className="uploadFilePreviewSize">{fmtSize(file.size)}</p>
                    </div>
                    <button
                      type="button"
                      className="uploadFilePreviewRemove"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <>
                    <Paperclip size={24} className="uploadDropIcon" />
                    <p className="uploadDropText">
                      Drag & drop or <span className="uploadDropHighlight">click to browse</span>
                    </p>
                    <p className="uploadDropSubtext">Images, videos, PDFs, documents — up to 50 MB</p>
                  </>
                )}
              </div>
            </div>

            <button
              type="button"
              className="btnCreate uploadSubmitBtn"
              onClick={handleUpload}
              disabled={uploading || !selectedCase || !title.trim() || !file}
            >
              {uploading ? (
                <>
                  <div className="miniSpinner uploadBtnSpinner" /> Uploading...
                </>
              ) : (
                <>
                  <Upload size={16} className="uploadBtnIcon" /> Upload Evidence
                </>
              )}
            </button>
          </div>
        </div>

        <div className="formSectionCard">
          <div className="sectionHeader">
            <div className="indicatorDot uploadDotPurple" />
            <h2>CASE EVIDENCE LOG</h2>
            <span className="uploadHistoryCount">{selectedCase ? `${history.length} file${history.length !== 1 ? "s" : ""}` : "Select a case"}</span>
          </div>

          {!selectedCase ? (
            <div className="uploadStateBox">
              <FolderOpen size={40} className="uploadStateIcon" />
              <p>Select a case to view its evidence log</p>
            </div>
          ) : histLoading ? (
            <div className="uploadStateBox">
              <div className="miniSpinner uploadStateSpinner" />
              Loading evidence...
            </div>
          ) : history.length === 0 ? (
            <div className="uploadStateBox">
              <Shield size={40} className="uploadStateIcon" />
              <p>No evidence uploaded for this case yet</p>
            </div>
          ) : (
            <div className="uploadHistoryList">
              {history.map((ev) => (
                <div key={ev.evidence_id ?? ev._id} className="uploadHistoryItem">
                  <div className="uploadHistoryIconBox">{fileIcon(ev.file_type || "")}</div>
                  <div className="uploadHistoryTextWrap">
                    <p className="uploadHistoryItemTitle">{ev.title}</p>
                    {ev.description && <p className="uploadHistoryItemDesc">{ev.description}</p>}
                    <div className="uploadHistoryItemMeta">
                      <span className="uploadHistoryItemUser">by {ev.uploaded_by?.name ?? ev.uploaded_by ?? "Unknown"}</span>
                      {ev.verified && <span className="uploadHistoryVerifiedBadge">✓ Verified</span>}
                    </div>
                  </div>
                  {ev.file_url && (
                    <a href={`http://localhost:5000${ev.file_url}`} target="_blank" rel="noreferrer" className="uploadHistoryViewLink">
                      View
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
