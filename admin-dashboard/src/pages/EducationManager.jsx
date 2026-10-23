import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../lib/supabaseClient";
import { SaveIcon, EyeIcon, EyeOffIcon, CloseIcon } from "../components/Icons";
import { ConfirmModal } from "../components/ConfirmModal";
import { logActivity, ACTION_TYPES, CONTENT_TYPES } from "../services/activityService";

const getNowIso = () => new Date().toISOString();

export function EducationManager({ showToast }) {
  const [formData, setFormData] = useState({
    degree: "",
    major: "",
    period: "",
    institution: "",
    location: "",
    current_status: "",
    program: "",
    description: "",
    coursework: [],
    is_published: true,
  });

  const [initialData, setInitialData] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [courseInput, setCourseInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showRevertConfirm, setShowRevertConfirm] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("education")
        .select("*")
        .eq("id", 1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const loaded = {
          degree: data.degree || "",
          major: data.major || "",
          period: data.period || "",
          institution: data.institution || "",
          location: data.location || "",
          current_status: data.current_status || "",
          program: data.program || "",
          description: data.description || "",
          coursework: Array.isArray(data.coursework) ? data.coursework : [],
          is_published: data.is_published !== false,
        };
        setFormData(loaded);
        setInitialData(loaded);
      }
    } catch (err) {
      showToast(`Failed to load education details: ${err.message}`, "error");
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

  const handleAddCourse = (e) => {
    e.preventDefault();
    const trimmed = courseInput.trim();
    if (!trimmed) return;
    if (formData.coursework.includes(trimmed)) {
      showToast(`'${trimmed}' is already in coursework`, "error");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      coursework: [...prev.coursework, trimmed],
    }));
    setCourseInput("");
  };

  const handleRemoveCourse = (course) => {
    setFormData((prev) => ({
      ...prev,
      coursework: prev.coursework.filter((c) => c !== course),
    }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.degree?.trim()) errors.degree = "Degree title is required.";
    if (!formData.major?.trim()) errors.major = "Major / Specialization is required.";
    if (!formData.program?.trim()) errors.program = "Program level is required.";
    if (!formData.period?.trim()) errors.period = "Academic period is required.";
    if (!formData.institution?.trim()) errors.institution = "Institution name is required.";
    if (!formData.location?.trim()) errors.location = "Campus location is required.";
    if (!formData.description?.trim()) errors.description = "Curriculum summary is required.";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      showToast("Please fill in all required education fields.", "error");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        id: 1,
        degree: formData.degree.trim(),
        major: formData.major.trim(),
        period: formData.period.trim(),
        institution: formData.institution.trim(),
        location: formData.location.trim(),
        current_status: formData.current_status.trim(),
        program: formData.program.trim(),
        description: formData.description.trim(),
        coursework: formData.coursework,
        is_published: formData.is_published,
        updated_at: getNowIso(),
      };

      const { error } = await supabase
        .from("education")
        .upsert(payload, { onConflict: "id" });

      if (error) throw error;

      await logActivity({
        action_type: ACTION_TYPES.UPDATE,
        content_type: CONTENT_TYPES.EDUCATION,
        record_id: "1",
        record_title: `${payload.degree} (${payload.institution})`,
      });

      if (initialData && initialData.is_published !== payload.is_published) {
        await logActivity({
          action_type: payload.is_published ? ACTION_TYPES.PUBLISH : ACTION_TYPES.UNPUBLISH,
          content_type: CONTENT_TYPES.EDUCATION,
          record_id: "1",
          record_title: `${payload.degree} (${payload.institution})`,
        });
      }

      showToast("Academic foundation updated successfully!", "success");
      setInitialData({ ...formData });
      setFormErrors({});
    } catch (err) {
      showToast(`Error saving education: ${err.message}`, "error");
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
    return <div className="page-loader">Loading education data...</div>;
  }

  return (
    <div className="manager-container">
      <div className="manager-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <h2>Academic Foundation & Coursework</h2>
            {isDirty && <span className="unsaved-badge">● Unsaved Changes</span>}
          </div>
          <p>Manage your degree program, institution details, standing, and relevant coursework.</p>
        </div>

        <div className="publishing-badge-toggle">
          <label className="toggle-label" title="Toggle section publication on public website">
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
          <h3>Degree & Program Overview</h3>
          <div className="form-grid-2">
            <div className="form-group">
              <label htmlFor="degree">
                Degree Title <span className="required-asterisk">*</span>
              </label>
              <input
                id="degree"
                name="degree"
                type="text"
                value={formData.degree}
                onChange={handleChange}
                placeholder="Bachelor of Technology (B.Tech)"
                className={formErrors.degree ? "input-has-error" : ""}
                required
              />
              {formErrors.degree && <span className="field-error">{formErrors.degree}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="major">
                Major / Specialization <span className="required-asterisk">*</span>
              </label>
              <input
                id="major"
                name="major"
                type="text"
                value={formData.major}
                onChange={handleChange}
                placeholder="Computer Science & Engineering"
                className={formErrors.major ? "input-has-error" : ""}
                required
              />
              {formErrors.major && <span className="field-error">{formErrors.major}</span>}
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label htmlFor="program">
                Program Level <span className="required-asterisk">*</span>
              </label>
              <input
                id="program"
                name="program"
                type="text"
                value={formData.program}
                onChange={handleChange}
                placeholder="Undergraduate Degree Program"
                className={formErrors.program ? "input-has-error" : ""}
                required
              />
              {formErrors.program && <span className="field-error">{formErrors.program}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="period">
                Academic Period <span className="required-asterisk">*</span>
              </label>
              <input
                id="period"
                name="period"
                type="text"
                value={formData.period}
                onChange={handleChange}
                placeholder="2025 — PRESENT"
                className={formErrors.period ? "input-has-error" : ""}
                required
              />
              {formErrors.period && <span className="field-error">{formErrors.period}</span>}
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label htmlFor="institution">
                Institution <span className="required-asterisk">*</span>
              </label>
              <input
                id="institution"
                name="institution"
                type="text"
                value={formData.institution}
                onChange={handleChange}
                className={formErrors.institution ? "input-has-error" : ""}
                required
              />
              {formErrors.institution && <span className="field-error">{formErrors.institution}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="location">
                Campus Location <span className="required-asterisk">*</span>
              </label>
              <input
                id="location"
                name="location"
                type="text"
                value={formData.location}
                onChange={handleChange}
                className={formErrors.location ? "input-has-error" : ""}
                required
              />
              {formErrors.location && <span className="field-error">{formErrors.location}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="current_status">Current Academic Status</label>
            <input
              id="current_status"
              name="current_status"
              type="text"
              value={formData.current_status}
              onChange={handleChange}
              placeholder="2nd Year · 3rd Semester"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">
              Curriculum Summary <span className="required-asterisk">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              rows="3"
              value={formData.description}
              onChange={handleChange}
              className={formErrors.description ? "input-has-error" : ""}
              required
            />
            {formErrors.description && <span className="field-error">{formErrors.description}</span>}
          </div>

          {/* Coursework Tag Manager */}
          <div className="form-group">
            <label>Relevant Coursework</label>
            <div className="tag-input-row">
              <input
                type="text"
                value={courseInput}
                onChange={(e) => setCourseInput(e.target.value)}
                placeholder="Add coursework (e.g. Operating Systems, DBMS)"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCourse(e);
                  }
                }}
              />
              <button type="button" className="btn-secondary" onClick={handleAddCourse}>
                Add Subject
              </button>
            </div>
            <div className="tags-display">
              {formData.coursework.map((course) => (
                <span key={course} className="tag-chip">
                  <span>{course}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCourse(course)}
                    aria-label={`Remove ${course}`}
                  >
                    ×
                  </button>
                </span>
              ))}
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
            <span>{saving ? "Saving Changes..." : "Save Education Info"}</span>
          </button>
        </div>
      </form>

      {/* Discard Confirmation Modal */}
      <ConfirmModal
        isOpen={showRevertConfirm}
        title="Discard Unsaved Changes?"
        message="Are you sure you want to discard your edits and revert back to the last saved education information?"
        confirmText="Discard Changes"
        cancelText="Keep Editing"
        onConfirm={handleRevert}
        onCancel={() => setShowRevertConfirm(false)}
      />
    </div>
  );
}
