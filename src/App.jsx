import Navbar from "./components/Navbar";
import profileImage from "./assets/profile.png";

function App() {
  return (
    <>
      <Navbar />

      <main>
      <section className="hero">
  <div className="hero-content">

    <div className="hero-text">

      <div className="hero-badge">
        <span className="status-dot"></span>
        AVAILABLE FOR OPPORTUNITIES
      </div>

      <p className="hero-tag">
        COMPUTER SCIENCE ENGINEERING STUDENT
      </p>

      <h1>
        Hi, I'm{" "}
        <span className="hero-name">
          Yash Dixit
        </span>
      </h1>

      <h2>
        Aspiring <span>Cloud & Software Engineer</span>
      </h2>

      <p className="hero-description">
        I build practical software solutions with a focus on
        backend development, cloud computing, DevOps, and
        problem solving.
      </p>

      <div className="hero-buttons">
        <a href="#projects" className="primary-button">
          View My Work →
        </a>

        <a href="#contact" className="secondary-button">
          Let's Connect
        </a>
      </div>

      <div className="hero-tech">
        <span>Java</span>
        <span>Python</span>
        <span>React</span>
        <span>Node.js</span>
        <span>Docker</span>
        <span>Linux</span>
      </div>

    </div>

    <div className="hero-image-container">
      <div className="hero-image-glow"></div>

      <div className="hero-image-frame">
        <img
          src={profileImage}
          alt="Yash Dixit"
          className="hero-image"
        />
      </div>

      <div className="hero-image-decoration"></div>
    </div>

  </div>

  <div className="hero-grid"></div>
</section>

        <section id="about" className="section about-section">
  <div className="section-container">

    <div className="about-header">
      <p className="section-label">ABOUT ME</p>

      <h2>
        Building, Learning
        <span> & Growing.</span>
      </h2>
    </div>

    <div className="about-grid">

      <div className="about-content">
        <p>
          I'm Yash Dixit, a Computer Science and Engineering student at
          Noida Institute of Engineering and Technology (NIET), Greater
          Noida, with a strong interest in cloud computing, software
          development, backend engineering, and problem solving.
        </p>

        <p>
          I enjoy turning ideas into practical applications and learning
          by building real-world projects. I've worked with technologies
          including Java, Python, C/C++, JavaScript, React, Node.js,
          MongoDB, PostgreSQL, Docker, Git, and Linux.
        </p>

        <p>
          Currently, I'm focused on strengthening my DSA, backend,
          cloud, and DevOps skills while working toward my goal of
          becoming a Cloud Engineer.
        </p>
      </div>

      <div className="focus-card">

        <div className="focus-card-header">
          <span className="focus-dot"></span>
          <span>CURRENT FOCUS</span>
        </div>

        <div className="focus-list">

          <div className="focus-item">
            <span className="focus-icon">☁</span>

            <div>
              <h3>Cloud Computing</h3>
              <p>Learning cloud infrastructure and services</p>
            </div>
          </div>

          <div className="focus-item">
            <span className="focus-icon">⚙</span>

            <div>
              <h3>Backend Engineering</h3>
              <p>Building APIs and scalable backend systems</p>
            </div>
          </div>

          <div className="focus-item">
            <span className="focus-icon">🚀</span>

            <div>
              <h3>DevOps</h3>
              <p>Docker, Linux, automation and deployment</p>
            </div>
          </div>

          <div className="focus-item">
            <span className="focus-icon">🧩</span>

            <div>
              <h3>Problem Solving</h3>
              <p>DSA, algorithms and logical thinking</p>
            </div>
          </div>

        </div>
      </div>

    </div>

    <div className="about-stats">

      <div className="about-stat">
        <strong>2nd</strong>
        <span>Year</span>
      </div>

      <div className="about-stat">
        <strong>3rd</strong>
        <span>Semester</span>
      </div>

      <div className="about-stat">
        <strong>CS</strong>
        <span>Engineering</span>
      </div>

      <div className="about-stat">
        <strong>∞</strong>
        <span>Learning</span>
      </div>

    </div>

  </div>
</section>
       <section id="skills" className="section skills-section">
  <div className="section-container">

    <div className="skills-header">
      <div>
        <p className="section-label">TECHNICAL SKILLS</p>

        <h2>
          Tools I use to
          <span> build.</span>
        </h2>
      </div>

      <p>
        A growing technical toolkit built through projects,
        hackathons, coursework, and continuous practice.
      </p>
    </div>

    <div className="skills-grid">

      {/* Programming */}
      <div className="skill-card">
        <div className="skill-card-top">
          <span className="skill-number">01</span>
          <span className="skill-category">PROGRAMMING</span>
        </div>

        <h3>Programming Languages</h3>

        <div className="skill-tags">
          <span>C/C++</span>
          <span>Java</span>
          <span>Python</span>
          <span>JavaScript</span>
        </div>
      </div>

      {/* Frontend */}
      <div className="skill-card">
        <div className="skill-card-top">
          <span className="skill-number">02</span>
          <span className="skill-category">FRONTEND</span>
        </div>

        <h3>Web Development</h3>

        <div className="skill-tags">
          <span>HTML</span>
          <span>CSS</span>
          <span>JavaScript</span>
          <span>React.js</span>
        </div>
      </div>

      {/* Backend */}
      <div className="skill-card">
        <div className="skill-card-top">
          <span className="skill-number">03</span>
          <span className="skill-category">BACKEND</span>
        </div>

        <h3>Backend Engineering</h3>

        <div className="skill-tags">
          <span>Node.js</span>
          <span>Express.js</span>
          <span>FastAPI</span>
          <span>REST APIs</span>
        </div>
      </div>

      {/* Database */}
      <div className="skill-card">
        <div className="skill-card-top">
          <span className="skill-number">04</span>
          <span className="skill-category">DATABASE</span>
        </div>

        <h3>Data & Storage</h3>

        <div className="skill-tags">
          <span>MongoDB</span>
          <span>PostgreSQL</span>
          <span>Prisma</span>
        </div>
      </div>

      {/* Cloud */}
      <div className="skill-card skill-card-featured">
        <div className="skill-card-top">
          <span className="skill-number">05</span>
          <span className="skill-category">CLOUD & DEVOPS</span>
        </div>

        <h3>Cloud & Infrastructure</h3>

        <div className="skill-tags">
          <span>Linux</span>
          <span>Docker</span>
          <span>Git & GitHub</span>
          <span>Cloud Computing</span>
        </div>
      </div>

      {/* Core CS */}
      <div className="skill-card">
        <div className="skill-card-top">
          <span className="skill-number">06</span>
          <span className="skill-category">CORE CS</span>
        </div>

        <h3>Computer Science</h3>

        <div className="skill-tags">
          <span>DSA</span>
          <span>OOP</span>
          <span>DBMS</span>
          <span>Computer Networks</span>
          <span>Operating Systems</span>
        </div>
      </div>

    </div>

  </div>
</section>
       <section id="projects" className="section projects-section">
  <div className="section-container">

    <div className="projects-header">
      <div>
        <p className="section-label">SELECTED PROJECTS</p>

        <h2>
          Things I've <span>built.</span>
        </h2>
      </div>

      <p>
        Practical projects built through development,
        hackathons, experimentation, and continuous learning.
      </p>
    </div>

    <div className="projects-list">

      {/* PROJECT 01 */}
      <article className="project-card">

        <div className="project-number">
          01
        </div>

        <div className="project-main">

          <div className="project-top">
            <div>
              <p className="project-type">
                SMART INDIA HACKATHON
              </p>

              <h3>KisanFlow 360</h3>
            </div>

            <a
              href="#"
              className="project-arrow"
              aria-label="KisanFlow 360 project"
            >
              ↗
            </a>
          </div>

          <p className="project-description">
            A full-stack digital platform designed to streamline
            agricultural procurement workflows and improve coordination
            between farmers, procurement centers, and operational teams.
          </p>

          <div className="project-role">
            <span>ROLE</span>
            <strong>Full-Stack / System Developer</strong>
          </div>

          <div className="project-tech">
            <span>React.js</span>
            <span>Node.js</span>
            <span>Python</span>
            <span>FastAPI</span>
            <span>PostgreSQL</span>
            <span>Docker</span>
            <span>Redis</span>
          </div>

        </div>

      </article>


      {/* PROJECT 02 */}
      <article className="project-card">

        <div className="project-number">
          02
        </div>

        <div className="project-main">

          <div className="project-top">
            <div>
              <p className="project-type">
                INNOV8 BATTLE ARENA · IIT DELHI
              </p>

              <h3>Battle Arena Agents</h3>
            </div>

            <a
              href="#"
              className="project-arrow"
              aria-label="Battle Arena Agents project"
            >
              ↗
            </a>
          </div>

          <p className="project-description">
            An autonomous candidate-selection system developed with
            Team Pixel Minds. The system processes job requisitions,
            evaluates candidate information, and automates matching
            and assessment workflows.
          </p>

          <div className="project-role">
            <span>ROLE</span>
            <strong>Full-Stack / AI Agent Developer</strong>
          </div>

          <div className="project-tech">
            <span>Python</span>
            <span>REST APIs</span>
            <span>Autonomous Agents</span>
            <span>JSON</span>
            <span>Pytest</span>
            <span>Git</span>
          </div>

        </div>

      </article>


      {/* PROJECT 03 */}
      <article className="project-card">

        <div className="project-number">
          03
        </div>

        <div className="project-main">

          <div className="project-top">
            <div>
              <p className="project-type">
                PYTHON DESKTOP APPLICATION
              </p>

              <h3>Smart Hospital Management System</h3>
            </div>

            <a
              href="#"
              className="project-arrow"
              aria-label="Smart Hospital Management System project"
            >
              ↗
            </a>
          </div>

          <p className="project-description">
            A Python-based desktop application focused on organizing
            hospital management workflows and providing a structured
            interface for managing healthcare-related information.
          </p>

          <div className="project-role">
            <span>ROLE</span>
            <strong>Developer</strong>
          </div>

          <div className="project-tech">
            <span>Python</span>
            <span>Desktop Application</span>
            <span>GUI</span>
            <span>Database</span>
          </div>

        </div>

      </article>

    </div>

  </div>
</section>
       
<section id="hackathons" className="section hackathons-section">
  <div className="section-container">

    <div className="hackathons-header">
      <div>
        <p className="section-label">HACKATHONS & EXPERIENCE</p>

        <h2>
          Built under
          <span> pressure.</span>
        </h2>
      </div>

      <p>
        Experiences where I collaborated with a team,
        solved technical problems, and built working solutions
        under real-world constraints.
      </p>
    </div>

    <div className="hackathons-list">

      {/* INNOV8 */}
      <article className="hackathon-card">

        <div className="hackathon-index">
          01
        </div>

        <div className="hackathon-content">

          <div className="hackathon-heading">
            <div>
              <p className="hackathon-label">
                IIT DELHI
              </p>

              <h3>Innov8 Battle Arena</h3>
            </div>

            <span className="hackathon-badge">
              TEAM PIXEL MINDS
            </span>
          </div>

          <p className="hackathon-description">
            Participated in Innov8 Battle Arena and worked with
            Team Pixel Minds on an autonomous candidate-selection
            system. The project focused on processing job
            requisitions, evaluating candidates, and automating
            candidate matching and assessment workflows.
          </p>

          <div className="hackathon-details">

            <div>
              <span>ROLE</span>
              <strong>Full-Stack / AI Agent Developer</strong>
            </div>

            <div>
              <span>FOCUS</span>
              <strong>Autonomous Agents & Candidate Evaluation</strong>
            </div>

          </div>

          <div className="hackathon-tech">
            <span>Python</span>
            <span>REST APIs</span>
            <span>JSON</span>
            <span>AI Agents</span>
            <span>Pytest</span>
          </div>

        </div>

      </article>


      {/* SIH */}
      <article className="hackathon-card">

        <div className="hackathon-index">
          02
        </div>

        <div className="hackathon-content">

          <div className="hackathon-heading">
            <div>
              <p className="hackathon-label">
                SMART INDIA HACKATHON
              </p>

              <h3>KisanFlow 360</h3>
            </div>

            <span className="hackathon-badge">
              FULL-STACK DEVELOPMENT
            </span>
          </div>

          <p className="hackathon-description">
            Worked on KisanFlow 360 as a full-stack/system
            developer, contributing across the application stack
            and helping build a digital workflow for agricultural
            procurement operations.
          </p>

          <div className="hackathon-details">

            <div>
              <span>ROLE</span>
              <strong>Full-Stack / System Developer</strong>
            </div>

            <div>
              <span>FOCUS</span>
              <strong>Backend, APIs & System Integration</strong>
            </div>

          </div>

          <div className="hackathon-tech">
            <span>React.js</span>
            <span>Node.js</span>
            <span>Python</span>
            <span>FastAPI</span>
            <span>PostgreSQL</span>
            <span>Docker</span>
          </div>

        </div>

      </article>

    </div>

  </div>
</section>
        <section id="certifications" className="section certifications-section">
  <div className="section-container">

    <div className="certifications-header">
      <div>
        <p className="section-label">CERTIFICATIONS</p>

        <h2>
          Learning that
          <span> compounds.</span>
        </h2>
      </div>

      <p>
        Certifications that reflect my continuous learning across
        programming, cybersecurity, Linux, and computer science.
      </p>
    </div>

    <div className="certifications-grid">

      {/* 01 */}
      <article className="certification-card">
        <div className="certification-top">
          <span className="certification-number">01</span>
          <span className="certification-type">LINUX</span>
        </div>

        <div className="certification-content">
          <h3>Getting Started with Linux Fundamentals</h3>

          <p className="certification-provider">
            Red Hat Training
          </p>

          <p className="certification-detail">
            RH104 – RHA · Version 9.1
          </p>
        </div>
      </article>

      {/* 02 */}
      <article className="certification-card">
        <div className="certification-top">
          <span className="certification-number">02</span>
          <span className="certification-type">PROGRAMMING</span>
        </div>

        <div className="certification-content">
          <h3>Python Programming</h3>

          <p className="certification-provider">
            iamneo
          </p>

          <p className="certification-detail">
            Programming fundamentals and Python development
          </p>
        </div>
      </article>

      {/* 03 */}
      <article className="certification-card">
        <div className="certification-top">
          <span className="certification-number">03</span>
          <span className="certification-type">DSA</span>
        </div>

        <div className="certification-content">
          <h3>Data Structures and Algorithms – I</h3>

          <p className="certification-provider">
            iamneo
          </p>

          <p className="certification-detail">
            Data structures, algorithms, and problem solving
          </p>
        </div>
      </article>

      {/* 04 */}
      <article className="certification-card">
        <div className="certification-top">
          <span className="certification-number">04</span>
          <span className="certification-type">SECURITY</span>
        </div>

        <div className="certification-content">
          <h3>Introduction to Cybersecurity</h3>

          <p className="certification-provider">
            Cisco Networking Academy
          </p>

          <p className="certification-detail">
            Cybersecurity fundamentals and digital security
          </p>
        </div>
      </article>

      {/* 05 */}
      <article className="certification-card">
        <div className="certification-top">
          <span className="certification-number">05</span>
          <span className="certification-type">WEB</span>
        </div>

        <div className="certification-content">
          <h3>JavaScript</h3>

          <p className="certification-provider">
            Infosys Springboard
          </p>

          <p className="certification-detail">
            JavaScript programming and web development
          </p>
        </div>
      </article>

    </div>

  </div>
</section>
<section id="education" className="section education-section">
  <div className="section-container">

    <div className="education-header">
      <div>
        <p className="section-label">EDUCATION</p>

        <h2>
          Where I’m
          <span> building foundations.</span>
        </h2>
      </div>

      <p>
        My academic journey is focused on strengthening my
        computer science fundamentals while building practical
        technical skills through projects and hackathons.
      </p>
    </div>

    <div className="education-card">

      <div className="education-number">
        01
      </div>

      <div className="education-main">

        <div className="education-top">

          <div>
            <p className="education-degree-label">
              BACHELOR OF TECHNOLOGY
            </p>

            <h3>
              Computer Science & Engineering
            </h3>
          </div>

          <span className="education-period">
            2025 — PRESENT
          </span>

        </div>

        <div className="education-divider"></div>

        <div className="education-info">

          <div className="education-info-item">
            <span>INSTITUTE</span>

            <strong>
              Noida Institute of Engineering and Technology
            </strong>
          </div>

          <div className="education-info-item">
            <span>LOCATION</span>

            <strong>
              Greater Noida, India
            </strong>
          </div>

          <div className="education-info-item">
            <span>PROGRAM</span>

            <strong>
              B-Tech · Computer Science
            </strong>
          </div>

          <div className="education-info-item">
            <span>CURRENT STATUS</span>

            <strong>
              2nd Year · 3rd Semester
            </strong>
          </div>

        </div>

      </div>

    </div>

  </div>
</section>
        <section id="contact" className="section contact-section">
  <div className="section-container">

    <div className="contact-wrapper">

      <div className="contact-main">

        <p className="section-label">GET IN TOUCH</p>

        <h2>
          Let's build
          <span> something.</span>
        </h2>

        <p className="contact-description">
          I'm always open to discussing software projects,
          hackathons, internships, collaboration opportunities,
          and interesting technical ideas.
        </p>

        <a
          href="mailto:dixityash2999@gmail.com"
          className="contact-email"
        >
          <span>dixityash2999@gmail.com</span>
          <span className="contact-arrow">↗</span>
        </a>

      </div>


      <div className="contact-links">

        <a
          href="https://github.com/yaxit-01"
          target="_blank"
          rel="noreferrer"
          className="contact-link"
        >
          <div>
            <span className="contact-link-label">GITHUB</span>
            <strong>yaxit-01</strong>
          </div>

          <span>↗</span>
        </a>


        <a
          href="https://www.linkedin.com/in/yash-dixit-531922387/"
          target="_blank"
          rel="noreferrer"
          className="contact-link"
        >
          <div>
            <span className="contact-link-label">LINKEDIN</span>
            <strong>Yash Dixit</strong>
          </div>

          <span>↗</span>
        </a>


        <div className="contact-link contact-location">

          <div>
            <span className="contact-link-label">LOCATION</span>
            <strong>Greater Noida, India</strong>
          </div>

          <span>●</span>

        </div>

      </div>

    </div>


    <footer className="portfolio-footer">

      <div className="footer-logo">
        YASH<span>.</span>
      </div>

      
         <p>© {new Date().getFullYear()} Yash Dixit. All rights reserved.</p>

      <a href="#">
        Back to top ↑
      </a>

    </footer>

  </div>
</section>
      </main>
    </>
  );
}

export default App;