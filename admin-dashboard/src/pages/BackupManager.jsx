import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import {
  DownloadIcon,
  UploadCloudIcon,
  RefreshIcon,
  CheckIcon,
  AlertCircleIcon,
  FileTextIcon,
  ProjectsIcon,
  CertificateIcon,
  HackathonIcon,
  SkillsIcon,
  EducationIcon,
  UserIcon,
  GlobeIcon,
  DatabaseIcon,
} from "../components/Icons";
import { ConfirmModal } from "../components/ConfirmModal";
import {
  generatePortfolioBackup,
  validateBackupJson,
  restorePortfolioBackup,
} from "../services/backupService";
import { exportContentInventoryCsv } from "../services/exportService";

export function BackupManager({ showToast }) {
  // Live database counts for comparison
  const [liveCounts, setLiveCounts] = useState({
    personal_info: 0,
    about_me: 0,
    skills: 0,
    projects: 0,
    hackathons: 0,
    certificates: 0,
    education: 0,
    seo_settings: 0,
  });

  const [loadingLive, setLoadingLive] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);

  // Import state
  const [importFile, setImportFile] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const [validating, setValidating] = useState(false);
  const [showConfirmRestore, setShowConfirmRestore] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [restoreResults, setRestoreResults] = useState(null);

  const fileInputRef = useRef(null);

  const fetchLiveCounts = useCallback(async () => {
    try {
      setLoadingLive(true);
      const [
        personalRes,
        aboutRes,
        skillsRes,
        projectsRes,
        hackathonsRes,
        certRes,
        eduRes,
        seoRes,
      ] = await Promise.all([
        supabase.from("personal_info").select("id", { count: "exact", head: true }),
        supabase.from("about_me").select("id", { count: "exact", head: true }),
        supabase.from("skills").select("id", { count: "exact", head: true }),
        supabase.from("projects").select("id", { count: "exact", head: true }),
        supabase.from("hackathons").select("id", { count: "exact", head: true }),
        supabase.from("certificates").select("id", { count: "exact", head: true }),
        supabase.from("education").select("id", { count: "exact", head: true }),
        supabase.from("seo_settings").select("id", { count: "exact", head: true }),
      ]);

      setLiveCounts({
        personal_info: personalRes.count || 0,
        about_me: aboutRes.count || 0,
        skills: skillsRes.count || 0,
        projects: projectsRes.count || 0,
        hackathons: hackathonsRes.count || 0,
        certificates: certRes.count || 0,
        education: eduRes.count || 0,
        seo_settings: seoRes.count || 0,
      });
    } catch (err) {
      console.warn("Notice loading live counts:", err);
    } finally {
      setLoadingLive(false);
    }
  }, []);

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    fetchLiveCounts();
  }, [fetchLiveCounts]);

  const handleExportBackup = async () => {
    try {
      setExporting(true);
      const backup = await generatePortfolioBackup();
      showToast(
        `Backup created successfully! Exported ${backup.manifest.total_items} items.`,
        "success"
      );
    } catch (err) {
      showToast(`Failed to generate backup: ${err.message}`, "error");
    } finally {
      setExporting(false);
    }
  };

  const handleExportInventoryCsv = async () => {
    try {
      setExportingCsv(true);
      const [
        projRes,
        certRes,
        hackRes,
        skillRes,
        eduRes,
        personalRes,
      ] = await Promise.all([
        supabase.from("projects").select("*").order("sort_order", { ascending: true }),
        supabase.from("certificates").select("*").order("sort_order", { ascending: true }),
        supabase.from("hackathons").select("*").order("sort_order", { ascending: true }),
        supabase.from("skills").select("*").order("sort_order", { ascending: true }),
        supabase.from("education").select("*").eq("id", 1).maybeSingle(),
        supabase.from("personal_info").select("*").eq("id", 1).maybeSingle(),
      ]);

      exportContentInventoryCsv({
        projects: projRes.data || [],
        certificates: certRes.data || [],
        hackathons: hackRes.data || [],
        skills: skillRes.data || [],
        education: eduRes.data || null,
        personalInfo: personalRes.data || null,
      });

      showToast("Content inventory exported to CSV spreadsheet!", "success");
    } catch (err) {
      showToast(`Failed to export CSV: ${err.message}`, "error");
    } finally {
      setExportingCsv(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setValidationResult(null);
    setRestoreResults(null);
    setValidating(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result;
        const result = validateBackupJson(content);
        setValidationResult(result);
        if (!result.valid) {
          showToast(result.error, "error");
        } else {
          showToast("Backup file validated successfully. Review details below.", "success");
        }
      } catch (err) {
        setValidationResult({ valid: false, error: err.message });
      } finally {
        setValidating(false);
      }
    };

    reader.onerror = () => {
      setValidationResult({ valid: false, error: "Failed to read backup file." });
      setValidating(false);
    };

    reader.readAsText(file);
  };

  const handleResetImport = () => {
    setImportFile(null);
    setValidationResult(null);
    setRestoreResults(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleExecuteRestore = async () => {
    if (!validationResult || !validationResult.valid || !validationResult.parsedData) return;

    try {
      setRestoring(true);
      setShowConfirmRestore(false);

      const results = await restorePortfolioBackup(validationResult.parsedData);
      setRestoreResults(results);

      if (results.errors.length > 0) {
        showToast(
          `Backup restored with ${results.errors.length} warning(s). Check details.`,
          "error"
        );
      } else {
        showToast("All portfolio records restored and synced successfully!", "success");
      }

      await fetchLiveCounts();
    } catch (err) {
      showToast(`Restore failed: ${err.message}`, "error");
    } finally {
      setRestoring(false);
    }
  };

  const CATEGORY_META = [
    { key: "personal_info", label: "Personal Information", icon: UserIcon },
    { key: "about_me", label: "About Me Story", icon: FileTextIcon },
    { key: "skills", label: "Skill Categories", icon: SkillsIcon },
    { key: "projects", label: "Selected Projects", icon: ProjectsIcon },
    { key: "hackathons", label: "Hackathon Builds", icon: HackathonIcon },
    { key: "certificates", label: "Certifications", icon: CertificateIcon },
    { key: "education", label: "Academic Foundation", icon: EducationIcon },
    { key: "seo_settings", label: "SEO & Social Metadata", icon: GlobeIcon },
  ];

  return (
    <div className="manager-container">
      {/* Header */}
      <div className="manager-header">
        <div>
          <h2>Portfolio Backup & Disaster Recovery</h2>
          <p>
            Export complete structured portfolio records to validated JSON packages, or restore previous backups with safe non-destructive primary-key merging.
          </p>
        </div>

        <div className="header-status-pill">
          <DatabaseIcon size={14} />
          <span>PostgreSQL Active</span>
        </div>
      </div>

      <div className="backup-two-column-layout">
        {/* Card 1: Export Package */}
        <div className="backup-panel-card">
          <div className="panel-header">
            <div className="panel-title-group">
              <DownloadIcon size={18} className="panel-title-icon" />
              <h3>Export Structured Content</h3>
            </div>
            <span className="panel-badge">JSON Format</span>
          </div>

          <div className="backup-card-body">
            <p className="backup-lead-desc">
              Generate a snapshot containing all live database records across your portfolio. The resulting JSON file includes record schemas, text fields, tech stacks, and Supabase Storage asset paths.
            </p>

            <div className="backup-scope-table">
              <div className="scope-table-header">
                <span>CONTENT COLLECTION</span>
                <span>LIVE RECORDS</span>
              </div>
              {CATEGORY_META.map((cat) => {
                const Icon = cat.icon;
                return (
                  <div key={cat.key} className="scope-table-row">
                    <span className="scope-name">
                      <Icon size={14} className="scope-icon" />
                      {cat.label}
                    </span>
                    <strong className="scope-count">
                      {loadingLive ? "..." : liveCounts[cat.key]}
                    </strong>
                  </div>
                );
              })}
            </div>

            <div className="backup-alert-note">
              <strong>Asset Preservation Notice:</strong> This JSON export contains all database content and storage asset URLs. Raw binary image and PDF files are hosted in your Supabase Storage bucket (<code>portfolio-assets</code>) and remain protected in the cloud.
            </div>

            <div className="backup-actions-bar">
              <button
                type="button"
                className="btn-primary"
                onClick={handleExportBackup}
                disabled={exporting}
              >
                {exporting ? (
                  <>
                    <RefreshIcon size={16} className="spin-animation" />
                    <span>Packaging Backup...</span>
                  </>
                ) : (
                  <>
                    <DownloadIcon size={16} />
                    <span>Download Full JSON Backup</span>
                  </>
                )}
              </button>

              <button
                type="button"
                className="btn-secondary"
                onClick={handleExportInventoryCsv}
                disabled={exportingCsv}
                title="Download spreadsheet-compatible CSV inventory"
              >
                <FileTextIcon size={16} />
                <span>Export CSV Spreadsheet</span>
              </button>
            </div>
          </div>
        </div>

        {/* Card 2: Restore / Import */}
        <div className="backup-panel-card">
          <div className="panel-header">
            <div className="panel-title-group">
              <UploadCloudIcon size={18} className="panel-title-icon" />
              <h3>Restore / Import Backup</h3>
            </div>
            <span className="panel-badge">Safe Merge</span>
          </div>

          <div className="backup-card-body">
            <p className="backup-lead-desc">
              Select a valid <code>.json</code> portfolio backup to inspect its structure and merge its records back into your Supabase database.
            </p>

            {/* File Upload Box */}
            {!importFile ? (
              <div
                className="backup-dropzone"
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json,application/json"
                  style={{ display: "none" }}
                  onChange={handleFileSelect}
                />
                <UploadCloudIcon size={32} className="dropzone-icon" />
                <strong>Select Portfolio Backup (.json)</strong>
                <span>Click or drag and drop your exported backup file here</span>
              </div>
            ) : (
              <div className="backup-file-selected-box">
                <div className="selected-file-meta">
                  <FileTextIcon size={20} />
                  <div>
                    <strong>{importFile.name}</strong>
                    <span>{(importFile.size / 1024).toFixed(1)} KB</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-secondary btn-sm"
                  onClick={handleResetImport}
                  disabled={restoring}
                >
                  Choose Different File
                </button>
              </div>
            )}

            {/* Validation & Inspection */}
            {validating && (
              <div className="backup-validating-spinner">
                <RefreshIcon size={16} className="spin-animation" />
                <span>Validating JSON schema and contents...</span>
              </div>
            )}

            {validationResult && !validationResult.valid && (
              <div className="backup-error-banner">
                <AlertCircleIcon size={18} />
                <div>
                  <strong>Invalid Backup File</strong>
                  <p>{validationResult.error}</p>
                </div>
              </div>
            )}

            {validationResult && validationResult.valid && (
              <div className="backup-dry-run-card">
                <div className="dry-run-header">
                  <span className="dry-run-badge">
                    <CheckIcon size={13} /> Schema Validated (v{validationResult.version})
                  </span>
                  <span className="dry-run-meta">
                    Exported {new Date(validationResult.exportedAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="comparison-table">
                  <div className="comparison-row header">
                    <span>SECTION</span>
                    <span>BACKUP HAS</span>
                    <span>DATABASE HAS</span>
                  </div>
                  {CATEGORY_META.map((cat) => {
                    const backupCount = validationResult.summary[cat.key] || 0;
                    const dbCount = liveCounts[cat.key] || 0;
                    return (
                      <div key={cat.key} className="comparison-row">
                        <span className="comp-name">{cat.label}</span>
                        <span className="comp-val backup">{backupCount} records</span>
                        <span className="comp-val db">{dbCount} records</span>
                      </div>
                    );
                  })}
                </div>

                <div className="merge-strategy-info">
                  <strong>Safe Merge Guarantee:</strong> Records are matched by primary key (e.g. category number or record ID). Existing records will be updated; new records will be added. Unmentioned records will not be deleted.
                </div>

                {restoreResults ? (
                  <div className="restore-success-summary">
                    <CheckIcon size={18} style={{ color: "#10b981" }} />
                    <div>
                      <strong>Restore Complete!</strong>
                      <p>
                        Successfully restored records across all categories. Live database has been updated.
                      </p>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="btn-primary restore-action-btn"
                    onClick={() => setShowConfirmRestore(true)}
                    disabled={restoring}
                  >
                    {restoring ? (
                      <>
                        <RefreshIcon size={16} className="spin-animation" />
                        <span>Restoring Records...</span>
                      </>
                    ) : (
                      <>
                        <RefreshIcon size={16} />
                        <span>Confirm & Restore {validationResult.totalRecords} Records</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showConfirmRestore}
        title="Confirm Safe Portfolio Restore"
        message={`Are you sure you want to restore ${
          validationResult?.totalRecords || 0
        } records into your Supabase database? Matching records will be updated with the backup's content. Unaffected records will be preserved.`}
        confirmText="Proceed With Restore"
        confirmVariant="primary"
        onConfirm={handleExecuteRestore}
        onCancel={() => setShowConfirmRestore(false)}
      />
    </div>
  );
}
