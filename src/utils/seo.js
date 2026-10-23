/**
 * Updates DOM head metadata dynamically in the browser
 * Provides runtime metadata parity while preserving baseline static tags in index.html
 */
export function updateDocumentSeo(seoSettings) {
  if (typeof document === "undefined" || !seoSettings) return;

  // 1. Page Title
  if (seoSettings.siteTitle) {
    document.title = seoSettings.siteTitle;
  }

  const setMetaTag = (selector, attributeName, attributeValue, content) => {
    if (!content) return;
    let tag = document.querySelector(selector);
    if (!tag) {
      tag = document.createElement("meta");
      tag.setAttribute(attributeName, attributeValue);
      document.head.appendChild(tag);
    }
    tag.setAttribute("content", content);
  };

  // 2. Primary Meta Tags
  setMetaTag('meta[name="description"]', "name", "description", seoSettings.metaDescription);
  setMetaTag('meta[name="title"]', "name", "title", seoSettings.siteTitle);
  setMetaTag('meta[name="keywords"]', "name", "keywords", seoSettings.keywords);
  setMetaTag('meta[name="author"]', "name", "author", seoSettings.author);
  setMetaTag('meta[name="theme-color"]', "name", "theme-color", seoSettings.themeColor || "#08090d");

  // 3. Canonical URL link
  if (seoSettings.canonicalUrl) {
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", seoSettings.canonicalUrl);
  }

  // 4. Open Graph Tags
  const ogTitle = seoSettings.ogTitle || seoSettings.siteTitle;
  const ogDesc = seoSettings.ogDescription || seoSettings.metaDescription;

  setMetaTag('meta[property="og:title"]', "property", "og:title", ogTitle);
  setMetaTag('meta[property="og:description"]', "property", "og:description", ogDesc);
  setMetaTag('meta[property="og:url"]', "property", "og:url", seoSettings.canonicalUrl);
  setMetaTag('meta[property="og:type"]', "property", "og:type", seoSettings.ogType || "website");

  if (seoSettings.ogImageUrl) {
    setMetaTag('meta[property="og:image"]', "property", "og:image", seoSettings.ogImageUrl);
  }

  // 5. Twitter Card Tags
  setMetaTag('meta[name="twitter:card"]', "name", "twitter:card", seoSettings.twitterCard || "summary_large_image");
  setMetaTag('meta[name="twitter:title"]', "name", "twitter:title", ogTitle);
  setMetaTag('meta[name="twitter:description"]', "name", "twitter:description", ogDesc);
  setMetaTag('meta[name="twitter:url"]', "name", "twitter:url", seoSettings.canonicalUrl);

  if (seoSettings.ogImageUrl) {
    setMetaTag('meta[name="twitter:image"]', "name", "twitter:image", seoSettings.ogImageUrl);
  }

  if (seoSettings.twitterHandle) {
    setMetaTag('meta[name="twitter:site"]', "name", "twitter:site", seoSettings.twitterHandle);
    setMetaTag('meta[name="twitter:creator"]', "name", "twitter:creator", seoSettings.twitterHandle);
  }
}

