import Navigation from "@/components/sections/Navigation";
import Hero from "@/components/sections/Hero";
import TrustBar from "@/components/sections/TrustBar";
import Services from "@/components/sections/Services";
import Products from "@/components/sections/Products";
import Portfolio from "@/components/sections/Portfolio";
import ProcessTimeline from "@/components/sections/ProcessTimeline";
import FinalCTA from "@/components/sections/FinalCTA";
import Footer from "@/components/sections/Footer";

import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Enable static site generation with ISR (revalidates on-demand via API)
export const revalidate = false;

export default async function Home() {
  let services: any[] = [];
  let products: any[] = [];
  let portfolioProjects: any[] = [];
  let homepageContent: any = null;
  let socialLinks: any[] = [];
  let processSteps: any[] = [];

  try {
    const [servicesSnap, productsSnap, portfolioSnap, contentSnap, socialSnap, processSnap] = await Promise.all([
      getDocs(collection(db, "services")),
      getDocs(collection(db, "products")),
      getDocs(collection(db, "portfolioProjects")),
      getDoc(doc(db, "websiteContent", "homepage")),
      getDocs(collection(db, "socialLinks")),
      getDocs(collection(db, "processSteps")),
    ]);

    if (!servicesSnap.empty) {
      servicesSnap.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.published !== false) {
          services.push({ id: docSnap.id, ...data });
        }
      });
    }

    if (!productsSnap.empty) {
      productsSnap.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.published !== false) {
          products.push({ id: docSnap.id, ...data });
        }
      });
    }

    if (!portfolioSnap.empty) {
      portfolioSnap.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.published !== false) {
          portfolioProjects.push({ id: docSnap.id, ...data });
        }
      });
    }

    if (contentSnap.exists()) {
      homepageContent = { id: contentSnap.id, ...contentSnap.data() };
    } else {
      const altSnap = await getDoc(doc(db, "siteContent", "homepage"));
      if (altSnap.exists()) {
        homepageContent = { id: altSnap.id, ...altSnap.data() };
      }
    }

    if (!socialSnap.empty) {
      socialSnap.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.isActive !== false) {
          socialLinks.push({ id: docSnap.id, ...data });
        }
      });
      // Sort by displayOrder ascending
      socialLinks.sort((a, b) => (Number(a.displayOrder) || 0) - (Number(b.displayOrder) || 0));
    }

    if (!processSnap.empty) {
      processSnap.forEach((docSnap) => {
        const data = docSnap.data();
        processSteps.push({ id: docSnap.id, ...data });
      });
      // Sort by displayOrder ascending
      processSteps.sort((a, b) => (Number(a.displayOrder) || 0) - (Number(b.displayOrder) || 0));
    }
  } catch (err) {
    console.error("[SERVER FETCH] Failed to load homepage CMS content:", err);
  }

  // Safe serialization helper to clean up undefined/Timestamps
  const safeServices = JSON.parse(JSON.stringify(services));
  const safeProducts = JSON.parse(JSON.stringify(products));
  const safePortfolio = JSON.parse(JSON.stringify(portfolioProjects));
  const safeContent = homepageContent ? JSON.parse(JSON.stringify(homepageContent)) : null;
  const safeSocialLinks = JSON.parse(JSON.stringify(socialLinks));
  const safeProcessSteps = JSON.parse(JSON.stringify(processSteps));

  // Extract content chunks for individual components
  const heroCmsContent = safeContent
    ? {
        heroEyebrow: safeContent.heroEyebrow,
        heroHeading: safeContent.heroHeading,
        heroHighlight: safeContent.heroHighlight,
        heroDescription: safeContent.heroDescription,
        heroPrimaryCta: safeContent.heroPrimaryCta,
        heroSecondaryCta: safeContent.heroSecondaryCta,
      }
    : undefined;

  const finalCtaCmsContent = safeContent
    ? {
        finalCtaEyebrow: safeContent.finalCtaEyebrow,
        finalCtaHeading: safeContent.finalCtaHeading,
        finalCtaDescription: safeContent.finalCtaDescription,
        finalCtaPrimary: safeContent.finalCtaPrimary,
        finalCtaSecondary: safeContent.finalCtaSecondary,
      }
    : undefined;

  const footerCmsContent = safeContent
    ? {
        footerBrandDesc: safeContent.footerBrandDesc,
        footerAddress: safeContent.footerAddress,
        footerEmail: safeContent.footerEmail,
        footerCopyright: safeContent.footerCopyright,
      }
    : undefined;

  return (
    <>
      <Navigation />
      <main className="grow">
        <Hero initialCmsContent={heroCmsContent} />
        <TrustBar />
        <Services initialServices={safeServices} />
        <Products initialProducts={safeProducts} />
        <Portfolio initialProjects={safePortfolio} />
        <ProcessTimeline initialSteps={safeProcessSteps} />
        <FinalCTA initialCmsContent={finalCtaCmsContent} />
      </main>
      <Footer initialCmsContent={footerCmsContent} initialSocialLinks={safeSocialLinks} />
    </>
  );
}
