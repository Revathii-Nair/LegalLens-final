import React, { useCallback, useEffect, useState, useRef } from "react";
import { Upload, CheckCircle, Trash2, FileText, Image, File, Video, Music, Calendar, User, X, Plus, Download, Eye } from "lucide-react";
import api from "../../api.js";
import "../../components/Components.css";

const canUpload = (role) => [1, 2, 3].includes(role);
const canVerify = (role) => [1, 2, 3].includes(role);
const canDelete = (role) => role === 1;

function FileIcon({ type, size = 20 }) {
  if (!type) return <File size={size} color="#94a3b8" />;
  if (type.startsWith("image/")) return <Image size={size} color="#818cf8" />;
  if (type === "application/pdf") return <FileText size={size} color="#f87171" />;
  if (type.startsWith("video/")) return <Video size={size} color="#34d399" />;
  if (type.startsWith("audio/")) return <Music size={size} color="#fbbf24" />;
  return <File size={size} color="#94a3b8" />;
}

function PreviewModal({ item, onClose }) {
  const fileUrl = item.file_url?.startsWith("http") ? item.file_url : `${api.defaults.baseURL}${item.file_url}`;
  const type = item.file_type || "";

  return (
    <div className="previewModalOverlay" onClick={onClose}>
      <div className="previewModalHeader" onClick={(e) => e.stopPropagation()}>
        <div className="previewModalHeaderLeft">
          <FileIcon type={type} size={18} />
          <div>
            <p className="previewModalTitle">{item.title}</p>
            <p className="previewModalSubtitle">
              {item.file_name} · Case #{item.case_id}
              {item.case_title ? ` · ${item.case_title}` : ""}
            </p>
          </div>
        </div>
        <div className="previewModalHeaderRight">
          <a
            href={fileUrl}
            target="_blank"
            rel="noreferrer noopener"
            download={item.file_name}
            className="previewModalDownloadBtn"
            onClick={(e) => e.stopPropagation()}
          >
            <Download size={14} /> Download
          </a>
          <button onClick={onClose} className="previewModalCloseBtn">
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="previewModalBody" onClick={(e) => e.stopPropagation()}>
        {type.startsWith("image/") ? (
          <img src={fileUrl} alt={item.title} className="previewImg" />
        ) : type === "application/pdf" ? (
          <iframe src={fileUrl} title={item.title} className="previewIframe" />
        ) : type.startsWith("video/") ? (
          <video controls autoPlay className="previewVideo">
            <source src={fileUrl} type={type} />
            Your browser does not support this video format.
          </video>
        ) : type.startsWith("audio/") ? (
          <div className="previewAudioContainer">
            <div className="previewAudioIconWrap">
              <Music size={40} color="#fbbf24" />
            </div>
            <p className="previewAudioName">{item.file_name}</p>
            <audio controls autoPlay className="previewAudioPlayer">
              <source src={fileUrl} type={type} />
              Your browser does not support this audio format.
            </audio>
          </div>
        ) : (
          <div className="previewFallbackContainer">
            <div className="previewFallbackIconWrap">
              <File size={36} color="#64748b" />
            </div>
            <p className="previewFallbackName">{item.file_name}</p>
            <p className="previewFallbackText">This file type cannot be previewed in the browser.</p>
            <a href={fileUrl} download={item.file_name} className="previewFallbackDownload">
              <Download size={16} /> Download File
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default function EvidenceTab({ caseId, userRole, onActivity }) {
  const [evidence, setEvidence] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({ title: "", description: "" });
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const [verifyTarget, setVerifyTarget] = useState(null);
  const [verifyNote, setVerifyNote] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);
  const fileInputRef = useRef(null);

  const fetchEvidence = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/case/${caseId}/evidence`);
      setEvidence(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching evidence:", err);
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    fetchEvidence();
  }, [fetchEvidence]);

  const handleFileSelect = (file) => {
    setSelectedFile(file);
    if (!uploadForm.title)
      setUploadForm((p) => ({
        ...p,
        title: file.name.replace(/\.[^/.]+$/, ""),
      }));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleUpload = async () => {
    if (!uploadForm.title.trim()) return setError("Please enter a title");
    if (!selectedFile) return setError("Please select a file");
    setError("");
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("title", uploadForm.title);
      formData.append("description", uploadForm.description);
      await api.post(`/case/${caseId}/evidence`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUploadForm({ title: "", description: "" });
      setSelectedFile(null);
      setShowUploadForm(false);
      fetchEvidence();
      onActivity?.();
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const submitVerify = async () => {
    if (!verifyTarget) return;
    setVerifying(true);
    try {
      await api.patch(`/evidence/${verifyTarget._id}/verify`, {
        note: verifyNote.trim(),
      });
      setEvidence((prev) =>
        prev.map((e) =>
          e._id === verifyTarget._id
            ? {
                ...e,
                verified: true,
                verified_note: verifyNote.trim(),
                verified_at: new Date().toISOString(),
                verified_by: "You",
              }
            : e,
        ),
      );
      setVerifyTarget(null);
      setVerifyNote("");
      onActivity?.();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to verify evidence");
    } finally {
      setVerifying(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete evidence "${title}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/evidence/${id}`);
      setEvidence((prev) => prev.filter((e) => e._id !== id));
      onActivity?.();
    } catch {
      alert("Failed to delete evidence");
    }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const formatTime = (d) => new Date(d).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="tabFilesContainer">
      {previewItem && <PreviewModal item={previewItem} onClose={() => setPreviewItem(null)} />}

      <div className="evidenceTabHeader">
        <p className="evidenceTabCount">
          {evidence.length} evidence item{evidence.length !== 1 ? "s" : ""} for Case #{caseId}
        </p>
        {canUpload(userRole) && (
          <button className="btnUpload evidenceTabUploadBtn" onClick={() => setShowUploadForm((v) => !v)}>
            {showUploadForm ? (
              <>
                <X size={16} /> Cancel
              </>
            ) : (
              <>
                <Plus size={16} /> Upload Evidence
              </>
            )}
          </button>
        )}
      </div>

      {showUploadForm && canUpload(userRole) && (
        <div className="evidenceUploadCard">
          <div className="sectionHeader evidenceUploadHeader">
            <div className="indicatorDot evidenceUploadDot" />
            <h3 className="evidenceUploadTitle">Upload New Evidence</h3>
          </div>

          {error && <div className="alertBanner alertError evidenceAlertBanner">{error}</div>}

          <div className="evidenceFormGrid">
            <div className="inputGroup">
              <label>Evidence Title *</label>
              <input
                type="text"
                value={uploadForm.title}
                onChange={(e) => setUploadForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="e.g. Crime Scene Photo #1"
              />
            </div>
            <div className="inputGroup">
              <label>Case ID (auto)</label>
              <input type="text" value={`Case #${caseId}`} readOnly className="evidenceCaseIdInput" />
            </div>
            <div className="inputGroup evidenceDescGroup">
              <label>Description</label>
              <textarea
                value={uploadForm.description}
                onChange={(e) => setUploadForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Describe this evidence..."
                rows={2}
                className="evidenceDescTextarea"
              />
            </div>
          </div>

          <div
            className={`evidenceDropZone ${dragOver ? "evidenceDropZoneActive" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="*/*"
              className="evidenceHiddenInput"
              onChange={(e) => {
                if (e.target.files[0]) handleFileSelect(e.target.files[0]);
              }}
            />
            {selectedFile ? (
              <div className="evidenceFilePreview">
                <FileIcon type={selectedFile.type} />
                <div>
                  <p className="evidenceFileName">{selectedFile.name}</p>
                  <p className="evidenceFileSize">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                </div>
                <button
                  className="evidenceFileRemoveBtn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="evidenceDropContent">
                <Upload size={32} color="#334155" className="evidenceDropIcon" />
                <p className="evidenceDropText">
                  Drag & drop or <span className="evidenceDropHighlight">click to browse</span>
                </p>
                <p className="evidenceDropSubtext">PDF, Images, Videos, Audio — Max 50MB</p>
              </div>
            )}
          </div>

          <div className="evidenceFormActions">
            <button
              className="btnCancel"
              onClick={() => {
                setShowUploadForm(false);
                setSelectedFile(null);
                setError("");
              }}
            >
              Cancel
            </button>
            <button className="btnCreate" onClick={handleUpload} disabled={uploading}>
              {uploading ? (
                "Uploading..."
              ) : (
                <>
                  <Upload size={16} className="evidenceBtnIcon" /> Upload Evidence
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="evidenceLoadingState">
          <div className="miniSpinner evidenceSpinner" />
          Loading evidence...
        </div>
      ) : evidence.length === 0 ? (
        <div className="evidenceEmpty">
          <File size={40} color="#334155" />
          <p className="evidenceEmptyText">No evidence uploaded yet</p>
          {canUpload(userRole) && <p className="evidenceEmptySubtext">Upload files using the button above</p>}
        </div>
      ) : (
        <div className="evidenceList">
          {evidence.map((e) => (
            <div key={e._id} className="evidenceItem">
              <div className="evidenceItemIcon">
                <FileIcon type={e.file_type} />
              </div>
              <div className="evidenceItemContent">
                <div className="evidenceItemHeader">
                  <p className="evidenceItemTitle">{e.title}</p>
                  {e.verified ? (
                    <span className="evidenceVerifiedBadge">
                      <CheckCircle size={10} /> Verified
                    </span>
                  ) : (
                    <span className="evidenceUnverifiedBadge">Unverified</span>
                  )}
                </div>
                {e.description && <p className="evidenceItemDesc">{e.description}</p>}
                {e.case_title && (
                  <p className="evidenceItemMetaText">
                    <strong>Case title:</strong> {e.case_title}
                  </p>
                )}
                {e.verified_note && (
                  <p className="evidenceItemMetaText">
                    <strong>Verification note:</strong> {e.verified_note}
                  </p>
                )}
                {e.file_name && (
                  <div className="evidenceFileNameWrap">
                    <span className="evidenceFileNamePill">📁 {e.file_name}</span>
                  </div>
                )}
                <div className="evidenceItemFooter">
                  <span className="evidenceFooterItem">
                    <User size={11} /> {e.uploaded_by}
                  </span>
                  <span className="evidenceFooterItem">
                    <Calendar size={11} /> {formatDate(e.created_at)} at {formatTime(e.created_at)}
                  </span>
                </div>
              </div>
              <div className="evidenceItemActions">
                {e.file_url && (
                  <button className="actionCircle evidenceActionPreview" title="Preview file" onClick={() => setPreviewItem(e)}>
                    <Eye size={15} />
                  </button>
                )}
                {canVerify(userRole) && !e.verified && (
                  <button
                    className="actionCircle evidenceActionVerify"
                    onClick={() => {
                      setVerifyTarget(e);
                      setVerifyNote("");
                    }}
                    title="Verify evidence"
                  >
                    <CheckCircle size={15} />
                  </button>
                )}
                {canDelete(userRole) && !e.verified && (
                  <button className="actionCircle evidenceActionDelete" onClick={() => handleDelete(e._id, e.title)} title="Delete evidence">
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {verifyTarget && (
        <div className="verifyModalOverlay">
          <div className="verifyModalBox">
            <div className="verifyModalHeader">
              <div>
                <h3 className="verifyModalTitle">Verify Evidence</h3>
                <p className="verifyModalSubtitle">Confirm verification for "{verifyTarget.title}" and add a note.</p>
              </div>
              <button type="button" onClick={() => setVerifyTarget(null)} className="verifyModalCloseBtn">
                <X size={18} />
              </button>
            </div>
            <div className="inputGroup verifyModalInputGroup">
              <label>Verification Notes</label>
              <textarea
                value={verifyNote}
                onChange={(e) => setVerifyNote(e.target.value)}
                placeholder="Optional: why this evidence is verified"
                rows={4}
                className="verifyModalTextarea"
              />
            </div>
            <div className="verifyModalActions">
              <button type="button" className="btnCancel" onClick={() => setVerifyTarget(null)}>
                Cancel
              </button>
              <button type="button" className="btnCreate" onClick={submitVerify} disabled={verifying}>
                {verifying ? "Verifying..." : "Verify Evidence"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
