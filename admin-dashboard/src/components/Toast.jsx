import { useEffect } from "react";
import { CheckIcon, AlertCircleIcon, CloseIcon } from "./Icons";

export function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const isError = toast.type === "error";

  return (
    <div className={`toast-container ${isError ? "toast-error" : "toast-success"}`} role="alert">
      <div className="toast-icon">
        {isError ? <AlertCircleIcon size={18} /> : <CheckIcon size={18} />}
      </div>
      <div className="toast-message">{toast.message}</div>
      <button type="button" className="toast-close" onClick={onClose} aria-label="Close notification">
        <CloseIcon size={16} />
      </button>
    </div>
  );
}

