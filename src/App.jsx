import { useState } from "react";
import Navbar from "./components/Navbar";
import CertificateModal from "./components/CertificateModal";
import profileImage from "./assets/profile.png";
import {
  PERSONAL_INFO,
  ABOUT_DATA,
  SKILL_CATEGORIES,
  PROJECTS_DATA,
  HACKATHONS_DATA,
  CERTIFICATES_DATA,
  EDUCATION_DATA,
} from "./data/portfolioData";
import {
  GitHubIcon,
  LinkedInIcon,
  MailIcon,
  ExternalLinkIcon,
  CodeIcon,
  ArrowUpRightIcon,
  ArrowUpIcon,
  MapPinIcon,
  CheckCircleIcon,
} from "./components/Icons";

// Calculate copyright year outside component to guarantee pure render
const CURRENT_YEAR = new Date().getFullYear();

function App() {
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleCopyEmail = (e) => {
    e.preventDefault();
    navigator.clipboard.writeText(PERSONAL_INFO.email).then(() => {
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2500);
    });
  };

  const handleOpenCertificate = (cert) => {
    const basePath = import.meta.env.BASE_URL.endsWith("/")
      ? import.meta.env.BASE_URL
      : `${import.meta.env.BASE_URL}/`;
    setSelectedCertificate({
      ...cert,
      image: `${basePath}certificates/${cert.filename}`,
    });
  };

  const handleScrollToTop = (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (window.location.hash) {
      history.pushState(null, "", window.location.pathname);
    }
  };

  return (
    <>
      <Navbar />

      <main id="top">
        {/* =========================================================
            HERO SECTION
           ========================================================= */}
        <section className="hero" aria-label="Introduction">
          <div className="hero-content">
            <div className="hero-text">
              <div className="hero-badge">
                <span className="status-dot" aria-hidden="true"></span>
                <span>{PERSONAL_INFO.statusText}</span>
              </div>

              <p className="hero-tag">COMPUTER SCIENCE ENGINEERING STUDENT</p>

              <h1>
                Hi, I'm <span className="hero-name">{PERSONAL_INFO.name}</span>
              </h1>

              <h2 className="hero-headline">{PERSONAL_INFO.headline}</h2>

              <p className="hero-description">{PERSONAL_INFO.heroDescription}</p>

              <div className="hero-actions">
                <a href="#projects" className="primary-button">
                  <span>View Projects</span>
                  <ArrowUpRightIcon size={16} />
                </a>

                <a href="#contact" className="secondary-button">
                  <span>Let's Connect</span>
                </a>

                <div className="hero-quick-socials" aria-label="Social Profiles">
                  <a
                    href={PERSONAL_INFO.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hero-social-link"
                    aria-label="GitHub Profile"
                  >
                    <GitHubIcon size={18} />
                  </a>

                  <a
                    href={PERSONAL_INFO.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hero-social-link"
                    aria-label="LinkedIn Profile"
                  >
                    <LinkedInIcon size={18} />
                  </a>
                </div>
              </div>

              <div className="hero-tech-strip">
                <span className="hero-tech-label">CORE TOOLS:</span>
                <div className="hero-tech-items">
                  <span>Java</span>
                  <span>Python</span>
                  <span>React.js</span>
                  <span>Node.js</span>
                  <span>Docker</span>
                  <span>PostgreSQL</span>
                  <span>Linux</span>
                </div>
              </div>
            </div>

            <div className="hero-image-container">
              <div className="hero-image-glow" aria-hidden="true"></div>
              <div className="hero-image-frame">
                <img
                  src={profileImage}
                  alt="Portrait of Yash Dixit"
                  className="hero-image"
                  loading="eager"
                  fetchPriority="high"
                />
              </div>
              <div className="hero-image-decoration" aria-hidden="true"></div>
            </div>
          </div>

          <div className="hero-grid" aria-hidden="true"></div>
        </section>

        {/* =========================================================
            ABOUT SECTION
           ========================================================= */}
        <section id="about" className="section about-section" aria-label="About Me">
          <div className="section-container">
            <div className="section-header">
              <p className="section-label">ABOUT ME</p>
              <h2>
                Building, Learning <span>& Growing.</span>
              </h2>
            </div>

            <div className="about-grid">
              <div className="about-content">
                {ABOUT_DATA.paragraphs.map((p, index) => (
                  <p key={index}>{p}</p>
                ))}
              </div>

              <div className="focus-card">
                <div className="focus-card-header">
                  <span className="focus-dot" aria-hidden="true"></span>
                  <span>CURRENT ENGINEERING FOCUS</span>
                </div>

                <div className="focus-list">
                  {ABOUT_DATA.focusAreas.map((area, index) => (
                    <div key={index} className="focus-item">
                      <div className="focus-icon-wrap" aria-hidden="true">
                        <span className="focus-icon-bullet">◆</span>
                      </div>
                      <div>
                        <h3>{area.title}</h3>
                        <p>{area.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="about-stats" aria-label="Quick Highlights">
              {ABOUT_DATA.stats.map((stat, index) => (
                <div key={index} className="about-stat">
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =========================================================
            SKILLS SECTION
           ========================================================= */}
        <section id="skills" className="section skills-section" aria-label="Technical Skills">
          <div className="section-container">
            <div className="section-header-split">
              <div>
                <p className="section-label">TECHNICAL SKILLS</p>
                <h2>
                  Tools I use to <span>build.</span>
                </h2>
              </div>
              <p className="section-header-desc">
                A verified technical toolkit built through hands-on development, hackathons, academic coursework, and continuous coding practice.
              </p>
            </div>

            <div className="skills-grid">
              {SKILL_CATEGORIES.map((cat) => (
                <article
                  key={cat.number}
                  className={`skill-card ${cat.isFeatured ? "skill-card-featured" : ""}`}
                >
                  <div className="skill-card-top">
                    <span className="skill-number">{cat.number}</span>
                    <span className="skill-category">{cat.category}</span>
                  </div>

                  <h3>{cat.title}</h3>

                  <div className="skill-tags">
                    {cat.skills.map((skill, index) => (
                      <span key={index}>{skill}</span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* =========================================================
            PROJECTS SECTION (Highest Priority)
           ========================================================= */}
        <section id="projects" className="section projects-section" aria-label="Featured Projects">
          <div className="section-container">
            <div className="section-header-split">
              <div>
                <p className="section-label">SELECTED PROJECTS</p>
                <h2>
                  Things I've <span>built.</span>
                </h2>
              </div>
              <p className="section-header-desc">
                Production-grade applications, hackathon innovations, and developer tools built with clean architecture, modern frameworks, and practical problem solving.
              </p>
            </div>

            <div className="projects-list">
              {PROJECTS_DATA.map((project) => (
                <article key={project.id} className="project-card">
                  <div className="project-number">{project.id}</div>

                  <div className="project-main">
                    <div className="project-top">
                      <div>
                        <span className="project-badge">{project.badge}</span>
                        <h3>{project.name}</h3>
                        <p className="project-tagline">{project.tagline}</p>
                      </div>

                      <div className="project-top-actions">
                        {project.liveUrl && (
                          <a
                            href={project.liveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="project-arrow-btn"
                            aria-label={`Open live demo of ${project.name}`}
                          >
                            <ArrowUpRightIcon size={18} />
                          </a>
                        )}
                        {project.githubUrl && !project.liveUrl && (
                          <a
                            href={project.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="project-arrow-btn"
                            aria-label={`View ${project.name} on GitHub`}
                          >
                            <CodeIcon size={18} />
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="project-problem-box">
                      <span className="project-label-sub">THE PROBLEM</span>
                      <p>{project.problem}</p>
                    </div>

                    <p className="project-description">{project.description}</p>

                    <div className="project-features-block">
                      <span className="project-label-sub">KEY ENGINEERING HIGHLIGHTS</span>
                      <ul className="project-features-list">
                        {project.features.map((feat, idx) => (
                          <li key={idx}>
                            <CheckCircleIcon size={15} className="feat-check-icon" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="project-meta-row">
                      <div className="project-role-info">
                        <span>ROLE</span>
                        <strong>{project.role}</strong>
                      </div>
                    </div>

                    <div className="project-tech">
                      {project.technologies.map((tech, idx) => (
                        <span key={idx}>{tech}</span>
                      ))}
                    </div>

                    <div className="project-actions">
                      {project.liveUrl && (
                        <a
                          href={project.liveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="project-btn-primary"
                        >
                          <span>Live Demo</span>
                          <ExternalLinkIcon size={14} />
                        </a>
                      )}

                      {project.githubUrl && (
                        <a
                          href={project.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="project-btn-secondary"
                        >
                          <GitHubIcon size={15} />
                          <span>View Code</span>
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* =========================================================
            HACKATHONS SECTION
           ========================================================= */}
        <section id="hackathons" className="section hackathons-section" aria-label="Hackathons and Collaborative Experience">
          <div className="section-container">
            <div className="section-header-split">
              <div>
                <p className="section-label">HACKATHONS & EXPERIENCE</p>
                <h2>
                  Built under <span>pressure.</span>
                </h2>
              </div>
              <p className="section-header-desc">
                Fast-paced hackathons and team competitions where I designed, built, and shipped working solutions under real-world constraints.
              </p>
            </div>

            <div className="hackathons-list">
              {HACKATHONS_DATA.map((hackathon) => (
                <article key={hackathon.id} className="hackathon-card">
                  <div className="hackathon-index">{hackathon.id}</div>

                  <div className="hackathon-content">
                    <div className="hackathon-heading">
                      <div>
                        <p className="hackathon-label">{hackathon.event}</p>
                        <h3>{hackathon.projectName}</h3>
                      </div>
                      <span className="hackathon-badge">{hackathon.badge}</span>
                    </div>

                    <p className="hackathon-description">{hackathon.description}</p>

                    <div className="hackathon-details">
                      <div>
                        <span>TEAM / ROLE</span>
                        <strong>{hackathon.team}</strong>
                      </div>

                      <div>
                        <span>CONTRIBUTION</span>
                        <strong>{hackathon.contribution}</strong>
                      </div>
                    </div>

                    <div className="hackathon-tech">
                      {hackathon.technologies.map((t, i) => (
                        <span key={i}>{t}</span>
                      ))}
                    </div>

                    {(hackathon.liveUrl || hackathon.githubUrl) && (
                      <div className="hackathon-links">
                        {hackathon.liveUrl && (
                          <a
                            href={hackathon.liveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hackathon-link-btn"
                          >
                            <span>Live Demo</span>
                            <ArrowUpRightIcon size={14} />
                          </a>
                        )}
                        {hackathon.githubUrl && (
                          <a
                            href={hackathon.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hackathon-link-btn"
                          >
                            <GitHubIcon size={14} />
                            <span>GitHub</span>
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* =========================================================
            CERTIFICATIONS SECTION
           ========================================================= */}
        <section id="certifications" className="section certifications-section" aria-label="Certifications">
          <div className="section-container">
            <div className="section-header-split">
              <div>
                <p className="section-label">CERTIFICATIONS</p>
                <h2>
                  Learning that <span>compounds.</span>
                </h2>
              </div>
              <p className="section-header-desc">
                Verified courses and certifications across Data Structures & Algorithms, Linux system administration, cybersecurity, web engineering, and generative AI.
              </p>
            </div>

            <div className="certifications-grid">
              {CERTIFICATES_DATA.map((cert) => (
                <article key={cert.id} className="certification-card">
                  <div className="certification-top">
                    <span className="certification-number">{cert.id}</span>
                    <span className="certification-type">{cert.type}</span>
                  </div>

                  <div className="certification-content">
                    <h3>{cert.title}</h3>
                    <p className="certification-provider">{cert.provider}</p>
                    <p className="certification-detail">{cert.date}</p>
                  </div>

                  <div className="certification-card-action">
                    <button
                      type="button"
                      className="certification-button"
                      onClick={() => handleOpenCertificate(cert)}
                      aria-label={`View certificate for ${cert.title}`}
                    >
                      <span>View Certificate</span>
                      <ArrowUpRightIcon size={14} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* =========================================================
            EDUCATION SECTION
           ========================================================= */}
        <section id="education" className="section education-section" aria-label="Education">
          <div className="section-container">
            <div className="section-header-split">
              <div>
                <p className="section-label">ACADEMIC FOUNDATION</p>
                <h2>
                  Where I'm <span>building foundations.</span>
                </h2>
              </div>
              <p className="section-header-desc">
                My academic journey is centered on mastering computer science fundamentals and applying theory to practical software systems.
              </p>
            </div>

            <div className="education-card">
              <div className="education-number">01</div>

              <div className="education-main">
                <div className="education-top">
                  <div>
                    <p className="education-degree-label">UNDERGRADUATE PROGRAM</p>
                    <h3>{EDUCATION_DATA.degree}</h3>
                    <p className="education-major">{EDUCATION_DATA.major}</p>
                  </div>

                  <span className="education-period">{EDUCATION_DATA.period}</span>
                </div>

                <div className="education-divider" aria-hidden="true"></div>

                <div className="education-info">
                  <div className="education-info-item">
                    <span>INSTITUTION</span>
                    <strong>{EDUCATION_DATA.institution}</strong>
                  </div>

                  <div className="education-info-item">
                    <span>LOCATION</span>
                    <strong>{EDUCATION_DATA.location}</strong>
                  </div>

                  <div className="education-info-item">
                    <span>PROGRAM</span>
                    <strong>{EDUCATION_DATA.program}</strong>
                  </div>

                  <div className="education-info-item">
                    <span>CURRENT STATUS</span>
                    <strong>{EDUCATION_DATA.currentStatus}</strong>
                  </div>
                </div>

                <div className="education-coursework">
                  <span className="education-coursework-label">CORE RELEVANT COURSEWORK:</span>
                  <div className="education-tags">
                    {EDUCATION_DATA.coursework.map((course, idx) => (
                      <span key={idx}>{course}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            CONTACT SECTION
           ========================================================= */}
        <section id="contact" className="section contact-section" aria-label="Contact">
          <div className="section-container">
            <div className="contact-wrapper">
              <div className="contact-main">
                <p className="section-label">GET IN TOUCH</p>
                <h2>
                  Let's build <span>something.</span>
                </h2>

                <p className="contact-description">
                  I'm actively seeking software engineering internships, collaborative development opportunities, and hackathon teams. Whether you have an open opportunity or an interesting project idea, let's talk.
                </p>

                <div className="contact-email-row">
                  <a
                    href={`mailto:${PERSONAL_INFO.email}`}
                    className="contact-email"
                    aria-label={`Send email to ${PERSONAL_INFO.email}`}
                  >
                    <MailIcon size={20} />
                    <span>{PERSONAL_INFO.email}</span>
                    <ArrowUpRightIcon size={18} className="contact-arrow" />
                  </a>

                  <button
                    type="button"
                    className="copy-email-btn"
                    onClick={handleCopyEmail}
                    aria-label="Copy email address to clipboard"
                  >
                    {copiedEmail ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>

              <div className="contact-links" aria-label="Contact Destinations">
                <a
                  href={PERSONAL_INFO.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="contact-link"
                >
                  <div className="contact-link-content">
                    <span className="contact-link-label">GITHUB</span>
                    <strong>yaxit-01</strong>
                  </div>
                  <div className="contact-link-icon">
                    <GitHubIcon size={20} />
                    <ArrowUpRightIcon size={16} />
                  </div>
                </a>

                <a
                  href={PERSONAL_INFO.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="contact-link"
                >
                  <div className="contact-link-content">
                    <span className="contact-link-label">LINKEDIN</span>
                    <strong>Yash Dixit</strong>
                  </div>
                  <div className="contact-link-icon">
                    <LinkedInIcon size={20} />
                    <ArrowUpRightIcon size={16} />
                  </div>
                </a>

                <div className="contact-link contact-location">
                  <div className="contact-link-content">
                    <span className="contact-link-label">LOCATION</span>
                    <strong>{PERSONAL_INFO.location}</strong>
                  </div>
                  <div className="contact-link-icon">
                    <MapPinIcon size={20} />
                  </div>
                </div>
              </div>
            </div>

            <footer className="portfolio-footer">
              <div className="footer-logo">
                YASH<span>.</span>
              </div>

              <p>© {CURRENT_YEAR} Yash Dixit. All rights reserved.</p>

              <a
                href="#top"
                className="back-to-top"
                onClick={handleScrollToTop}
                aria-label="Back to top of page"
              >
                <span>Back to top</span>
                <ArrowUpIcon size={14} />
              </a>
            </footer>
          </div>
        </section>
      </main>

      {/* Certificate Viewer Modal */}
      <CertificateModal
        certificate={selectedCertificate}
        onClose={() => setSelectedCertificate(null)}
      />
    </>
  );
}

export default App;