export function ContentDistributionChart({
  projectCount = 0,
  certCount = 0,
  hackathonCount = 0,
  skillCount = 0,
  mediaCount = 0,
}) {
  const items = [
    { label: "Projects", count: projectCount, color: "var(--accent-purple, #8b5cf6)" },
    { label: "Certificates", count: certCount, color: "var(--accent-emerald, #10b981)" },
    { label: "Hackathons", count: hackathonCount, color: "var(--accent-amber, #f59e0b)" },
    { label: "Skill Categories", count: skillCount, color: "var(--accent, #06b6d4)" },
    { label: "Media Assets", count: mediaCount, color: "var(--accent-blue, #3b82f6)" },
  ];

  const maxVal = Math.max(...items.map((i) => i.count), 1);
  const total = items.reduce((acc, i) => acc + i.count, 0);

  return (
    <div className="chart-card-box">
      <div className="chart-header">
        <h4>Portfolio Content Inventory Breakdown</h4>
        <span className="chart-badge">{total} Assets & Items</span>
      </div>

      <div className="bar-chart-list" role="list" aria-label="Content distribution bar chart">
        {items.map((item) => {
          const widthPct = Math.max(Math.round((item.count / maxVal) * 100), item.count > 0 ? 6 : 0);
          const sharePct = total > 0 ? Math.round((item.count / total) * 100) : 0;

          return (
            <div key={item.label} className="bar-chart-item" role="listitem">
              <div className="bar-info-row">
                <span className="bar-label">{item.label}</span>
                <span className="bar-val-group">
                  <strong>{item.count}</strong>
                  <span className="bar-share">({sharePct}%)</span>
                </span>
              </div>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{
                    width: `${widthPct}%`,
                    backgroundColor: item.color,
                  }}
                  title={`${item.label}: ${item.count} items (${sharePct}% of total)`}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="chart-accessible-summary sr-only">
        Content breakdown: {items.map((i) => `${i.label}: ${i.count}`).join(", ")}. Total items: {total}.
      </div>
    </div>
  );
}

