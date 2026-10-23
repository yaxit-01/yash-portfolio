/**
 * Sanitizes a cell value to prevent CSV / Spreadsheet formula injection attacks
 * (@see OWASP CSV Injection guidelines)
 */
export function sanitizeCsvCell(value) {
  if (value === null || value === undefined) return "";
  let stringVal = String(value);

  // Strip formula prefixes if present at start of field
  const formulaChars = ["=", "+", "-", "@", "\t", "\r"];
  if (formulaChars.some((char) => stringVal.startsWith(char))) {
    stringVal = `'${stringVal}`;
  }

  // Escape quotation marks and wrap in quotes if containing delimiter, quote, or newline
  if (stringVal.includes('"') || stringVal.includes(",") || stringVal.includes("\n") || stringVal.includes("\r")) {
    return `"${stringVal.replace(/"/g, '""')}"`;
  }

  return stringVal;
}

/**
 * Converts array of row arrays to CSV string
 */
export function buildCsvString(headers = [], rows = []) {
  const headerLine = headers.map(sanitizeCsvCell).join(",");
  const rowLines = rows.map((row) => row.map(sanitizeCsvCell).join(","));
  return [headerLine, ...rowLines].join("\r\n");
}

/**
 * Triggers browser download of generated CSV
 */
export function triggerCsvDownload(csvContent, filename) {
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates and downloads a complete portfolio content inventory
 */
export function exportContentInventoryCsv({
  projects = [],
  certificates = [],
  hackathons = [],
  skills = [],
  education = null,
  personalInfo = null,
}) {
  const headers = [
    "Content Type",
    "Record ID / Display #",
    "Title / Name",
    "Category / Badge",
    "Publication Status",
    "Details / Description",
    "Last Modified",
  ];

  const rows = [];

  // Personal Info
  if (personalInfo) {
    rows.push([
      "Personal Profile",
      "01",
      personalInfo.name || "Yash Dixit",
      personalInfo.headline || "Hero Profile",
      personalInfo.is_published ? "Published" : "Draft",
      personalInfo.hero_description || "",
      personalInfo.updated_at || "",
    ]);
  }

  // Education
  if (education) {
    rows.push([
      "Academic Foundation",
      "01",
      `${education.degree || ""} - ${education.institution || ""}`,
      education.program || "Degree",
      education.is_published ? "Published" : "Draft",
      education.description || "",
      education.updated_at || "",
    ]);
  }

  // Projects
  projects.forEach((p) => {
    rows.push([
      "Project",
      p.display_id || "",
      p.name || "",
      p.badge || "FEATURED",
      p.is_published ? "Published" : "Draft",
      p.problem || p.description || "",
      p.updated_at || "",
    ]);
  });

  // Certificates
  certificates.forEach((c) => {
    rows.push([
      "Certificate",
      c.display_id || "",
      c.title || "",
      c.type || "CREDENTIAL",
      c.is_published ? "Published" : "Draft",
      c.provider || "",
      c.updated_at || "",
    ]);
  });

  // Hackathons
  hackathons.forEach((h) => {
    rows.push([
      "Hackathon",
      h.display_id || "",
      h.project_name || "",
      h.badge || "HACKATHON",
      h.is_published ? "Published" : "Draft",
      h.event || "",
      h.updated_at || "",
    ]);
  });

  // Skills
  skills.forEach((s) => {
    rows.push([
      "Skill Category",
      s.category_number || "",
      s.title || "",
      s.category_name || "TECH",
      s.is_published ? "Published" : "Draft",
      Array.isArray(s.skills_list) ? s.skills_list.join("; ") : "",
      s.updated_at || "",
    ]);
  });

  const csv = buildCsvString(headers, rows);
  const dateStr = new Date().toISOString().split("T")[0];
  triggerCsvDownload(csv, `portfolio-content-inventory-${dateStr}.csv`);
}

/**
 * Generates and downloads an activity history report
 */
export function exportActivityHistoryCsv(activities = [], periodLabel = "all") {
  const headers = [
    "Log ID",
    "Timestamp (UTC)",
    "Action Type",
    "Content Category",
    "Record Identifier",
    "Item Title",
    "Admin Identity",
  ];

  const rows = activities.map((act) => [
    act.id || "",
    act.created_at || "",
    act.action_type || "",
    act.content_type || "",
    act.record_id || "",
    act.record_title || "",
    act.admin_email || "",
  ]);

  const csv = buildCsvString(headers, rows);
  const dateStr = new Date().toISOString().split("T")[0];
  triggerCsvDownload(csv, `portfolio-activity-log-${periodLabel}-${dateStr}.csv`);
}

