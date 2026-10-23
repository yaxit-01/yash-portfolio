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

export function ProjectsManager({ showToast }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  // Status Filter tab: "all" | "published" | "draft"
  const [statusFilter, setStatusFilter] = useState("all");

  // Form / Modal state
  const [editingItem, setEditingItem] = useState(null);
  const [initialSnapshot, setInitialSnapshot] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [techInput, setTechInput] = useState("");
  const [featureInput, setFeatureInput] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setProjects(data || []);
    } catch (err) {
      showToast(`Failed to load projects: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    fetchProjects();
  }, [fetchProjects]);

  const handleOpenNew = () => {
    const nextOrder = projects.length + 1;
    const newItem = {
      display_id: String(nextOrder).padStart(2, "0"),
      name: "",
      badge: "FEATURED PROJECT",
      tagline: "",
      problem: "",
      description: "",
      role: "Full-Stack Developer",
      technologies: [],
      features: [],
      live_url: "",
      github_url: "",
      sort_order: nextOrder,
      is_published: true,
    };
    setEditingItem(newItem);
    setInitialSnapshot(JSON.stringify(newItem));
    setFormErrors({});
    setTechInput("");
    setFeatureInput("");
  };

  const handleEdit = (project) => {
    const item = {
      ...project,
      technologies: Array.isArray(project.technologies) ? [...project.technologies] : [],
      features: Array.isArray(project.features) ? [...project.features] : [],
      live_url: project.live_url || project.liveUrl || "",
      github_url: project.github_url || project.githubUrl || "",
    };
    setEditingItem(item);
    setInitialSnapshot(JSON.stringify(item));
    setFormErrors({});
    setTechInput("");
    setFeatureInput("");
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

  const handleAddFeature = (e) => {
    e.preventDefault();
    const trimmed = featureInput.trim();
    if (!trimmed) return;
    setEditingItem((prev) => ({
      ...prev,
      features: [...prev.features, trimmed],
    }));
    setFeatureInput("");
  };

  const handleRemoveFeature = (idx) => {
    setEditingItem((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== idx),
    }));
  };

  const validateForm = () => {
    const errors = {};
    if (!editingItem.name?.trim()) errors.name = "Project name is required.";
    if (!editingItem.display_id?.trim()) errors.display_id = "Display ID is required (e.g. 01).";
    if (!editingItem.badge?.trim()) errors.badge = "Category badge is required.";
    if (!editingItem.problem?.trim()) errors.problem = "Problem statement is required.";
    if (!editingItem.description?.trim()) errors.description = "Full description is required.";

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
      showToast("Please correct the errors in the form before saving.", "error");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        ...editingItem,
        name: editingItem.name.trim(),
        display_id: editingItem.display_id.trim(),
        badge: editingItem.badge.trim(),
        role: editingItem.role?.trim() || "Full-Stack Developer",
        tagline: editingItem.tagline?.trim() || "",
        problem: editingItem.problem.trim(),
        description: editingItem.description.trim(),
        live_url: editingItem.live_url?.trim() || null,
        github_url: editingItem.github_url?.trim() || null,
        updated_at: getNowIso(),
      };

      const { error } = await supabase.from("projects").upsert(payload);

      if (error) throw error;

      await logActivity({
        action_type: editingItem.id ? ACTION_TYPES.UPDATE : ACTION_TYPES.CREATE,
        content_type: CONTENT_TYPES.PROJECTS,
        record_id: payload.display_id,
        record_title: payload.name,
      });

      showToast("Project saved successfully!", "success");
      setEditingItem(null);
      setFormErrors({});
      await fetchProjects();
    } catch (err) {
      showToast(`Error saving project: ${err.message}`, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (project) => {
    if (togglingId) return;
    try {
      setTogglingId(project.id);
      const nextState = !project.is_published;
      const { error } = await supabase
        .from("projects")
        .update({ is_published: nextState, updated_at: getNowIso() })
        .eq("id", project.id);

      if (error) throw error;

      await logActivity({
        action_type: nextState ? ACTION_TYPES.PUBLISH : ACTION_TYPES.UNPUBLISH,
        content_type: CONTENT_TYPES.PROJECTS,
        record_id: project.display_id,
        record_title: project.name,
      });

      showToast(
        `Project marked as ${nextState ? "Published" : "Draft"}`,
        "success"
      );
      setProjects((prev) =>
        prev.map((p) => (p.id === project.id ? { ...p, is_published: nextState } : p))
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
      const { error } = await supabase.from("projects").delete().eq("id", deleteTarget.id);

      if (error) throw error;

      await logActivity({
        action_type: ACTION_TYPES.DELETE,
        content_type: CONTENT_TYPES.PROJECTS,
        record_id: deleteTarget.display_id,
        record_title: deleteTarget.name,
      });

      showToast("Project deleted successfully.", "success");
      setDeleteTarget(null);
      await fetchProjects();
    } catch (err) {
      showToast(`Delete failed: ${err.message}`, "error");
    }
  };

  // Filter computation
  const publishedCount = useMemo(() => projects.filter((p) => p.is_published).length, [projects]);
  const draftCount = useMemo(() => projects.filter((p) => !p.is_published).length, [projects]);

  const filteredProjects = useMemo(() => {
    if (statusFilter === "published") {
      return projects.filter((p) => p.is_published);
    }
    if (statusFilter === "draft") {
      return projects.filter((p) => !p.is_published);
    }
    return projects;
  }, [projects, statusFilter]);

  return (
    <div className="manager-container">
      <div className="manager-header">
        <div>
          <h2>Featured & Selected Projects</h2>
          <p>Manage showcased projects, problem statements, features, and source repository links.</p>
        </div>

        <button type="button" className="btn-primary" onClick={handleOpenNew}>
          <PlusIcon size={16} />
          <span>New Project</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="manager-toolbar">
        <div className="filter-tabs" role="tablist" aria-label="Filter projects by publication status">
          <button
            type="button"
            role="tab"
            aria-selected={statusFilter === "all"}
            className={`filter-tab ${statusFilter === "all" ? "active" : ""}`}
            onClick={() => setStatusFilter("all")}
          >
            <span>All</span>
            <span className="filter-count">{projects.length}</span>
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
        <div className="page-loader">Loading projects...</div>
      ) : filteredProjects.length === 0 ? (
        <div className="card-empty-notice">
          <p>
            {statusFilter === "all"
              ? "No projects found. Click 'New Project' to create your first showcase."
              : statusFilter === "published"
              ? "No published projects found. Check the Drafts tab to publish projects."
              : "No draft projects found. All projects are currently published."}
          </p>
        </div>
      ) : (
        <div className="card-stack">
          {filteredProjects.map((proj) => (
            <div key={proj.id} className="admin-project-card">
              <div className="project-card-top-row">
                <div className="project-id-and-name">
                  <span className="card-code-tag">#{proj.display_id}</span>
                  <div>
                    <span className="project-badge-tag">{proj.badge}</span>
                    <h3 className="project-heading-name">{proj.name}</h3>
                    <p className="project-tagline-text">{proj.tagline}</p>
                  </div>
                </div>

                <div className="admin-card-controls">
                  <button
                    type="button"
                    className={`btn-icon ${togglingId === proj.id ? "is-toggling" : ""}`}
                    onClick={() => handleTogglePublish(proj)}
                    disabled={togglingId === proj.id}
                    title={proj.is_published ? "Unpublish to draft" : "Publish to live website"}
                  >
                    {proj.is_published ? (
                      <span className="badge-published"><EyeIcon size={13} /> Live</span>
                    ) : (
                      <span className="badge-draft"><EyeOffIcon size={13} /> Draft</span>
                    )}
                  </button>

                  <button
                    type="button"
                    className="btn-icon"
                    onClick={() => handleEdit(proj)}
                    title="Edit project"
                  >
                    <EditIcon size={15} />
                  </button>

                  <button
                    type="button"
                    className="btn-icon btn-danger"
                    onClick={() => setDeleteTarget(proj)}
                    title="Delete project"
                  >
                    <TrashIcon size={15} />
                  </button>
                </div>
              </div>

              <div className="project-summary-box">
                <p><strong>Problem:</strong> {proj.problem}</p>
                <p><strong>Description:</strong> {proj.description}</p>
              </div>

              <div className="project-meta-strip">
                <div className="tech-tags-list">
                  {(proj.technologies || []).map((t, idx) => (
                    <span key={idx} className="tech-tag-chip">{t}</span>
                  ))}
                </div>

                <div className="project-link-pills">
                  {(proj.live_url || proj.liveUrl) && (
                    <a
                      href={proj.live_url || proj.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link-pill"
                    >
                      <span>Live Demo</span> <ExternalLinkIcon size={12} />
                    </a>
                  )}
                  {(proj.github_url || proj.githubUrl) && (
                    <a
                      href={proj.github_url || proj.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link-pill"
                    >
                      <span>GitHub</span> <ExternalLinkIcon size={12} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit / Add Modal */}
      {editingItem && (
        <div className="modal-overlay" onClick={requestCloseModal}>
          <div className="modal-card modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>{editingItem.id ? "Edit Project" : "Add New Project"}</h3>
                <p className="modal-subtitle">
                  {editingItem.is_published
                    ? "Currently set to Published (will be live upon saving)"
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
                  <label htmlFor="proj-display-id">
                    Display ID <span className="required-asterisk">*</span>
                  </label>
                  <input
                    id="proj-display-id"
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
                  <label htmlFor="proj-sort-order">Sort Order</label>
                  <input
                    id="proj-sort-order"
                    type="number"
                    value={editingItem.sort_order}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, sort_order: parseInt(e.target.value, 10) || 0 })
                    }
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="proj-badge">
                    Category Badge <span className="required-asterisk">*</span>
                  </label>
                  <input
                    id="proj-badge"
                    type="text"
                    value={editingItem.badge}
                    onChange={(e) => {
                      setEditingItem({ ...editingItem, badge: e.target.value.toUpperCase() });
                      if (formErrors.badge) setFormErrors((prev) => ({ ...prev, badge: null }));
                    }}
                    placeholder="FEATURED AI PLATFORM"
                    className={formErrors.badge ? "input-has-error" : ""}
                    required
                  />
                  {formErrors.badge && <span className="field-error">{formErrors.badge}</span>}
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label htmlFor="proj-name">
                    Project Name <span className="required-asterisk">*</span>
                  </label>
                  <input
                    id="proj-name"
                    type="text"
                    value={editingItem.name}
                    onChange={(e) => {
                      setEditingItem({ ...editingItem, name: e.target.value });
                      if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: null }));
                    }}
                    placeholder="e.g. SkillBridge AI"
                    className={formErrors.name ? "input-has-error" : ""}
                    required
                  />
                  {formErrors.name && <span className="field-error">{formErrors.name}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="proj-role">Your Role</label>
                  <input
                    id="proj-role"
                    type="text"
                    value={editingItem.role}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, role: e.target.value })
                    }
                    placeholder="e.g. Full-Stack Developer"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="proj-tagline">Tagline</label>
                <input
                  id="proj-tagline"
                  type="text"
                  value={editingItem.tagline}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, tagline: e.target.value })
                  }
                  placeholder="Intelligent career roadmap and milestone tracking platform"
                />
              </div>

              <div className="form-group">
                <label htmlFor="proj-problem">
                  Problem Statement <span className="required-asterisk">*</span>
                </label>
                <textarea
                  id="proj-problem"
                  rows="2"
                  value={editingItem.problem}
                  onChange={(e) => {
                    setEditingItem({ ...editingItem, problem: e.target.value });
                    if (formErrors.problem) setFormErrors((prev) => ({ ...prev, problem: null }));
                  }}
                  placeholder="What core challenge does this project address?"
                  className={formErrors.problem ? "input-has-error" : ""}
                  required
                />
                {formErrors.problem && <span className="field-error">{formErrors.problem}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="proj-desc">
                  Full Description <span className="required-asterisk">*</span>
                </label>
                <textarea
                  id="proj-desc"
                  rows="3"
                  value={editingItem.description}
                  onChange={(e) => {
                    setEditingItem({ ...editingItem, description: e.target.value });
                    if (formErrors.description) setFormErrors((prev) => ({ ...prev, description: null }));
                  }}
                  placeholder="Comprehensive description of the architecture, stack, and outcome."
                  className={formErrors.description ? "input-has-error" : ""}
                  required
                />
                {formErrors.description && <span className="field-error">{formErrors.description}</span>}
              </div>

              {/* Technologies */}
              <div className="form-group">
                <label>Technologies Used</label>
                <div className="tag-input-row">
                  <input
                    type="text"
                    value={techInput}
                    onChange={(e) => setTechInput(e.target.value)}
                    placeholder="Add technology (e.g. React.js, Docker)"
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

              {/* Engineering Highlights / Features */}
              <div className="form-group">
                <label>Key Engineering Highlights (Bullet Points)</label>
                <div className="tag-input-row">
                  <input
                    type="text"
                    value={featureInput}
                    onChange={(e) => setFeatureInput(e.target.value)}
                    placeholder="Add key feature bullet point..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddFeature(e);
                      }
                    }}
                  />
                  <button type="button" className="btn-secondary" onClick={handleAddFeature}>
                    Add Bullet
                  </button>
                </div>
                <ul className="bullet-items-list">
                  {editingItem.features.map((feat, idx) => (
                    <li key={idx} className="bullet-item">
                      <span>{feat}</span>
                      <button
                        type="button"
                        className="btn-icon btn-danger"
                        onClick={() => handleRemoveFeature(idx)}
                        aria-label={`Remove bullet point ${idx + 1}`}
                      >
                        <TrashIcon size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label htmlFor="proj-live-url">Live Demo URL (Optional)</label>
                  <input
                    id="proj-live-url"
                    type="url"
                    value={editingItem.live_url || ""}
                    onChange={(e) => {
                      setEditingItem({ ...editingItem, live_url: e.target.value });
                      if (formErrors.live_url) setFormErrors((prev) => ({ ...prev, live_url: null }));
                    }}
                    placeholder="https://example.com"
                    className={formErrors.live_url ? "input-has-error" : ""}
                  />
                  {formErrors.live_url && <span className="field-error">{formErrors.live_url}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="proj-github-url">GitHub Repository URL (Optional)</label>
                  <input
                    id="proj-github-url"
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
                  <span>{saving ? "Saving..." : "Save Project"}</span>
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
        message="You have unsaved changes in this project. Are you sure you want to discard them? Any edits will be lost."
        confirmText="Discard Changes"
        cancelText="Keep Editing"
        onConfirm={handleConfirmDiscard}
        onCancel={() => setShowDiscardConfirm(false)}
      />

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Project"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmText="Delete Project"
        cancelText="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
