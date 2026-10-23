import { supabase } from "../lib/supabaseClient.js";

export const ALLOWED_MEDIA_TYPES = {
  images: [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
    "image/svg+xml",
  ],
  documents: [
    "application/pdf",
  ],
};

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * Formats bytes into human-readable string (KB, MB)
 */
export function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Resolves file type category: "image" | "pdf" | "other"
 */
export function getFileTypeCategory(fileName = "", mimeType = "") {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (
    mimeType.startsWith("image/") ||
    ["png", "jpg", "jpeg", "webp", "svg", "gif"].includes(ext)
  ) {
    return "image";
  }
  if (mimeType === "application/pdf" || ext === "pdf") {
    return "pdf";
  }
  return "other";
}

/**
 * Fetches all media files across primary folders in 'portfolio-assets'
 */
export async function listAllMediaFiles(bucket = "portfolio-assets") {
  const foldersToScan = ["", "certificates", "projects", "uploads"];
  const allFiles = [];
  const seenPaths = new Set();

  for (const folder of foldersToScan) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(folder, {
          limit: 100,
          offset: 0,
          sortBy: { column: "created_at", order: "desc" },
        });

      if (error) {
        // If folder does not exist, simply continue
        continue;
      }

      if (Array.isArray(data)) {
        for (const item of data) {
          // Ignore placeholder or hidden system files
          if (!item.name || item.name === ".emptyFolderPlaceholder") continue;

          // If it's a folder, skip (we scan designated folders explicitly)
          if (item.id === null && !item.metadata) continue;

          const fullPath = folder ? `${folder}/${item.name}` : item.name;
          if (seenPaths.has(fullPath)) continue;
          seenPaths.add(fullPath);

          const { data: urlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(fullPath);

          const mimeType = item.metadata?.mimetype || "";
          const category = getFileTypeCategory(item.name, mimeType);

          allFiles.push({
            id: item.id || fullPath,
            name: item.name,
            folder: folder || "root",
            fullPath,
            publicUrl: urlData?.publicUrl || "",
            size: item.metadata?.size || 0,
            mimeType,
            category,
            createdAt: item.created_at || item.updated_at || null,
            updatedAt: item.updated_at || null,
          });
        }
      }
    } catch {
      // Continue gracefully on transient folder errors
    }
  }

  // Sort by createdAt descending
  return allFiles.sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeB - timeA;
  });
}

/**
 * Validates file before upload
 */
export function validateMediaFile(file) {
  if (!file) {
    return { valid: false, error: "No file selected." };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File is too large (${formatBytes(file.size)}). Maximum allowed size is 10 MB.`,
    };
  }

  // Check file type
  const isImage = ALLOWED_MEDIA_TYPES.images.includes(file.type);
  const isPdf = ALLOWED_MEDIA_TYPES.documents.includes(file.type);

  // Fallback check on file extension for stubborn browser MIME types
  const ext = file.name.split(".").pop()?.toLowerCase();
  const validExts = ["png", "jpg", "jpeg", "webp", "svg", "pdf"];

  if (!isImage && !isPdf && !validExts.includes(ext)) {
    return {
      valid: false,
      error: `Unsupported file type "${file.type || ext}". Only PNG, JPG, WebP, SVG, and PDF files are allowed.`,
    };
  }

  return { valid: true, error: null };
}

/**
 * Uploads a file with clean sanitized naming and unique timestamp
 */
export async function uploadMediaFile({
  file,
  folder = "certificates",
  bucket = "portfolio-assets",
}) {
  const validation = validateMediaFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Sanitize name
  const lastDot = file.name.lastIndexOf(".");
  const ext = lastDot !== -1 ? file.name.substring(lastDot + 1).toLowerCase() : "bin";
  const rawBase = lastDot !== -1 ? file.name.substring(0, lastDot) : file.name;
  const sanitizedBase = rawBase
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 50);

  const uniqueFileName = `${sanitizedBase}-${Date.now()}.${ext}`;
  const fullPath = folder ? `${folder}/${uniqueFileName}` : uniqueFileName;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(fullPath, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type || undefined,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fullPath);
  const publicUrl = urlData?.publicUrl || "";

  return {
    name: uniqueFileName,
    originalName: file.name,
    folder,
    fullPath,
    publicUrl,
    size: file.size,
    category: getFileTypeCategory(uniqueFileName, file.type),
  };
}

/**
 * Checks if a media asset is actively referenced by portfolio collections
 * (certificates, projects, etc.) to prevent accidental broken links
 */
export async function checkMediaReferences(fileItem) {
  const references = [];
  const fileName = fileItem.name;
  const fullPath = fileItem.fullPath;
  const publicUrl = fileItem.publicUrl;

  try {
    // 1. Check Certificates
    const { data: certs } = await supabase
      .from("certificates")
      .select("id, title, display_id, filename, image_url");

    if (Array.isArray(certs)) {
      for (const cert of certs) {
        const matchesFilename = cert.filename && (cert.filename === fileName || fileName.includes(cert.filename));
        const matchesUrl = cert.image_url && (cert.image_url === publicUrl || cert.image_url.includes(fullPath) || cert.image_url.includes(fileName));
        if (matchesFilename || matchesUrl) {
          references.push({
            collection: "Certificates",
            id: cert.id,
            displayId: cert.display_id,
            title: cert.title,
            field: matchesUrl ? "image_url" : "filename",
          });
        }
      }
    }

    // 2. Check Projects (if any URL references exist)
    const { data: projects } = await supabase
      .from("projects")
      .select("id, name, display_id, description");

    if (Array.isArray(projects)) {
      for (const proj of projects) {
        if (proj.description && proj.description.includes(fileName)) {
          references.push({
            collection: "Projects",
            id: proj.id,
            displayId: proj.display_id,
            title: proj.name,
            field: "description",
          });
        }
      }
    }
  } catch (err) {
    console.warn("Reference check query notice:", err.message);
  }

  return references;
}

/**
 * Deletes a file from Supabase Storage
 */
export async function deleteMediaFile(fullPath, bucket = "portfolio-assets") {
  const { error } = await supabase.storage.from(bucket).remove([fullPath]);
  if (error) {
    throw error;
  }
  return true;
}
