import { useState, useEffect } from "react";
import {
  CloseIcon,
  CopyIcon,
  CheckIcon,
  ExternalLinkIcon,
  DownloadIcon,
  FileTextIcon,
  AlertCircleIcon,
} from "./Icons";
import { formatBytes } from "../services/mediaService";

export function MediaPreviewModal({ file, references = [], onClose, onCopyUrl }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!file) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [file, onClose]);

  if (!file) return null;

  const handleCopy = () => {
    if (onCopyUrl) {
      onCopyUrl(file.publicUrl);
    } else {
      navigator.clipboard.writeText(file.publicUrl);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isPdf = file.category === "pdf" || file.name.toLowerCase().endsWith(".pdf");

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal-card modal-lg media-preview-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="preview-title"
      >
        <div className="modal-header">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              <span className={`file-badge ${isPdf ? "badge-pdf" : "badge-image"}`}>
                {isPdf ? "PDF DOCUMENT" : "IMAGE"}
              </span>
              {references.length > 0 && (
                <span className="badge-in-use">
                  <AlertCircleIcon size={12} />
                  <span>Referenced in {references.length} item{references.length > 1 ? "s" : ""}</span>
                </span>
              )}
            </div>
            <h3 id="preview-title" className="media-preview-title" title={file.name}>
              {file.name}
            </h3>
          </div>

          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close media preview"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        <div className="media-preview-body">
          <div className="media-preview-stage">
            {isPdf ? (
              <div className="pdf-preview-box">
                <object
                  data={file.publicUrl}
                  type="application/pdf"
                  className="pdf-preview-frame"
                  aria-label={file.name}
                >
                  <div className="pdf-fallback-notice">
                    <FileTextIcon size={48} />
                    <p>PDF Document Preview</p>
                    <a
                      href={file.publicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary"
                    >
                      <span>Open PDF in New Window</span>
                      <ExternalLinkIcon size={14} />
                    </a>
                  </div>
                </object>
              </div>
            ) : (
              <div className="image-preview-box">
                <img
                  src={file.publicUrl}
                  alt={file.name}
                  className="image-preview-element"
                  loading="lazy"
                />
              </div>
            )}
          </div>

          {/* Metadata Sidebar / Strip */}
          <div className="media-preview-meta-strip">
            <div className="meta-item">
              <span className="meta-label">File Size</span>
              <span className="meta-val">{formatBytes(file.size)}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Storage Folder</span>
              <span className="meta-val"><code>{file.folder || "root"}</code></span>
            </div>
            <div className="meta-item">
              <span className="meta-label">MIME Type</span>
              <span className="meta-val"><code>{file.mimeType || (isPdf ? "application/pdf" : "image/*")}</code></span>
            </div>
            {file.createdAt && (
              <div className="meta-item">
                <span className="meta-label">Uploaded</span>
                <span className="meta-val">
                  {new Date(file.createdAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            )}
          </div>

          {/* References Notice */}
          {references.length > 0 && (
            <div className="media-references-alert">
              <strong>Active Portfolio References:</strong>
              <ul>
                {references.map((ref, idx) => (
                  <li key={idx}>
                    <span>{ref.collection}:</span> <strong>{ref.title}</strong>
                    {ref.displayId && ` (#${ref.displayId})`}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Direct URL Box */}
          <div className="media-url-copy-box">
            <input
              type="text"
              readOnly
              value={file.publicUrl}
              className="media-url-input"
              onClick={(e) => e.target.select()}
            />
            <button
              type="button"
              className={`btn-secondary ${copied ? "is-copied" : ""}`}
              onClick={handleCopy}
              title="Copy CDN link to clipboard"
            >
              {copied ? (
                <>
                  <CheckIcon size={15} />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <CopyIcon size={15} />
                  <span>Copy URL</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="modal-actions" style={{ justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <a
              href={file.publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
            >
              <ExternalLinkIcon size={15} />
              <span>Open in New Tab</span>
            </a>
            <a
              href={file.publicUrl}
              download={file.name}
              className="btn-secondary"
            >
              <DownloadIcon size={15} />
              <span>Download</span>
            </a>
          </div>

          <button type="button" className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

