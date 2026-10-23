import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";
import {
  PERSONAL_INFO,
  ABOUT_DATA,
  SKILL_CATEGORIES,
  PROJECTS_DATA,
  HACKATHONS_DATA,
  CERTIFICATES_DATA,
  EDUCATION_DATA,
  DEFAULT_SEO_SETTINGS,
} from "../data/portfolioData";

/**
 * Fetches and maps personal info metadata from Supabase
 */
export async function fetchPersonalInfo() {
  if (!isSupabaseConfigured || !supabase) return PERSONAL_INFO;

  const { data, error } = await supabase
    .from("personal_info")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    if (error) console.warn("[Supabase] Failed to fetch personal_info:", error.message);
    return PERSONAL_INFO;
  }

  return {
    ...PERSONAL_INFO,
    name: data.name ?? PERSONAL_INFO.name,
    headline: data.headline ?? PERSONAL_INFO.headline,
    subheading: data.subheading ?? PERSONAL_INFO.subheading,
    educationDegree: data.education_degree ?? PERSONAL_INFO.educationDegree,
    institution: data.institution ?? PERSONAL_INFO.institution,
    location: data.location ?? PERSONAL_INFO.location,
    currentLevel: data.current_level ?? PERSONAL_INFO.currentLevel,
    academicPeriod: data.academic_period ?? PERSONAL_INFO.academicPeriod,
    email: data.email ?? PERSONAL_INFO.email,
    github: data.github ?? PERSONAL_INFO.github,
    linkedin: data.linkedin ?? PERSONAL_INFO.linkedin,
    portfolio: data.portfolio ?? PERSONAL_INFO.portfolio,
    statusText: data.status_text ?? PERSONAL_INFO.statusText,
    heroDescription: data.hero_description ?? PERSONAL_INFO.heroDescription,
    coreTools: Array.isArray(data.core_tools) && data.core_tools.length > 0
      ? data.core_tools
      : [
          "Java",
          "Python",
          "React.js",
          "Node.js",
          "Docker",
          "PostgreSQL",
          "Linux",
        ],
  };
}

/**
 * Fetches and maps about me information from Supabase
 */
export async function fetchAboutData() {
  if (!isSupabaseConfigured || !supabase) return ABOUT_DATA;

  const { data, error } = await supabase
    .from("about_me")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    if (error) console.warn("[Supabase] Failed to fetch about_me:", error.message);
    return ABOUT_DATA;
  }

  return {
    paragraphs: Array.isArray(data.paragraphs) && data.paragraphs.length > 0
      ? data.paragraphs
      : ABOUT_DATA.paragraphs,
    stats: Array.isArray(data.stats) && data.stats.length > 0
      ? data.stats
      : ABOUT_DATA.stats,
    focusAreas: Array.isArray(data.focus_areas) && data.focus_areas.length > 0
      ? data.focus_areas
      : ABOUT_DATA.focusAreas,
  };
}

/**
 * Fetches and maps skills categories from Supabase
 */
export async function fetchSkills() {
  if (!isSupabaseConfigured || !supabase) return SKILL_CATEGORIES;

  const { data, error } = await supabase
    .from("skills")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error || !data || data.length === 0) {
    if (error) console.warn("[Supabase] Failed to fetch skills:", error.message);
    return SKILL_CATEGORIES;
  }

  return data.map((item) => ({
    number: item.category_number || "01",
    category: item.category_name || "GENERAL",
    title: item.title || "Skills",
    isFeatured: Boolean(item.is_featured),
    skills: Array.isArray(item.skills_list) ? item.skills_list : [],
  }));
}

/**
 * Fetches and maps selected projects from Supabase
 */
export async function fetchProjects() {
  if (!isSupabaseConfigured || !supabase) return PROJECTS_DATA;

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error || !data || data.length === 0) {
    if (error) console.warn("[Supabase] Failed to fetch projects:", error.message);
    return PROJECTS_DATA;
  }

  return data.map((item) => ({
    id: item.display_id || "01",
    name: item.name || "",
    badge: item.badge || "",
    tagline: item.tagline || "",
    problem: item.problem || "",
    description: item.description || "",
    features: Array.isArray(item.features) ? item.features : [],
    role: item.role || "",
    technologies: Array.isArray(item.technologies) ? item.technologies : [],
    liveUrl: item.live_url || null,
    githubUrl: item.github_url || null,
  }));
}

/**
 * Fetches and maps hackathons from Supabase
 */
export async function fetchHackathons() {
  if (!isSupabaseConfigured || !supabase) return HACKATHONS_DATA;

  const { data, error } = await supabase
    .from("hackathons")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error || !data || data.length === 0) {
    if (error) console.warn("[Supabase] Failed to fetch hackathons:", error.message);
    return HACKATHONS_DATA;
  }

  return data.map((item) => ({
    id: item.display_id || "01",
    event: item.event || "",
    team: item.team || "",
    badge: item.badge || "",
    projectName: item.project_name || "",
    problem: item.problem || "",
    description: item.description || "",
    contribution: item.contribution || "",
    technologies: Array.isArray(item.technologies) ? item.technologies : [],
    githubUrl: item.github_url || null,
    liveUrl: item.live_url || null,
  }));
}

/**
 * Fetches and maps certificates from Supabase
 */
export async function fetchCertificates() {
  if (!isSupabaseConfigured || !supabase) return CERTIFICATES_DATA;

  const { data, error } = await supabase
    .from("certificates")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error || !data || data.length === 0) {
    if (error) console.warn("[Supabase] Failed to fetch certificates:", error.message);
    return CERTIFICATES_DATA;
  }

  return data.map((item) => ({
    id: item.display_id || "01",
    type: item.type || "CREDENTIAL",
    title: item.title || "",
    provider: item.provider || "",
    date: item.date || "",
    filename: item.filename || "",
    imageUrl: item.image_url || null,
  }));
}

/**
 * Fetches and maps education details from Supabase
 */
export async function fetchEducation() {
  if (!isSupabaseConfigured || !supabase) return EDUCATION_DATA;

  const { data, error } = await supabase
    .from("education")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    if (error) console.warn("[Supabase] Failed to fetch education:", error.message);
    return EDUCATION_DATA;
  }

  return {
    ...EDUCATION_DATA,
    degree: data.degree ?? EDUCATION_DATA.degree,
    major: data.major ?? EDUCATION_DATA.major,
    period: data.period ?? EDUCATION_DATA.period,
    institution: data.institution ?? EDUCATION_DATA.institution,
    location: data.location ?? EDUCATION_DATA.location,
    currentStatus: data.current_status ?? EDUCATION_DATA.currentStatus,
    program: data.program ?? EDUCATION_DATA.program,
    description: data.description ?? EDUCATION_DATA.description,
    coursework: Array.isArray(data.coursework) && data.coursework.length > 0
      ? data.coursework
      : EDUCATION_DATA.coursework,
  };
}

/**
 * Fetches and maps SEO configuration from Supabase
 */
export async function fetchSeoSettings() {
  if (!isSupabaseConfigured || !supabase) return DEFAULT_SEO_SETTINGS;

  const { data, error } = await supabase
    .from("seo_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) {
    if (error) console.warn("[Supabase] Failed to fetch seo_settings:", error.message);
    return DEFAULT_SEO_SETTINGS;
  }

  // If unpublished, fallback to defaults
  if (data.is_published === false) {
    return DEFAULT_SEO_SETTINGS;
  }

  return {
    ...DEFAULT_SEO_SETTINGS,
    siteTitle: data.site_title || DEFAULT_SEO_SETTINGS.siteTitle,
    metaDescription: data.meta_description || DEFAULT_SEO_SETTINGS.metaDescription,
    keywords: data.keywords || DEFAULT_SEO_SETTINGS.keywords,
    author: data.author || DEFAULT_SEO_SETTINGS.author,
    canonicalUrl: data.canonical_url || DEFAULT_SEO_SETTINGS.canonicalUrl,
    ogTitle: data.og_title || DEFAULT_SEO_SETTINGS.ogTitle,
    ogDescription: data.og_description || DEFAULT_SEO_SETTINGS.ogDescription,
    ogImageUrl: data.og_image_url || DEFAULT_SEO_SETTINGS.ogImageUrl,
    ogType: data.og_type || DEFAULT_SEO_SETTINGS.ogType,
    twitterCard: data.twitter_card || DEFAULT_SEO_SETTINGS.twitterCard,
    twitterHandle: data.twitter_handle || DEFAULT_SEO_SETTINGS.twitterHandle,
    themeColor: data.theme_color || DEFAULT_SEO_SETTINGS.themeColor,
    isPublished: data.is_published !== false,
  };
}

/**
 * Fetches all portfolio content in parallel with resilient per-section fallback
 */
export async function fetchAllPortfolioData() {
  if (!isSupabaseConfigured || !supabase) {
    return {
      personalInfo: PERSONAL_INFO,
      aboutData: ABOUT_DATA,
      skills: SKILL_CATEGORIES,
      projects: PROJECTS_DATA,
      hackathons: HACKATHONS_DATA,
      certificates: CERTIFICATES_DATA,
      education: EDUCATION_DATA,
      seoSettings: DEFAULT_SEO_SETTINGS,
      isRemote: false,
    };
  }

  const [
    personalInfoRes,
    aboutDataRes,
    skillsRes,
    projectsRes,
    hackathonsRes,
    certificatesRes,
    educationRes,
    seoSettingsRes,
  ] = await Promise.allSettled([
    fetchPersonalInfo(),
    fetchAboutData(),
    fetchSkills(),
    fetchProjects(),
    fetchHackathons(),
    fetchCertificates(),
    fetchEducation(),
    fetchSeoSettings(),
  ]);

  return {
    personalInfo: personalInfoRes.status === "fulfilled" ? personalInfoRes.value : PERSONAL_INFO,
    aboutData: aboutDataRes.status === "fulfilled" ? aboutDataRes.value : ABOUT_DATA,
    skills: skillsRes.status === "fulfilled" ? skillsRes.value : SKILL_CATEGORIES,
    projects: projectsRes.status === "fulfilled" ? projectsRes.value : PROJECTS_DATA,
    hackathons: hackathonsRes.status === "fulfilled" ? hackathonsRes.value : HACKATHONS_DATA,
    certificates: certificatesRes.status === "fulfilled" ? certificatesRes.value : CERTIFICATES_DATA,
    education: educationRes.status === "fulfilled" ? educationRes.value : EDUCATION_DATA,
    seoSettings: seoSettingsRes.status === "fulfilled" ? seoSettingsRes.value : DEFAULT_SEO_SETTINGS,
    isRemote: true,
  };
}

/**
 * Submits a new contact message to Supabase with validation and abuse defense
 */
export async function submitContactMessage({
  senderName,
  senderEmail,
  subject,
  message,
  honeypot = "",
}) {
  // Silent drop for automated bots filling invisible honeypot field
  if (honeypot && honeypot.trim().length > 0) {
    return { success: true };
  }

  if (!isSupabaseConfigured || !supabase) {
    throw new Error(
      "Direct message submission is temporarily offline. Please reach out via email directly."
    );
  }

  const name = senderName?.trim();
  const email = senderEmail?.trim();
  const sub = subject?.trim();
  const body = message?.trim();

  if (!name || name.length < 2) {
    throw new Error("Please enter your name (at least 2 characters).");
  }
  if (name.length > 100) {
    throw new Error("Name is too long (maximum 100 characters).");
  }

  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  if (!email || !emailRegex.test(email)) {
    throw new Error("Please enter a valid email address.");
  }
  if (email.length > 150) {
    throw new Error("Email address is too long (maximum 150 characters).");
  }

  if (!sub || sub.length < 2) {
    throw new Error("Please enter a subject (at least 2 characters).");
  }
  if (sub.length > 200) {
    throw new Error("Subject is too long (maximum 200 characters).");
  }

  if (!body || body.length < 5) {
    throw new Error("Please enter your message (at least 5 characters).");
  }
  if (body.length > 3000) {
    throw new Error("Message is too long (maximum 3,000 characters).");
  }

  const payload = {
    sender_name: name,
    sender_email: email,
    subject: sub,
    message: body,
    status: "NEW",
  };

  const { error } = await supabase.from("contact_messages").insert([payload]);

  if (error) {
    console.error("[Supabase] Contact submission error:", error);
    throw new Error(error.message || "Unable to send your message. Please try again.");
  }

  return { success: true };
}


