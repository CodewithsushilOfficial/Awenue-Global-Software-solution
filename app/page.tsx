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
import { ServiceData } from "@/components/sections/Services";
import { ProductItem } from "@/components/sections/Products";
import { PortfolioProject } from "@/components/sections/Portfolio";
import { ProcessStepItem } from "@/components/sections/ProcessTimeline";
import { SocialLink } from "@/components/sections/Footer";

interface HomepageContent {
  id: string;
  heroEyebrow?: string;
  heroHeading?: string;
  heroHighlight?: string;
  heroDescription?: string;
  heroPrimaryCta?: string;
  heroSecondaryCta?: string;
  finalCtaEyebrow?: string;
  finalCtaHeading?: string;
  finalCtaDescription?: string;
  finalCtaPrimary?: string;
  finalCtaSecondary?: string;
  footerBrandDesc?: string;
  footerAddress?: string;
  footerEmail?: string;
  footerCopyright?: string;
  [key: string]: unknown;
}

// Enable static site generation with ISR (revalidates on-demand via API)
export const revalidate = false;

export default async function Home() {
  const services: ServiceData[] = [];
  const products: ProductItem[] = [];
  const portfolioProjects: PortfolioProject[] = [];
  let homepageContent: HomepageContent | null = null;
  const socialLinks: SocialLink[] = [];
  const processSteps: ProcessStepItem[] = [];

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
          services.push({ id: docSnap.id, ...data } as ServiceData);
        }
      });
    }

    if (!productsSnap.empty) {
      productsSnap.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.published !== false) {
          products.push({ id: docSnap.id, ...data } as ProductItem);
        }
      });
    }

    if (!portfolioSnap.empty) {
      portfolioSnap.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.published !== false) {
          portfolioProjects.push({ id: docSnap.id, ...data } as PortfolioProject);
        }
      });
    }

    if (contentSnap.exists()) {
      homepageContent = { id: contentSnap.id, ...contentSnap.data() } as HomepageContent;
    } else {
      const altSnap = await getDoc(doc(db, "siteContent", "homepage"));
      if (altSnap.exists()) {
        homepageContent = { id: altSnap.id, ...altSnap.data() } as HomepageContent;
      }
    }

    if (!socialSnap.empty) {
      socialSnap.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.isActive !== false) {
           socialLinks.push({ id: docSnap.id, ...data } as SocialLink);
        }
      });
      // Sort by displayOrder ascending
      socialLinks.sort((a, b) => (Number(a.displayOrder) || 0) - (Number(b.displayOrder) || 0));
    }

    if (!processSnap.empty) {
      processSnap.forEach((docSnap) => {
        const data = docSnap.data();
         processSteps.push({ id: docSnap.id, ...data } as ProcessStepItem);
      });
      // Sort by displayOrder ascending
      processSteps.sort((a, b) => (Number(a.displayOrder) || 0) - (Number(b.displayOrder) || 0));
    }
  } catch (err) {
    console.error("[SERVER FETCH] Failed to load homepage CMS content:", err);
  }

  // Safe serialization helper to clean up undefined/Timestamps
  const safeServices = JSON.parse(JSON.stringify(services)) as ServiceData[];
  const safeProducts = JSON.parse(JSON.stringify(products)) as ProductItem[];
  const safePortfolio = JSON.parse(JSON.stringify(portfolioProjects)) as PortfolioProject[];
  const safeContent = homepageContent ? (JSON.parse(JSON.stringify(homepageContent)) as HomepageContent) : null;
  const safeSocialLinks = JSON.parse(JSON.stringify(socialLinks)) as SocialLink[];
  const safeProcessSteps = JSON.parse(JSON.stringify(processSteps)) as ProcessStepItem[];

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
