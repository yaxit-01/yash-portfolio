import { useEffect } from "react";
import { CloseIcon, ExternalLinkIcon } from "./Icons";

function CertificateModal({ certificate, onClose }) {
  useEffect(() => {
    if (!certificate) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [certificate, onClose]);

  if (!certificate) return null;

  return (
    <div
      className="certificate-modal-overlay"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="certificate-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cert-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="certificate-modal-header">
          <div>
            <span className="certificate-modal-badge">{certificate.type || "CREDENTIAL"}</span>
            <h2 id="cert-modal-title">{certificate.title}</h2>
            {certificate.provider && (
              <p className="certificate-modal-issuer">
                Issued by <strong>{certificate.provider}</strong> {certificate.date ? `· ${certificate.date}` : ""}
              </p>
            )}
          </div>

          <button
            type="button"
            className="certificate-modal-close"
            onClick={onClose}
            aria-label="Close certificate preview"
          >
            <CloseIcon size={20} />
          </button>
        </div>

        <div className="certificate-modal-image-wrapper">
          <img
            src={certificate.image}
            alt={`Certificate for ${certificate.title} issued by ${certificate.provider || "Issuer"}`}
            loading="lazy"
            className="certificate-modal-image"
          />
        </div>

        <div className="certificate-modal-footer">
          <a
            href={certificate.image}
            target="_blank"
            rel="noopener noreferrer"
            className="certificate-external-btn"
          >
            <span>Open High-Resolution Image</span>
            <ExternalLinkIcon size={14} />
          </a>

          <button
            type="button"
            className="certificate-close-btn"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default CertificateModal;

