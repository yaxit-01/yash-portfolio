export const PERSONAL_INFO = {
  name: "Yash Dixit",
  headline: "Software Developer | Full-Stack Development | Cloud Enthusiast",
  subheading: "Aspiring Cloud & Software Engineer",
  educationDegree: "B.Tech in Computer Science and Engineering",
  institution: "Noida Institute of Engineering and Technology (NIET)",
  location: "Greater Noida, India",
  currentLevel: "Second Year · 3rd Semester",
  academicPeriod: "2025 — Present",
  email: "dixityash2999@gmail.com",
  github: "https://github.com/yaxit-01",
  linkedin: "https://www.linkedin.com/in/yash-dixit-531922387/",
  portfolio: "https://yaxit-01.github.io/yash-portfolio/",
  statusText: "AVAILABLE FOR OPPORTUNITIES",
  heroDescription:
    "Second-year Computer Science student at NIET Greater Noida passionate about building scalable web applications, robust backend architectures, and exploring cloud technologies and data structures.",
};

export const ABOUT_DATA = {
  paragraphs: [
    "I'm Yash Dixit, a Computer Science and Engineering undergraduate at Noida Institute of Engineering and Technology (NIET), Greater Noida. I specialize in full-stack web development, backend engineering, and algorithmic problem solving, with a long-term goal of building scalable cloud-native systems.",
    "I believe the best way to master technology is through practical implementation. Over the course of my academic journey and competitive hackathons, I've designed and shipped full-stack platforms, autonomous agent workflows, and desktop database utilities using technologies like React, Node.js, Python, Java, Docker, and PostgreSQL.",
    "Currently, I am actively sharpening my Data Structures and Algorithms, deepening my understanding of system design and DevOps pipelines, and preparing for software engineering and cloud-focused roles.",
  ],
  stats: [
    { value: "2nd", label: "Academic Year" },
    { value: "4+", label: "Projects Built" },
    { value: "3", label: "Hackathons" },
    { value: "8", label: "Certifications" },
  ],
  focusAreas: [
    {
      icon: "cloud",
      title: "Cloud Computing",
      description: "Cloud infrastructure, serverless architectures, and AWS/GCP essentials.",
    },
    {
      icon: "server",
      title: "Backend Engineering",
      description: "Designing RESTful APIs, microservices, and database query optimization.",
    },
    {
      icon: "docker",
      title: "DevOps & Tooling",
      description: "Docker containerization, Linux environments, Git workflows, and CI/CD.",
    },
    {
      icon: "code",
      title: "Problem Solving",
      description: "Data Structures & Algorithms, algorithmic complexity, and clean code practices.",
    },
  ],
};

export const SKILL_CATEGORIES = [
  {
    number: "01",
    category: "PROGRAMMING",
    title: "Programming Languages",
    skills: ["Java", "Python", "C", "C++", "JavaScript"],
  },
  {
    number: "02",
    category: "FRONTEND",
    title: "Frontend Development",
    skills: ["HTML5", "CSS3", "JavaScript (ES6+)", "React.js", "Vite", "Tailwind CSS"],
  },
  {
    number: "03",
    category: "BACKEND",
    title: "Backend Development",
    skills: ["Node.js", "Express.js", "FastAPI", "RESTful APIs", "JWT Auth"],
  },
  {
    number: "04",
    category: "DATABASES",
    title: "Databases & Storage",
    skills: ["MongoDB", "PostgreSQL", "SQL", "Prisma ORM", "Redis"],
  },
  {
    number: "05",
    category: "CLOUD & DEVOPS",
    title: "Cloud & Infrastructure",
    isFeatured: true,
    skills: ["Docker", "Linux (RHEL/Ubuntu)", "Git & GitHub", "Cloud Computing Basics", "Vercel"],
  },
  {
    number: "06",
    category: "CORE CS",
    title: "Computer Science",
    skills: ["Data Structures & Algorithms", "Object-Oriented Programming (OOP)", "DBMS", "Computer Networks", "Operating Systems"],
  },
];

export const PROJECTS_DATA = [
  {
    id: "01",
    name: "CareerPilot AI",
    badge: "FEATURED AI PLATFORM",
    tagline: "Intelligent career roadmap and milestone tracking platform",
    problem:
      "Navigating software engineering career transitions is overwhelming without personalized, visual milestones and concrete study guidance.",
    description:
      "A full-stack, AI-powered platform that converts target roles and career goals into step-by-step visual roadmaps. Integrates Google Gemini API for custom curriculum synthesis and React Flow for interactive graph exploration.",
    features: [
      "Interactive visual roadmap dependency graph powered by React Flow",
      "Dynamic milestone generation tailored to role, availability, and background using Gemini API",
      "Actionable milestone drill-down with required study topics, tips, and practical project prompts",
      "Progress tracking (Not Started, In Progress, Completed) with browser localStorage persistence",
    ],
    role: "Full-Stack & AI Integration Developer",
    technologies: ["React.js", "Vite", "React Flow", "Node.js", "Express", "Google Gemini API", "CSS3"],
    liveUrl: "https://careerpilot-ai-woad-rho.vercel.app/",
    githubUrl: "https://github.com/yaxit-01/careerpilot-ai",
  },
  {
    id: "02",
    name: "Paytm GrowthPilot",
    badge: "FINTECH & MERCHANT ANALYTICS",
    tagline: "Merchant analytics & transaction automation dashboard built for Paytm Hackathon",
    problem:
      "Merchants and growing businesses often lack real-time visibility into transaction volumes, customer retention patterns, and payment anomalies.",
    description:
      "A full-stack merchant intelligence platform engineered during the Paytm Hackathon. Offers real-time visibility into transactions, automated revenue insights, and anomaly alerts across high-velocity payment flows.",
    features: [
      "Real-time merchant dashboard for transaction monitoring, revenue trends, and retention rates",
      "Automated growth recommendations and payment flow anomaly detection",
      "Decoupled dual-stack architecture for high responsiveness, speed, and modularity",
      "Secure RESTful APIs with JWT authentication and MongoDB data persistence",
    ],
    role: "Full-Stack Developer",
    technologies: ["React.js", "Vite", "Node.js", "Express", "MongoDB", "JWT", "REST APIs"],
    liveUrl: "https://paytm-growthpilot.vercel.app/",
    githubUrl: "https://github.com/yaxit-01/paytm-growthpilot",
  },
  {
    id: "03",
    name: "Smart Hospital Management System",
    badge: "HEALTHCARE DESKTOP APPLICATION",
    tagline: "Python GUI application for hospital administration, patient records, and doctor scheduling",
    problem:
      "Healthcare facilities struggle with operational delays and record discrepancies caused by fragmented manual administration processes.",
    description:
      "A desktop application built with Python to streamline core hospital administration tasks. Features patient admission logging, doctor scheduling, and appointment management with persistent database storage.",
    features: [
      "Intuitive Graphical User Interface (GUI) engineered for smooth administrative workflows",
      "Structured CRUD database layer for persistent patient, doctor, and appointment records",
      "JSON data handling for local configuration, data export, and fast retrieval",
      "Modular OOP architecture separating GUI components, database logic, and data models",
    ],
    role: "Desktop Application Developer",
    technologies: ["Python", "Desktop GUI", "SQLite / Database", "JSON Handling", "OOP"],
    liveUrl: null,
    githubUrl: "https://github.com/yaxit-01/smart_hospital_management_system",
  },
  {
    id: "04",
    name: "Student Grade Calculator",
    badge: "ACADEMIC UTILITY / ALGORITHMS",
    tagline: "Object-oriented student performance evaluation tool developed for CodSoft Internship",
    problem:
      "Manually calculating cumulative academic standings across varying subjects, grade boundaries, and weightages is prone to arithmetic mistakes.",
    description:
      "A robust Java console application developed during the CodSoft Java Programming Internship. Accepts multi-subject inputs, computes exact percentages, and determines corresponding letter grades using structured evaluation criteria.",
    features: [
      "Dynamic multi-subject mark ingestion with comprehensive input validation",
      "Instant computation of total marks, average percentage, and standard grade mapping (A+ to F)",
      "Modular, object-oriented design adhering to clean code principles",
      "Interactive command-line interface with formatted performance summaries",
    ],
    role: "Java Developer (CodSoft Internship)",
    technologies: ["Java", "OOP", "Data Validation", "CLI"],
    liveUrl: null,
    githubUrl: "https://github.com/yaxit-01/CodSoft-Grade-Calculator",
  },
];

export const HACKATHONS_DATA = [
  {
    id: "01",
    event: "Innov8 Battle Arena — IIT Delhi",
    team: "Team Pixel Minds",
    badge: "IIT DELHI HACKATHON",
    projectName: "Innov8 Battle Arena Agents",
    problem:
      "High-volume technical hiring processes face bottlenecks in candidate screening, resume-to-job matching, and objective qualification assessments.",
    description:
      "Collaborated with Team Pixel Minds to engineer an autonomous candidate-selection system. The platform parses job requisitions, processes applicant profiles, and executes automated assessment workflows.",
    contribution:
      "Developed autonomous AI agent evaluation logic, candidate matching workflows, JSON data transformations, and REST API integration verified via Pytest test suites.",
    technologies: ["Python", "REST APIs", "Autonomous AI Agents", "JSON", "Pytest", "Git"],
    githubUrl: null,
    liveUrl: null,
  },
  {
    id: "02",
    event: "Smart India Hackathon",
    team: "SIH Team",
    badge: "NATIONAL HACKATHON",
    projectName: "KisanFlow 360",
    problem:
      "Agricultural procurement operations suffer from paper-based tracking, opaque coordination between procurement centers, and delayed farmer settlements.",
    description:
      "Contributed as a full-stack system developer to KisanFlow 360, a digital workflow platform modernizing communication and logistics between farmers and agricultural procurement centers.",
    contribution:
      "Implemented full-stack features, designed RESTful backend endpoints, structured database schemas, and assisted with containerized deployment using Docker.",
    technologies: ["React.js", "Node.js", "Python", "FastAPI", "PostgreSQL", "Docker", "Redis"],
    githubUrl: null,
    liveUrl: null,
  },
  {
    id: "03",
    event: "Paytm Hackathon",
    team: "GrowthPilot Team",
    badge: "FINTECH CHALLENGE",
    projectName: "Paytm GrowthPilot",
    problem:
      "Merchants on digital payment platforms need accessible, real-time analytics to understand customer churn, revenue growth, and transaction health.",
    description:
      "Participated in the Paytm Hackathon and developed GrowthPilot, an analytics and automation solution addressing practical merchant operations.",
    contribution:
      "Built interactive dashboard interfaces in React and integrated backend services for merchant metrics visualization and anomaly alerts.",
    technologies: ["React.js", "Node.js", "Express", "MongoDB", "REST APIs", "Vercel"],
    githubUrl: "https://github.com/yaxit-01/paytm-growthpilot",
    liveUrl: "https://paytm-growthpilot.vercel.app/",
  },
];

export const CERTIFICATES_DATA = [
  {
    id: "01",
    type: "DSA",
    title: "Data Structures and Algorithms – I",
    provider: "iamneo",
    date: "Course completed · May 2026",
    filename: "iamneo-dsa.png",
  },
  {
    id: "02",
    type: "PROGRAMMING",
    title: "Python Programming",
    provider: "iamneo",
    date: "Course completed · June 2026",
    filename: "iamneo-python.png",
  },
  {
    id: "03",
    type: "LINUX",
    title: "Getting Started with Linux Fundamentals",
    provider: "Red Hat Training",
    date: "RH104 – RHA · Version 9.1 · September 2026",
    filename: "red-hat-linux.png",
  },
  {
    id: "04",
    type: "WEB DEVELOPMENT",
    title: "JavaScript",
    provider: "Infosys Springboard",
    date: "Course completion · November 2025",
    filename: "infosys-javascript.png",
  },
  {
    id: "05",
    type: "PYTHON",
    title: "Programming Fundamentals using Python – Part 2",
    provider: "Infosys Springboard",
    date: "Course completion · February 2026",
    filename: "infosys-python-fundamentals.png",
  },
  {
    id: "06",
    type: "CYBERSECURITY",
    title: "Introduction to Cybersecurity",
    provider: "Cisco Networking Academy · NIET",
    date: "Completed · February 2026",
    filename: "cisco-cybersecurity.png",
  },
  {
    id: "07",
    type: "GENERATIVE AI",
    title: "Master Generative AI & Generative AI Tools (ChatGPT & more)",
    provider: "Udemy",
    date: "14.5 hours · March 2026",
    filename: "udemy-generative-ai.png",
  },
  {
    id: "08",
    type: "COMMUNICATION",
    title: "The Complete English Grammar Course – Perfect Your English",
    provider: "Udemy",
    date: "42.5 hours · March 2026",
    filename: "udemy-english-grammar.png",
  },
];

export const EDUCATION_DATA = {
  degree: "Bachelor of Technology (B.Tech)",
  major: "Computer Science & Engineering",
  period: "2025 — PRESENT",
  institution: "Noida Institute of Engineering and Technology (NIET)",
  location: "Greater Noida, Uttar Pradesh, India",
  currentStatus: "2nd Year · 3rd Semester",
  program: "Undergraduate Degree Program",
  description:
    "Rigorous curriculum focusing on computer science foundations, algorithm design, system architecture, database management, and hands-on software development through lab coursework and team projects.",
  coursework: [
    "Data Structures & Algorithms",
    "Object-Oriented Programming (OOP)",
    "Database Management Systems (DBMS)",
    "Computer Organization & Architecture",
    "Operating Systems",
    "Computer Networks",
  ],
};

