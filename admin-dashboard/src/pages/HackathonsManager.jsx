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
} from "../components/Icons";
import { ConfirmModal } from "../components/ConfirmModal";
import { logActivity, ACTION_TYPES, CONTENT_TYPES } from "../services/activityService";

const getNowIso = () => new Date().toISOString();

function isValidUrl(string) {
  if (!string || !string.trim()) return true;
  try {
    const url = new URL(string.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function HackathonsManager({ showToast }) {
  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  // Status Filter tab: "all" | "published" | "draft"
  const [statusFilter, setStatusFilter] = useState("all");

  const [editingItem, setEditingItem] = useState(null);
  const [initialSnapshot, setInitialSnapshot] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [techInput, setTechInput] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const fetchHackathons = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("hackathons")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setHackathons(data || []);
    } catch (err) {
      showToast(`Failed to load hackathons: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    fetchHackathons();
  }, [fetchHackathons]);

  const handleOpenNew = () => {
    const nextOrder = hackathons.length + 1;
    const newItem = {
      display_id: String(nextOrder).padStart(2, "0"),
      event: "",
      team: "",
      badge: "HACKATHON",
      project_name: "",
      problem: "",
      description: "",
      contribution: "",
      technologies: [],
      github_url: "",
      live_url: "",
      sort_order: nextOrder,
      is_published: true,
    };
    setEditingItem(newItem);
    setInitialSnapshot(JSON.stringify(newItem));
    setFormErrors({});
    setTechInput("");
  };

  const handleEdit = (item) => {
    const cloned = {
      ...item,
      technologies: Array.isArray(item.technologies) ? [...item.technologies] : [],
      github_url: item.github_url || "",
      live_url: item.live_url || "",
    };
    setEditingItem(cloned);
    setInitialSnapshot(JSON.stringify(cloned));
    setFormErrors({});
    setTechInput("");
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

  const handleAddTech = (e) => {
    e.preventDefault();
    const trimmed = techInput.trim();
    if (!trimmed) return;
    if (editingItem.technologies.includes(trimmed)) return;
    setEditingItem((prev) => ({
      ...prev,
      technologies: [...prev.technologies, trimmed],
    }));
    setTechInput("");
  };

  const handleRemoveTech = (tech) => {
    setEditingItem((prev) => ({
      ...prev,
      technologies: prev.technologies.filter((t) => t !== tech),
    }));
  };

  const validateForm = () => {
    const errors = {};
    if (!editingItem.display_id?.trim()) errors.display_id = "Display ID is required.";
    if (!editingItem.badge?.trim()) errors.badge = "Badge name is required.";
    if (!editingItem.project_name?.trim()) errors.project_name = "Project name is required.";
    if (!editingItem.event?.trim()) errors.event = "Event / Arena name is required.";
    if (!editingItem.team?.trim()) errors.team = "Team or role name is required.";
    if (!editingItem.problem?.trim()) errors.problem = "Problem statement is required.";
    if (!editingItem.description?.trim()) errors.description = "Project description is required.";
    if (!editingItem.contribution?.trim()) errors.contribution = "Your contribution is required.";

    if (editingItem.live_url && !isValidUrl(editingItem.live_url)) {
      errors.live_url = "Please enter a valid URL (including https://).";
    }
    if (editingItem.github_url && !isValidUrl(editingItem.github_url)) {
      errors.github_url = "Please enter a valid URL (including https://).";
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
        badge: editingItem.badge.trim(),
        project_name: editingItem.project_name.trim(),
        event: editingItem.event.trim(),
        team: editingItem.team.trim(),
        problem: editingItem.problem.trim(),
        description: editingItem.description.trim(),
        contribution: editingItem.contribution.trim(),
        live_url: editingItem.live_url?.trim() || null,
        github_url: editingItem.github_url?.trim() || null,
        updated_at: getNowIso(),
      };

      const { error } = await supabase.from("hackathons").upsert(payload);

      if (error) throw error;

      await logActivity({
        action_type: editingItem.id ? ACTION_TYPES.UPDATE : ACTION_TYPES.CREATE,
        content_type: CONTENT_TYPES.HACKATHONS,
        record_id: payload.display_id,
        record_title: payload.project_name,
      });

      showToast("Hackathon saved successfully!", "success");
      setEditingItem(null);
      setFormErrors({});
      await fetchHackathons();
    } catch (err) {
      showToast(`Error saving hackathon: ${err.message}`, "error");
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
        .from("hackathons")
        .update({ is_published: nextState, updated_at: getNowIso() })
        .eq("id", item.id);

      if (error) throw error;

      await logActivity({
        action_type: nextState ? ACTION_TYPES.PUBLISH : ACTION_TYPES.UNPUBLISH,
        content_type: CONTENT_TYPES.HACKATHONS,
        record_id: item.display_id,
        record_title: item.project_name,
      });

      showToast(`Hackathon marked as ${nextState ? "Published" : "Draft"}`, "success");
      setHackathons((prev) =>
        prev.map((h) => (h.id === item.id ? { ...h, is_published: nextState } : h))
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
      const { error } = await supabase.from("hackathons").delete().eq("id", deleteTarget.id);

      if (error) throw error;

      await logActivity({
        action_type: ACTION_TYPES.DELETE,
        content_type: CONTENT_TYPES.HACKATHONS,
        record_id: deleteTarget.display_id,
        record_title: deleteTarget.project_name,
      });

      showToast("Hackathon deleted.", "success");
      setDeleteTarget(null);
      await fetchHackathons();
    } catch (err) {
      showToast(`Delete failed: ${err.message}`, "error");
    }
  };

  // Filter computation
  const publishedCount = useMemo(() => hackathons.filter((h) => h.is_published).length, [hackathons]);
  const draftCount = useMemo(() => hackathons.filter((h) => !h.is_published).length, [hackathons]);

  const filteredHackathons = useMemo(() => {
    if (statusFilter === "published") {
      return hackathons.filter((h) => h.is_published);
    }
    if (statusFilter === "draft") {
      return hackathons.filter((h) => !h.is_published);
    }
    return hackathons;
  }, [hackathons, statusFilter]);

  return (
    <div className="manager-container">
      <div className="manager-header">
        <div>
          <h2>Hackathons & Competitive Experience</h2>
          <p>Highlight fast-paced team hackathons, problem statements, and technical contributions.</p>
        </div>

        <button type="button" className="btn-primary" onClick={handleOpenNew}>
          <PlusIcon size={16} />
          <span>New Hackathon</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="manager-toolbar">
        <div className="filter-tabs" role="tablist" aria-label="Filter hackathons by publication status">
          <button
            type="button"
            role="tab"
            aria-selected={statusFilter === "all"}
            className={`filter-tab ${statusFilter === "all" ? "active" : ""}`}
            onClick={() => setStatusFilter("all")}
          >
            <span>All</span>
            <span className="filter-count">{hackathons.length}</span>
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
        <div className="page-loader">Loading hackathons...</div>
      ) : filteredHackathons.length === 0 ? (
        <div className="card-empty-notice">
          <p>
            {statusFilter === "all"
              ? "No hackathon entries found. Click 'New Hackathon' to add an event."
              : statusFilter === "published"
              ? "No published hackathons found. Check Drafts to publish."
              : "No draft hackathons found. All entries are currently published."}
          </p>
        </div>
      ) : (
        <div className="card-stack">
          {filteredHackathons.map((hack) => (
            <div key={hack.id} className="admin-project-card">
              <div className="project-card-top-row">
                <div className="project-id-and-name">
                  <span className="card-code-tag">#{hack.display_id}</span>
                  <div>
                    <span className="project-badge-tag">{hack.badge}</span>
                    <h3 className="project-heading-name">{hack.project_name}</h3>
                    <p className="project-tagline-text">{hack.event}</p>
                  </div>
                </div>

                <div className="admin-card-controls">
                  <button
                    type="button"
                    className={`btn-icon ${togglingId === hack.id ? "is-toggling" : ""}`}
                    onClick={() => handleTogglePublish(hack)}
                    disabled={togglingId === hack.id}
                    title={hack.is_published ? "Unpublish to draft" : "Publish to live website"}
                  >
                    {hack.is_published ? (
                      <span className="badge-published"><EyeIcon size={13} /> Live</span>
                    ) : (
                      <span className="badge-draft"><EyeOffIcon size={13} /> Draft</span>
                    )}
                  </button>

                  <button
                    type="button"
                    className="btn-icon"
                    onClick={() => handleEdit(hack)}
                    title="Edit hackathon"
                  >
                    <EditIcon size={15} />
                  </button>

                  <button
                    type="button"
                    className="btn-icon btn-danger"
                    onClick={() => setDeleteTarget(hack)}
                    title="Delete hackathon"
                  >
                    <TrashIcon size={15} />
                  </button>
                </div>
              </div>

              <div className="project-summary-box">
                <p><strong>Team / Role:</strong> {hack.team}</p>
                <p><strong>Problem:</strong> {hack.problem}</p>
                <p><strong>Description:</strong> {hack.description}</p>
                <p><strong>My Contribution:</strong> {hack.contribution}</p>
              </div>

              <div className="project-meta-strip">
                <div className="tech-tags-list">
                  {(hack.technologies || []).map((t, idx) => (
                    <span key={idx} className="tech-tag-chip">{t}</span>
                  ))}
                </div>

                <div className="project-link-pills">
                  {hack.live_url && (
                    <a href={hack.live_url} target="_blank" rel="noopener noreferrer" className="link-pill">
                      <span>Live Demo</span> <ExternalLinkIcon size={12} />
                    </a>
                  )}
                  {hack.github_url && (
                    <a href={hack.github_url} target="_blank" rel="noopener noreferrer" className="link-pill">
                      <span>GitHub</span> <ExternalLinkIcon size={12} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit / New Modal */}
      {editingItem && (
        <div className="modal-overlay" onClick={requestCloseModal}>
          <div className="modal-card modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>{editingItem.id ? "Edit Hackathon" : "Add Hackathon"}</h3>
                <p className="modal-subtitle">
                  {editingItem.is_published
                    ? "Currently set to Published (visible on live website)"
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
                  <label htmlFor="hack-display-id">
                    Display ID <span className="required-asterisk">*</span>
                  </label>
                  <input
                    id="hack-display-id"
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
                  <label htmlFor="hack-sort-order">Sort Order</label>
                  <input
                    id="hack-sort-order"
                    type="number"
                    value={editingItem.sort_order}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, sort_order: parseInt(e.target.value, 10) || 0 })
                    }
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="hack-badge">
                    Badge <span className="required-asterisk">*</span>
                  </label>
                  <input
                    id="hack-badge"
                    type="text"
                    value={editingItem.badge}
                    onChange={(e) => {
                      setEditingItem({ ...editingItem, badge: e.target.value.toUpperCase() });
                      if (formErrors.badge) setFormErrors((prev) => ({ ...prev, badge: null }));
                    }}
                    placeholder="IIT DELHI HACKATHON"
                    className={formErrors.badge ? "input-has-error" : ""}
                    required
                  />
                  {formErrors.badge && <span className="field-error">{formErrors.badge}</span>}
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label htmlFor="hack-project-name">
                    Project Name <span className="required-asterisk">*</span>
                  </label>
                  <input
                    id="hack-project-name"
                    type="text"
                    value={editingItem.project_name}
                    onChange={(e) => {
                      setEditingItem({ ...editingItem, project_name: e.target.value });
                      if (formErrors.project_name) setFormErrors((prev) => ({ ...prev, project_name: null }));
                    }}
                    placeholder="e.g. EduSynth AI"
                    className={formErrors.project_name ? "input-has-error" : ""}
                    required
                  />
                  {formErrors.project_name && <span className="field-error">{formErrors.project_name}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="hack-event">
                    Event Name / Arena <span className="required-asterisk">*</span>
                  </label>
                  <input
                    id="hack-event"
                    type="text"
                    value={editingItem.event}
                    onChange={(e) => {
                      setEditingItem({ ...editingItem, event: e.target.value });
                      if (formErrors.event) setFormErrors((prev) => ({ ...prev, event: null }));
                    }}
                    placeholder="e.g. Innov8 Battle Arena — IIT Delhi"
                    className={formErrors.event ? "input-has-error" : ""}
                    required
                  />
                  {formErrors.event && <span className="field-error">{formErrors.event}</span>}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="hack-team">
                  Team Name / Role <span className="required-asterisk">*</span>
                </label>
                <input
                  id="hack-team"
                  type="text"
                  value={editingItem.team}
                  onChange={(e) => {
                    setEditingItem({ ...editingItem, team: e.target.value });
                    if (formErrors.team) setFormErrors((prev) => ({ ...prev, team: null }));
                  }}
                  placeholder="e.g. Team Pixel Minds (Lead Architect)"
                  className={formErrors.team ? "input-has-error" : ""}
                  required
                />
                {formErrors.team && <span className="field-error">{formErrors.team}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="hack-problem">
                  Problem Statement <span className="required-asterisk">*</span>
                </label>
                <textarea
                  id="hack-problem"
                  rows="2"
                  value={editingItem.problem}
                  onChange={(e) => {
                    setEditingItem({ ...editingItem, problem: e.target.value });
                    if (formErrors.problem) setFormErrors((prev) => ({ ...prev, problem: null }));
                  }}
                  placeholder="The 24-48 hour challenge description..."
                  className={formErrors.problem ? "input-has-error" : ""}
                  required
                />
                {formErrors.problem && <span className="field-error">{formErrors.problem}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="hack-desc">
                  Project Description <span className="required-asterisk">*</span>
                </label>
                <textarea
                  id="hack-desc"
                  rows="3"
                  value={editingItem.description}
                  onChange={(e) => {
                    setEditingItem({ ...editingItem, description: e.target.value });
                    if (formErrors.description) setFormErrors((prev) => ({ ...prev, description: null }));
                  }}
                  placeholder="The solution engineered by the team..."
                  className={formErrors.description ? "input-has-error" : ""}
                  required
                />
                {formErrors.description && <span className="field-error">{formErrors.description}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="hack-contribution">
                  My Specific Engineering Contribution <span className="required-asterisk">*</span>
                </label>
                <textarea
                  id="hack-contribution"
                  rows="2"
                  value={editingItem.contribution}
                  onChange={(e) => {
                    setEditingItem({ ...editingItem, contribution: e.target.value });
                    if (formErrors.contribution) setFormErrors((prev) => ({ ...prev, contribution: null }));
                  }}
                  placeholder="What did you personally build, architect, or lead?"
                  className={formErrors.contribution ? "input-has-error" : ""}
                  required
                />
                {formErrors.contribution && <span className="field-error">{formErrors.contribution}</span>}
              </div>

              {/* Technologies */}
              <div className="form-group">
                <label>Technologies Used</label>
                <div className="tag-input-row">
                  <input
                    type="text"
                    value={techInput}
                    onChange={(e) => setTechInput(e.target.value)}
                    placeholder="Add tech (e.g. FastAPI, Docker)"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTech(e);
                      }
                    }}
                  />
                  <button type="button" className="btn-secondary" onClick={handleAddTech}>
                    Add Tech
                  </button>
                </div>
                <div className="tags-display">
                  {editingItem.technologies.map((t) => (
                    <span key={t} className="tag-chip">
                      <span>{t}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTech(t)}
                        aria-label={`Remove ${t}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label htmlFor="hack-live-url">Live Demo URL (Optional)</label>
                  <input
                    id="hack-live-url"
                    type="url"
                    value={editingItem.live_url || ""}
                    onChange={(e) => {
                      setEditingItem({ ...editingItem, live_url: e.target.value });
                      if (formErrors.live_url) setFormErrors((prev) => ({ ...prev, live_url: null }));
                    }}
                    placeholder="https://..."
                    className={formErrors.live_url ? "input-has-error" : ""}
                  />
                  {formErrors.live_url && <span className="field-error">{formErrors.live_url}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="hack-github-url">GitHub Repository URL (Optional)</label>
                  <input
                    id="hack-github-url"
                    type="url"
                    value={editingItem.github_url || ""}
                    onChange={(e) => {
                      setEditingItem({ ...editingItem, github_url: e.target.value });
                      if (formErrors.github_url) setFormErrors((prev) => ({ ...prev, github_url: null }));
                    }}
                    placeholder="https://github.com/..."
                    className={formErrors.github_url ? "input-has-error" : ""}
                  />
                  {formErrors.github_url && <span className="field-error">{formErrors.github_url}</span>}
                </div>
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
                  <span>Published (Visible on Public Website)</span>
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
                  <span>{saving ? "Saving..." : "Save Hackathon"}</span>
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
        message="You have unsaved changes in this hackathon entry. Are you sure you want to discard them? Any edits will be lost."
        confirmText="Discard Changes"
        cancelText="Keep Editing"
        onConfirm={handleConfirmDiscard}
        onCancel={() => setShowDiscardConfirm(false)}
      />

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Hackathon Entry"
        message={`Are you sure you want to delete "${deleteTarget?.project_name}"? This action cannot be undone.`}
        confirmText="Delete Hackathon"
        cancelText="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
