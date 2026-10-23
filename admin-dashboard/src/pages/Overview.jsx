import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../lib/supabaseClient";
import {
  ProjectsIcon,
  CertificateIcon,
  HackathonIcon,
  SkillsIcon,
  EducationIcon,
  UserIcon,
  EyeIcon,
  EyeOffIcon,
  ExternalLinkIcon,
  PlusIcon,
  RefreshIcon,
  ClockIcon,
  AlertCircleIcon,
  EditIcon,
  MediaIcon,
  DownloadIcon,
  GlobeIcon,
  DatabaseIcon,
  MailIcon,
} from "../components/Icons";
import { PublicationStatusChart } from "../components/Charts/PublicationStatusChart";
import { ContentDistributionChart } from "../components/Charts/ContentDistributionChart";
import { ActivityTimelineChart } from "../components/Charts/ActivityTimelineChart";
import { fetchActivityLogs } from "../services/activityService";
import { exportContentInventoryCsv } from "../services/exportService";
import { listAllMediaFiles } from "../services/mediaService";

function formatRelativeTime(dateString) {
  if (!dateString) return "Recently";
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (isNaN(diffInSeconds) || diffInSeconds < 0) return "Recently";
  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) {
    const mins = Math.floor(diffInSeconds / 60);
    return `${mins} ${mins === 1 ? "min" : "mins"} ago`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} ${hours === 1 ? "hr" : "hrs"} ago`;
  }
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} ${days === 1 ? "day" : "days"} ago`;
  }
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function Overview({ onNavigate, showToast }) {
  // Quantitative metrics state
  const [stats, setStats] = useState({
    projects: { total: 0, published: 0, drafts: 0 },
    certificates: { total: 0, published: 0, drafts: 0 },
    hackathons: { total: 0, published: 0, drafts: 0 },
    skills: { categoriesTotal: 0, toolsCount: 0, published: 0 },
    education: { total: 0, published: 0 },
    mediaCount: 0,
  });

  // Raw dataset references for CSV export
  const [rawRecords, setRawRecords] = useState({
    projects: [],
    certificates: [],
    hackathons: [],
    skills: [],
    education: null,
    personalInfo: null,
  });

  const [recentActivities, setRecentActivities] = useState([]);
  const [timelineLogs, setTimelineLogs] = useState([]);
  const [timePeriod, setTimePeriod] = useState("7d"); // "7d" | "30d" | "90d" | "all"
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);

  const loadDashboardData = useCallback(async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const [
        projRes,
        certRes,
        hackRes,
        skillRes,
        eduRes,
        personalRes,
        aboutRes,
        mediaFiles,
      ] = await Promise.all([
        supabase
          .from("projects")
          .select("*")
          .order("sort_order", { ascending: true }),
        supabase
          .from("certificates")
          .select("*")
          .order("sort_order", { ascending: true }),
        supabase
          .from("hackathons")
          .select("*")
          .order("sort_order", { ascending: true }),
        supabase
          .from("skills")
          .select("*")
          .order("sort_order", { ascending: true }),
        supabase
          .from("education")
          .select("*")
          .eq("id", 1)
          .maybeSingle(),
        supabase
          .from("personal_info")
          .select("*")
          .eq("id", 1)
          .maybeSingle(),
        supabase
          .from("about_me")
          .select("*")
          .eq("id", 1)
          .maybeSingle(),
        listAllMediaFiles().catch(() => []),
      ]);

      if (projRes.error) throw projRes.error;
      if (certRes.error) throw certRes.error;
      if (hackRes.error) throw hackRes.error;
      if (skillRes.error) throw skillRes.error;

      const projectRows = projRes.data || [];
      const certRows = certRes.data || [];
      const hackRows = hackRes.data || [];
      const skillRows = skillRes.data || [];
      const eduRow = eduRes.data || null;
      const personalRow = personalRes.data || null;
      const mediaList = mediaFiles || [];

      // Save raw records for export
      setRawRecords({
        projects: projectRows,
        certificates: certRows,
        hackathons: hackRows,
        skills: skillRows,
        education: eduRow,
        personalInfo: personalRow,
      });

      const countGroup = (rows) => {
        const total = rows.length;
        const published = rows.filter((r) => r.is_published !== false).length;
        return { total, published, drafts: total - published };
      };

      const toolsCount = skillRows.reduce(
        (acc, s) =>
          acc + (Array.isArray(s.skills_list) ? s.skills_list.length : 0),
        0
      );

      setStats({
        projects: countGroup(projectRows),
        certificates: countGroup(certRows),
        hackathons: countGroup(hackRows),
        skills: {
          categoriesTotal: skillRows.length,
          toolsCount,
          published: skillRows.filter((s) => s.is_published !== false).length,
        },
        education: {
          total: eduRow ? 1 : 0,
          published: eduRow && eduRow.is_published !== false ? 1 : 0,
        },
        mediaCount: mediaList.length,
      });

      // Construct authentic Recent Activity from real PostgreSQL records
      const activities = [];

      projectRows.forEach((p) => {
        if (p.updated_at) {
          activities.push({
            id: `proj-${p.id}`,
            title: p.name || "Untitled Project",
            type: "Project",
            targetTab: "projects",
            isPublished: p.is_published !== false,
            timestamp: p.updated_at,
            action: "Project updated",
            icon: ProjectsIcon,
          });
        }
      });

      certRows.forEach((c) => {
        if (c.updated_at) {
          activities.push({
            id: `cert-${c.id}`,
            title: c.title || "Untitled Certificate",
            type: "Certificate",
            targetTab: "certificates",
            isPublished: c.is_published !== false,
            timestamp: c.updated_at,
            action: "Credential updated",
            icon: CertificateIcon,
          });
        }
      });

      hackRows.forEach((h) => {
        if (h.updated_at) {
          activities.push({
            id: `hack-${h.id}`,
            title: h.project_name
              ? `${h.project_name} (${h.event || "Hackathon"})`
              : h.event || "Hackathon entry",
            type: "Hackathon",
            targetTab: "hackathons",
            isPublished: h.is_published !== false,
            timestamp: h.updated_at,
            action: "Challenge entry updated",
            icon: HackathonIcon,
          });
        }
      });

      skillRows.forEach((s) => {
        if (s.updated_at) {
          activities.push({
            id: `skill-${s.id}`,
            title: s.title || s.category_name || "Skill Category",
            type: "Skills",
            targetTab: "skills",
            isPublished: s.is_published !== false,
            timestamp: s.updated_at,
            action: "Skill group modified",
            icon: SkillsIcon,
          });
        }
      });

      if (eduRow?.updated_at) {
        activities.push({
          id: "edu-record",
          title: `${eduRow.degree || "Degree"} (${eduRow.institution || "Academic"})`,
          type: "Education",
          targetTab: "education",
          isPublished: eduRow.is_published !== false,
          timestamp: eduRow.updated_at,
          action: "Education record updated",
          icon: EducationIcon,
        });
      }

      if (personalRow?.updated_at) {
        activities.push({
          id: "personal-record",
          title: personalRow.headline || personalRow.name || "Profile & Bio",
          type: "Personal Info",
          targetTab: "personal",
          isPublished: personalRow.is_published !== false,
          timestamp: personalRow.updated_at,
          action: "Profile & contacts updated",
          icon: UserIcon,
        });
      }

      if (aboutRes.data?.updated_at) {
        activities.push({
          id: "about-record",
          title: "About Me & Focus Areas",
          type: "About Me",
          targetTab: "about",
          isPublished: aboutRes.data.is_published !== false,
          timestamp: aboutRes.data.updated_at,
          action: "Bio & engineering focus modified",
          icon: UserIcon,
        });
      }

      // Sort by latest timestamp first and pick the most recent 6
      activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setRecentActivities(activities.slice(0, 6));

      // Fetch authentic activity log entries for the selected timePeriod
      const { data: logs } = await fetchActivityLogs({
        dateRange: timePeriod,
        limit: 100,
      });
      setTimelineLogs(logs || []);
    } catch (err) {
      console.error("Failed to load overview data:", err);
      setError(err.message || "Failed to load dashboard metrics from Supabase.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [timePeriod]);

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    loadDashboardData();
  }, [loadDashboardData]);

  // Aggregate published vs draft counts across entire portfolio
  const aggregatePublication = useMemo(() => {
    let published =
      stats.projects.published +
      stats.certificates.published +
      stats.hackathons.published +
      stats.skills.published +
      stats.education.published;

    let drafts =
      stats.projects.drafts +
      stats.certificates.drafts +
      stats.hackathons.drafts +
      (stats.skills.categoriesTotal - stats.skills.published) +
      (stats.education.total - stats.education.published);

    if (rawRecords.personalInfo) {
      if (rawRecords.personalInfo.is_published !== false) published++;
      else drafts++;
    }

    return { published, drafts };
  }, [stats, rawRecords.personalInfo]);

  // Handle inventory CSV export
  const handleExportInventory = () => {
    try {
      setExporting(true);
      exportContentInventoryCsv({
        projects: rawRecords.projects,
        certificates: rawRecords.certificates,
        hackathons: rawRecords.hackathons,
        skills: rawRecords.skills,
        education: rawRecords.education,
        personalInfo: rawRecords.personalInfo,
      });
      if (showToast) {
        showToast("Content inventory exported to CSV!", "success");
      }
    } catch (err) {
      if (showToast) {
        showToast(`Failed to export CSV: ${err.message}`, "error");
      }
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="overview-page">
        <div className="overview-skeleton-header">
          <div className="skeleton-line title" />
          <div className="skeleton-line subtitle" />
        </div>
        <div className="metrics-grid">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="metric-card skeleton-card">
              <div className="skeleton-line pill" />
              <div className="skeleton-line value" />
              <div className="skeleton-line meta" />
            </div>
          ))}
        </div>
        <div className="analytics-section-container skeleton-panel" style={{ height: "300px" }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="overview-page">
        <div className="overview-error-card">
          <div className="error-icon-box">
            <AlertCircleIcon size={24} />
          </div>
          <div className="error-body">
            <h3>Unable to fetch dashboard metrics</h3>
            <p>{error}</p>
            <button
              type="button"
              className="btn-primary"
              onClick={() => loadDashboardData(true)}
            >
              <RefreshIcon size={15} />
              <span>Retry Connection</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overview-page">
      {/* Hero Welcome Banner */}
      <div className="overview-hero-banner">
        <div className="hero-content">
          <h2>Welcome back, Yash!</h2>
          <p>
            Portfolio Management System. Manage live content, publish drafts, and
            sync real-time updates directly to your GitHub Pages website.
          </p>
        </div>
        <div className="overview-hero-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={handleExportInventory}
            disabled={exporting}
            title="Download full content inventory as a CSV spreadsheet"
          >
            <DownloadIcon size={14} />
            <span>{exporting ? "Exporting..." : "Export Inventory CSV"}</span>
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={() => loadDashboardData(true)}
            disabled={refreshing}
            title="Reload live stats from Supabase"
          >
            <RefreshIcon
              size={14}
              className={refreshing ? "spin-animation" : ""}
            />
            <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
          </button>

          <a
            href="https://yaxit-01.github.io/yash-portfolio/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
          >
            <span>Live Portfolio</span>
            <ExternalLinkIcon size={14} />
          </a>
        </div>
      </div>

      {/* Advanced Metrics Grid */}
      <div className="metrics-grid">
        <div
          className="metric-card"
          onClick={() => onNavigate("projects")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && onNavigate("projects")}
        >
          <div className="metric-header">
            <span className="metric-icon-wrap">
              <ProjectsIcon size={20} />
            </span>
            <span className="metric-label">PROJECTS</span>
          </div>
          <div className="metric-value">{stats.projects.total}</div>
          <div className="metric-footer">
            <span className="metric-sub published">
              <EyeIcon size={13} /> {stats.projects.published} Published
            </span>
            {stats.projects.drafts > 0 ? (
              <span className="metric-sub draft">
                <EyeOffIcon size={13} /> {stats.projects.drafts} Draft
              </span>
            ) : (
              <span className="metric-sub neutral">All live</span>
            )}
          </div>
        </div>

        <div
          className="metric-card"
          onClick={() => onNavigate("certificates")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && onNavigate("certificates")}
        >
          <div className="metric-header">
            <span className="metric-icon-wrap">
              <CertificateIcon size={20} />
            </span>
            <span className="metric-label">CERTIFICATES</span>
          </div>
          <div className="metric-value">{stats.certificates.total}</div>
          <div className="metric-footer">
            <span className="metric-sub published">
              <EyeIcon size={13} /> {stats.certificates.published} Published
            </span>
            {stats.certificates.drafts > 0 ? (
              <span className="metric-sub draft">
                <EyeOffIcon size={13} /> {stats.certificates.drafts} Draft
              </span>
            ) : (
              <span className="metric-sub neutral">All credentials live</span>
            )}
          </div>
        </div>

        <div
          className="metric-card"
          onClick={() => onNavigate("hackathons")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && onNavigate("hackathons")}
        >
          <div className="metric-header">
            <span className="metric-icon-wrap">
              <HackathonIcon size={20} />
            </span>
            <span className="metric-label">HACKATHONS</span>
          </div>
          <div className="metric-value">{stats.hackathons.total}</div>
          <div className="metric-footer">
            <span className="metric-sub published">
              <EyeIcon size={13} /> {stats.hackathons.published} Published
            </span>
            {stats.hackathons.drafts > 0 ? (
              <span className="metric-sub draft">
                <EyeOffIcon size={13} /> {stats.hackathons.drafts} Draft
              </span>
            ) : (
              <span className="metric-sub neutral">All challenge entries live</span>
            )}
          </div>
        </div>

        <div
          className="metric-card"
          onClick={() => onNavigate("skills")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && onNavigate("skills")}
        >
          <div className="metric-header">
            <span className="metric-icon-wrap">
              <SkillsIcon size={20} />
            </span>
            <span className="metric-label">SKILLS & TOOLS</span>
          </div>
          <div className="metric-value">{stats.skills.categoriesTotal}</div>
          <div className="metric-footer">
            <span className="metric-sub published">
              {stats.skills.toolsCount} Individual tools
            </span>
            <span className="metric-sub neutral">
              {stats.skills.published} Active categories
            </span>
          </div>
        </div>

        <div
          className="metric-card"
          onClick={() => onNavigate("education")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && onNavigate("education")}
        >
          <div className="metric-header">
            <span className="metric-icon-wrap">
              <EducationIcon size={20} />
            </span>
            <span className="metric-label">ACADEMIC FOUNDATION</span>
          </div>
          <div className="metric-value">{stats.education.total}</div>
          <div className="metric-footer">
            <span className="metric-sub published">
              {stats.education.published > 0 ? "Published on site" : "Draft"}
            </span>
            <span className="metric-sub neutral">Degree & coursework</span>
          </div>
        </div>
      </div>

      {/* Analytics & Content Distribution Section (Phase 4) */}
      <div className="analytics-section-card">
        <div className="analytics-section-header">
          <div>
            <h3>Portfolio Analytics & Activity Insights</h3>
            <p>
              Publication distribution, content inventory balances, and genuine administrative activity history.
            </p>
          </div>

          <div className="time-filter-pills" role="tablist" aria-label="Activity date range filter">
            {[
              { id: "7d", label: "7 Days" },
              { id: "30d", label: "30 Days" },
              { id: "90d", label: "90 Days" },
              { id: "all", label: "All Time" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={timePeriod === tab.id}
                className={`filter-pill ${timePeriod === tab.id ? "active" : ""}`}
                onClick={() => setTimePeriod(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="analytics-charts-grid">
          <PublicationStatusChart
            publishedCount={aggregatePublication.published}
            draftCount={aggregatePublication.drafts}
          />

          <ContentDistributionChart
            projectCount={stats.projects.total}
            certCount={stats.certificates.total}
            hackathonCount={stats.hackathons.total}
            skillCount={stats.skills.categoriesTotal}
            mediaCount={stats.mediaCount}
          />
        </div>

        <div className="analytics-timeline-wrapper">
          <ActivityTimelineChart
            activities={timelineLogs}
            period={timePeriod}
          />
        </div>
      </div>

      {/* Main Grid: Recent Activity & Quick Actions */}
      <div className="overview-sections-row">
        {/* Recent Activity (Authentic PostgreSQL timestamps) */}
        <div className="content-panel activity-panel">
          <div className="panel-header">
            <div className="panel-title-group">
              <ClockIcon size={18} className="panel-title-icon" />
              <h3>Recent Content Activity</h3>
            </div>
            <button
              type="button"
              className="view-all-history-link"
              onClick={() => onNavigate("activity")}
              title="View full activity log and audit history"
            >
              Full History &rarr;
            </button>
          </div>

          <div className="activity-list">
            {recentActivities.length === 0 ? (
              <div className="activity-empty-state">
                <p>No recent activity recorded yet.</p>
                <span>Edits and additions made in any manager will appear here automatically.</span>
              </div>
            ) : (
              recentActivities.map((act) => {
                const Icon = act.icon;
                return (
                  <div key={act.id} className="activity-item">
                    <div className="activity-icon-col">
                      <div className="activity-icon-bubble">
                        <Icon size={15} />
                      </div>
                    </div>
                    <div className="activity-content-col">
                      <div className="activity-line-top">
                        <span className="activity-title" title={act.title}>
                          {act.title}
                        </span>
                        <span className="activity-time">
                          {formatRelativeTime(act.timestamp)}
                        </span>
                      </div>
                      <div className="activity-line-bottom">
                        <span className="activity-badge-type">{act.type}</span>
                        <span
                          className={`activity-badge-status ${
                            act.isPublished ? "published" : "draft"
                          }`}
                        >
                          {act.isPublished ? "Published" : "Draft"}
                        </span>
                        <span className="activity-action-label">{act.action}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="activity-action-btn"
                      onClick={() => onNavigate(act.targetTab)}
                      title={`Open ${act.type} manager`}
                      aria-label={`Open ${act.type} manager`}
                    >
                      <EditIcon size={14} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Quick Actions & Workflow Hub */}
        <div className="content-panel quick-actions-panel">
          <div className="panel-header">
            <div className="panel-title-group">
              <PlusIcon size={18} className="panel-title-icon" />
              <h3>Quick Content Actions</h3>
            </div>
            <span className="panel-badge">Workflows</span>
          </div>

          <div className="quick-actions-list">
            <button
              type="button"
              className="quick-action-item"
              onClick={() => onNavigate("messages")}
            >
              <div
                className="action-icon-box"
                style={{
                  background: "rgba(139, 92, 246, 0.12)",
                  color: "var(--accent-purple, #8b5cf6)",
                }}
              >
                <MailIcon size={18} />
              </div>
              <div className="action-text">
                <strong>Contact Messages & Inquiries</strong>
                <span>Review visitor submissions, reply via email, and manage message status</span>
              </div>
            </button>

            <button
              type="button"
              className="quick-action-item"
              onClick={() => onNavigate("activity")}
            >
              <div
                className="action-icon-box"
                style={{
                  background: "rgba(16, 185, 129, 0.12)",
                  color: "var(--accent-emerald, #10b981)",
                }}
              >
                <ClockIcon size={18} />
              </div>
              <div className="action-text">
                <strong>Activity & Audit History</strong>
                <span>Inspect complete administrative logs, filtered timelines, and export CSV</span>
              </div>
            </button>

            <button
              type="button"
              className="quick-action-item"
              onClick={() => onNavigate("media")}
            >
              <div
                className="action-icon-box"
                style={{
                  background: "rgba(59, 130, 246, 0.12)",
                  color: "var(--accent-blue, #3b82f6)",
                }}
              >
                <MediaIcon size={18} />
              </div>
              <div className="action-text">
                <strong>Media & Asset Library</strong>
                <span>Upload credentials, project assets, and PDFs to Supabase Storage</span>
              </div>
            </button>

            <button
              type="button"
              className="quick-action-item"
              onClick={() => onNavigate("seo")}
            >
              <div
                className="action-icon-box"
                style={{
                  background: "rgba(6, 182, 212, 0.12)",
                  color: "var(--accent, #06b6d4)",
                }}
              >
                <GlobeIcon size={18} />
              </div>
              <div className="action-text">
                <strong>SEO & Social Previews</strong>
                <span>Configure search snippet titles, descriptions, and Twitter/OG social cards</span>
              </div>
            </button>

            <button
              type="button"
              className="quick-action-item"
              onClick={() => onNavigate("backup")}
            >
              <div
                className="action-icon-box"
                style={{
                  background: "rgba(245, 158, 11, 0.12)",
                  color: "var(--accent-amber, #f59e0b)",
                }}
              >
                <DatabaseIcon size={18} />
              </div>
              <div className="action-text">
                <strong>Backup & Disaster Recovery</strong>
                <span>Export complete JSON snapshots and restore portfolio content safely</span>
              </div>
            </button>

            <button
              type="button"
              className="quick-action-item"
              onClick={() => onNavigate("projects")}
            >
              <div className="action-icon-box projects">
                <ProjectsIcon size={18} />
              </div>
              <div className="action-text">
                <strong>New / Edit Projects</strong>
                <span>Add featured projects, update tech tags, live links, or repo URLs</span>
              </div>
            </button>

            <button
              type="button"
              className="quick-action-item"
              onClick={() => onNavigate("certificates")}
            >
              <div className="action-icon-box certificates">
                <CertificateIcon size={18} />
              </div>
              <div className="action-text">
                <strong>Upload Certificate Credential</strong>
                <span>Upload credential images to Storage and assign issuer details</span>
              </div>
            </button>

            <button
              type="button"
              className="quick-action-item"
              onClick={() => onNavigate("hackathons")}
            >
              <div className="action-icon-box hackathons">
                <HackathonIcon size={18} />
              </div>
              <div className="action-text">
                <strong>New Hackathon Experience</strong>
                <span>Highlight hackathon builds, problem solved, and team outcomes</span>
              </div>
            </button>

            <button
              type="button"
              className="quick-action-item"
              onClick={() => onNavigate("skills")}
            >
              <div className="action-icon-box skills">
                <SkillsIcon size={18} />
              </div>
              <div className="action-text">
                <strong>Manage Tech Stack & Tools</strong>
                <span>Organize skills by categories and highlight primary competencies</span>
              </div>
            </button>

            <button
              type="button"
              className="quick-action-item"
              onClick={() => onNavigate("personal")}
            >
              <div className="action-icon-box personal">
                <UserIcon size={18} />
              </div>
              <div className="action-text">
                <strong>Update Profile & Socials</strong>
                <span>Refine your hero headline, status badge, GitHub, and LinkedIn</span>
              </div>
            </button>

            <button
              type="button"
              className="quick-action-item"
              onClick={() => onNavigate("education")}
            >
              <div className="action-icon-box education">
                <EducationIcon size={18} />
              </div>
              <div className="action-text">
                <strong>Academic Foundation & Coursework</strong>
                <span>Manage B.Tech degree details, current CGPA/standing, and coursework</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
