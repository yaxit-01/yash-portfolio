import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  UploadCloudIcon,
  SearchIcon,
  GridIcon,
  ListIcon,
  TrashIcon,
  EyeIcon,
  CopyIcon,
  CheckIcon,
  RefreshIcon,
  FileTextIcon,
  FolderIcon,
} from "../components/Icons";
import { ConfirmModal } from "../components/ConfirmModal";
import { MediaPreviewModal } from "../components/MediaPreviewModal";
import {
  listAllMediaFiles,
  uploadMediaFile,
  deleteMediaFile,
  checkMediaReferences,
  formatBytes,
  validateMediaFile,
} from "../services/mediaService";
import { logActivity, ACTION_TYPES, CONTENT_TYPES } from "../services/activityService";

export function MediaManager({ showToast }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & View state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all"); // "all" | "images" | "documents"
  const [viewMode, setViewMode] = useState(() => {
    try {
      return localStorage.getItem("media_library_view") || "grid";
    } catch {
      return "grid";
    }
  });

  // Upload state
  const [uploadFolder, setUploadFolder] = useState("certificates");
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const fileInputRef = useRef(null);

  // Preview & Delete state
  const [previewTarget, setPreviewTarget] = useState(null);
  const [previewReferences, setPreviewReferences] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteReferences, setDeleteReferences] = useState([]);
  const [checkingRefs, setCheckingRefs] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Copy URL state tracker
  const [copiedId, setCopiedId] = useState(null);

  // Reference cache
  const [referencesMap, setReferencesMap] = useState({});

  const fetchMedia = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);

      const mediaItems = await listAllMediaFiles();
      setFiles(mediaItems);

      // Check references for all items in the background
      const refMap = {};
      for (const item of mediaItems) {
        const refs = await checkMediaReferences(item);
        if (refs.length > 0) {
          refMap[item.fullPath] = refs;
        }
      }
      setReferencesMap(refMap);
    } catch (err) {
      showToast(`Failed to load media files: ${err.message}`, "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    fetchMedia();
  }, [fetchMedia]);

  const handleToggleView = (mode) => {
    setViewMode(mode);
    try {
      localStorage.setItem("media_library_view", mode);
    } catch {
      // ignore
    }
  };

  const handleProcessUpload = async (fileList) => {
    if (!fileList || fileList.length === 0) return;

    const filesToUpload = Array.from(fileList);
    setUploading(true);
    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i];
      setUploadProgress(`Uploading ${i + 1} of ${filesToUpload.length}: ${file.name}`);

      const validation = validateMediaFile(file);
      if (!validation.valid) {
        showToast(validation.error, "error");
        failedCount++;
        continue;
      }

      try {
        await uploadMediaFile({
          file,
          folder: uploadFolder,
        });
        successCount++;

        await logActivity({
          action_type: ACTION_TYPES.UPLOAD,
          content_type: CONTENT_TYPES.MEDIA,
          record_id: `${uploadFolder}/${file.name}`,
          record_title: file.name,
          metadata: { folder: uploadFolder, size: file.size, type: file.type },
        });
      } catch (err) {
        showToast(`Failed to upload ${file.name}: ${err.message}`, "error");
        failedCount++;
      }
    }

    setUploading(false);
    setUploadProgress(null);

    if (successCount > 0) {
      showToast(`Successfully uploaded ${successCount} asset${successCount > 1 ? "s" : ""} to "${uploadFolder}/"!`, "success");
      await fetchMedia(true);
    }
  };

  // Drag and drop handlers
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleProcessUpload(e.dataTransfer.files);
    }
  };

  const handleCopyUrl = (url, id) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(id);
      showToast("CDN URL copied to clipboard!", "success");
      setTimeout(() => setCopiedId(null), 2200);
    });
  };

  const handleOpenPreview = async (file) => {
    const refs = referencesMap[file.fullPath] || (await checkMediaReferences(file));
    setPreviewReferences(refs);
    setPreviewTarget(file);
  };

  const handleRequestDelete = async (file) => {
    setCheckingRefs(true);
    try {
      const refs = referencesMap[file.fullPath] || (await checkMediaReferences(file));
      setDeleteReferences(refs);
      setDeleteTarget(file);
    } catch {
      setDeleteReferences([]);
      setDeleteTarget(file);
    } finally {
      setCheckingRefs(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await deleteMediaFile(deleteTarget.fullPath);

      await logActivity({
        action_type: ACTION_TYPES.DELETE_MEDIA,
        content_type: CONTENT_TYPES.MEDIA,
        record_id: deleteTarget.fullPath,
        record_title: deleteTarget.name,
        metadata: { folder: deleteTarget.folder, size: deleteTarget.size },
      });

      showToast(`Asset "${deleteTarget.name}" deleted from storage.`, "success");
      setDeleteTarget(null);
      setDeleteReferences([]);
      await fetchMedia(true);
    } catch (err) {
      showToast(`Failed to delete asset: ${err.message}`, "error");
    } finally {
      setDeleting(false);
    }
  };

  // Filter computation
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

  // Statistics
  const imageCount = useMemo(() => files.filter((f) => f.category === "image").length, [files]);
  const docCount = useMemo(() => files.filter((f) => f.category === "pdf").length, [files]);
  const totalBytes = useMemo(() => files.reduce((acc, f) => acc + (f.size || 0), 0), [files]);

  return (
    <div className="manager-container">
      {/* Header */}
      <div className="manager-header">
        <div>
          <h2>Media & Asset Library</h2>
          <p>
            Manage public portfolio images, certificates, credentials, and PDF documents hosted on Supabase Storage.
          </p>
        </div>

        <div className="media-header-stats-pill">
          <span>Bucket: <code>portfolio-assets</code></span>
          <span className="stat-separator">•</span>
          <span>{files.length} Assets</span>
          <span className="stat-separator">•</span>
          <span>{formatBytes(totalBytes)}</span>
        </div>
      </div>

      {/* Upload Dropzone Area */}
      <div
        className={`media-dropzone ${isDragging ? "is-dragover" : ""} ${uploading ? "is-uploading" : ""}`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="dropzone-content">
          <div className="dropzone-icon-circle">
            <UploadCloudIcon size={28} />
          </div>

          <div className="dropzone-text-block">
            <h4>
              {uploading
                ? uploadProgress || "Uploading files to Supabase Storage..."
                : isDragging
                ? "Drop files to begin upload"
                : "Drag & drop media files here, or browse from computer"}
            </h4>
            <p>
              Supports <strong>PNG, JPG, WebP, SVG</strong> images and <strong>PDF</strong> documents up to <strong>10 MB</strong>.
            </p>
          </div>

          <div className="dropzone-controls-row">
            <div className="folder-selector-box">
              <FolderIcon size={14} />
              <span>Target Folder:</span>
              <select
                value={uploadFolder}
                onChange={(e) => setUploadFolder(e.target.value)}
                disabled={uploading}
              >
                <option value="certificates">certificates/</option>
                <option value="projects">projects/</option>
                <option value="uploads">uploads/</option>
              </select>
            </div>

            <button
              type="button"
              className="btn-primary"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              <span>{uploading ? "Uploading..." : "Browse Files"}</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp,image/svg+xml,application/pdf"
              onChange={(e) => handleProcessUpload(e.target.files)}
              style={{ display: "none" }}
            />
          </div>
        </div>
      </div>

      {/* Media Toolbar */}
      <div className="media-manager-toolbar">
        {/* Search */}
        <div className="media-search-input-wrapper">
          <SearchIcon size={16} className="search-icon-inside" />
          <input
            type="text"
            placeholder="Search by file name or folder..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setSearchQuery("")}
            >
              ×
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="filter-tabs" role="tablist">
          <button
            type="button"
            className={`filter-tab ${filterType === "all" ? "active" : ""}`}
            onClick={() => setFilterType("all")}
          >
            <span>All Assets</span>
            <span className="filter-count">{files.length}</span>
          </button>
          <button
            type="button"
            className={`filter-tab ${filterType === "images" ? "active" : ""}`}
            onClick={() => setFilterType("images")}
          >
            <span>Images</span>
            <span className="filter-count">{imageCount}</span>
          </button>
          <button
            type="button"
            className={`filter-tab ${filterType === "documents" ? "active" : ""}`}
            onClick={() => setFilterType("documents")}
          >
            <span>PDFs</span>
            <span className="filter-count">{docCount}</span>
          </button>
        </div>

        {/* View Switcher & Refresh */}
        <div className="toolbar-view-actions">
          <div className="view-mode-toggle" role="group" aria-label="View switch">
            <button
              type="button"
              className={`view-btn ${viewMode === "grid" ? "active" : ""}`}
              onClick={() => handleToggleView("grid")}
              title="Grid View"
              aria-label="Grid View"
            >
              <GridIcon size={16} />
            </button>
            <button
              type="button"
              className={`view-btn ${viewMode === "list" ? "active" : ""}`}
              onClick={() => handleToggleView("list")}
              title="List View"
              aria-label="List View"
            >
              <ListIcon size={16} />
            </button>
          </div>

          <button
            type="button"
            className={`btn-icon ${refreshing ? "is-toggling" : ""}`}
            onClick={() => fetchMedia(true)}
            title="Refresh assets list"
            aria-label="Refresh media list"
          >
            <RefreshIcon size={16} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="page-loader">Loading portfolio assets from Supabase...</div>
      ) : filteredFiles.length === 0 ? (
        <div className="card-empty-notice">
          <p>
            {searchQuery || filterType !== "all"
              ? "No assets match your search filters. Try clearing the search query or switching tabs."
              : "No media files found in your Supabase bucket. Upload your first certificate image or project asset above."}
          </p>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW */
        <div className="media-grid-container">
          {filteredFiles.map((file) => {
            const isPdf = file.category === "pdf" || file.name.toLowerCase().endsWith(".pdf");
            const refs = referencesMap[file.fullPath] || [];
            const isCopied = copiedId === file.id;

            return (
              <div key={file.id} className="media-card-item">
                <div
                  className="media-card-thumbnail"
                  onClick={() => handleOpenPreview(file)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") handleOpenPreview(file);
                  }}
                  title="Click to preview asset"
                >
                  {isPdf ? (
                    <div className="media-card-pdf-placeholder">
                      <FileTextIcon size={42} />
                      <span className="pdf-tag-overlay">PDF</span>
                    </div>
                  ) : (
                    <img
                      src={file.publicUrl}
                      alt={file.name}
                      loading="lazy"
                      className="media-card-img"
                    />
                  )}

                  {/* Overlay Badges */}
                  <div className="media-card-badges-overlay">
                    <span className="folder-badge">{file.folder}</span>
                    {refs.length > 0 && (
                      <span className="in-use-pill" title={`Linked in ${refs.map(r => r.title).join(", ")}`}>
                        In Use
                      </span>
                    )}
                  </div>
                </div>

                <div className="media-card-meta">
                  <h4 className="media-card-filename" title={file.name}>
                    {file.name}
                  </h4>

                  <div className="media-card-submeta">
                    <span className="media-size-text">{formatBytes(file.size)}</span>
                    {file.createdAt && (
                      <span className="media-date-text">
                        {new Date(file.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    )}
                  </div>

                  <div className="media-card-actions">
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => handleOpenPreview(file)}
                      title="Inspect / Preview"
                    >
                      <EyeIcon size={15} />
                    </button>

                    <button
                      type="button"
                      className={`btn-icon ${isCopied ? "btn-success" : ""}`}
                      onClick={() => handleCopyUrl(file.publicUrl, file.id)}
                      title={isCopied ? "Copied!" : "Copy Public CDN Link"}
                    >
                      {isCopied ? <CheckIcon size={15} /> : <CopyIcon size={15} />}
                    </button>

                    <button
                      type="button"
                      className="btn-icon btn-danger"
                      onClick={() => handleRequestDelete(file)}
                      disabled={checkingRefs}
                      title="Delete asset"
                    >
                      <TrashIcon size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="media-list-container">
          <table className="media-table">
            <thead>
              <tr>
                <th>Asset</th>
                <th>Folder</th>
                <th>Type</th>
                <th>Size</th>
                <th>Uploaded</th>
                <th>Portfolio Usage</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFiles.map((file) => {
                const isPdf = file.category === "pdf" || file.name.toLowerCase().endsWith(".pdf");
                const refs = referencesMap[file.fullPath] || [];
                const isCopied = copiedId === file.id;

                return (
                  <tr key={file.id}>
                    <td>
                      <div className="table-file-cell" onClick={() => handleOpenPreview(file)}>
                        {isPdf ? (
                          <div className="table-thumb-pdf">
                            <FileTextIcon size={20} />
                          </div>
                        ) : (
                          <img
                            src={file.publicUrl}
                            alt={file.name}
                            className="table-thumb-img"
                            loading="lazy"
                          />
                        )}
                        <span className="table-file-name" title={file.name}>
                          {file.name}
                        </span>
                      </div>
                    </td>
                    <td>
                      <code>{file.folder}</code>
                    </td>
                    <td>
                      <span className={`file-badge ${isPdf ? "badge-pdf" : "badge-image"}`}>
                        {isPdf ? "PDF" : "IMAGE"}
                      </span>
                    </td>
                    <td>{formatBytes(file.size)}</td>
                    <td>
                      {file.createdAt
                        ? new Date(file.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "—"}
                    </td>
                    <td>
                      {refs.length > 0 ? (
                        <span
                          className="in-use-pill"
                          title={refs.map((r) => `${r.collection}: ${r.title}`).join("\n")}
                        >
                          ● {refs.length} Record{refs.length > 1 ? "s" : ""}
                        </span>
                      ) : (
                        <span className="not-in-use-pill">Unlinked</span>
                      )}
                    </td>
                    <td>
                      <div className="table-actions-cell">
                        <button
                          type="button"
                          className="btn-icon"
                          onClick={() => handleOpenPreview(file)}
                          title="Preview"
                        >
                          <EyeIcon size={14} />
                        </button>
                        <button
                          type="button"
                          className={`btn-icon ${isCopied ? "btn-success" : ""}`}
                          onClick={() => handleCopyUrl(file.publicUrl, file.id)}
                          title="Copy Link"
                        >
                          {isCopied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
                        </button>
                        <button
                          type="button"
                          className="btn-icon btn-danger"
                          onClick={() => handleRequestDelete(file)}
                          title="Delete file"
                        >
                          <TrashIcon size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Preview Modal */}
      {previewTarget && (
        <MediaPreviewModal
          file={previewTarget}
          references={previewReferences}
          onClose={() => setPreviewTarget(null)}
          onCopyUrl={(url) => handleCopyUrl(url, previewTarget.id)}
        />
      )}

      {/* Safe Delete Confirmation Modal with Reference Warning */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title={
          deleteReferences.length > 0
            ? "⚠️ Warning: Asset In Active Use"
            : "Delete Asset from Storage"
        }
        message={
          deleteReferences.length > 0 ? (
            <div>
              <p>
                The file <strong>"{deleteTarget?.name}"</strong> is currently referenced by the following portfolio records:
              </p>
              <ul style={{ margin: "0.75rem 0", paddingLeft: "1.25rem", color: "var(--accent-amber, #f59e0b)" }}>
                {deleteReferences.map((ref, idx) => (
                  <li key={idx}>
                    {ref.collection}: <strong>{ref.title}</strong>
                    {ref.displayId && ` (#${ref.displayId})`}
                  </li>
                ))}
              </ul>
              <p style={{ color: "var(--accent-red, #ef4444)", fontWeight: 600 }}>
                Deleting this asset will result in broken images or missing credentials on your live portfolio website!
              </p>
              <p style={{ marginTop: "0.5rem" }}>Are you absolutely sure you want to proceed with permanent deletion?</p>
            </div>
          ) : (
            `Are you sure you want to delete "${deleteTarget?.name}" from Supabase Storage? This action cannot be undone.`
          )
        }
        confirmText={deleteReferences.length > 0 ? "Yes, Permanently Delete" : "Delete File"}
        cancelText="Cancel"
        isBusy={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteTarget(null);
          setDeleteReferences([]);
        }}
      />
    </div>
  );
}
