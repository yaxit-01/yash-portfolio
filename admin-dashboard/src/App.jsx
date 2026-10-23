import { useState, useEffect, useCallback } from "react";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { useAuth } from "./context/useAuth";
import { Login } from "./pages/Login";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { Toast } from "./components/Toast";

import { Overview } from "./pages/Overview";
import { MessagesManager } from "./pages/MessagesManager";
import { ActivityHistory } from "./pages/ActivityHistory";
import { MediaManager } from "./pages/MediaManager";
import { SeoManager } from "./pages/SeoManager";
import { BackupManager } from "./pages/BackupManager";
import { PersonalInfoManager } from "./pages/PersonalInfoManager";
import { AboutManager } from "./pages/AboutManager";
import { SkillsManager } from "./pages/SkillsManager";
import { ProjectsManager } from "./pages/ProjectsManager";
import { HackathonsManager } from "./pages/HackathonsManager";
import { CertificatesManager } from "./pages/CertificatesManager";
import { EducationManager } from "./pages/EducationManager";

function DashboardContent() {
  const { user, isAdmin, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState(() => {
    const hash = window.location.hash.replace("#", "");
    return hash || "overview";
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem("portfolio_sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);

  const handleToggleCollapse = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("portfolio_sidebar_collapsed", String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Sync hash with browser history
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash) {
        setCurrentTab(hash);
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const handleSelectTab = (tab) => {
    setCurrentTab(tab);
    window.location.hash = tab;
  };

  if (loading) {
    return (
      <div className="global-auth-loader">
        <div className="loader-spinner" />
        <p>Verifying admin authorization...</p>
      </div>
    );
  }

  // Route protection: If unauthenticated or non-admin, render login screen
  if (!user || !isAdmin) {
    return <Login />;
  }

  return (
    <div
      className={`dashboard-layout ${
        sidebarCollapsed ? "layout-collapsed" : ""
      }`}
    >
      <Sidebar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />

      <div className="dashboard-main-area">
        <Header
          currentTab={currentTab}
          onOpenSidebar={() => setSidebarOpen(true)}
        />

        <main className="dashboard-page-wrapper">
          {currentTab === "overview" && (
            <Overview onNavigate={handleSelectTab} showToast={showToast} />
          )}
          {currentTab === "messages" && (
            <MessagesManager showToast={showToast} />
          )}
          {currentTab === "activity" && (
            <ActivityHistory showToast={showToast} onNavigate={handleSelectTab} />
          )}
          {currentTab === "media" && (
            <MediaManager showToast={showToast} />
          )}
          {currentTab === "seo" && (
            <SeoManager showToast={showToast} />
          )}
          {currentTab === "backup" && (
            <BackupManager showToast={showToast} />
          )}
          {currentTab === "personal" && (
            <PersonalInfoManager showToast={showToast} />
          )}
          {currentTab === "about" && <AboutManager showToast={showToast} />}
          {currentTab === "skills" && <SkillsManager showToast={showToast} />}
          {currentTab === "projects" && (
            <ProjectsManager showToast={showToast} />
          )}
          {currentTab === "hackathons" && (
            <HackathonsManager showToast={showToast} />
          )}
          {currentTab === "certificates" && (
            <CertificatesManager showToast={showToast} />
          )}
          {currentTab === "education" && (
            <EducationManager showToast={showToast} />
          )}
        </main>
      </div>

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DashboardContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
