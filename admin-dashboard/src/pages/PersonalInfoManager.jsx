import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../lib/supabaseClient";
import { SaveIcon, EyeIcon, EyeOffIcon, CloseIcon } from "../components/Icons";
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

function isValidEmail(email) {
  if (!email || !email.trim()) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function PersonalInfoManager({ showToast }) {
  const [formData, setFormData] = useState({
    name: "",
    headline: "",
    subheading: "",
    status_text: "",
    hero_description: "",
    core_tools: [],
    email: "",
    github: "",
    linkedin: "",
    portfolio: "",
    location: "",
    institution: "",
    education_degree: "",
    academic_period: "",
    current_level: "",
    is_published: true,
  });

  const [initialData, setInitialData] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [toolInput, setToolInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showRevertConfirm, setShowRevertConfirm] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("personal_info")
        .select("*")
        .eq("id", 1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const loaded = {
          name: data.name || "",
          headline: data.headline || "",
          subheading: data.subheading || "",
          status_text: data.status_text || "",
          hero_description: data.hero_description || "",
          core_tools: Array.isArray(data.core_tools) ? data.core_tools : [],
          email: data.email || "",
          github: data.github || "",
          linkedin: data.linkedin || "",
          portfolio: data.portfolio || "",
          location: data.location || "",
          institution: data.institution || "",
          education_degree: data.education_degree || "",
          academic_period: data.academic_period || "",
          current_level: data.current_level || "",
          is_published: data.is_published !== false,
        };
        setFormData(loaded);
        setInitialData(loaded);
      }
    } catch (err) {
      showToast(`Failed to load personal info: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    loadData();
  }, [loadData]);

  // Compute dirty state
  const isDirty = useMemo(() => {
    if (!initialData) return false;
    return JSON.stringify(formData) !== JSON.stringify(initialData);
  }, [formData, initialData]);

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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleAddTool = (e) => {
    e.preventDefault();
    const trimmed = toolInput.trim();
    if (!trimmed) return;
    if (formData.core_tools.includes(trimmed)) {
      showToast(`'${trimmed}' is already in core tools`, "error");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      core_tools: [...prev.core_tools, trimmed],
    }));
    setToolInput("");
  };

  const handleRemoveTool = (toolToRemove) => {
    setFormData((prev) => ({
      ...prev,
      core_tools: prev.core_tools.filter((t) => t !== toolToRemove),
    }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name?.trim()) errors.name = "Full name is required.";
    if (!formData.headline?.trim()) errors.headline = "Main headline is required.";
    if (!formData.hero_description?.trim()) errors.hero_description = "Hero bio is required.";

    if (!formData.email?.trim()) {
      errors.email = "Email address is required.";
    } else if (!isValidEmail(formData.email)) {
      errors.email = "Please enter a valid email address (e.g. name@domain.com).";
    }

    if (formData.github && !isValidUrl(formData.github)) {
      errors.github = "Please enter a valid URL (including https://).";
    }
    if (formData.linkedin && !isValidUrl(formData.linkedin)) {
      errors.linkedin = "Please enter a valid URL (including https://).";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      showToast("Please check the form for errors before saving.", "error");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        id: 1,
        name: formData.name.trim(),
        headline: formData.headline.trim(),
        subheading: formData.subheading?.trim() || "",
        status_text: formData.status_text?.trim() || "",
        hero_description: formData.hero_description.trim(),
        core_tools: formData.core_tools,
        email: formData.email.trim(),
        github: formData.github?.trim() || "",
        linkedin: formData.linkedin?.trim() || "",
        portfolio: formData.portfolio?.trim() || "",
        location: formData.location?.trim() || "",
        institution: formData.institution?.trim() || "",
        education_degree: formData.education_degree?.trim() || "",
        academic_period: formData.academic_period?.trim() || "",
        current_level: formData.current_level?.trim() || "",
        is_published: formData.is_published,
        updated_at: getNowIso(),
      };

      const { error } = await supabase
        .from("personal_info")
        .upsert(payload, { onConflict: "id" });

      if (error) throw error;

      await logActivity({
        action_type: ACTION_TYPES.UPDATE,
        content_type: CONTENT_TYPES.PERSONAL,
        record_id: "1",
        record_title: payload.name || "Personal Info",
      });

      if (initialData && initialData.is_published !== payload.is_published) {
        await logActivity({
          action_type: payload.is_published ? ACTION_TYPES.PUBLISH : ACTION_TYPES.UNPUBLISH,
          content_type: CONTENT_TYPES.PERSONAL,
          record_id: "1",
          record_title: payload.name || "Personal Info",
        });
      }

      showToast("Personal information saved successfully!", "success");
      setInitialData({ ...formData });
      setFormErrors({});
    } catch (err) {
      showToast(`Error saving: ${err.message}`, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleRevert = () => {
    if (initialData) {
      setFormData({ ...initialData });
      setFormErrors({});
      setShowRevertConfirm(false);
      showToast("Unsaved changes discarded.", "info");
    }
  };

  if (loading) {
    return <div className="page-loader">Loading personal information...</div>;
  }

  return (
    <div className="manager-container">
      <div className="manager-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <h2>Personal Profile & Hero Information</h2>
            {isDirty && <span className="unsaved-badge">● Unsaved Changes</span>}
          </div>
          <p>Update your public identity, status banner, core tools, and social contacts.</p>
        </div>

        <div className="publishing-badge-toggle">
          <label className="toggle-label" title="Toggle profile publication on public website">
            <input
              type="checkbox"
              name="is_published"
              checked={formData.is_published}
              onChange={handleChange}
            />
            <span className="toggle-slider" />
            <span className="toggle-text">
              {formData.is_published ? (
                <span className="badge-published"><EyeIcon size={14} /> Published</span>
              ) : (
                <span className="badge-draft"><EyeOffIcon size={14} /> Draft (Hidden)</span>
              )}
            </span>
          </label>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card-form" noValidate>
        <div className="form-section">
          <h3>Hero & Header Details</h3>
          <div className="form-grid-2">
            <div className="form-group">
              <label htmlFor="name">
                Full Name <span className="required-asterisk">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="Yash Dixit"
                className={formErrors.name ? "input-has-error" : ""}
                required
              />
              {formErrors.name && <span className="field-error">{formErrors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="status_text">Status Badge Text</label>
              <input
                id="status_text"
                name="status_text"
                type="text"
                value={formData.status_text}
                onChange={handleChange}
                placeholder="e.g. AVAILABLE FOR OPPORTUNITIES"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="headline">
              Main Headline <span className="required-asterisk">*</span>
            </label>
            <input
              id="headline"
              name="headline"
              type="text"
              value={formData.headline}
              onChange={handleChange}
              placeholder="e.g. Software Developer | Full-Stack Development"
              className={formErrors.headline ? "input-has-error" : ""}
              required
            />
            {formErrors.headline && <span className="field-error">{formErrors.headline}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="hero_description">
              Hero Bio / Introduction <span className="required-asterisk">*</span>
            </label>
            <textarea
              id="hero_description"
              name="hero_description"
              rows="3"
              value={formData.hero_description}
              onChange={handleChange}
              className={formErrors.hero_description ? "input-has-error" : ""}
              required
            />
            {formErrors.hero_description && <span className="field-error">{formErrors.hero_description}</span>}
          </div>

          <div className="form-group">
            <label>Core Tools Strip (Hero)</label>
            <div className="tag-input-row">
              <input
                type="text"
                value={toolInput}
                onChange={(e) => setToolInput(e.target.value)}
                placeholder="Add tool (e.g. React.js, Docker, Java)"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTool(e);
                  }
                }}
              />
              <button type="button" className="btn-secondary" onClick={handleAddTool}>
                Add Tool
              </button>
            </div>
            <div className="tags-display">
              {formData.core_tools.map((tool) => (
                <span key={tool} className="tag-chip">
                  <span>{tool}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTool(tool)}
                    aria-label={`Remove ${tool}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Contact & Social Destinations</h3>
          <div className="form-grid-2">
            <div className="form-group">
              <label htmlFor="email">
                Email Address <span className="required-asterisk">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@domain.com"
                className={formErrors.email ? "input-has-error" : ""}
                required
              />
              {formErrors.email && <span className="field-error">{formErrors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="location">Location</label>
              <input
                id="location"
                name="location"
                type="text"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g. Greater Noida, India"
              />
            </div>

            <div className="form-group">
              <label htmlFor="github">GitHub Profile URL</label>
              <input
                id="github"
                name="github"
                type="url"
                value={formData.github}
                onChange={handleChange}
                placeholder="https://github.com/..."
                className={formErrors.github ? "input-has-error" : ""}
              />
              {formErrors.github && <span className="field-error">{formErrors.github}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="linkedin">LinkedIn Profile URL</label>
              <input
                id="linkedin"
                name="linkedin"
                type="url"
                value={formData.linkedin}
                onChange={handleChange}
                placeholder="https://linkedin.com/in/..."
                className={formErrors.linkedin ? "input-has-error" : ""}
              />
              {formErrors.linkedin && <span className="field-error">{formErrors.linkedin}</span>}
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Institutional & Academic Tags</h3>
          <div className="form-grid-2">
            <div className="form-group">
              <label htmlFor="institution">Institution / University</label>
              <input
                id="institution"
                name="institution"
                type="text"
                value={formData.institution}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="education_degree">Degree</label>
              <input
                id="education_degree"
                name="education_degree"
                type="text"
                value={formData.education_degree}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="academic_period">Academic Period</label>
              <input
                id="academic_period"
                name="academic_period"
                type="text"
                value={formData.academic_period}
                onChange={handleChange}
                placeholder="2025 — Present"
              />
            </div>

            <div className="form-group">
              <label htmlFor="current_level">Current Standing</label>
              <input
                id="current_level"
                name="current_level"
                type="text"
                value={formData.current_level}
                onChange={handleChange}
                placeholder="Second Year · 3rd Semester"
              />
            </div>
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
            <span>{saving ? "Saving Changes..." : "Save Personal Info"}</span>
          </button>
        </div>
      </form>

      {/* Discard Confirmation Modal */}
      <ConfirmModal
        isOpen={showRevertConfirm}
        title="Discard Unsaved Changes?"
        message="Are you sure you want to discard your edits and revert back to the last saved personal information?"
        confirmText="Discard Changes"
        cancelText="Keep Editing"
        onConfirm={handleRevert}
        onCancel={() => setShowRevertConfirm(false)}
      />
    </div>
  );
}
