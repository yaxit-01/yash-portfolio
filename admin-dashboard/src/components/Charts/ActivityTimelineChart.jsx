import { groupActivitiesByDay } from "../../services/activityService";

export function ActivityTimelineChart({ activities = [], period = "7d" }) {
  const days = period === "7d" ? 7 : period === "30d" ? 14 : period === "90d" ? 12 : 7;
  const dayBuckets = groupActivitiesByDay(activities, days);

  const totalActions = activities.length;
  const maxBucket = Math.max(...dayBuckets.map((d) => d.count), 1);

  if (totalActions === 0) {
    return (
      <div className="chart-card-box">
        <div className="chart-header">
          <h4>Administrative Activity Timeline</h4>
          <span className="chart-badge">No Events in Range</span>
        </div>

        <div className="chart-empty-state">
          <p>No administrative activity has been logged in this period.</p>
          <span>
            Edits, new records, publishing toggles, and media uploads made going forward are tracked here automatically.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="chart-card-box">
      <div className="chart-header">
        <h4>Administrative Activity Timeline</h4>
        <span className="chart-badge">{totalActions} Actions Tracked</span>
      </div>

      <div
        className="timeline-bars-container"
        role="img"
        aria-label={`Activity timeline showing ${totalActions} actions across ${dayBuckets.length} intervals`}
      >
        {dayBuckets.map((bucket) => {
          const heightPct = bucket.count > 0 ? Math.max(Math.round((bucket.count / maxBucket) * 100), 12) : 4;

          return (
            <div key={bucket.key} className="timeline-col">
              <div className="timeline-bar-wrapper">
                {bucket.count > 0 && (
                  <span className="timeline-bar-tooltip">{bucket.count}</span>
                )}
                <div
                  className={`timeline-bar ${bucket.count > 0 ? "has-data" : "empty-bar"}`}
                  style={{ height: `${heightPct}%` }}
                />
              </div>
              <span className="timeline-date-label">{bucket.label.split(",")[0] || bucket.label}</span>
            </div>
          );
        })}
      </div>

      <div className="timeline-footer-summary">
        <span className="timeline-legend-pill">
          <span className="legend-dot" style={{ background: "var(--accent, #06b6d4)" }} />
          <span>Recorded Actions</span>
        </span>
        <span className="timeline-total-note">
          Peak activity: <strong>{maxBucket} event{maxBucket > 1 ? "s" : ""}/day</strong>
        </span>
      </div>
    </div>
  );
}

