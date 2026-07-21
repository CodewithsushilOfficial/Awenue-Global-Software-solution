import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/admin/*",
          "/api",
          "/api/",
          "/api/*",
        ],
      },
    ],
    sitemap: "https://www.awenueglobalsoftwaresolutions.in/sitemap.xml",
  };
}
