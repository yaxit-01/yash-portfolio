import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../lib/supabaseClient";
import {
  SaveIcon,
  EyeIcon,
  EyeOffIcon,
  CloseIcon,
  RefreshIcon,
  MediaIcon,
  ExternalLinkIcon,
} from "../components/Icons";
import { ConfirmModal } from "../components/ConfirmModal";
import { MediaPickerModal } from "../components/MediaPickerModal";
import { logActivity, ACTION_TYPES, CONTENT_TYPES } from "../services/activityService";

const getNowIso = () => new Date().toISOString();

const DEFAULT_SEO_FORM = {
  site_title: "Yash Dixit | Software Developer Portfolio",
  meta_description:
    "Explore Yash Dixit's software development projects, technical skills, certifications, and experience in full-stack web development, backend engineering, and cloud technologies.",
  keywords:
    "Yash Dixit, Software Developer, Full-Stack Developer, Cloud Enthusiast, React, Node.js, Python, Java, Docker, Portfolio",
  author: "Yash Dixit",
  canonical_url: "https://yaxit-01.github.io/yash-portfolio/",
  og_title: "Yash Dixit | Software Developer Portfolio",
  og_description:
    "Explore Yash Dixit's software development projects, technical skills, certifications, and experience in full-stack web development, backend engineering, and cloud technologies.",
  og_image_url: "",
  og_type: "website",
  twitter_card: "summary_large_image",
  twitter_handle: "@dixityash",
  theme_color: "#08090d",
  is_published: true,
};

function isValidUrl(string) {
  if (!string || !string.trim()) return true;
  try {
    const url = new URL(string.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function SeoManager({ showToast }) {
  const [formData, setFormData] = useState(DEFAULT_SEO_FORM);
  const [initialData, setInitialData] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showRevertConfirm, setShowRevertConfirm] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [searchPreviewDevice, setSearchPreviewDevice] = useState("desktop"); // "desktop" | "mobile"

  const loadSeoData = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("seo_settings")
        .select("*")
        .eq("id", 1)
        .maybeSingle();

      if (error) {
        // Table may not have been migrated yet
        console.warn("[SeoManager] Notice loading seo_settings:", error.message);
        setFormData(DEFAULT_SEO_FORM);
        setInitialData(DEFAULT_SEO_FORM);
      } else if (data) {
        const loaded = {
          site_title: data.site_title || DEFAULT_SEO_FORM.site_title,
          meta_description: data.meta_description || DEFAULT_SEO_FORM.meta_description,
          keywords: data.keywords || DEFAULT_SEO_FORM.keywords,
          author: data.author || DEFAULT_SEO_FORM.author,
          canonical_url: data.canonical_url || DEFAULT_SEO_FORM.canonical_url,
          og_title: data.og_title || data.site_title || DEFAULT_SEO_FORM.og_title,
          og_description: data.og_description || data.meta_description || DEFAULT_SEO_FORM.og_description,
          og_image_url: data.og_image_url || "",
          og_type: data.og_type || "website",
          twitter_card: data.twitter_card || "summary_large_image",
          twitter_handle: data.twitter_handle || "@dixityash",
          theme_color: data.theme_color || "#08090d",
          is_published: data.is_published !== false,
        };
        setFormData(loaded);
        setInitialData(loaded);
      } else {
        setFormData(DEFAULT_SEO_FORM);
        setInitialData(DEFAULT_SEO_FORM);
      }
    } catch (err) {
      showToast(`Failed to load SEO configuration: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    loadSeoData();
  }, [loadSeoData]);

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

  const handleMediaSelect = (file) => {
    setFormData((prev) => ({
      ...prev,
      og_image_url: file.url,
    }));
    setShowMediaPicker(false);
    showToast("Social sharing image assigned from Media Library!", "success");
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.site_title?.trim()) {
      errors.site_title = "Website title is required.";
    }
    if (!formData.meta_description?.trim()) {
      errors.meta_description = "Meta description is required.";
    }
    if (formData.canonical_url && !isValidUrl(formData.canonical_url)) {
      errors.canonical_url = "Please enter a valid URL (including https://).";
    }
    if (formData.og_image_url && !isValidUrl(formData.og_image_url)) {
      errors.og_image_url = "Please enter a valid image URL.";
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
        site_title: formData.site_title.trim(),
        meta_description: formData.meta_description.trim(),
        keywords: formData.keywords?.trim() || "",
        author: formData.author?.trim() || "Yash Dixit",
        canonical_url: formData.canonical_url?.trim() || "",
        og_title: formData.og_title?.trim() || formData.site_title.trim(),
        og_description: formData.og_description?.trim() || formData.meta_description.trim(),
        og_image_url: formData.og_image_url?.trim() || null,
        og_type: formData.og_type || "website",
        twitter_card: formData.twitter_card || "summary_large_image",
        twitter_handle: formData.twitter_handle?.trim() || "@dixityash",
        theme_color: formData.theme_color || "#08090d",
        is_published: formData.is_published,
        updated_at: getNowIso(),
      };

      const { error } = await supabase
        .from("seo_settings")
        .upsert(payload, { onConflict: "id" });

      if (error) throw error;

      await logActivity({
        action_type: ACTION_TYPES.UPDATE,
        content_type: CONTENT_TYPES.SEO,
        record_id: "1",
        record_title: payload.site_title,
      });

      if (initialData && initialData.is_published !== payload.is_published) {
        await logActivity({
          action_type: payload.is_published ? ACTION_TYPES.PUBLISH : ACTION_TYPES.UNPUBLISH,
          content_type: CONTENT_TYPES.SEO,
          record_id: "1",
          record_title: payload.site_title,
        });
      }

      showToast("SEO & Social Sharing settings saved successfully!", "success");
      setInitialData({ ...formData });
      setFormErrors({});
    } catch (err) {
      showToast(`Error saving SEO configuration: ${err.message}`, "error");
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

  // Character counter helper
  const titleLen = formData.site_title?.length || 0;
  const descLen = formData.meta_description?.length || 0;

  const getCounterClass = (length, minRec, maxRec) => {
    if (length === 0) return "counter-neutral";
    if (length >= minRec && length <= maxRec) return "counter-optimal";
    if (length > maxRec) return "counter-warning";
    return "counter-suboptimal";
  };

  if (loading) {
    return <div className="page-loader">Loading SEO configuration...</div>;
  }

  const effectiveOgTitle = formData.og_title || formData.site_title || "Yash Dixit | Software Developer Portfolio";
  const effectiveOgDesc = formData.og_description || formData.meta_description || "Explore Yash Dixit's portfolio.";
  const displayUrl = formData.canonical_url || "https://yaxit-01.github.io/yash-portfolio/";

  return (
    <div className="manager-container">
      {/* Header */}
      <div className="manager-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <h2>SEO & Social Card Management</h2>
            {isDirty && <span className="unsaved-badge">● Unsaved Changes</span>}
          </div>
          <p>
            Configure global search metadata, Open Graph previews, Twitter/X cards, and search snippet optimization.
          </p>
        </div>

        <div className="publishing-badge-toggle">
          <label className="toggle-label" title="Toggle active SEO override injection on public website">
            <input
              type="checkbox"
              name="is_published"
              checked={formData.is_published}
              onChange={handleChange}
            />
            <span className="toggle-slider" />
            <span className="toggle-text">
              {formData.is_published ? (
                <span className="badge-published"><EyeIcon size={14} /> Active & Live</span>
              ) : (
                <span className="badge-draft"><EyeOffIcon size={14} /> Draft (Defaults Active)</span>
              )}
            </span>
          </label>
        </div>
      </div>

      <div className="seo-two-column-layout">
        {/* Form Column */}
        <form onSubmit={handleSubmit} className="card-form seo-form-column" noValidate>
          {/* Section 1: Search Engine Basics */}
          <div className="form-section">
            <h3>Search Engine Optimization (Google / Bing)</h3>

            <div className="form-group">
              <div className="label-with-counter">
                <label htmlFor="site_title">
                  Global Website Title <span className="required-asterisk">*</span>
                </label>
                <span className={`char-counter ${getCounterClass(titleLen, 50, 60)}`}>
                  {titleLen} / 60 chars (Optimal: 50–60)
                </span>
              </div>
              <input
                id="site_title"
                name="site_title"
                type="text"
                value={formData.site_title}
                onChange={handleChange}
                placeholder="e.g. Yash Dixit | Software Developer Portfolio"
                className={formErrors.site_title ? "input-error" : ""}
              />
              {formErrors.site_title && (
                <span className="field-error-text">{formErrors.site_title}</span>
              )}
            </div>

            <div className="form-group">
              <div className="label-with-counter">
                <label htmlFor="meta_description">
                  Global Meta Description <span className="required-asterisk">*</span>
                </label>
                <span className={`char-counter ${getCounterClass(descLen, 140, 160)}`}>
                  {descLen} / 160 chars (Optimal: 140–160)
                </span>
              </div>
              <textarea
                id="meta_description"
                name="meta_description"
                rows={3}
                value={formData.meta_description}
                onChange={handleChange}
                placeholder="Compelling summary shown in Google search result snippets..."
                className={formErrors.meta_description ? "input-error" : ""}
              />
              {formErrors.meta_description && (
                <span className="field-error-text">{formErrors.meta_description}</span>
              )}
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label htmlFor="canonical_url">Canonical URL</label>
                <input
                  id="canonical_url"
                  name="canonical_url"
                  type="url"
                  value={formData.canonical_url}
                  onChange={handleChange}
                  placeholder="https://yaxit-01.github.io/yash-portfolio/"
                  className={formErrors.canonical_url ? "input-error" : ""}
                />
                {formErrors.canonical_url && (
                  <span className="field-error-text">{formErrors.canonical_url}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="author">Author Name</label>
                <input
                  id="author"
                  name="author"
                  type="text"
                  value={formData.author}
                  onChange={handleChange}
                  placeholder="Yash Dixit"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="keywords">Meta Keywords (Comma-separated)</label>
              <input
                id="keywords"
                name="keywords"
                type="text"
                value={formData.keywords}
                onChange={handleChange}
                placeholder="Yash Dixit, Software Developer, React, Node.js, Python, Java, Docker"
              />
            </div>
          </div>

          {/* Section 2: Open Graph & Social Cards */}
          <div className="form-section">
            <h3>Open Graph & Social Previews (LinkedIn, Twitter/X, Discord)</h3>

            <div className="form-group">
              <label htmlFor="og_title">Open Graph Title</label>
              <input
                id="og_title"
                name="og_title"
                type="text"
                value={formData.og_title}
                onChange={handleChange}
                placeholder="Defaults to Global Title if left blank"
              />
            </div>

            <div className="form-group">
              <label htmlFor="og_description">Open Graph Description</label>
              <textarea
                id="og_description"
                name="og_description"
                rows={2}
                value={formData.og_description}
                onChange={handleChange}
                placeholder="Defaults to Meta Description if left blank"
              />
            </div>

            <div className="form-group">
              <label htmlFor="og_image_url">Social Sharing Image (OG Image)</label>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  id="og_image_url"
                  name="og_image_url"
                  type="url"
                  value={formData.og_image_url}
                  onChange={handleChange}
                  placeholder="https://.../preview.png or select from Media Library"
                  className={formErrors.og_image_url ? "input-error" : ""}
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowMediaPicker(true)}
                  title="Choose image from Supabase Storage Media Library"
                >
                  <MediaIcon size={16} />
                  <span>Choose Media</span>
                </button>
              </div>
              {formErrors.og_image_url && (
                <span className="field-error-text">{formErrors.og_image_url}</span>
              )}
            </div>

            <div className="form-grid-3">
              <div className="form-group">
                <label htmlFor="twitter_card">Twitter / X Card Type</label>
                <select
                  id="twitter_card"
                  name="twitter_card"
                  value={formData.twitter_card}
                  onChange={handleChange}
                  className="filter-select"
                >
                  <option value="summary_large_image">Large Banner (summary_large_image)</option>
                  <option value="summary">Small Thumbnail (summary)</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="twitter_handle">Twitter / X Handle</label>
                <input
                  id="twitter_handle"
                  name="twitter_handle"
                  type="text"
                  value={formData.twitter_handle}
                  onChange={handleChange}
                  placeholder="@dixityash"
                />
              </div>

              <div className="form-group">
                <label htmlFor="theme_color">Browser Theme Color</label>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <input
                    type="color"
                    id="theme_color_picker"
                    value={formData.theme_color || "#08090d"}
                    onChange={(e) => setFormData((p) => ({ ...p, theme_color: e.target.value }))}
                    style={{ width: "36px", height: "36px", padding: 0, border: "none", cursor: "pointer", background: "none" }}
                  />
                  <input
                    id="theme_color"
                    name="theme_color"
                    type="text"
                    value={formData.theme_color}
                    onChange={handleChange}
                    placeholder="#08090d"
                    style={{ flex: 1 }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions Toolbar */}
          <div className="form-actions-bar">
            <div className="actions-left">
              {isDirty && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowRevertConfirm(true)}
                  disabled={saving}
                >
                  <CloseIcon size={16} />
                  <span>Discard Changes</span>
                </button>
              )}
            </div>

            <div className="actions-right">
              <button
                type="submit"
                className="btn-primary"
                disabled={saving || !isDirty}
              >
                {saving ? (
                  <>
                    <RefreshIcon size={16} className="spin-animation" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <SaveIcon size={16} />
                    <span>Save SEO Configuration</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Live Interactive Preview Column */}
        <aside className="seo-previews-column" aria-label="Live Search and Social Previews">
          {/* Preview 1: Google Search Snippet */}
          <div className="preview-card-box">
            <div className="preview-card-header">
              <span className="preview-badge">GOOGLE SEARCH RESULT PREVIEW</span>
              <div className="preview-device-toggle">
                <button
                  type="button"
                  className={`device-btn ${searchPreviewDevice === "desktop" ? "active" : ""}`}
                  onClick={() => setSearchPreviewDevice("desktop")}
                >
                  Desktop
                </button>
                <button
                  type="button"
                  className={`device-btn ${searchPreviewDevice === "mobile" ? "active" : ""}`}
                  onClick={() => setSearchPreviewDevice("mobile")}
                >
                  Mobile
                </button>
              </div>
            </div>

            <div className={`google-search-snippet ${searchPreviewDevice}`}>
              <div className="google-url-row">
                <div className="google-favicon-pill">Y</div>
                <div className="google-url-text">
                  <span className="google-site-name">Yash Dixit</span>
                  <span className="google-breadcrumbs">{displayUrl}</span>
                </div>
              </div>
              <h4 className="google-title">{formData.site_title || "Website Title"}</h4>
              <p className="google-description">
                {formData.meta_description || "Meta description will appear here in search snippets."}
              </p>
            </div>

            <div className="preview-disclaimer">
              <small>
                Note: Search engines dynamically evaluate snippets based on search intent. Setting clean metadata gives engines the best signal, though search rankings and indexation timing are determined by web crawler algorithms.
              </small>
            </div>
          </div>

          {/* Preview 2: Social Card (OpenGraph / Twitter) */}
          <div className="preview-card-box">
            <div className="preview-card-header">
              <span className="preview-badge">SOCIAL MEDIA SHARE CARD PREVIEW</span>
              <span className="preview-tag">{formData.twitter_card === "summary" ? "Compact" : "Large Banner"}</span>
            </div>

            <div className={`social-preview-card ${formData.twitter_card === "summary" ? "summary-mode" : "banner-mode"}`}>
              {formData.og_image_url ? (
                <div className="social-preview-image-wrap">
                  <img
                    src={formData.og_image_url}
                    alt="Social Card Preview"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                </div>
              ) : (
                <div className="social-preview-placeholder">
                  <ExternalLinkIcon size={28} />
                  <span>No Custom Social Image Selected</span>
                  <small>Add an OG image URL or choose from Media Library</small>
                </div>
              )}

              <div className="social-preview-body">
                <span className="social-domain-badge">
                  {displayUrl.replace(/https?:\/\//, "").replace(/\/$/, "")}
                </span>
                <strong className="social-preview-title">{effectiveOgTitle}</strong>
                <p className="social-preview-desc">{effectiveOgDesc}</p>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Discard Confirmation Modal */}
      <ConfirmModal
        isOpen={showRevertConfirm}
        title="Discard Unsaved SEO Changes?"
        message="Are you sure you want to revert all changes made to your SEO configuration? Any unsaved edits will be lost."
        confirmText="Discard Changes"
        confirmVariant="danger"
        onConfirm={handleRevert}
        onCancel={() => setShowRevertConfirm(false)}
      />

      {/* Media Picker Modal for OG Image */}
      <MediaPickerModal
        isOpen={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        onSelect={handleMediaSelect}
        currentUrl={formData.og_image_url}
        folder="projects"
        title="Select Social Sharing Image"
      />
    </div>
  );
}

