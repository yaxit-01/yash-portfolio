import { useState, useEffect, useCallback, useMemo } from "react";
import {
  ClockIcon,
  SearchIcon,
  RefreshIcon,
  DownloadIcon,
  ExternalLinkIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  EyeIcon,
  EyeOffIcon,
  UploadCloudIcon,
} from "../components/Icons";
import { fetchActivityLogs, ACTION_TYPES, CONTENT_TYPES } from "../services/activityService";
import { exportActivityHistoryCsv } from "../services/exportService";

export function ActivityHistory({ showToast, onNavigate }) {
  const [activities, setActivities] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [contentFilter, setContentFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");

  const loadLogs = useCallback(
    async (isSilent = false) => {
      try {
        if (!isSilent) setLoading(true);
        else setRefreshing(true);

        const { data, count, error } = await fetchActivityLogs({
          limit: 100,
          actionType: actionFilter,
          contentType: contentFilter,
          dateRange,
          searchQuery,
        });

        if (error) {
          // If table not yet migrated, set friendly empty state
          console.warn("[ActivityHistory] Fetch notice:", error);
          setActivities([]);
          setTotalCount(0);
        } else {
          setActivities(data || []);
          setTotalCount(count || 0);
        }
      } catch (err) {
        showToast(`Error fetching activity records: ${err.message}`, "error");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [actionFilter, contentFilter, dateRange, searchQuery, showToast]
  );

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    loadLogs();
  }, [loadLogs]);

  const handleExportCsv = () => {
    if (activities.length === 0) {
      showToast("No activity records available to export.", "info");
      return;
    }
    try {
      exportActivityHistoryCsv(activities, dateRange);
      showToast(`Exported ${activities.length} activity records to CSV.`, "success");
    } catch (err) {
      showToast(`Failed to export CSV: ${err.message}`, "error");
    }
  };

  const getActionBadge = (type) => {
    switch (type) {
      case ACTION_TYPES.CREATE:
        return (
          <span className="act-badge badge-create">
            <PlusIcon size={12} /> CREATE
          </span>
        );
      case ACTION_TYPES.UPDATE:
        return (
          <span className="act-badge badge-update">
            <EditIcon size={12} /> UPDATE
          </span>
        );
      case ACTION_TYPES.DELETE:
      case ACTION_TYPES.DELETE_MEDIA:
        return (
          <span className="act-badge badge-delete">
            <TrashIcon size={12} /> DELETE
          </span>
        );
      case ACTION_TYPES.PUBLISH:
        return (
          <span className="act-badge badge-publish">
            <EyeIcon size={12} /> PUBLISH
          </span>
        );
      case ACTION_TYPES.UNPUBLISH:
        return (
          <span className="act-badge badge-unpublish">
            <EyeOffIcon size={12} /> UNPUBLISH
          </span>
        );
      case ACTION_TYPES.UPLOAD:
        return (
          <span className="act-badge badge-upload">
            <UploadCloudIcon size={12} /> UPLOAD
          </span>
        );
      case ACTION_TYPES.BACKUP_EXPORT:
        return (
          <span className="act-badge badge-upload">
            <DownloadIcon size={12} /> EXPORT
          </span>
        );
      case ACTION_TYPES.BACKUP_RESTORE:
        return (
          <span className="act-badge badge-create">
            <RefreshIcon size={12} /> RESTORE
          </span>
        );
      default:
        return <span className="act-badge">{type}</span>;
    }
  };

  const mapContentToTab = (type) => {
    switch (type) {
      case "projects":
        return "projects";
      case "certificates":
        return "certificates";
      case "hackathons":
        return "hackathons";
      case "skills":
        return "skills";
      case "education":
        return "education";
      case "personal_info":
        return "personal";
      case "about_me":
        return "about";
      case "media":
        return "media";
      case "seo_settings":
        return "seo";
      case "backup":
        return "backup";
      case "contact_messages":
        return "messages";
      default:
        return null;
    }
  };

  const filteredItemsCount = useMemo(() => activities.length, [activities]);

  return (
    <div className="manager-container">
      <div className="manager-header">
        <div>
          <h2>Genuine Administrative Activity Log</h2>
          <p>
            Audit history tracking creation, edits, publishing toggles, and asset uploads.
          </p>
        </div>

        <div className="header-actions-group">
          <button
            type="button"
            className="btn-secondary"
            onClick={handleExportCsv}
            disabled={activities.length === 0}
            title="Download CSV export of currently filtered activity records"
          >
            <DownloadIcon size={16} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Controls Toolbar */}
      <div className="activity-filters-card">
        <div className="filter-grid-4">
          {/* Search */}
          <div className="form-group" style={{ margin: 0 }}>
            <label>Search Title / Record</label>
            <div className="media-search-input-wrapper" style={{ maxWidth: "100%" }}>
              <SearchIcon size={15} className="search-icon-inside" />
              <input
                type="text"
                placeholder="Search by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Action Type */}
          <div className="form-group" style={{ margin: 0 }}>
            <label>Action Type</label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Actions</option>
              <option value={ACTION_TYPES.CREATE}>CREATE</option>
              <option value={ACTION_TYPES.UPDATE}>UPDATE</option>
              <option value={ACTION_TYPES.DELETE}>DELETE</option>
              <option value={ACTION_TYPES.PUBLISH}>PUBLISH</option>
              <option value={ACTION_TYPES.UNPUBLISH}>UNPUBLISH</option>
              <option value={ACTION_TYPES.UPLOAD}>UPLOAD</option>
              <option value={ACTION_TYPES.DELETE_MEDIA}>DELETE MEDIA</option>
              <option value={ACTION_TYPES.BACKUP_EXPORT}>BACKUP EXPORT</option>
              <option value={ACTION_TYPES.BACKUP_RESTORE}>BACKUP RESTORE</option>
            </select>
          </div>

          {/* Content Type */}
          <div className="form-group" style={{ margin: 0 }}>
            <label>Content Category</label>
            <select
              value={contentFilter}
              onChange={(e) => setContentFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Content Types</option>
              <option value={CONTENT_TYPES.PROJECTS}>Projects</option>
              <option value={CONTENT_TYPES.CERTIFICATES}>Certificates</option>
              <option value={CONTENT_TYPES.HACKATHONS}>Hackathons</option>
              <option value={CONTENT_TYPES.SKILLS}>Skills</option>
              <option value={CONTENT_TYPES.EDUCATION}>Education</option>
              <option value={CONTENT_TYPES.PERSONAL_INFO}>Personal Info</option>
              <option value={CONTENT_TYPES.ABOUT_ME}>About Me</option>
              <option value={CONTENT_TYPES.MEDIA}>Media</option>
              <option value={CONTENT_TYPES.SEO}>SEO Settings</option>
              <option value={CONTENT_TYPES.BACKUP}>Backup System</option>
              <option value={CONTENT_TYPES.MESSAGES}>Contact Messages</option>
            </select>
          </div>

          {/* Date Range */}
          <div className="form-group" style={{ margin: 0 }}>
            <label>Time Period</label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="filter-select"
                style={{ flex: 1 }}
              >
                <option value="all">All Time</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
              </select>
              <button
                type="button"
                className={`btn-icon ${refreshing ? "is-toggling" : ""}`}
                onClick={() => loadLogs(true)}
                title="Refresh log entries"
              >
                <RefreshIcon size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Timeline List */}
      {loading ? (
        <div className="page-loader">Loading activity logs from database...</div>
      ) : activities.length === 0 ? (
        <div className="card-empty-notice">
          <ClockIcon size={32} style={{ opacity: 0.5, marginBottom: "0.5rem" }} />
          <h4>No Activity Events Found</h4>
          <p>
            {searchQuery || actionFilter !== "all" || contentFilter !== "all" || dateRange !== "all"
              ? "No events match your current filter settings. Try resetting your filters."
              : "No actions have been logged to the activity table yet. Changes made in the dashboard going forward will be recorded here automatically."}
          </p>
        </div>
      ) : (
        <div className="activity-feed-card">
          <div className="activity-feed-header">
            <span>Showing <strong>{filteredItemsCount}</strong> of <strong>{totalCount}</strong> recorded events</span>
          </div>

          <div className="activity-timeline-feed">
            {activities.map((act) => {
              const targetTab = mapContentToTab(act.content_type);
              const formattedDate = act.created_at
                ? new Date(act.created_at).toLocaleString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Just now";

              return (
                <div key={act.id} className="activity-row-item">
                  <div className="activity-row-left">
                    {getActionBadge(act.action_type)}
                    <span className="act-content-pill">{act.content_type}</span>
                  </div>

                  <div className="activity-row-content">
                    <span className="activity-row-title">
                      {act.record_title}
                    </span>
                    {act.record_id && (
                      <span className="activity-row-id">
                        ID: <code>{act.record_id}</code>
                      </span>
                    )}
                  </div>

                  <div className="activity-row-right">
                    <span className="activity-row-time" title={act.created_at}>
                      {formattedDate}
                    </span>
                    {targetTab && onNavigate && (
                      <button
                        type="button"
                        className="btn-icon"
                        onClick={() => onNavigate(targetTab)}
                        title={`Open ${act.content_type} section`}
                        aria-label={`Open ${act.content_type} section`}
                      >
                        <ExternalLinkIcon size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

