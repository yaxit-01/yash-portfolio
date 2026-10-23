import { useState, useEffect } from "react";
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
import { fetchAllPortfolioData } from "../services/portfolioService";
import { isSupabaseConfigured } from "../lib/supabaseClient";

/**
 * Custom hook to deliver immediate fallback data and asynchronously revalidate with live Supabase data
 */
export function usePortfolioData() {
  const [data, setData] = useState({
    personalInfo: PERSONAL_INFO,
    aboutData: ABOUT_DATA,
    skills: SKILL_CATEGORIES,
    projects: PROJECTS_DATA,
    hackathons: HACKATHONS_DATA,
    certificates: CERTIFICATES_DATA,
    education: EDUCATION_DATA,
    seoSettings: DEFAULT_SEO_SETTINGS,
  });

  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);
  const [isLive, setIsLive] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadRemoteData() {
      if (!isSupabaseConfigured) {
        setIsLoading(false);
        return;
      }

      try {
        const remoteData = await fetchAllPortfolioData();
        if (isMounted && remoteData) {
          setData({
            personalInfo: remoteData.personalInfo,
            aboutData: remoteData.aboutData,
            skills: remoteData.skills,
            projects: remoteData.projects,
            hackathons: remoteData.hackathons,
            certificates: remoteData.certificates,
            education: remoteData.education,
            seoSettings: remoteData.seoSettings || DEFAULT_SEO_SETTINGS,
          });
          setIsLive(Boolean(remoteData.isRemote));
        }
      } catch (err) {
        if (isMounted) {
          console.warn("[Portfolio] Asynchronous fetch error, using fallback data:", err);
          setError(err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadRemoteData();

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    ...data,
    isLoading,
    isLive,
    error,
    isSupabaseConfigured,
  };
}

