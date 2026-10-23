import { useState } from "react";
import { submitContactMessage } from "../services/portfolioService";

export default function ContactForm() {
  const [formData, setFormData] = useState({
    senderName: "",
    senderEmail: "",
    subject: "",
    message: "",
    honeypot: "",
  });

  const [status, setStatus] = useState("idle"); // "idle" | "submitting" | "success" | "error"
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const errors = {};
    if (!formData.senderName.trim() || formData.senderName.trim().length < 2) {
      errors.senderName = "Please enter your name.";
    }
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!formData.senderEmail.trim() || !emailRegex.test(formData.senderEmail.trim())) {
      errors.senderEmail = "Please enter a valid email address.";
    }
    if (!formData.subject.trim() || formData.subject.trim().length < 2) {
      errors.subject = "Please enter a subject.";
    }
    if (!formData.message.trim() || formData.message.trim().length < 5) {
      errors.message = "Please write a message (at least 5 characters).";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (status === "submitting") return;

    if (!validate()) {
      return;
    }

    try {
      setStatus("submitting");
      setErrorMessage("");

      await submitContactMessage({
        senderName: formData.senderName,
        senderEmail: formData.senderEmail,
        subject: formData.subject,
        message: formData.message,
        honeypot: formData.honeypot,
      });

      setStatus("success");
      setFormData({
        senderName: "",
        senderEmail: "",
        subject: "",
        message: "",
        honeypot: "",
      });
    } catch (err) {
      setStatus("error");
      setErrorMessage(err.message || "Failed to send message. Please try again.");
    }
  };

  return (
    <div className="contact-form-container">
      <h3 className="contact-form-title">Send a Direct Message</h3>
      <p className="contact-form-subtitle">
        Leave a note below and it will be sent directly to my portfolio inbox.
      </p>

      {status === "success" ? (
        <div className="contact-form-alert success" role="alert">
          <div className="alert-icon">✓</div>
          <div className="alert-content">
            <strong>Message Received!</strong>
            <p>
              Thank you for reaching out. Your message has been sent successfully, and I will get back to you shortly.
            </p>
            <button
              type="button"
              className="send-another-btn"
              onClick={() => setStatus("idle")}
            >
              Send Another Message
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="contact-form" noValidate>
          {status === "error" && (
            <div className="contact-form-alert error" role="alert">
              <span>!</span>
              <div>
                <strong>Transmission Error</strong>
                <p>{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Anti-spam honeypot (hidden from human visitors) */}
          <div style={{ display: "none" }} aria-hidden="true">
            <label htmlFor="website_hp">Leave this field empty</label>
            <input
              type="text"
              id="website_hp"
              name="honeypot"
              tabIndex={-1}
              autoComplete="off"
              value={formData.honeypot}
              onChange={handleChange}
            />
          </div>

          <div className="contact-form-grid">
            <div className="contact-form-group">
              <label htmlFor="senderName">
                Your Name <span className="req-star">*</span>
              </label>
              <input
                id="senderName"
                name="senderName"
                type="text"
                placeholder="e.g. Alex Johnson"
                value={formData.senderName}
                onChange={handleChange}
                maxLength={100}
                required
                className={fieldErrors.senderName ? "has-error" : ""}
                disabled={status === "submitting"}
              />
              {fieldErrors.senderName && (
                <span className="contact-field-error">{fieldErrors.senderName}</span>
              )}
            </div>

            <div className="contact-form-group">
              <label htmlFor="senderEmail">
                Email Address <span className="req-star">*</span>
              </label>
              <input
                id="senderEmail"
                name="senderEmail"
                type="email"
                placeholder="e.g. alex@example.com"
                value={formData.senderEmail}
                onChange={handleChange}
                maxLength={150}
                required
                className={fieldErrors.senderEmail ? "has-error" : ""}
                disabled={status === "submitting"}
              />
              {fieldErrors.senderEmail && (
                <span className="contact-field-error">{fieldErrors.senderEmail}</span>
              )}
            </div>
          </div>

          <div className="contact-form-group">
            <label htmlFor="subject">
              Subject <span className="req-star">*</span>
            </label>
            <input
              id="subject"
              name="subject"
              type="text"
              placeholder="e.g. Internship Inquiry / Collaboration Opportunity"
              value={formData.subject}
              onChange={handleChange}
              maxLength={200}
              required
              className={fieldErrors.subject ? "has-error" : ""}
              disabled={status === "submitting"}
            />
            {fieldErrors.subject && (
              <span className="contact-field-error">{fieldErrors.subject}</span>
            )}
          </div>

          <div className="contact-form-group">
            <div className="label-count-row">
              <label htmlFor="message">
                Message <span className="req-star">*</span>
              </label>
              <span className="char-count">
                {formData.message.length} / 3000
              </span>
            </div>
            <textarea
              id="message"
              name="message"
              rows={4}
              placeholder="Hi Yash, I'd like to talk about an opportunity..."
              value={formData.message}
              onChange={handleChange}
              maxLength={3000}
              required
              className={fieldErrors.message ? "has-error" : ""}
              disabled={status === "submitting"}
            />
            {fieldErrors.message && (
              <span className="contact-field-error">{fieldErrors.message}</span>
            )}
          </div>

          <button
            type="submit"
            className="contact-submit-btn"
            disabled={status === "submitting"}
          >
            {status === "submitting" ? (
              <span>Sending Message...</span>
            ) : (
              <span>Send Message &rarr;</span>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
