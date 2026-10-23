import { supabase } from "../lib/supabaseClient.js";
import { AUTHORIZED_ADMIN_EMAIL } from "../context/authConstants.js";
import { logActivity, ACTION_TYPES, CONTENT_TYPES } from "./activityService.js";

export const BACKUP_SCHEMA_VERSION = "1.0";

/**
 * Strips any sensitive properties or metadata prior to export
 */
function sanitizeRecord(record) {
  if (!record || typeof record !== "object") return record;
  const clone = { ...record };
  delete clone.secret;
  delete clone.api_key;
  delete clone.token;
  delete clone.password;
  return clone;
}

/**
 * Exports complete structured portfolio content into a validated JSON backup package
 */
export async function generatePortfolioBackup() {
  if (!supabase) throw new Error("Database client is not available.");

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const userEmail = session?.user?.email || AUTHORIZED_ADMIN_EMAIL;

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
    supabase.from("personal_info").select("*").eq("id", 1).maybeSingle(),
    supabase.from("about_me").select("*").eq("id", 1).maybeSingle(),
    supabase.from("skills").select("*").order("sort_order", { ascending: true }),
    supabase.from("projects").select("*").order("sort_order", { ascending: true }),
    supabase.from("hackathons").select("*").order("sort_order", { ascending: true }),
    supabase.from("certificates").select("*").order("sort_order", { ascending: true }),
    supabase.from("education").select("*").eq("id", 1).maybeSingle(),
    supabase.from("seo_settings").select("*").eq("id", 1).maybeSingle(),
  ]);

  if (skillsRes.error) throw skillsRes.error;
  if (projectsRes.error) throw projectsRes.error;
  if (hackathonsRes.error) throw hackRes.error || hackathonsRes.error;
  if (certRes.error) throw certRes.error;

  const dataPayload = {
    personal_info: sanitizeRecord(personalRes.data),
    about_me: sanitizeRecord(aboutRes.data),
    skills: (skillsRes.data || []).map(sanitizeRecord),
    projects: (projectsRes.data || []).map(sanitizeRecord),
    hackathons: (hackathonsRes.data || []).map(sanitizeRecord),
    certificates: (certRes.data || []).map(sanitizeRecord),
    education: sanitizeRecord(eduRes.data),
    seo_settings: sanitizeRecord(seoRes.data),
  };

  const backupPackage = {
    version: BACKUP_SCHEMA_VERSION,
    system: "Yash Portfolio Management System",
    exported_at: new Date().toISOString(),
    exported_by: userEmail,
    manifest: {
      personal_info: dataPayload.personal_info ? 1 : 0,
      about_me: dataPayload.about_me ? 1 : 0,
      skills: dataPayload.skills.length,
      projects: dataPayload.projects.length,
      hackathons: dataPayload.hackathons.length,
      certificates: dataPayload.certificates.length,
      education: dataPayload.education ? 1 : 0,
      seo_settings: dataPayload.seo_settings ? 1 : 0,
      total_items:
        (dataPayload.personal_info ? 1 : 0) +
        (dataPayload.about_me ? 1 : 0) +
        dataPayload.skills.length +
        dataPayload.projects.length +
        dataPayload.hackathons.length +
        dataPayload.certificates.length +
        (dataPayload.education ? 1 : 0) +
        (dataPayload.seo_settings ? 1 : 0),
    },
    data: dataPayload,
    disclaimer:
      "This backup contains structured JSON content records and Storage CDN paths. Raw media asset binaries (PNG, PDF) are maintained in Supabase Storage and should be preserved in the portfolio-assets bucket.",
  };

  // Trigger browser download
  const jsonContent = JSON.stringify(backupPackage, null, 2);
  const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const nowStr = new Date().toISOString().slice(0, 10);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `portfolio-backup-${nowStr}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  // Log activity
  await logActivity({
    action_type: ACTION_TYPES.BACKUP_EXPORT,
    content_type: CONTENT_TYPES.BACKUP,
    record_id: `backup-${nowStr}`,
    record_title: `Full JSON Content Backup (${backupPackage.manifest.total_items} items)`,
    metadata: backupPackage.manifest,
  });

  return backupPackage;
}

/**
 * Validates the schema and structure of an uploaded backup JSON file
 */
export function validateBackupJson(jsonString) {
  if (!jsonString || typeof jsonString !== "string") {
    return { valid: false, error: "Empty or invalid backup file provided." };
  }

  let parsed;
  try {
    parsed = JSON.parse(jsonString);
  } catch (err) {
    return { valid: false, error: `Malformed JSON format: ${err.message}` };
  }

  if (!parsed || typeof parsed !== "object") {
    return { valid: false, error: "Root payload is not a valid JSON object." };
  }

  if (!parsed.version) {
    return { valid: false, error: "Missing 'version' property. Please provide an official portfolio backup." };
  }

  if (!parsed.data || typeof parsed.data !== "object") {
    return { valid: false, error: "Missing or invalid 'data' payload in backup file." };
  }

  const { data } = parsed;

  const summary = {
    personal_info: data.personal_info ? 1 : 0,
    about_me: data.about_me ? 1 : 0,
    skills: Array.isArray(data.skills) ? data.skills.length : 0,
    projects: Array.isArray(data.projects) ? data.projects.length : 0,
    hackathons: Array.isArray(data.hackathons) ? data.hackathons.length : 0,
    certificates: Array.isArray(data.certificates) ? data.certificates.length : 0,
    education: data.education ? 1 : 0,
    seo_settings: data.seo_settings ? 1 : 0,
  };

  const totalRecords = Object.values(summary).reduce((acc, c) => acc + c, 0);

  if (totalRecords === 0) {
    return { valid: false, error: "Backup file contains no recognizable portfolio records." };
  }

  return {
    valid: true,
    parsedData: parsed,
    summary,
    totalRecords,
    exportedAt: parsed.exported_at || "Unknown",
    exportedBy: parsed.exported_by || "Admin",
    version: parsed.version,
  };
}

/**
 * Safely restores portfolio content using a non-destructive primary-key merge/upsert strategy
 */
export async function restorePortfolioBackup(backupData) {
  if (!supabase) throw new Error("Database client not available.");
  if (!backupData || !backupData.data) {
    throw new Error("Invalid backup data payload.");
  }

  const { data } = backupData;
  const results = {
    personal_info: 0,
    about_me: 0,
    skills: 0,
    projects: 0,
    hackathons: 0,
    certificates: 0,
    education: 0,
    seo_settings: 0,
    errors: [],
  };

  const nowIso = new Date().toISOString();

  // 1. Personal Info
  if (data.personal_info && typeof data.personal_info === "object") {
    try {
      const payload = { ...data.personal_info, id: 1, updated_at: nowIso };
      const { error } = await supabase.from("personal_info").upsert(payload, { onConflict: "id" });
      if (error) throw error;
      results.personal_info = 1;
    } catch (err) {
      results.errors.push(`personal_info: ${err.message}`);
    }
  }

  // 2. About Me
  if (data.about_me && typeof data.about_me === "object") {
    try {
      const payload = { ...data.about_me, id: 1, updated_at: nowIso };
      const { error } = await supabase.from("about_me").upsert(payload, { onConflict: "id" });
      if (error) throw error;
      results.about_me = 1;
    } catch (err) {
      results.errors.push(`about_me: ${err.message}`);
    }
  }

  // 3. Education
  if (data.education && typeof data.education === "object") {
    try {
      const payload = { ...data.education, id: 1, updated_at: nowIso };
      const { error } = await supabase.from("education").upsert(payload, { onConflict: "id" });
      if (error) throw error;
      results.education = 1;
    } catch (err) {
      results.errors.push(`education: ${err.message}`);
    }
  }

  // 4. SEO Settings
  if (data.seo_settings && typeof data.seo_settings === "object") {
    try {
      const payload = { ...data.seo_settings, id: 1, updated_at: nowIso };
      const { error } = await supabase.from("seo_settings").upsert(payload, { onConflict: "id" });
      if (error) throw error;
      results.seo_settings = 1;
    } catch (err) {
      results.errors.push(`seo_settings: ${err.message}`);
    }
  }

  // 5. Skills
  if (Array.isArray(data.skills) && data.skills.length > 0) {
    for (const skill of data.skills) {
      try {
        const payload = { ...skill, updated_at: nowIso };
        const { error } = await supabase.from("skills").upsert(payload);
        if (error) throw error;
        results.skills += 1;
      } catch (err) {
        results.errors.push(`skill (${skill.category_name || "item"}): ${err.message}`);
      }
    }
  }

  // 6. Projects
  if (Array.isArray(data.projects) && data.projects.length > 0) {
    for (const proj of data.projects) {
      try {
        const payload = { ...proj, updated_at: nowIso };
        const { error } = await supabase.from("projects").upsert(payload);
        if (error) throw error;
        results.projects += 1;
      } catch (err) {
        results.errors.push(`project (${proj.name || "item"}): ${err.message}`);
      }
    }
  }

  // 7. Hackathons
  if (Array.isArray(data.hackathons) && data.hackathons.length > 0) {
    for (const hack of data.hackathons) {
      try {
        const payload = { ...hack, updated_at: nowIso };
        const { error } = await supabase.from("hackathons").upsert(payload);
        if (error) throw error;
        results.hackathons += 1;
      } catch (err) {
        results.errors.push(`hackathon (${hack.event || "item"}): ${err.message}`);
      }
    }
  }

  // 8. Certificates
  if (Array.isArray(data.certificates) && data.certificates.length > 0) {
    for (const cert of data.certificates) {
      try {
        const payload = { ...cert, updated_at: nowIso };
        const { error } = await supabase.from("certificates").upsert(payload);
        if (error) throw error;
        results.certificates += 1;
      } catch (err) {
        results.errors.push(`certificate (${cert.title || "item"}): ${err.message}`);
      }
    }
  }

  const totalSuccess =
    results.personal_info +
    results.about_me +
    results.skills +
    results.projects +
    results.hackathons +
    results.certificates +
    results.education +
    results.seo_settings;

  // Record audit activity
  await logActivity({
    action_type: ACTION_TYPES.BACKUP_RESTORE,
    content_type: CONTENT_TYPES.BACKUP,
    record_id: `restore-${Date.now()}`,
    record_title: `Restored ${totalSuccess} records from backup`,
    metadata: {
      restored_counts: results,
      error_count: results.errors.length,
    },
  });

  return results;
}
