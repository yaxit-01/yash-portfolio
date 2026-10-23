import { useState, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import { UploadCloudIcon, AlertCircleIcon, CloseIcon, FileTextIcon } from "./Icons";

export function ImageUploader({
  bucket = "portfolio-assets",
  folder = "certificates",
  currentUrl = "",
  onUploadComplete,
  label = "Upload Image",
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(currentUrl);
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validate size (max 10 MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("File is too large. Maximum size is 10 MB.");
      return;
    }

    // Validate type
    const validTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
      "image/svg+xml",
      "application/pdf",
    ];
    const ext = file.name.split(".").pop()?.toLowerCase();
    const isPdfExt = ext === "pdf";

    if (!validTypes.includes(file.type) && !isPdfExt) {
      setError("Invalid file type. Please upload a PNG, JPEG, WebP, SVG, or PDF file.");
      return;
    }

    try {
      setUploading(true);

      // Create a clean, unique filename
      const baseName = file.name
        .substring(0, file.name.lastIndexOf("."))
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, "-")
        .slice(0, 50);
      const uniqueFileName = `${baseName}-${Date.now()}.${ext}`;
      const filePath = `${folder}/${uniqueFileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
          contentType: file.type || (isPdfExt ? "application/pdf" : undefined),
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public CDN URL
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
      const publicUrl = urlData.publicUrl;

      setPreviewUrl(publicUrl);
      onUploadComplete(publicUrl, file.name);
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.message || "Failed to upload file.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleClear = () => {
    setPreviewUrl("");
    onUploadComplete("", "");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const isPdf = previewUrl?.toLowerCase().includes(".pdf");

  return (
    <div className="uploader-box">
      <label className="uploader-label">{label}</label>

      {previewUrl ? (
        <div className="uploader-preview-frame">
          {isPdf ? (
            <div className="uploader-pdf-preview">
              <FileTextIcon size={36} />
              <div className="uploader-pdf-info">
                <span>PDF Document Uploaded</span>
                <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="uploader-pdf-link">
                  View PDF in new tab
                </a>
              </div>
            </div>
          ) : (
            <img src={previewUrl} alt="Upload preview" className="uploader-preview-image" />
          )}

          <div className="uploader-preview-actions">
            <button
              type="button"
              className="btn-sm btn-secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              Replace Asset
            </button>
            <button
              type="button"
              className="btn-sm btn-danger"
              onClick={handleClear}
              disabled={uploading}
              title="Remove file"
            >
              <CloseIcon size={14} /> Remove
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`uploader-dropzone ${uploading ? "uploader-loading" : ""}`}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="uploader-icon-wrap">
            <UploadCloudIcon size={28} />
          </div>
          <div className="uploader-text">
            <strong>{uploading ? "Uploading to Supabase Storage..." : "Click or drag asset to upload"}</strong>
            <span>PNG, JPEG, WebP, SVG or PDF up to 10 MB</span>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml,application/pdf"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      {error && (
        <div className="uploader-error">
          <AlertCircleIcon size={14} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
