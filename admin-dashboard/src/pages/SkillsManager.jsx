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
} from "../components/Icons";
import { ConfirmModal } from "../components/ConfirmModal";
import { logActivity, ACTION_TYPES, CONTENT_TYPES } from "../services/activityService";

const getNowIso = () => new Date().toISOString();

export function SkillsManager({ showToast }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  // Status Filter tab: "all" | "published" | "draft"
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal / Form state
  const [editingItem, setEditingItem] = useState(null);
  const [initialSnapshot, setInitialSnapshot] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [tagInput, setTagInput] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const fetchSkillsList = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setLoading(true);
      const { data, error } = await supabase
        .from("skills")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      showToast(`Failed to load skills: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    fetchSkillsList();
  }, [fetchSkillsList]);

  const handleOpenNew = () => {
    const nextOrder = categories.length + 1;
    const newItem = {
      category_number: String(nextOrder).padStart(2, "0"),
      category_name: "",
      title: "",
      is_featured: false,
      skills_list: [],
      sort_order: nextOrder,
      is_published: true,
    };
    setEditingItem(newItem);
    setInitialSnapshot(JSON.stringify(newItem));
    setFormErrors({});
    setTagInput("");
  };

  const handleEdit = (cat) => {
    const cloned = {
      ...cat,
      skills_list: Array.isArray(cat.skills_list) ? [...cat.skills_list] : [],
    };
    setEditingItem(cloned);
    setInitialSnapshot(JSON.stringify(cloned));
    setFormErrors({});
    setTagInput("");
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

  const handleAddTag = (e) => {
    e.preventDefault();
    const trimmed = tagInput.trim();
    if (!trimmed) return;
    if (editingItem.skills_list.includes(trimmed)) {
      showToast(`'${trimmed}' is already in this category`, "error");
      return;
    }
    setEditingItem((prev) => ({
      ...prev,
      skills_list: [...prev.skills_list, trimmed],
    }));
    setTagInput("");
    if (formErrors.skills_list) {
      setFormErrors((prev) => ({ ...prev, skills_list: null }));
    }
  };

  const handleRemoveTag = (tag) => {
    setEditingItem((prev) => ({
      ...prev,
      skills_list: prev.skills_list.filter((t) => t !== tag),
    }));
  };

  const validateForm = () => {
    const errors = {};
    if (!editingItem.category_number?.trim()) {
      errors.category_number = "Category number is required (e.g. 01).";
    }
    if (!editingItem.category_name?.trim()) {
      errors.category_name = "Category label is required (e.g. PROGRAMMING).";
    }
    if (!editingItem.title?.trim()) {
      errors.title = "Display title is required.";
    }
    if (!editingItem.skills_list || editingItem.skills_list.length === 0) {
      errors.skills_list = "Please add at least one skill to this category.";
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
        category_number: editingItem.category_number.trim(),
        category_name: editingItem.category_name.trim().toUpperCase(),
        title: editingItem.title.trim(),
        updated_at: getNowIso(),
      };

      const { error } = await supabase.from("skills").upsert(payload);

      if (error) throw error;

      await logActivity({
        action_type: editingItem.id ? ACTION_TYPES.UPDATE : ACTION_TYPES.CREATE,
        content_type: CONTENT_TYPES.SKILLS,
        record_id: payload.category_number,
        record_title: `${payload.category_name} - ${payload.title}`,
      });

      showToast("Skill category saved successfully!", "success");
      setEditingItem(null);
      setFormErrors({});
      await fetchSkillsList();
    } catch (err) {
      showToast(`Failed to save skill: ${err.message}`, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (cat) => {
    if (togglingId) return;
    try {
      setTogglingId(cat.id);
      const nextState = !cat.is_published;
      const { error } = await supabase
        .from("skills")
        .update({ is_published: nextState, updated_at: getNowIso() })
        .eq("id", cat.id);

      if (error) throw error;

      await logActivity({
        action_type: nextState ? ACTION_TYPES.PUBLISH : ACTION_TYPES.UNPUBLISH,
        content_type: CONTENT_TYPES.SKILLS,
        record_id: cat.category_number,
        record_title: `${cat.category_name} - ${cat.title}`,
      });

      showToast(`Category marked as ${nextState ? "Published" : "Draft"}`, "success");
      setCategories((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, is_published: nextState } : c))
      );
    } catch (err) {
      showToast(`Error toggling publish state: ${err.message}`, "error");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const { error } = await supabase.from("skills").delete().eq("id", deleteTarget.id);

      if (error) throw error;

      await logActivity({
        action_type: ACTION_TYPES.DELETE,
        content_type: CONTENT_TYPES.SKILLS,
        record_id: deleteTarget.category_number,
        record_title: `${deleteTarget.category_name} - ${deleteTarget.title}`,
      });

      showToast("Skill category deleted.", "success");
      setDeleteTarget(null);
      await fetchSkillsList();
    } catch (err) {
      showToast(`Failed to delete: ${err.message}`, "error");
    }
  };

  // Filter computation
  const publishedCount = useMemo(() => categories.filter((c) => c.is_published).length, [categories]);
  const draftCount = useMemo(() => categories.filter((c) => !c.is_published).length, [categories]);

  const filteredCategories = useMemo(() => {
    if (statusFilter === "published") {
      return categories.filter((c) => c.is_published);
    }
    if (statusFilter === "draft") {
      return categories.filter((c) => !c.is_published);
    }
    return categories;
  }, [categories, statusFilter]);

  return (
    <div className="manager-container">
      <div className="manager-header">
        <div>
          <h2>Technical Skills & Categories</h2>
          <p>Organize programming languages, frameworks, cloud tooling, and CS concepts.</p>
        </div>

        <button type="button" className="btn-primary" onClick={handleOpenNew}>
          <PlusIcon size={16} />
          <span>New Category</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="manager-toolbar">
        <div className="filter-tabs" role="tablist" aria-label="Filter skill categories by publication status">
          <button
            type="button"
            role="tab"
            aria-selected={statusFilter === "all"}
            className={`filter-tab ${statusFilter === "all" ? "active" : ""}`}
            onClick={() => setStatusFilter("all")}
          >
            <span>All</span>
            <span className="filter-count">{categories.length}</span>
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
        <div className="page-loader">Loading categories...</div>
      ) : filteredCategories.length === 0 ? (
        <div className="card-empty-notice">
          <p>
            {statusFilter === "all"
              ? "No skill categories found. Click 'New Category' to add technical skills."
              : statusFilter === "published"
              ? "No published skill categories found. Check Drafts to publish."
              : "No draft categories found. All skill categories are currently published."}
          </p>
        </div>
      ) : (
        <div className="card-grid">
          {filteredCategories.map((cat) => (
            <div key={cat.id} className="admin-card">
              <div className="admin-card-header">
                <div className="admin-card-badge-row">
                  <span className="card-code-tag">{cat.category_number}</span>
                  <span className="card-cat-label">{cat.category_name}</span>
                  {cat.is_featured && <span className="featured-pill">FEATURED</span>}
                </div>

                <div className="admin-card-controls">
                  <button
                    type="button"
                    className={`btn-icon ${togglingId === cat.id ? "is-toggling" : ""}`}
                    onClick={() => handleTogglePublish(cat)}
                    disabled={togglingId === cat.id}
                    title={cat.is_published ? "Unpublish to draft" : "Publish to live site"}
                  >
                    {cat.is_published ? (
                      <span className="badge-published"><EyeIcon size={13} /> Live</span>
                    ) : (
                      <span className="badge-draft"><EyeOffIcon size={13} /> Draft</span>
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn-icon"
                    onClick={() => handleEdit(cat)}
                    title="Edit category"
                  >
                    <EditIcon size={15} />
                  </button>
                  <button
                    type="button"
                    className="btn-icon btn-danger"
                    onClick={() => setDeleteTarget(cat)}
                    title="Delete category"
                  >
                    <TrashIcon size={15} />
                  </button>
                </div>
              </div>

              <h3 className="admin-card-title">{cat.title}</h3>

              <div className="admin-card-tags">
                {(cat.skills_list || []).map((skill, i) => (
                  <span key={i} className="skill-pill">
                    {skill}
                  </span>
                ))}
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
                <h3>{editingItem.id ? "Edit Skill Category" : "Add New Skill Category"}</h3>
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
                  <label htmlFor="cat-number">
                    Number <span className="required-asterisk">*</span>
                  </label>
                  <input
                    id="cat-number"
                    type="text"
                    value={editingItem.category_number}
                    onChange={(e) => {
                      setEditingItem({ ...editingItem, category_number: e.target.value });
                      if (formErrors.category_number) setFormErrors((prev) => ({ ...prev, category_number: null }));
                    }}
                    placeholder="01"
                    className={formErrors.category_number ? "input-has-error" : ""}
                    required
                  />
                  {formErrors.category_number && <span className="field-error">{formErrors.category_number}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="cat-label">
                    Category Label <span className="required-asterisk">*</span>
                  </label>
                  <input
                    id="cat-label"
                    type="text"
                    value={editingItem.category_name}
                    onChange={(e) => {
                      setEditingItem({ ...editingItem, category_name: e.target.value.toUpperCase() });
                      if (formErrors.category_name) setFormErrors((prev) => ({ ...prev, category_name: null }));
                    }}
                    placeholder="PROGRAMMING"
                    className={formErrors.category_name ? "input-has-error" : ""}
                    required
                  />
                  {formErrors.category_name && <span className="field-error">{formErrors.category_name}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="cat-sort-order">Sort Order</label>
                  <input
                    id="cat-sort-order"
                    type="number"
                    value={editingItem.sort_order}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, sort_order: parseInt(e.target.value, 10) || 0 })
                    }
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="cat-title">
                  Display Title <span className="required-asterisk">*</span>
                </label>
                <input
                  id="cat-title"
                  type="text"
                  value={editingItem.title}
                  onChange={(e) => {
                    setEditingItem({ ...editingItem, title: e.target.value });
                    if (formErrors.title) setFormErrors((prev) => ({ ...prev, title: null }));
                  }}
                  placeholder="Programming Languages"
                  className={formErrors.title ? "input-has-error" : ""}
                  required
                />
                {formErrors.title && <span className="field-error">{formErrors.title}</span>}
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={editingItem.is_featured}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, is_featured: e.target.checked })
                    }
                  />
                  <span>Featured Category (Cyan Highlight Frame)</span>
                </label>
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

              <div className="form-group">
                <label>
                  Skills in this Category <span className="required-asterisk">*</span>
                </label>
                <div className="tag-input-row">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add skill (e.g. TypeScript, Redis)"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag(e);
                      }
                    }}
                  />
                  <button type="button" className="btn-secondary" onClick={handleAddTag}>
                    Add Skill
                  </button>
                </div>

                {formErrors.skills_list && <span className="field-error">{formErrors.skills_list}</span>}

                <div className="tags-display">
                  {editingItem.skills_list.map((tag) => (
                    <span key={tag} className="tag-chip">
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        aria-label={`Remove ${tag}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
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
                  <span>{saving ? "Saving..." : "Save Category"}</span>
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
        message="You have unsaved changes in this skill category. Are you sure you want to discard them? Any edits will be lost."
        confirmText="Discard Changes"
        cancelText="Keep Editing"
        onConfirm={handleConfirmDiscard}
        onCancel={() => setShowDiscardConfirm(false)}
      />

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Skill Category"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmText="Delete Category"
        cancelText="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
