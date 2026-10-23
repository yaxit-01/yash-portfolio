import { useState, useEffect, useCallback, useMemo } from "react";
import {
  CloseIcon,
  SearchIcon,
  PlusIcon,
  FileTextIcon,
  CheckIcon,
  RefreshIcon,
} from "./Icons";
import {
  listAllMediaFiles,
  uploadMediaFile,
  formatBytes,
} from "../services/mediaService";

export function MediaPickerModal({
  isOpen,
  onClose,
  onSelect,
  currentUrl = "",
  folder = "certificates",
  title = "Select from Media Library",
}) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const fetchFiles = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listAllMediaFiles();
      setFiles(data);
    } catch (err) {
      console.error("Failed to load media items:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      // oxlint-disable-next-line react/set-state-in-effect
      fetchFiles();
      setSearchQuery("");
      setSelectedFile(null);
      setUploadError(null);
    }
  }, [isOpen, fetchFiles]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    try {
      setUploading(true);
      const uploaded = await uploadMediaFile({ file, folder });
      await fetchFiles();
      setSelectedFile(uploaded);
    } catch (err) {
      setUploadError(err.message || "Failed to upload file.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const filteredFiles = useMemo(() => {
    return files.filter((f) => {
      const matchesSearch =
        !searchQuery ||
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.folder.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFilter =
        filterType === "all" ||
        (filterType === "images" && f.category === "image") ||
        (filterType === "documents" && f.category === "pdf");

      return matchesSearch && matchesFilter;
    });
  }, [files, searchQuery, filterType]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (selectedFile) {
      onSelect({
        publicUrl: selectedFile.publicUrl,
        name: selectedFile.name,
        fullPath: selectedFile.fullPath,
      });
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal-card modal-lg media-picker-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="picker-title"
      >
        <div className="modal-header">
          <div>
            <h3 id="picker-title">{title}</h3>
            <p className="modal-subtitle">
              Select an existing asset from Supabase Storage or upload a new file.
            </p>
          </div>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close media picker"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        {/* Picker Toolbar */}
        <div className="media-picker-toolbar">
          <div className="media-search-input-wrapper">
            <SearchIcon size={16} className="search-icon-inside" />
            <input
              type="text"
              placeholder="Search assets by filename..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="picker-filter-buttons">
            <button
              type="button"
              className={`filter-btn-pill ${filterType === "all" ? "active" : ""}`}
              onClick={() => setFilterType("all")}
            >
              All ({files.length})
            </button>
            <button
              type="button"
              className={`filter-btn-pill ${filterType === "images" ? "active" : ""}`}
              onClick={() => setFilterType("images")}
            >
              Images
            </button>
            <button
              type="button"
              className={`filter-btn-pill ${filterType === "documents" ? "active" : ""}`}
              onClick={() => setFilterType("documents")}
            >
              PDFs
            </button>
          </div>

          <div className="picker-upload-action">
            <label className="btn-primary btn-sm upload-label-btn">
              <PlusIcon size={14} />
              <span>{uploading ? "Uploading..." : "Upload New"}</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml,application/pdf"
                onChange={handleFileUpload}
                disabled={uploading}
                style={{ display: "none" }}
              />
            </label>
            <button
              type="button"
              className="btn-icon"
              onClick={fetchFiles}
              title="Refresh media files"
            >
              <RefreshIcon size={15} />
            </button>
          </div>
        </div>

        {uploadError && (
          <div className="picker-upload-error">
            <span>{uploadError}</span>
          </div>
        )}

        {/* Content Area */}
        <div className="media-picker-grid-wrapper">
          {loading ? (
            <div className="page-loader">Loading media library assets...</div>
          ) : filteredFiles.length === 0 ? (
            <div className="card-empty-notice">
              <p>No media files found matching your search. Click 'Upload New' to add files.</p>
            </div>
          ) : (
            <div className="media-picker-grid">
              {filteredFiles.map((file) => {
                const isSelected = selectedFile?.fullPath === file.fullPath || (!selectedFile && currentUrl === file.publicUrl);
                const isPdf = file.category === "pdf" || file.name.toLowerCase().endsWith(".pdf");

                return (
                  <div
                    key={file.id}
                    className={`media-picker-item ${isSelected ? "is-selected" : ""}`}
                    onClick={() => setSelectedFile(file)}
                  >
                    <div className="picker-item-thumb">
                      {isPdf ? (
                        <div className="pdf-thumb-box">
                          <FileTextIcon size={28} />
                          <span className="pdf-thumb-badge">PDF</span>
                        </div>
                      ) : (
                        <img src={file.publicUrl} alt={file.name} loading="lazy" />
                      )}
                      {isSelected && (
                        <div className="selection-checkmark-badge">
                          <CheckIcon size={14} />
                        </div>
                      )}
                    </div>
                    <div className="picker-item-details">
                      <span className="picker-item-name" title={file.name}>
                        {file.name}
                      </span>
                      <span className="picker-item-size">{formatBytes(file.size)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="modal-actions" style={{ justifyContent: "space-between" }}>
          <div className="selected-preview-hint">
            {selectedFile ? (
              <span>Selected: <strong>{selectedFile.name}</strong></span>
            ) : (
              <span>Click a file above to select it</span>
            )}
          </div>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={!selectedFile}
              onClick={handleConfirm}
            >
              Use Selected Asset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

