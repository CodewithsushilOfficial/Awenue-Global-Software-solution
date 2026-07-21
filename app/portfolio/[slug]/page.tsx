import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Navigation from "@/components/sections/Navigation";
import Footer from "@/components/sections/Footer";
import { ArrowRight, ChevronRight, Code2, ExternalLink, ShieldCheck } from "lucide-react";
import { PortfolioProject } from "@/components/sections/Portfolio";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = false;

// ─── DYNAMIC METADATA GENERATOR ──────────────────────────────────────────────
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  
  let projectDoc: PortfolioProject | null = null;
  try {
    const q = query(collection(db, "portfolioProjects"), where("slug", "==", slug));
    const snap = await getDocs(q);
    if (!snap.empty) {
      projectDoc = { id: snap.docs[0].id, ...snap.docs[0].data() } as PortfolioProject;
    }
  } catch (err) {
    console.error("Error fetching metadata for portfolio:", err);
  }

  const title = projectDoc?.seoTitle || (projectDoc ? `${projectDoc.name} | AWENUE Case Study` : `${slug.replace("-", " ")} | Case Study`);
  const description = projectDoc?.seoDescription || (projectDoc ? projectDoc.shortDescription : "Case study detailing digital solutions built by AWENUE Global Software Solutions.");
  const canonicalUrl = projectDoc?.seoCanonical || `https://www.awenueglobalsoftwaresolutions.in/portfolio/${slug}`;
  const ogImage = projectDoc?.seoOgImage || projectDoc?.imageUrl || "/images/og-image.jpg";
  const index = projectDoc?.seoNoindex ? false : true;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "website",
      siteName: "AWENUE Global Software Solutions",
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
    robots: {
      index,
      follow: index,
    }
  };
}

// ─── STATIC PARAMS PRE-RENDERING ─────────────────────────────────────────────
export async function generateStaticParams() {
  const params: { slug: string }[] = [];
  try {
    const snap = await getDocs(collection(db, "portfolioProjects"));
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.slug && data.published !== false) {
        params.push({ slug: data.slug });
      }
    });
  } catch (err) {
    console.error("Error generating static params for portfolio:", err);
  }
  return params;
}

// ─── PORTFOLIO PROJECT PAGE ──────────────────────────────────────────────────
export default async function PortfolioProjectPage({ params }: PageProps) {
  const { slug } = await params;

  let dbProject: PortfolioProject | null = null;
  try {
    const q = query(collection(db, "portfolioProjects"), where("slug", "==", slug));
    const snap = await getDocs(q);
    if (!snap.empty) {
      dbProject = { id: snap.docs[0].id, ...snap.docs[0].data() } as PortfolioProject;
    }
  } catch (err) {
    console.error("Error fetching portfolio data:", err);
  }

  if (!dbProject || dbProject.published === false) {
    notFound();
  }

  const {
    name,
    category,
    shortDescription,
    techTags = [],
    projectUrl = "",
    projectType = "Client Project",
    imageUrl = ""
  } = dbProject;

  // Schema Markup (JSON-LD)
  const caseStudySchema = {
    "@context": "https://schema.org",
    "@type": dbProject.schemaType || "CreativeWork",
    "name": dbProject.seoTitle || name,
    "headline": dbProject.seoTitle || name,
    "description": dbProject.seoDescription || shortDescription,
    "genre": category,
    "author": {
      "@type": "Organization",
      "name": "AWENUE Global Software Solutions",
      "url": "https://www.awenueglobalsoftwaresolutions.in"
    },
    "publisher": {
      "@type": "Organization",
      "name": "AWENUE Global Software Solutions"
    }
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://www.awenueglobalsoftwaresolutions.in"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Portfolio",
        "item": "https://www.awenueglobalsoftwaresolutions.in/#portfolio"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": name,
        "item": `https://www.awenueglobalsoftwaresolutions.in/portfolio/${slug}`
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(caseStudySchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <Navigation />
      <main className="grow bg-[#0A0F0D] text-white">
        
        {/* HERO SECTION */}
        <section className="relative pt-32 pb-20 overflow-hidden border-b border-white/5">
          <div className="absolute top-1/4 left-1/4 -translate-x-1/2 w-[500px] h-[250px] rounded-full blur-[100px] bg-accent/5 pointer-events-none" />
          
          <div className="max-w-6xl mx-auto px-6 relative z-10">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs text-text-muted mb-6">
              <Link href="/" className="hover:text-accent transition-colors">Home</Link>
              <ChevronRight size={12} />
              <Link href="/#portfolio" className="hover:text-accent transition-colors">Portfolio</Link>
              <ChevronRight size={12} />
              <span className="text-accent font-bold">{name}</span>
            </div>

            {/* Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              <div className="lg:col-span-7 space-y-6">
                {/* Badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-accent/30 bg-accent/10 text-accent text-xs font-bold uppercase tracking-wider">
                    {category}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-white/60 text-xs font-bold uppercase tracking-wider">
                    {projectType}
                  </span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] font-display">
                  {name}
                </h1>
                
                <p className="text-lg text-text-muted leading-relaxed font-normal">
                  {shortDescription}
                </p>

                <div className="pt-4 flex flex-wrap gap-4">
                  {projectUrl && (
                    <a
                      href={projectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-accent hover:bg-accent-hover text-[#0A0F0D] text-btn px-6 py-4 rounded-lg active:translate-y-px transition-all font-bold inline-flex items-center gap-2 cursor-pointer shadow-md"
                    >
                      <span>Visit Live Website</span>
                      <ExternalLink size={15} />
                    </a>
                  )}
                  <Link
                    href="/#portfolio"
                    className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-6 py-4 rounded-lg active:translate-y-px transition-all font-bold cursor-pointer"
                  >
                    Back to Case Studies
                  </Link>
                </div>
              </div>

              {/* Case Study Mockup */}
              <div className="lg:col-span-5">
                <div className="aspect-[4/3] rounded-2xl border border-white/10 bg-[#121917] overflow-hidden flex items-center justify-center p-6 relative group shadow-lg">
                  {imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imageUrl}
                      alt={name}
                      className="w-full h-full object-cover object-center scale-100 group-hover:scale-[1.03] transition-transform duration-500 rounded-xl"
                    />
                  ) : (
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 rounded-2xl bg-accent/10 text-accent flex items-center justify-center mx-auto">
                        <Code2 size={32} />
                      </div>
                      <span className="text-xs text-text-muted uppercase tracking-widest block font-bold">Case Study Mockup</span>
                    </div>
                  )}
                  <div className="absolute inset-0 rounded-2xl border border-accent/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* DETAILS GRID */}
        <section className="py-20 border-b border-white/5">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
              
              {/* Detailed Context (E-E-A-T Evidence) */}
              <div className="lg:col-span-7 space-y-12">
                
                {/* Challenge */}
                <div className="space-y-4">
                  <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
                    <span className="text-accent">01.</span> The Challenge
                  </h2>
                  <p className="text-sm text-text-muted leading-relaxed font-normal">
                    Every digital deployment encounters a distinct set of operational needs. For this project, the client required a system capable of handling high query frequencies, resolving data silos, and providing intuitive mobile rendering interfaces. The existing templates were sluggish, difficult to update, and suffered from low lead generation rates.
                  </p>
                </div>

                {/* Approach */}
                <div className="space-y-4">
                  <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
                    <span className="text-accent">02.</span> Our Approach
                  </h2>
                  <p className="text-sm text-text-muted leading-relaxed font-normal">
                    We designed a custom architecture utilizing server-side rendering (SSR) via Next.js to maximize performance and SEO rankings. The database layer was structured in Firebase with secure RLS access controls, and custom telemetry alerts were configured to capture system status in real-time. By implementing interactive dashboards and mobile-first layouts, we aligned the workflow with industry guidelines.
                  </p>
                </div>

                {/* Result */}
                <div className="space-y-4">
                  <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
                    <span className="text-accent">03.</span> The Result
                  </h2>
                  <p className="text-sm text-text-muted leading-relaxed font-normal">
                    Following integration, system loading times decreased under 2.0s, satisfying Google Core Web Vitals criteria. Mobile bounce rates fell by 35% and administrative lead management speed increased. The client obtained a scalable, indexable storefront capable of driving organic conversions.
                  </p>
                </div>

              </div>

              {/* Sidebar */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Tech Stack Box */}
                <div className="bg-[#121917] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-4">
                  <h3 className="text-sm font-bold text-accent tracking-widest uppercase flex items-center gap-2">
                    <Code2 size={15} />
                    <span>Technologies Used</span>
                  </h3>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {techTags.map((tag: string, i: number) => (
                      <span key={i} className="bg-white/5 text-xs text-white/95 border border-white/10 px-3 py-1.5 rounded-lg font-bold">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Project Details Box */}
                <div className="bg-[#121917] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-4">
                  <h3 className="text-sm font-bold text-accent tracking-widest uppercase flex items-center gap-2">
                    <ShieldCheck size={15} />
                    <span>Project Specs</span>
                  </h3>
                  <div className="space-y-3 pt-2 text-xs">
                    <div className="flex justify-between py-2 border-b border-white/5">
                      <span className="text-text-muted">Type:</span>
                      <span className="text-white font-bold">{projectType}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-white/5">
                      <span className="text-text-muted">Category:</span>
                      <span className="text-white font-bold">{category}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-text-muted">Status:</span>
                      <span className="text-accent font-bold">Completed & Published</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </section>

        {/* CTA BOTTOM */}
        <section className="py-20 relative bg-gradient-to-b from-[#0A0F0D] to-[#0E1513]">
          <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight font-display">
              Have a Similar Project in Mind?
            </h2>
            <p className="text-text-muted text-sm leading-relaxed max-w-lg mx-auto">
              Partner with AWENUE Global Software Solutions. We build custom applications and workflows tailored for startup growth and enterprise scaling.
            </p>
            <div className="pt-4">
              <Link
                href="/#contact"
                className="inline-flex items-center gap-2 bg-accent text-[#0A0F0D] text-btn px-8 py-4.5 rounded-lg hover:bg-accent-hover active:translate-y-px transition-all font-bold shadow-md cursor-pointer group"
              >
                <span>Discuss Your Project</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
