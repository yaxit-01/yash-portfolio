import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../lib/supabaseClient";
import {
  PlusIcon,
  EditIcon,
  TrashIcon,
  EyeIcon,
  EyeOffIcon,
  SaveIcon,
  CloseIcon,
  ExternalLinkIcon,
  MediaIcon,
} from "../components/Icons";
import { ImageUploader } from "../components/ImageUploader";
import { ConfirmModal } from "../components/ConfirmModal";
import { MediaPickerModal } from "../components/MediaPickerModal";
import { logActivity, ACTION_TYPES, CONTENT_TYPES } from "../services/activityService";

const getNowIso = () => new Date().toISOString();

export function CertificatesManager({ showToast }) {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  // Status Filter tab: "all" | "published" | "draft"
  const [statusFilter, setStatusFilter] = useState("all");

  const [editingItem, setEditingItem] = useState(null);
  const [initialSnapshot, setInitialSnapshot] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);

  const fetchCertificates = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("certificates")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setCertificates(data || []);
    } catch (err) {
      showToast(`Failed to load certificates: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    fetchCertificates();
  }, [fetchCertificates]);

  const handleOpenNew = () => {
    const nextOrder = certificates.length + 1;
    const newItem = {
      display_id: String(nextOrder).padStart(2, "0"),
      type: "CREDENTIAL",
      title: "",
      provider: "",
      date: "",
      filename: "",
      image_url: "",
      sort_order: nextOrder,
      is_published: true,
    };
    setEditingItem(newItem);
    setInitialSnapshot(JSON.stringify(newItem));
    setFormErrors({});
  };

  const handleEdit = (item) => {
    const cloned = { ...item };
    setEditingItem(cloned);
    setInitialSnapshot(JSON.stringify(cloned));
    setFormErrors({});
  };

  const isFormDirty = () => {
    if (!editingItem || !initialSnapshot) return false;
    return JSON.stringify(editingItem) !== initialSnapshot;
  };

  const requestCloseModal = () => {
    if (isFormDirty()) {
      setShowDiscardConfirm(true);
    } else {
      setEditingItem(null);
      setFormErrors({});
    }
  };

  const handleConfirmDiscard = () => {
    setShowDiscardConfirm(false);
    setEditingItem(null);
    setFormErrors({});
  };

  const handleUploadComplete = (publicUrl, originalFilename) => {
    setEditingItem((prev) => ({
      ...prev,
      image_url: publicUrl,
      filename: prev.filename || originalFilename,
    }));
    showToast("Certificate image uploaded to Supabase Storage!", "success");
    if (formErrors.image) {
      setFormErrors((prev) => ({ ...prev, image: null }));
    }
  };

  const handleSelectFromMediaLibrary = ({ publicUrl, name }) => {
    setEditingItem((prev) => ({
      ...prev,
      image_url: publicUrl,
      filename: prev.filename || name,
    }));
    if (formErrors.image) {
      setFormErrors((prev) => ({ ...prev, image: null }));
    }
    showToast("Media asset linked to certificate!", "success");
  };

  const validateForm = () => {
    const errors = {};
    if (!editingItem.display_id?.trim()) errors.display_id = "Display ID is required (e.g. 01).";
    if (!editingItem.type?.trim()) errors.type = "Credential type is required.";
    if (!editingItem.title?.trim()) errors.title = "Certificate title is required.";
    if (!editingItem.provider?.trim()) errors.provider = "Issuer / Provider is required.";
    if (!editingItem.date?.trim()) errors.date = "Completion date or issue year is required.";

    if (!editingItem.image_url?.trim() && !editingItem.filename?.trim()) {
      errors.image = "Please upload an image or provide a certificate filename.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      showToast("Please correct the highlighted fields before saving.", "error");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        ...editingItem,
        display_id: editingItem.display_id.trim(),
        type: editingItem.type.trim(),
        title: editingItem.title.trim(),
        provider: editingItem.provider.trim(),
        date: editingItem.date.trim(),
        image_url: editingItem.image_url?.trim() || null,
        filename: editingItem.filename?.trim() || "certificate.png",
        updated_at: getNowIso(),
      };

      const { error } = await supabase.from("certificates").upsert(payload);

      if (error) throw error;

      await logActivity({
        action_type: editingItem.id ? ACTION_TYPES.UPDATE : ACTION_TYPES.CREATE,
        content_type: CONTENT_TYPES.CERTIFICATES,
        record_id: payload.display_id,
        record_title: payload.title,
      });

      showToast("Certificate credential saved!", "success");
      setEditingItem(null);
      setFormErrors({});
      await fetchCertificates();
    } catch (err) {
      showToast(`Failed to save: ${err.message}`, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (item) => {
    if (togglingId) return;
    try {
      setTogglingId(item.id);
      const nextState = !item.is_published;
      const { error } = await supabase
        .from("certificates")
        .update({ is_published: nextState, updated_at: getNowIso() })
        .eq("id", item.id);

      if (error) throw error;

      await logActivity({
        action_type: nextState ? ACTION_TYPES.PUBLISH : ACTION_TYPES.UNPUBLISH,
        content_type: CONTENT_TYPES.CERTIFICATES,
        record_id: item.display_id,
        record_title: item.title,
      });

      showToast(`Certificate marked as ${nextState ? "Published" : "Draft"}`, "success");
      setCertificates((prev) =>
        prev.map((c) => (c.id === item.id ? { ...c, is_published: nextState } : c))
      );
    } catch (err) {
      showToast(`Error updating publish state: ${err.message}`, "error");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const { error } = await supabase.from("certificates").delete().eq("id", deleteTarget.id);

      if (error) throw error;

      await logActivity({
        action_type: ACTION_TYPES.DELETE,
        content_type: CONTENT_TYPES.CERTIFICATES,
        record_id: deleteTarget.display_id,
        record_title: deleteTarget.title,
      });

      showToast("Certificate deleted.", "success");
      setDeleteTarget(null);
      await fetchCertificates();
    } catch (err) {
      showToast(`Delete failed: ${err.message}`, "error");
    }
  };

  // Filter computation
  const publishedCount = useMemo(() => certificates.filter((c) => c.is_published).length, [certificates]);
  const draftCount = useMemo(() => certificates.filter((c) => !c.is_published).length, [certificates]);

  const filteredCertificates = useMemo(() => {
    if (statusFilter === "published") {
      return certificates.filter((c) => c.is_published);
    }
    if (statusFilter === "draft") {
      return certificates.filter((c) => !c.is_published);
    }
    return certificates;
  }, [certificates, statusFilter]);

  return (
    <div className="manager-container">
      <div className="manager-header">
        <div>
          <h2>Certificates & Professional Credentials</h2>
          <p>
            Upload credential images directly to the portfolio-assets bucket, manage issuers, and view previews.
          </p>
        </div>

        <button type="button" className="btn-primary" onClick={handleOpenNew}>
          <PlusIcon size={16} />
          <span>New Certificate</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="manager-toolbar">
        <div className="filter-tabs" role="tablist" aria-label="Filter certificates by publication status">
          <button
            type="button"
            role="tab"
            aria-selected={statusFilter === "all"}
            className={`filter-tab ${statusFilter === "all" ? "active" : ""}`}
            onClick={() => setStatusFilter("all")}
          >
            <span>All</span>
            <span className="filter-count">{certificates.length}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={statusFilter === "published"}
            className={`filter-tab ${statusFilter === "published" ? "active" : ""}`}
            onClick={() => setStatusFilter("published")}
          >
            <span>Published</span>
            <span className="filter-count">{publishedCount}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={statusFilter === "draft"}
            className={`filter-tab ${statusFilter === "draft" ? "active" : ""}`}
            onClick={() => setStatusFilter("draft")}
          >
            <span>Drafts</span>
            <span className="filter-count">{draftCount}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="page-loader">Loading certificates...</div>
      ) : filteredCertificates.length === 0 ? (
        <div className="card-empty-notice">
          <p>
            {statusFilter === "all"
              ? "No certificates found. Click 'New Certificate' to upload credentials."
              : statusFilter === "published"
              ? "No published certificates found. View Drafts to publish."
              : "No draft certificates found. All credentials are currently published."}
          </p>
        </div>
      ) : (
        <div className="card-grid">
          {filteredCertificates.map((cert) => {
            const displayImage = cert.image_url || `https://yaxit-01.github.io/yash-portfolio/certificates/${cert.filename}`;
            return (
              <div key={cert.id} className="admin-cert-card">
                <div className="cert-card-preview-box">
                  {cert.image_url ? (
                    <img src={cert.image_url} alt={cert.title} className="cert-thumb" loading="lazy" />
                  ) : (
                    <div className="cert-thumb-placeholder">
                      <span>Local Asset:</span>
                      <code>{cert.filename}</code>
                    </div>
                  )}
                </div>

                <div className="cert-card-body">
                  <div className="admin-card-header">
                    <span className="card-cat-label">{cert.type}</span>
                    <div className="admin-card-controls">
                      <button
                        type="button"
                        className={`btn-icon ${togglingId === cert.id ? "is-toggling" : ""}`}
                        onClick={() => handleTogglePublish(cert)}
                        disabled={togglingId === cert.id}
                        title={cert.is_published ? "Unpublish to draft" : "Publish to live website"}
                      >
                        {cert.is_published ? (
                          <span className="badge-published"><EyeIcon size={13} /> Live</span>
                        ) : (
                          <span className="badge-draft"><EyeOffIcon size={13} /> Draft</span>
                        )}
                      </button>

                      <button
                        type="button"
                        className="btn-icon"
                        onClick={() => handleEdit(cert)}
                        title="Edit certificate"
                      >
                        <EditIcon size={15} />
                      </button>

                      <button
                        type="button"
                        className="btn-icon btn-danger"
                        onClick={() => setDeleteTarget(cert)}
                        title="Delete certificate"
                      >
                        <TrashIcon size={15} />
                      </button>
                    </div>
                  </div>

                  <h3 className="cert-title-text">{cert.title}</h3>
                  <p className="cert-issuer-text">{cert.provider}</p>
                  <p className="cert-date-text">{cert.date}</p>

                  <div className="cert-card-footer">
                    <span className="cert-index-tag">#{cert.display_id}</span>
                    {displayImage && (
                      <a
                        href={displayImage}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="cert-view-link"
                      >
                        <span>Preview</span>
                        <ExternalLinkIcon size={12} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit / New Modal */}
      {editingItem && (
        <div className="modal-overlay" onClick={requestCloseModal}>
          <div className="modal-card modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>{editingItem.id ? "Edit Certificate" : "Add New Certificate"}</h3>
                <p className="modal-subtitle">
                  {editingItem.is_published
                    ? "Currently set to Published (credential visible in modal)"
                    : "Currently set to Draft (hidden from visitors)"}
                </p>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={requestCloseModal}
                aria-label="Close modal"
              >
                <CloseIcon size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="modal-form" noValidate>
              <div className="form-grid-3">
                <div className="form-group">
                  <label htmlFor="cert-display-id">
                    Display ID <span className="required-asterisk">*</span>
                  </label>
                  <input
                    id="cert-display-id"
                    type="text"
                    value={editingItem.display_id}
                    onChange={(e) => {
                      setEditingItem({ ...editingItem, display_id: e.target.value });
                      if (formErrors.display_id) setFormErrors((prev) => ({ ...prev, display_id: null }));
                    }}
                    placeholder="01"
                    className={formErrors.display_id ? "input-has-error" : ""}
                    required
                  />
                  {formErrors.display_id && <span className="field-error">{formErrors.display_id}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="cert-sort-order">Sort Order</label>
                  <input
                    id="cert-sort-order"
                    type="number"
                    value={editingItem.sort_order}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, sort_order: parseInt(e.target.value, 10) || 0 })
                    }
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="cert-type">
                    Credential Type <span className="required-asterisk">*</span>
                  </label>
                  <input
                    id="cert-type"
                    type="text"
                    value={editingItem.type}
                    onChange={(e) => {
                      setEditingItem({ ...editingItem, type: e.target.value.toUpperCase() });
                      if (formErrors.type) setFormErrors((prev) => ({ ...prev, type: null }));
                    }}
                    placeholder="DSA, LINUX, CLOUD"
                    className={formErrors.type ? "input-has-error" : ""}
                    required
                  />
                  {formErrors.type && <span className="field-error">{formErrors.type}</span>}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="cert-title">
                  Certificate Title <span className="required-asterisk">*</span>
                </label>
                <input
                  id="cert-title"
                  type="text"
                  value={editingItem.title}
                  onChange={(e) => {
                    setEditingItem({ ...editingItem, title: e.target.value });
                    if (formErrors.title) setFormErrors((prev) => ({ ...prev, title: null }));
                  }}
                  placeholder="e.g. Data Structures and Algorithms – I"
                  className={formErrors.title ? "input-has-error" : ""}
                  required
                />
                {formErrors.title && <span className="field-error">{formErrors.title}</span>}
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label htmlFor="cert-provider">
                    Issuer / Provider <span className="required-asterisk">*</span>
                  </label>
                  <input
                    id="cert-provider"
                    type="text"
                    value={editingItem.provider}
                    onChange={(e) => {
                      setEditingItem({ ...editingItem, provider: e.target.value });
                      if (formErrors.provider) setFormErrors((prev) => ({ ...prev, provider: null }));
                    }}
                    placeholder="e.g. Red Hat Training, Udemy, Cisco"
                    className={formErrors.provider ? "input-has-error" : ""}
                    required
                  />
                  {formErrors.provider && <span className="field-error">{formErrors.provider}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="cert-date">
                    Completion Date / Credential ID <span className="required-asterisk">*</span>
                  </label>
                  <input
                    id="cert-date"
                    type="text"
                    value={editingItem.date}
                    onChange={(e) => {
                      setEditingItem({ ...editingItem, date: e.target.value });
                      if (formErrors.date) setFormErrors((prev) => ({ ...prev, date: null }));
                    }}
                    placeholder="Course completed · May 2026"
                    className={formErrors.date ? "input-has-error" : ""}
                    required
                  />
                  {formErrors.date && <span className="field-error">{formErrors.date}</span>}
                </div>
              </div>

              {/* Supabase Storage Image Upload */}
              <div className="form-group">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem", flexWrap: "wrap", gap: "0.5rem" }}>
                  <label style={{ margin: 0 }}>
                    Certificate Image <span className="required-asterisk">*</span>
                  </label>
                  <button
                    type="button"
                    className="btn-sm btn-secondary"
                    onClick={() => setShowMediaPicker(true)}
                  >
                    <MediaIcon size={14} />
                    <span>Choose from Media Library</span>
                  </button>
                </div>
                <ImageUploader
                  bucket="portfolio-assets"
                  folder="certificates"
                  currentUrl={editingItem.image_url}
                  onUploadComplete={handleUploadComplete}
                  label="Upload to Supabase Storage Bucket"
                />
                {formErrors.image && <span className="field-error">{formErrors.image}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="cert-filename">Local Filename Fallback (Optional)</label>
                <input
                  id="cert-filename"
                  type="text"
                  value={editingItem.filename || ""}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, filename: e.target.value })
                  }
                  placeholder="e.g. iamneo-dsa.png"
                />
                <span className="field-hint">
                  Used as fallback if uploaded CDN URL is not provided.
                </span>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={editingItem.is_published}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, is_published: e.target.checked })
                    }
                  />
                  <span>Published (Visible on Public Website & Certificate Modal)</span>
                </label>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={requestCloseModal}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  <SaveIcon size={16} />
                  <span>{saving ? "Saving..." : "Save Certificate"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Discard Confirmation Modal */}
      <ConfirmModal
        isOpen={showDiscardConfirm}
        title="Discard Unsaved Changes?"
        message="You have unsaved changes in this certificate. Are you sure you want to discard them? Any edits will be lost."
        confirmText="Discard Changes"
        cancelText="Keep Editing"
        onConfirm={handleConfirmDiscard}
        onCancel={() => setShowDiscardConfirm(false)}
      />

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Certificate"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmText="Delete Certificate"
        cancelText="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Media Picker Modal */}
      <MediaPickerModal
        isOpen={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        onSelect={handleSelectFromMediaLibrary}
        currentUrl={editingItem?.image_url}
        folder="certificates"
        title="Select Certificate Asset from Media Library"
      />
    </div>
  );
}
