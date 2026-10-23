export function PublicationStatusChart({ publishedCount = 0, draftCount = 0 }) {
  const total = publishedCount + draftCount;
  const publishedPct = total > 0 ? Math.round((publishedCount / total) * 100) : 100;
  const draftPct = total > 0 ? Math.round((draftCount / total) * 100) : 0;

  // SVG Donut calculation
  const radius = 40;
  const circumference = 2 * Math.PI * radius; // ~251.32
  const publishedOffset = circumference - (publishedPct / 100) * circumference;

  return (
    <div className="chart-card-box">
      <div className="chart-header">
        <h4>Publication Status Distribution</h4>
        <span className="chart-badge">{total} Total Items</span>
      </div>

      <div className="donut-chart-wrapper">
        <svg
          className="donut-svg"
          viewBox="0 0 100 100"
          role="img"
          aria-label={`Publication status: ${publishedCount} published (${publishedPct}%), ${draftCount} drafts (${draftPct}%)`}
        >
          {/* Background circle (Drafts) */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="transparent"
            stroke="var(--accent-amber, #f59e0b)"
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset="0"
            opacity="0.35"
          />
          {/* Foreground circle (Published) */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="transparent"
            stroke="var(--accent, #06b6d4)"
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={publishedOffset}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
          />
          {/* Center text */}
          <text
            x="50"
            y="48"
            className="donut-center-pct"
            textAnchor="middle"
            dominantBaseline="central"
          >
            {publishedPct}%
          </text>
          <text
            x="50"
            y="62"
            className="donut-center-label"
            textAnchor="middle"
            dominantBaseline="central"
          >
            LIVE
          </text>
        </svg>

        <div className="donut-legend-col">
          <div className="legend-row">
            <span className="legend-dot published-dot" />
            <div className="legend-text-group">
              <span className="legend-name">Published (Live)</span>
              <strong className="legend-count">{publishedCount} records ({publishedPct}%)</strong>
            </div>
          </div>

          <div className="legend-row">
            <span className="legend-dot draft-dot" />
            <div className="legend-text-group">
              <span className="legend-name">Draft (Hidden)</span>
              <strong className="legend-count">{draftCount} records ({draftPct}%)</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="chart-accessible-summary sr-only">
        Out of {total} total records across your portfolio, {publishedCount} are currently published and visible to visitors ({publishedPct}%), and {draftCount} are in draft state ({draftPct}%).
      </div>
    </div>
  );
}

