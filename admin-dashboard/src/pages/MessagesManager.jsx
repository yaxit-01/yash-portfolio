import { useState, useEffect, useCallback, useMemo } from "react";
import {
  MailIcon,
  SearchIcon,
  RefreshIcon,
  TrashIcon,
  CheckIcon,
  CloseIcon,
  ExternalLinkIcon,
  ArchiveIcon,
} from "../components/Icons";
import { ConfirmModal } from "../components/ConfirmModal";
import {
  fetchContactMessages,
  updateMessageStatus,
  deleteContactMessage,
  MESSAGE_STATUSES,
} from "../services/contactService";

function formatMessageTime(dateString) {
  if (!dateString) return "Recently";
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (isNaN(diffInSeconds) || diffInSeconds < 0) return "Recently";
  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) {
    const mins = Math.floor(diffInSeconds / 60);
    return `${mins}m ago`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  }
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d ago`;
  }
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function MessagesManager({ showToast }) {
  const [messages, setMessages] = useState([]);
  const [statusCounts, setStatusCounts] = useState({
    all: 0,
    new: 0,
    read: 0,
    replied: 0,
    archived: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "new" | "read" | "replied" | "archived"
  const [searchQuery, setSearchQuery] = useState("");

  // Modals & detail view
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const loadMessages = useCallback(
    async (isSilent = false) => {
      try {
        if (!isSilent) setLoading(true);
        else setRefreshing(true);

        const { data, statusCounts: counts, error } = await fetchContactMessages({
          status: statusFilter,
          searchQuery,
          limit: 100,
        });

        if (error) {
          console.warn("[MessagesManager] Notice loading messages:", error);
          setMessages([]);
        } else {
          setMessages(data || []);
          if (counts) setStatusCounts(counts);
        }
      } catch (err) {
        showToast(`Failed to load contact messages: ${err.message}`, "error");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [statusFilter, searchQuery, showToast]
  );

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    loadMessages();
  }, [loadMessages]);

  const handleOpenDetail = async (msg) => {
    setSelectedMessage(msg);

    // Auto mark NEW message as READ upon opening
    if (msg.status === MESSAGE_STATUSES.NEW) {
      try {
        await updateMessageStatus(msg.id, MESSAGE_STATUSES.READ, msg);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === msg.id ? { ...m, status: MESSAGE_STATUSES.READ } : m
          )
        );
        setStatusCounts((prev) => ({
          ...prev,
          new: Math.max(0, prev.new - 1),
          read: prev.read + 1,
        }));
      } catch (err) {
        console.warn("Could not auto-mark read:", err);
      }
    }
  };

  const handleStatusChange = async (msg, nextStatus) => {
    try {
      setUpdatingId(msg.id);
      await updateMessageStatus(msg.id, nextStatus, msg);

      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, status: nextStatus } : m))
      );

      if (selectedMessage && selectedMessage.id === msg.id) {
        setSelectedMessage((prev) => ({ ...prev, status: nextStatus }));
      }

      showToast(`Message marked as ${nextStatus.toLowerCase()}.`, "success");
      await loadMessages(true);
    } catch (err) {
      showToast(`Error updating message: ${err.message}`, "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteMessage = async () => {
    if (!deleteTarget) return;

    try {
      await deleteContactMessage(deleteTarget.id, deleteTarget);
      showToast("Message deleted successfully.", "success");

      setMessages((prev) => prev.filter((m) => m.id !== deleteTarget.id));
      if (selectedMessage && selectedMessage.id === deleteTarget.id) {
        setSelectedMessage(null);
      }
      setDeleteTarget(null);
      await loadMessages(true);
    } catch (err) {
      showToast(`Failed to delete message: ${err.message}`, "error");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case MESSAGE_STATUSES.NEW:
        return (
          <span className="msg-badge badge-new">
            <span className="msg-dot new" /> New
          </span>
        );
      case MESSAGE_STATUSES.READ:
        return (
          <span className="msg-badge badge-read">
            <span className="msg-dot read" /> Read
          </span>
        );
      case MESSAGE_STATUSES.REPLIED:
        return (
          <span className="msg-badge badge-replied">
            <CheckIcon size={12} /> Replied
          </span>
        );
      case MESSAGE_STATUSES.ARCHIVED:
        return (
          <span className="msg-badge badge-archived">
            <ArchiveIcon size={12} /> Archived
          </span>
        );
      default:
        return <span className="msg-badge">{status}</span>;
    }
  };

  const filteredCount = useMemo(() => messages.length, [messages]);

  return (
    <div className="manager-container">
      {/* Header */}
      <div className="manager-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <h2>Contact Messages & Inquiries</h2>
            {statusCounts.new > 0 && (
              <span className="unread-count-pill">
                {statusCounts.new} Unread
              </span>
            )}
          </div>
          <p>
            Messages submitted by visitors through your public portfolio's contact form.
          </p>
        </div>

        <button
          type="button"
          className="btn-secondary"
          onClick={() => loadMessages(true)}
          disabled={refreshing}
          title="Refresh inbox"
        >
          <RefreshIcon size={15} className={refreshing ? "spin-animation" : ""} />
          <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
        </button>
      </div>

      {/* Toolbar: Status Tabs & Search */}
      <div className="messages-toolbar-card">
        <div className="msg-status-tabs" role="tablist" aria-label="Filter by message status">
          {[
            { id: "all", label: "All Messages", count: statusCounts.all },
            { id: "new", label: "New", count: statusCounts.new, highlight: true },
            { id: "read", label: "Read", count: statusCounts.read },
            { id: "replied", label: "Replied", count: statusCounts.replied },
            { id: "archived", label: "Archived", count: statusCounts.archived },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={statusFilter === tab.id}
              className={`msg-tab-btn ${statusFilter === tab.id ? "active" : ""} ${
                tab.highlight && tab.count > 0 ? "has-unread" : ""
              }`}
              onClick={() => setStatusFilter(tab.id)}
            >
              <span>{tab.label}</span>
              <span className="msg-tab-count">{tab.count}</span>
            </button>
          ))}
        </div>

        <div className="media-search-input-wrapper" style={{ maxWidth: "340px" }}>
          <SearchIcon size={15} className="search-icon-inside" />
          <input
            type="text"
            placeholder="Search sender, email, subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
            >
              <CloseIcon size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Messages List Area */}
      {loading ? (
        <div className="page-loader">Loading contact messages...</div>
      ) : messages.length === 0 ? (
        <div className="card-empty-notice">
          <MailIcon size={36} style={{ opacity: 0.5, marginBottom: "0.5rem" }} />
          <h4>No Messages Found</h4>
          <p>
            {searchQuery || statusFilter !== "all"
              ? "No messages match your current filter settings. Try clearing your search or switching tabs."
              : "No visitor messages in your inbox yet. Messages submitted through the public contact form will appear here automatically."}
          </p>
        </div>
      ) : (
        <div className="messages-list-card">
          <div className="messages-list-header">
            <span>
              Showing <strong>{filteredCount}</strong> {statusFilter !== "all" ? statusFilter : ""}{" "}
              message{filteredCount !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="messages-feed">
            {messages.map((msg) => {
              const isUnread = msg.status === MESSAGE_STATUSES.NEW;
              const senderInitial = msg.sender_name?.[0]?.toUpperCase() || "?";

              return (
                <div
                  key={msg.id}
                  className={`message-row-item ${isUnread ? "is-unread" : ""}`}
                  onClick={() => handleOpenDetail(msg)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && handleOpenDetail(msg)}
                >
                  <div className="msg-avatar-col">
                    <div className={`msg-avatar-circle ${isUnread ? "unread" : ""}`}>
                      {senderInitial}
                    </div>
                  </div>

                  <div className="msg-main-col">
                    <div className="msg-top-line">
                      <div className="msg-sender-group">
                        <strong className="msg-sender-name">{msg.sender_name}</strong>
                        <span className="msg-sender-email">&lt;{msg.sender_email}&gt;</span>
                      </div>
                      <div className="msg-time-badge-group">
                        {getStatusBadge(msg.status)}
                        <span className="msg-date-text">{formatMessageTime(msg.created_at)}</span>
                      </div>
                    </div>

                    <div className="msg-subject-line">
                      <span className="msg-subject">{msg.subject}</span>
                    </div>

                    <p className="msg-preview-snippet">
                      {msg.message}
                    </p>
                  </div>

                  <div className="msg-actions-col" onClick={(e) => e.stopPropagation()}>
                    <a
                      href={`mailto:${msg.sender_email}?subject=Re: ${encodeURIComponent(msg.subject)}`}
                      className="btn-icon"
                      title="Reply via Email Client"
                      onClick={() => {
                        if (msg.status === MESSAGE_STATUSES.NEW || msg.status === MESSAGE_STATUSES.READ) {
                          handleStatusChange(msg, MESSAGE_STATUSES.REPLIED);
                        }
                      }}
                    >
                      <ExternalLinkIcon size={14} />
                    </a>

                    {msg.status !== MESSAGE_STATUSES.ARCHIVED ? (
                      <button
                        type="button"
                        className="btn-icon"
                        title="Archive message"
                        onClick={() => handleStatusChange(msg, MESSAGE_STATUSES.ARCHIVED)}
                        disabled={updatingId === msg.id}
                      >
                        <ArchiveIcon size={14} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn-icon"
                        title="Move to Read"
                        onClick={() => handleStatusChange(msg, MESSAGE_STATUSES.READ)}
                        disabled={updatingId === msg.id}
                      >
                        <CheckIcon size={14} />
                      </button>
                    )}

                    <button
                      type="button"
                      className="btn-icon danger"
                      title="Delete message"
                      onClick={() => setDeleteTarget(msg)}
                    >
                      <TrashIcon size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Message Detail Modal */}
      {selectedMessage && (
        <div className="modal-backdrop" onClick={() => setSelectedMessage(null)}>
          <div
            className="message-detail-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="msg-detail-subject"
          >
            <div className="modal-header">
              <div className="msg-detail-header-left">
                {getStatusBadge(selectedMessage.status)}
                <span className="msg-detail-date">
                  {new Date(selectedMessage.created_at).toLocaleString(undefined, {
                    weekday: "short",
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setSelectedMessage(null)}
                aria-label="Close modal"
              >
                <CloseIcon size={18} />
              </button>
            </div>

            <div className="msg-detail-body">
              <h3 id="msg-detail-subject" className="msg-detail-subject">
                {selectedMessage.subject}
              </h3>

              <div className="msg-detail-sender-card">
                <div className="sender-avatar-large">
                  {selectedMessage.sender_name?.[0]?.toUpperCase() || "?"}
                </div>
                <div className="sender-meta-text">
                  <strong>{selectedMessage.sender_name}</strong>
                  <a
                    href={`mailto:${selectedMessage.sender_email}?subject=Re: ${encodeURIComponent(selectedMessage.subject)}`}
                    className="sender-mailto-link"
                  >
                    {selectedMessage.sender_email} <ExternalLinkIcon size={12} />
                  </a>
                </div>
              </div>

              <div className="msg-detail-content-box">
                <p className="msg-full-text">{selectedMessage.message}</p>
              </div>
            </div>

            <div className="modal-footer msg-detail-footer">
              <div className="footer-status-buttons">
                <span className="status-label-inline">Change Status:</span>
                <button
                  type="button"
                  className={`btn-sm-pill ${selectedMessage.status === MESSAGE_STATUSES.READ ? "active" : ""}`}
                  onClick={() => handleStatusChange(selectedMessage, MESSAGE_STATUSES.READ)}
                  disabled={updatingId === selectedMessage.id}
                >
                  Read
                </button>
                <button
                  type="button"
                  className={`btn-sm-pill ${selectedMessage.status === MESSAGE_STATUSES.REPLIED ? "active" : ""}`}
                  onClick={() => handleStatusChange(selectedMessage, MESSAGE_STATUSES.REPLIED)}
                  disabled={updatingId === selectedMessage.id}
                >
                  Replied
                </button>
                <button
                  type="button"
                  className={`btn-sm-pill ${selectedMessage.status === MESSAGE_STATUSES.ARCHIVED ? "active" : ""}`}
                  onClick={() => handleStatusChange(selectedMessage, MESSAGE_STATUSES.ARCHIVED)}
                  disabled={updatingId === selectedMessage.id}
                >
                  Archived
                </button>
              </div>

              <div className="footer-action-buttons">
                <button
                  type="button"
                  className="btn-secondary danger"
                  onClick={() => setDeleteTarget(selectedMessage)}
                >
                  <TrashIcon size={15} />
                  <span>Delete</span>
                </button>

                <a
                  href={`mailto:${selectedMessage.sender_email}?subject=Re: ${encodeURIComponent(selectedMessage.subject)}`}
                  className="btn-primary"
                  onClick={() => {
                    if (selectedMessage.status !== MESSAGE_STATUSES.REPLIED) {
                      handleStatusChange(selectedMessage, MESSAGE_STATUSES.REPLIED);
                    }
                  }}
                >
                  <MailIcon size={15} />
                  <span>Reply via Email</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Contact Message?"
        message={`Are you sure you want to permanently delete the message from "${deleteTarget?.sender_name}" regarding "${deleteTarget?.subject}"? This action cannot be undone.`}
        confirmText="Delete Message"
        confirmVariant="danger"
        onConfirm={handleDeleteMessage}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
