import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../lib/supabaseClient";
import { SaveIcon, PlusIcon, TrashIcon, EyeIcon, EyeOffIcon, CloseIcon } from "../components/Icons";
import { ConfirmModal } from "../components/ConfirmModal";
import { logActivity, ACTION_TYPES, CONTENT_TYPES } from "../services/activityService";

const getNowIso = () => new Date().toISOString();

export function AboutManager({ showToast }) {
  const [paragraphs, setParagraphs] = useState([]);
  const [stats, setStats] = useState([]);
  const [focusAreas, setFocusAreas] = useState([]);
  const [isPublished, setIsPublished] = useState(true);

  const [initialSnapshot, setInitialSnapshot] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showRevertConfirm, setShowRevertConfirm] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("about_me")
        .select("*")
        .eq("id", 1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const p = Array.isArray(data.paragraphs) ? data.paragraphs : [];
        const s = Array.isArray(data.stats) ? data.stats : [];
        const f = Array.isArray(data.focus_areas) ? data.focus_areas : [];
        const pub = data.is_published !== false;

        setParagraphs(p);
        setStats(s);
        setFocusAreas(f);
        setIsPublished(pub);

        setInitialSnapshot(JSON.stringify({ paragraphs: p, stats: s, focusAreas: f, isPublished: pub }));
      }
    } catch (err) {
      showToast(`Failed to load About data: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    loadData();
  }, [loadData]);

  const currentPayload = useMemo(() => {
    return { paragraphs, stats, focusAreas, isPublished };
  }, [paragraphs, stats, focusAreas, isPublished]);

  // Compute dirty state
  const isDirty = useMemo(() => {
    if (!initialSnapshot) return false;
    return JSON.stringify(currentPayload) !== initialSnapshot;
  }, [currentPayload, initialSnapshot]);

  // Prompt on tab close / reload if dirty
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Paragraph handlers
  const handleParagraphChange = (index, value) => {
    setParagraphs((prev) => {
      const copy = [...prev];
      copy[index] = value;
      return copy;
    });
    if (formErrors.paragraphs) {
      setFormErrors((prev) => ({ ...prev, paragraphs: null }));
    }
  };

  const handleAddParagraph = () => {
    setParagraphs((prev) => [...prev, ""]);
  };

  const handleRemoveParagraph = (index) => {
    setParagraphs((prev) => prev.filter((_, i) => i !== index));
  };

  // Stat handlers
  const handleStatChange = (index, field, value) => {
    setStats((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleAddStat = () => {
    setStats((prev) => [...prev, { value: "", label: "" }]);
  };

  const handleRemoveStat = (index) => {
    setStats((prev) => prev.filter((_, i) => i !== index));
  };

  // Focus area handlers
  const handleFocusChange = (index, field, value) => {
    setFocusAreas((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleAddFocus = () => {
    setFocusAreas((prev) => [
      ...prev,
      { icon: "code", title: "", description: "" },
    ]);
  };

  const handleRemoveFocus = (index) => {
    setFocusAreas((prev) => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const errors = {};
    const validParas = paragraphs.filter((p) => p.trim().length > 0);
    if (validParas.length === 0) {
      errors.paragraphs = "At least one bio narrative paragraph is required.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      showToast("Please provide at least one bio narrative paragraph.", "error");
      return;
    }

    try {
      setSaving(true);

      const cleanedParas = paragraphs.filter((p) => p.trim().length > 0);
      const cleanedStats = stats.filter((s) => s.value.trim() && s.label.trim());
      const cleanedFocus = focusAreas.filter((f) => f.title.trim());

      const payload = {
        id: 1,
        paragraphs: cleanedParas,
        stats: cleanedStats,
        focus_areas: cleanedFocus,
        is_published: isPublished,
        updated_at: getNowIso(),
      };

      const { error } = await supabase
        .from("about_me")
        .upsert(payload, { onConflict: "id" });

      if (error) throw error;

      await logActivity({
        action_type: ACTION_TYPES.UPDATE,
        content_type: CONTENT_TYPES.ABOUT,
        record_id: "1",
        record_title: "About Me Story & Focus Areas",
      });

      if (initialSnapshot) {
        try {
          const prev = JSON.parse(initialSnapshot);
          if (prev.isPublished !== isPublished) {
            await logActivity({
              action_type: isPublished ? ACTION_TYPES.PUBLISH : ACTION_TYPES.UNPUBLISH,
              content_type: CONTENT_TYPES.ABOUT,
              record_id: "1",
              record_title: "About Me Story & Focus Areas",
            });
          }
        } catch {
          // ignore parsing error
        }
      }

      showToast("About section updated successfully!", "success");
      setParagraphs(cleanedParas);
      setStats(cleanedStats);
      setFocusAreas(cleanedFocus);
      setInitialSnapshot(
        JSON.stringify({
          paragraphs: cleanedParas,
          stats: cleanedStats,
          focusAreas: cleanedFocus,
          isPublished,
        })
      );
      setFormErrors({});
    } catch (err) {
      showToast(`Error saving: ${err.message}`, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleRevert = () => {
    if (initialSnapshot) {
      const parsed = JSON.parse(initialSnapshot);
      setParagraphs(parsed.paragraphs || []);
      setStats(parsed.stats || []);
      setFocusAreas(parsed.focusAreas || []);
      setIsPublished(parsed.isPublished !== false);
      setFormErrors({});
      setShowRevertConfirm(false);
      showToast("Unsaved changes discarded.", "info");
    }
  };

  if (loading) {
    return <div className="page-loader">Loading About section...</div>;
  }

  return (
    <div className="manager-container">
      <div className="manager-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <h2>About Me & Focus Areas</h2>
            {isDirty && <span className="unsaved-badge">● Unsaved Changes</span>}
          </div>
          <p>Edit narrative paragraphs, highlight stats, and engineering focus cards.</p>
        </div>

        <div className="publishing-badge-toggle">
          <label className="toggle-label" title="Toggle section publication on public website">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
            />
            <span className="toggle-slider" />
            <span className="toggle-text">
              {isPublished ? (
                <span className="badge-published"><EyeIcon size={14} /> Published</span>
              ) : (
                <span className="badge-draft"><EyeOffIcon size={14} /> Draft (Hidden)</span>
              )}
            </span>
          </label>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card-form" noValidate>
        {/* Paragraphs */}
        <div className="form-section">
          <div className="section-title-with-btn">
            <h3>
              Bio Narrative Paragraphs <span className="required-asterisk">*</span>
            </h3>
            <button type="button" className="btn-sm btn-secondary" onClick={handleAddParagraph}>
              <PlusIcon size={14} /> Add Paragraph
            </button>
          </div>

          {formErrors.paragraphs && <span className="field-error">{formErrors.paragraphs}</span>}

          <div className="list-items-stack">
            {paragraphs.map((para, idx) => (
              <div key={idx} className="item-row">
                <span className="item-index-badge">#{idx + 1}</span>
                <textarea
                  rows="3"
                  value={para}
                  onChange={(e) => handleParagraphChange(idx, e.target.value)}
                  placeholder="Write paragraph content..."
                  required
                />
                <button
                  type="button"
                  className="btn-icon btn-danger"
                  onClick={() => handleRemoveParagraph(idx)}
                  title="Remove paragraph"
                  aria-label={`Remove paragraph ${idx + 1}`}
                >
                  <TrashIcon size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="form-section">
          <div className="section-title-with-btn">
            <h3>Key Highlight Stats</h3>
            <button type="button" className="btn-sm btn-secondary" onClick={handleAddStat}>
              <PlusIcon size={14} /> Add Stat
            </button>
          </div>

          <div className="grid-stack-items">
            {stats.map((stat, idx) => (
              <div key={idx} className="stat-edit-card">
                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Value (e.g. 4+, 2nd, 8)</label>
                    <input
                      type="text"
                      value={stat.value}
                      onChange={(e) => handleStatChange(idx, "value", e.target.value)}
                      placeholder="e.g. 4+"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Label</label>
                    <input
                      type="text"
                      value={stat.label}
                      onChange={(e) => handleStatChange(idx, "label", e.target.value)}
                      placeholder="e.g. Projects Built"
                      required
                    />
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-sm btn-danger stat-delete-btn"
                  onClick={() => handleRemoveStat(idx)}
                  aria-label={`Remove stat ${idx + 1}`}
                >
                  <TrashIcon size={14} /> Remove Stat
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Focus Areas */}
        <div className="form-section">
          <div className="section-title-with-btn">
            <h3>Current Engineering Focus Areas</h3>
            <button type="button" className="btn-sm btn-secondary" onClick={handleAddFocus}>
              <PlusIcon size={14} /> Add Focus Area
            </button>
          </div>

          <div className="grid-stack-items">
            {focusAreas.map((area, idx) => (
              <div key={idx} className="focus-edit-card">
                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Title</label>
                    <input
                      type="text"
                      value={area.title}
                      onChange={(e) => handleFocusChange(idx, "title", e.target.value)}
                      placeholder="e.g. Cloud Computing"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Icon Keyword</label>
                    <input
                      type="text"
                      value={area.icon || "code"}
                      onChange={(e) => handleFocusChange(idx, "icon", e.target.value)}
                      placeholder="cloud, server, docker, code"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    rows="2"
                    value={area.description}
                    onChange={(e) => handleFocusChange(idx, "description", e.target.value)}
                    placeholder="Focus summary..."
                    required
                  />
                </div>
                <button
                  type="button"
                  className="btn-sm btn-danger focus-delete-btn"
                  onClick={() => handleRemoveFocus(idx)}
                  aria-label={`Remove focus area ${idx + 1}`}
                >
                  <TrashIcon size={14} /> Remove Area
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="form-actions-bar">
          <div className="left-actions">
            {isDirty && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowRevertConfirm(true)}
                disabled={saving}
              >
                <CloseIcon size={15} />
                <span>Discard Changes</span>
              </button>
            )}
          </div>
          <button type="submit" className="btn-primary" disabled={saving}>
            <SaveIcon size={16} />
            <span>{saving ? "Saving Changes..." : "Save About Section"}</span>
          </button>
        </div>
      </form>

      {/* Discard Confirmation Modal */}
      <ConfirmModal
        isOpen={showRevertConfirm}
        title="Discard Unsaved Changes?"
        message="Are you sure you want to discard your edits and revert back to the last saved About section?"
        confirmText="Discard Changes"
        cancelText="Keep Editing"
        onConfirm={handleRevert}
        onCancel={() => setShowRevertConfirm(false)}
      />
    </div>
  );
}
