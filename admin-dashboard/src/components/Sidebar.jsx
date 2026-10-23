import { useEffect } from "react";
import {
  DashboardIcon,
  UserIcon,
  InfoIcon,
  SkillsIcon,
  ProjectsIcon,
  HackathonIcon,
  CertificateIcon,
  EducationIcon,
  LogOutIcon,
  ExternalLinkIcon,
  CloseIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MediaIcon,
  ClockIcon,
  GlobeIcon,
  DatabaseIcon,
  MailIcon,
} from "./Icons";
import { useAuth } from "../context/useAuth";

const NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: DashboardIcon },
  { id: "messages", label: "Messages", icon: MailIcon },
  { id: "activity", label: "Activity History", icon: ClockIcon },
  { id: "media", label: "Media Library", icon: MediaIcon },
  { id: "seo", label: "SEO & Social", icon: GlobeIcon },
  { id: "backup", label: "Backup & Restore", icon: DatabaseIcon },
  { id: "personal", label: "Personal Info", icon: UserIcon },
  { id: "about", label: "About Me", icon: InfoIcon },
  { id: "skills", label: "Skills", icon: SkillsIcon },
  { id: "projects", label: "Projects", icon: ProjectsIcon },
  { id: "hackathons", label: "Hackathons", icon: HackathonIcon },
  { id: "certificates", label: "Certificates", icon: CertificateIcon },
  { id: "education", label: "Education", icon: EducationIcon },
];

export function Sidebar({
  currentTab,
  onSelectTab,
  isOpen,
  onClose,
  isCollapsed,
  onToggleCollapse,
}) {
  const { logout, user } = useAuth();

  // Keyboard accessibility: close mobile drawer on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <>
      {isOpen && (
        <div
          className="sidebar-backdrop"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={`sidebar ${isOpen ? "sidebar-open" : ""} ${
          isCollapsed ? "sidebar-collapsed" : ""
        }`}
        aria-label="Admin Navigation"
      >
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <span className="brand-logo">
              {isCollapsed ? "Y" : "YASH"}
              <span>.</span>
            </span>
            {!isCollapsed && <span className="brand-badge">ADMIN</span>}
          </div>

          <button
            type="button"
            className="sidebar-close-btn"
            onClick={onClose}
            aria-label="Close navigation sidebar"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Main menu">
          {!isCollapsed && (
            <div className="nav-group-label">CONTENT MANAGEMENT</div>
          )}
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`sidebar-nav-item ${isActive ? "active" : ""}`}
                onClick={() => {
                  onSelectTab(item.id);
                  onClose();
                }}
                title={isCollapsed ? item.label : undefined}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon size={18} className="nav-item-icon" />
                <span className="nav-item-label">{item.label}</span>
                {isActive && <span className="active-pill" aria-hidden="true" />}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button
            type="button"
            className="sidebar-collapse-toggle desktop-only"
            onClick={onToggleCollapse}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRightIcon size={16} />
            ) : (
              <>
                <ChevronLeftIcon size={16} />
                <span>Collapse Sidebar</span>
              </>
            )}
          </button>

          <a
            href="https://yaxit-01.github.io/yash-portfolio/"
            target="_blank"
            rel="noopener noreferrer"
            className="sidebar-link-btn"
            title={isCollapsed ? "View Live Portfolio" : undefined}
          >
            <ExternalLinkIcon size={15} />
            <span className="sidebar-link-label">Live Portfolio</span>
          </a>

          <div className="sidebar-user-block">
            <div className="user-avatar" title={user?.email || "Admin"}>
              {user?.email?.[0]?.toUpperCase() || "A"}
            </div>
            {!isCollapsed && (
              <div className="user-details">
                <span className="user-role">Administrator</span>
                <span className="user-email" title={user?.email}>
                  {user?.email}
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            className="logout-btn"
            onClick={logout}
            title={isCollapsed ? "Sign Out" : undefined}
            aria-label="Sign Out"
          >
            <LogOutIcon size={16} />
            <span className="logout-label">Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
