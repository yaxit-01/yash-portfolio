import { MenuIcon, ExternalLinkIcon, SunIcon, MoonIcon } from "./Icons";
import { useTheme } from "../context/useTheme";

const TAB_TITLES = {
  overview: "Dashboard Overview",
  messages: "Contact Messages & Inquiries",
  activity: "Audit & Activity History",
  media: "Media & Asset Library",
  seo: "SEO & Social Sharing Previews",
  backup: "Portfolio Backup & Recovery",
  personal: "Personal Information & Contacts",
  about: "About Me & Focus Areas",
  skills: "Skills & Tooling",
  projects: "Selected Projects",
  hackathons: "Hackathons & Experience",
  certificates: "Certifications & Credentials",
  education: "Academic Foundation",
};

export function Header({ currentTab, onOpenSidebar }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="dashboard-header">
      <div className="header-left">
        <button
          type="button"
          className="mobile-menu-trigger"
          onClick={onOpenSidebar}
          aria-label="Open navigation menu"
        >
          <MenuIcon size={22} />
        </button>
        <h1 className="header-title">{TAB_TITLES[currentTab] || "Dashboard"}</h1>
      </div>

      <div className="header-right">
        <button
          type="button"
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? <SunIcon size={17} /> : <MoonIcon size={17} />}
          <span className="theme-toggle-text">{theme === "dark" ? "Light" : "Dark"}</span>
        </button>

        <div className="header-status-pill">
          <span className="status-live-dot" aria-hidden="true" />
          <span>Supabase Live</span>
        </div>

        <a
          href="https://yaxit-01.github.io/yash-portfolio/"
          target="_blank"
          rel="noopener noreferrer"
          className="header-preview-btn"
        >
          <span>View Site</span>
          <ExternalLinkIcon size={14} />
        </a>
      </div>
    </header>
  );
}
