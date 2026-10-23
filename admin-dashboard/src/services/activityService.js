import { supabase } from "../lib/supabaseClient.js";
import { AUTHORIZED_ADMIN_EMAIL } from "../context/authConstants.js";

/**
 * Standard action types tracked across the portfolio system
 */
export const ACTION_TYPES = {
  CREATE: "CREATE",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
  PUBLISH: "PUBLISH",
  UNPUBLISH: "UNPUBLISH",
  UPLOAD: "UPLOAD",
  DELETE_MEDIA: "DELETE_MEDIA",
  BACKUP_EXPORT: "BACKUP_EXPORT",
  BACKUP_RESTORE: "BACKUP_RESTORE",
};

/**
 * Supported content collection types
 */
export const CONTENT_TYPES = {
  PROJECTS: "projects",
  CERTIFICATES: "certificates",
  HACKATHONS: "hackathons",
  SKILLS: "skills",
  EDUCATION: "education",
  PERSONAL_INFO: "personal_info",
  ABOUT_ME: "about_me",
  MEDIA: "media",
  SEO: "seo_settings",
  BACKUP: "backup",
  MESSAGES: "contact_messages",
};

/**
 * Logs an administrative action to Supabase activity_logs table
 */
export async function logActivity({
  action_type,
  content_type,
  record_id = null,
  record_title,
  metadata = {},
}) {
  if (!supabase) return null;

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const userEmail = session?.user?.email || AUTHORIZED_ADMIN_EMAIL;

    const payload = {
      action_type,
      content_type,
      record_id: record_id ? String(record_id) : null,
      record_title: String(record_title || "Untitled"),
      admin_email: userEmail,
      metadata: metadata || {},
    };

    const { data, error } = await supabase
      .from("activity_logs")
      .insert(payload)
      .select()
      .maybeSingle();

    if (error) {
      console.warn("[ActivityLog] Notice: could not record log:", error.message);
      return null;
    }

    return data;
  } catch (err) {
    console.warn("[ActivityLog] Exception recording log:", err.message);
    return null;
  }
}

/**
 * Resolves start date from filter period
 */
export function getStartDateFromPeriod(period = "all") {
  const now = new Date();
  if (period === "7d") {
    return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  }
  if (period === "30d") {
    return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  }
  if (period === "90d") {
    return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
  }
  return null;
}

/**
 * Fetches activity logs with optional filtering
 */
export async function fetchActivityLogs({
  limit = 50,
  actionType = "all",
  contentType = "all",
  dateRange = "all",
  searchQuery = "",
} = {}) {
  if (!supabase) return { data: [], count: 0, error: "Database not connected." };

  try {
    let query = supabase
      .from("activity_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(limit);

    if (actionType && actionType !== "all") {
      query = query.eq("action_type", actionType);
    }

    if (contentType && contentType !== "all") {
      query = query.eq("content_type", contentType);
    }

    const startDate = getStartDateFromPeriod(dateRange);
    if (startDate) {
      query = query.gte("created_at", startDate);
    }

    if (searchQuery && searchQuery.trim()) {
      query = query.ilike("record_title", `%${searchQuery.trim()}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      // Table might not be migrated yet or RLS policy
      return { data: [], count: 0, error: error.message };
    }

    return { data: data || [], count: count || 0, error: null };
  } catch (err) {
    return { data: [], count: 0, error: err.message };
  }
}

/**
 * Groups activities into daily buckets for analytics charts
 */
export function groupActivitiesByDay(activities = [], days = 7) {
  const dayMap = {};
  const now = new Date();

  // Initialize all days in interval to 0
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().split("T")[0];
    const label = d.toLocaleDateString(undefined, { weekday: "short", month: "numeric", day: "numeric" });
    dayMap[key] = { key, label, count: 0, published: 0, updates: 0, creations: 0 };
  }

  for (const act of activities) {
    if (!act.created_at) continue;
    const key = act.created_at.split("T")[0];
    if (dayMap[key]) {
      dayMap[key].count += 1;
      if (act.action_type === ACTION_TYPES.PUBLISH) dayMap[key].published += 1;
      else if (act.action_type === ACTION_TYPES.CREATE) dayMap[key].creations += 1;
      else dayMap[key].updates += 1;
    }
  }

  return Object.values(dayMap);
}
