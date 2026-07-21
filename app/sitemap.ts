import { MetadataRoute } from "next";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://www.awenueglobalsoftwaresolutions.in";

  // Base routes
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
  ];

  try {
    const [servicesSnap, productsSnap, portfolioSnap] = await Promise.all([
      getDocs(collection(db, "services")),
      getDocs(collection(db, "products")),
      getDocs(collection(db, "portfolioProjects")),
    ]);

    // Add Services
    if (!servicesSnap.empty) {
      servicesSnap.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.published !== false && data.slug && !data.seoNoindex) {
          routes.push({
            url: `${baseUrl}/services/${data.slug}`,
            lastModified: data.updatedAt ? new Date(data.updatedAt) : new Date(),
            changeFrequency: "monthly",
            priority: 0.8,
          });
        }
      });
    }

    // Add Products
    if (!productsSnap.empty) {
      productsSnap.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.published !== false && data.slug && !data.seoNoindex) {
          routes.push({
            url: `${baseUrl}/products/${data.slug}`,
            lastModified: data.updatedAt ? new Date(data.updatedAt) : new Date(),
            changeFrequency: "monthly",
            priority: 0.8,
          });
        }
      });
    }

    // Add Portfolio
    if (!portfolioSnap.empty) {
      portfolioSnap.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.published !== false && data.slug && !data.seoNoindex) {
          routes.push({
            url: `${baseUrl}/portfolio/${data.slug}`,
            lastModified: data.updatedAt ? new Date(data.updatedAt) : new Date(),
            changeFrequency: "monthly",
            priority: 0.7,
          });
        }
      });
    }
  } catch (err) {
    console.error("[SITEMAP GENERATION] Failed to fetch CMS items for sitemap:", err);
  }

  return routes;
}
