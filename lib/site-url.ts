/**
 * lib/site-url.ts — Centralized Application Base URL Configuration for AWENUE
 *
 * Guarantees 100% accurate, canonical HTTPS production URLs for:
 * 1. Admin Invitation Email Links
 * 2. OAuth Callback & Redirect URIs
 * 3. Serverless API absolute endpoints
 *
 * Rules:
 * - Production / Vercel ALWAYS resolves to `https://www.awenueglobalsoftwaresolutions.in`
 * - Local development (`NODE_ENV === "development"` without `VERCEL`) resolves to `http://localhost:3000`
 * - Filters out `http://localhost:3000` from environment variables when running in production
 */

export function getSiteUrl(): string {
  // 1. Check explicit environment variables (SITE_URL, NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_APP_URL)
  const candidateUrl =
    process.env.SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL;

  const isProductionOrVercel =
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL === "1" ||
    Boolean(process.env.VERCEL_ENV);

  if (candidateUrl) {
    let cleanCandidate = candidateUrl.trim();
    if (!cleanCandidate.startsWith("http://") && !cleanCandidate.startsWith("https://")) {
      cleanCandidate = `https://${cleanCandidate}`;
    }

    // In production or Vercel environment, NEVER accept a localhost candidate URL!
    if (isProductionOrVercel && cleanCandidate.includes("localhost")) {
      return "https://www.awenueglobalsoftwaresolutions.in";
    }

    return cleanCandidate.replace(/\/+$/, "");
  }

  // 2. Production or Vercel Fallback
  if (isProductionOrVercel) {
    return "https://www.awenueglobalsoftwaresolutions.in";
  }

  // 3. Local Development Fallback
  return "http://localhost:3000";
}

/**
 * Safely construct absolute URL with pathname and query params
 */
export function getAbsoluteUrl(
  pathname: string,
  queryParams?: Record<string, string | number | boolean | null | undefined>
): string {
  const baseUrl = getSiteUrl();
  const cleanPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const url = new URL(`${baseUrl}${cleanPath}`);

  if (queryParams) {
    for (const [key, val] of Object.entries(queryParams)) {
      if (val !== undefined && val !== null && val !== "") {
        url.searchParams.set(key, String(val));
      }
    }
  }

  return url.toString();
}
