import { supabase } from "../lib/supabaseClient.js";
import { logActivity, ACTION_TYPES, CONTENT_TYPES } from "./activityService.js";

export const MESSAGE_STATUSES = {
  NEW: "NEW",
  READ: "READ",
  REPLIED: "REPLIED",
  ARCHIVED: "ARCHIVED",
};

/**
 * Extracts domain safely from email for audit log without logging sensitive personal data
 */
function extractEmailDomain(email) {
  if (!email || !email.includes("@")) return "unknown";
  return email.split("@")[1]?.toLowerCase() || "unknown";
}

/**
 * Fetches contact messages with optional status and search filtering
 */
export async function fetchContactMessages({
  status = "all",
  searchQuery = "",
  limit = 100,
} = {}) {
  if (!supabase) return { data: [], count: 0, statusCounts: {}, error: "Database client offline." };

  try {
    let query = supabase
      .from("contact_messages")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status && status !== "all") {
      query = query.eq("status", status.toUpperCase());
    }

    if (searchQuery && searchQuery.trim()) {
      const term = searchQuery.trim();
      query = query.or(
        `sender_name.ilike.%${term}%,sender_email.ilike.%${term}%,subject.ilike.%${term}%,message.ilike.%${term}%`
      );
    }

    const { data, count, error } = await query;

    if (error) {
      console.warn("[ContactService] Notice fetching messages:", error.message);
      return { data: [], count: 0, statusCounts: {}, error: error.message };
    }

    // Also fetch status counts
    const statusCounts = await fetchMessageCounts();

    return {
      data: data || [],
      count: count || 0,
      statusCounts,
      error: null,
    };
  } catch (err) {
    return { data: [], count: 0, statusCounts: {}, error: err.message };
  }
}

/**
 * Fetches message counts across all statuses
 */
export async function fetchMessageCounts() {
  if (!supabase) return { all: 0, new: 0, read: 0, replied: 0, archived: 0 };

  try {
    const { data, error } = await supabase
      .from("contact_messages")
      .select("status");

    if (error || !data) return { all: 0, new: 0, read: 0, replied: 0, archived: 0 };

    const counts = {
      all: data.length,
      new: 0,
      read: 0,
      replied: 0,
      archived: 0,
    };

    data.forEach((row) => {
      const s = row.status?.toLowerCase();
      if (counts[s] !== undefined) {
        counts[s] += 1;
      }
    });

    return counts;
  } catch {
    return { all: 0, new: 0, read: 0, replied: 0, archived: 0 };
  }
}

/**
 * Updates a message's status (NEW, READ, REPLIED, ARCHIVED)
 */
export async function updateMessageStatus(messageId, nextStatus, currentMessage = null) {
  if (!supabase) throw new Error("Database client not available.");

  const payload = {
    status: nextStatus.toUpperCase(),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("contact_messages")
    .update(payload)
    .eq("id", messageId);

  if (error) throw error;

  // Log action to activity trail (without full body to respect privacy)
  await logActivity({
    action_type: ACTION_TYPES.UPDATE,
    content_type: CONTENT_TYPES.MESSAGES,
    record_id: messageId,
    record_title: currentMessage?.subject ? `Message: "${currentMessage.subject}"` : "Contact Message",
    metadata: {
      new_status: nextStatus,
      sender_domain: extractEmailDomain(currentMessage?.sender_email),
    },
  });

  return { success: true };
}

/**
 * Deletes a message from database with audit logging
 */
export async function deleteContactMessage(messageId, currentMessage = null) {
  if (!supabase) throw new Error("Database client not available.");

  const { error } = await supabase
    .from("contact_messages")
    .delete()
    .eq("id", messageId);

  if (error) throw error;

  await logActivity({
    action_type: ACTION_TYPES.DELETE,
    content_type: CONTENT_TYPES.MESSAGES,
    record_id: messageId,
    record_title: currentMessage?.subject ? `Deleted message: "${currentMessage.subject}"` : "Contact Message",
    metadata: {
      sender_domain: extractEmailDomain(currentMessage?.sender_email),
    },
  });

  return { success: true };
}

