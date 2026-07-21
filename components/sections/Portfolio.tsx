"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import RevealOnScroll from "@/components/motion/RevealOnScroll";
import { useModal } from "@/components/providers/ModalProvider";
import { ExternalLink, ArrowRight } from "lucide-react";
import { motion } from "motion/react";

export interface PortfolioProject {
  id: string;
  name: string;
  slug: string;
  category: string;
  shortDescription: string;
  techTags: string[];
  projectUrl?: string;
  projectType: "AWENUE Product" | "Personal Project" | "Client Project";
  imageUrl?: string;
  imageAlt?: string;
  displayOrder: number;
  published: boolean;
  seoTitle?: string;
  seoDescription?: string;
  seoCanonical?: string;
  seoOgImage?: string;
  seoNoindex?: boolean;
  schemaType?: string;
}

const DEFAULT_PROJECTS: PortfolioProject[] = [
  {
    id: "p-1",
    name: "Enterprise Analytics Portal",
    slug: "enterprise-analytics",
    category: "Web Application",
    shortDescription: "Real-time decision intelligence dashboard with custom telemetry and predictive workflow triggers.",
    techTags: ["Next.js", "TypeScript", "Tailwind CSS", "Recharts"],
    projectUrl: "https://awenue.io",
    projectType: "Client Project",
    imageUrl: "/images/hero/scene-01-business.jpg",
    displayOrder: 1,
    published: true,
  },
  {
    id: "p-2",
    name: "Cross-Platform Logistics Suite",
    slug: "logistics-mobile-app",
    category: "Mobile Application",
    shortDescription: "Universal iOS & Android dispatch manager connecting drivers, hub controllers, and live fleet GPS.",
    techTags: ["React Native", "Node.js", "PostgreSQL"],
    projectType: "Client Project",
    imageUrl: "/images/hero/scene-03-mobile.jpg",
    displayOrder: 2,
    published: true,
  },
  {
    id: "p-3",
    name: "Automated Lead Routing Engine",
    slug: "ai-lead-automation",
    category: "AI & Automation",
    shortDescription: "Custom AI pipeline extracting inquiry metadata and orchestrating real-time CRM follow-ups.",
    techTags: ["Python", "FastAPI", "OpenAI API", "Webhooks"],
    projectType: "AWENUE Product",
    imageUrl: "/images/hero/scene-04-ai.jpg",
    displayOrder: 3,
    published: true,
  },
];

export default function Portfolio({ initialProjects }: { initialProjects?: PortfolioProject[] }) {
  const { openModal } = useModal();
  const [projects, setProjects] = useState<PortfolioProject[]>(initialProjects || DEFAULT_PROJECTS);
  const [activeTab, setActiveTab] = useState<string>("All");

  useEffect(() => {
    if (initialProjects && initialProjects.length > 0) return;
    async function fetchPortfolio() {
      try {
        const snap = await getDocs(collection(db, "portfolioProjects"));
        if (!snap.empty) {
          const loaded: PortfolioProject[] = [];
          snap.forEach((docSnap) => {
            const data = docSnap.data() as PortfolioProject;
            if (data.published !== false) {
              loaded.push({ ...data, id: docSnap.id });
            }
          });
          loaded.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
          if (loaded.length > 0) {
            setProjects(loaded);
          }
        }
      } catch (err) {
        console.warn("Using default portfolio projects (Firestore load bypassed):", err);
      }
    }
    fetchPortfolio();
  }, [initialProjects]);

  const categories = ["All", "AWENUE Product", "Client Project", "Personal Project"];

  const filteredProjects = activeTab === "All"
    ? projects
    : projects.filter((p) => p.projectType === activeTab);

  return (
    <section id="portfolio" className="bg-surface-base py-24 sm:py-32 relative overflow-hidden border-t border-border-dark">
      {/* Background glow */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[400px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse at center, rgba(9,184,80,0.04) 0%, transparent 70%)" }}
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <RevealOnScroll delay={0.1}>
            <span className="text-accent text-eyebrow block mb-3">OUR PORTFOLIO</span>
          </RevealOnScroll>
          <RevealOnScroll delay={0.15}>
            <h2 className="text-section-title text-text-secondary mb-4 leading-tight">
              Featured Work & <span className="text-accent">Proven Results.</span>
            </h2>
          </RevealOnScroll>
          <RevealOnScroll delay={0.2}>
            <p className="text-text-muted text-body-lg max-w-xl mx-auto leading-relaxed">
              Explore digital solutions we&apos;ve engineered — from custom web applications to automated growth engines.
            </p>
          </RevealOnScroll>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`px-4 py-2 rounded-full text-xs font-extrabold transition-all cursor-pointer border ${
                activeTab === cat
                  ? "bg-accent text-surface-base border-accent shadow-glow"
                  : "bg-surface-raised text-text-muted border-white/10 hover:border-white/25 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredProjects.map((project, idx) => (
            <RevealOnScroll key={project.id} delay={0.1 + idx * 0.1}>
              <motion.div
                whileHover={{ y: -6 }}
                transition={{ type: "spring", stiffness: 220, damping: 20 }}
                className="group rounded-3xl border border-white/10 bg-surface-raised overflow-hidden flex flex-col h-full hover:border-accent/40 transition-all duration-300 shadow-xl"
              >
                {/* Image Preview */}
                <div className="relative w-full h-48 sm:h-52 bg-surface-base overflow-hidden">
                  {(() => {
                    const src = project.imageUrl || "";
                    const alt = (project as PortfolioProject & { imageAlt?: string }).imageAlt || project.name;
                    if (src && (src.startsWith("http://") || src.startsWith("https://"))) {
                      return (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={src}
                          alt={alt}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "/images/hero/scene-02-webdev.jpg";
                          }}
                        />
                      );
                    }
                    return (
                      <Image
                        src={src || "/images/hero/scene-02-webdev.jpg"}
                        alt={alt}
                        fill
                        className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    );
                  })()}
                  <div className="absolute inset-0 bg-linear-to-t from-surface-raised via-transparent to-transparent opacity-80" />
                  
                  {/* Badge */}
                  <div className="absolute top-3 right-3">
                    <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider border backdrop-blur-md ${
                      project.projectType === "AWENUE Product"
                        ? "bg-accent/15 border-accent/40 text-accent"
                        : project.projectType === "Client Project"
                        ? "bg-blue-500/15 border-blue-400/40 text-blue-400"
                        : "bg-purple-500/15 border-purple-400/40 text-purple-400"
                    }`}>
                      {project.projectType}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col justify-between flex-1 gap-4">
                  <div>
                    <span className="text-[11px] font-extrabold text-accent uppercase tracking-widest block mb-1">
                      {project.category}
                    </span>
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-accent transition-colors">
                      {project.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-text-muted leading-relaxed line-clamp-3">
                      {project.shortDescription}
                    </p>
                  </div>

                  <div>
                    {/* Tech Stack Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-4 pt-3 border-t border-white/10">
                      {project.techTags.map((tag, i) => (
                        <span key={i} className="text-[10px] font-semibold text-white/60 bg-surface-base px-2.5 py-1 rounded-md border border-white/10">
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Action */}
                    {project.projectUrl ? (
                      <a
                        href={project.projectUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-accent hover:text-accent-tint transition-colors"
                      >
                        <span>Visit Live Project</span>
                        <ExternalLink size={13} />
                      </a>
                    ) : (
                      <button
                        onClick={() => openModal("project", project.category)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-text-muted hover:text-white transition-colors cursor-pointer"
                      >
                        <span>Request Similar Solution</span>
                        <ArrowRight size={13} />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
