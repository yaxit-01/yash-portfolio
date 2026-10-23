import { useEffect } from "react";
import { AlertCircleIcon, CloseIcon } from "./Icons";

export function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, confirmText = "Delete", isDangerous = true, isBusy = false }) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") onCancel();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel} role="presentation">
      <div className="modal-card" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-header">
          <div className="modal-title-row">
            {isDangerous && <AlertCircleIcon size={20} className="modal-danger-icon" />}
            <h3>{title}</h3>
          </div>
          <button type="button" className="modal-close" onClick={onCancel} aria-label="Close dialog">
            <CloseIcon size={18} />
          </button>
        </div>

        <div className="modal-body">
          <p>{message}</p>
        </div>

        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className={isDangerous ? "btn-danger" : "btn-primary"}
            onClick={onConfirm}
            disabled={isBusy}
          >
            {isBusy ? "Processing..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

