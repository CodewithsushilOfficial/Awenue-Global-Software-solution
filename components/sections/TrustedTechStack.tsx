"use client";

import { useEffect, useRef, useMemo } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import TechLogo from "@/lib/techLogos";

gsap.registerPlugin(ScrollTrigger);

export interface Technology {
  id: string;
  name: string;
  slug: string;
  category: "Frontend" | "Backend" | "Cloud & DevOps" | "Database" | "AI & Mobile";
  logo?: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
  featured?: boolean;
}

interface TrustedTechStackProps {
  initialTechnologies?: Technology[];
}

const DEFAULT_FALLBACK_TECHS: Technology[] = [
  { id: "1", name: "React", slug: "react", category: "Frontend", displayOrder: 1, isActive: true, featured: true },
  { id: "2", name: "Next.js", slug: "nextjs", category: "Frontend", displayOrder: 2, isActive: true, featured: true },
  { id: "3", name: "TypeScript", slug: "typescript", category: "Frontend", displayOrder: 3, isActive: true, featured: true },
  { id: "4", name: "Tailwind CSS", slug: "tailwindcss", category: "Frontend", displayOrder: 4, isActive: true, featured: true },
  { id: "5", name: "JavaScript", slug: "javascript", category: "Frontend", displayOrder: 5, isActive: true, featured: false },
  { id: "6", name: "Node.js", slug: "nodejs", category: "Backend", displayOrder: 6, isActive: true, featured: true },
  { id: "7", name: "Express.js", slug: "express", category: "Backend", displayOrder: 7, isActive: true, featured: false },
  { id: "8", name: "Python", slug: "python", category: "Backend", displayOrder: 8, isActive: true, featured: true },
  { id: "9", name: "Firebase", slug: "firebase", category: "Backend", displayOrder: 9, isActive: true, featured: true },
  { id: "10", name: "Socket.IO", slug: "socketio", category: "Backend", displayOrder: 10, isActive: true, featured: false },
  { id: "11", name: "MongoDB", slug: "mongodb", category: "Database", displayOrder: 11, isActive: true, featured: true },
  { id: "12", name: "PostgreSQL", slug: "postgresql", category: "Database", displayOrder: 12, isActive: true, featured: true },
  { id: "13", name: "Prisma", slug: "prisma", category: "Database", displayOrder: 13, isActive: true, featured: true },
  { id: "14", name: "Redis", slug: "redis", category: "Database", displayOrder: 14, isActive: true, featured: false },
  { id: "15", name: "Docker", slug: "docker", category: "Cloud & DevOps", displayOrder: 15, isActive: true, featured: true },
  { id: "16", name: "Kubernetes", slug: "kubernetes", category: "Cloud & DevOps", displayOrder: 16, isActive: true, featured: true },
  { id: "17", name: "AWS", slug: "aws", category: "Cloud & DevOps", displayOrder: 17, isActive: true, featured: true },
  { id: "18", name: "Microsoft Azure", slug: "azure", category: "Cloud & DevOps", displayOrder: 18, isActive: true, featured: true },
  { id: "19", name: "Google Cloud", slug: "gcp", category: "Cloud & DevOps", displayOrder: 19, isActive: true, featured: true },
  { id: "20", name: "Vercel", slug: "vercel", category: "Cloud & DevOps", displayOrder: 20, isActive: true, featured: true },
  { id: "21", name: "Nginx", slug: "nginx", category: "Cloud & DevOps", displayOrder: 21, isActive: true, featured: false },
  { id: "22", name: "GitHub", slug: "github", category: "Cloud & DevOps", displayOrder: 22, isActive: true, featured: true },
  { id: "23", name: "Flutter", slug: "flutter", category: "AI & Mobile", displayOrder: 23, isActive: true, featured: true },
  { id: "24", name: "React Native", slug: "reactnative", category: "AI & Mobile", displayOrder: 24, isActive: true, featured: true },
  { id: "25", name: "OpenAI", slug: "openai", category: "AI & Mobile", displayOrder: 25, isActive: true, featured: true },
];

// ─── MARQUEE STRIP (EXACT SAME AS SERVICES MARQUEE STRIP) ─────────────────────
function TechMarqueeStrip({ techList }: { techList: Technology[] }) {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const ctx = gsap.context(() => {
      gsap.to(track, { xPercent: -50, duration: 35, ease: "none", repeat: -1 });
    }, track);
    return () => ctx.revert();
  }, [techList]);

  const items = [...techList, ...techList, ...techList];

  return (
    <div className="relative overflow-hidden py-6 border-y border-border-dark/50 select-none" aria-hidden="true">
      {/* Edge Gradient Fades */}
      <div className="absolute top-0 bottom-0 left-0 w-24 sm:w-40 bg-gradient-to-r from-surface-base to-transparent z-10 pointer-events-none" />
      <div className="absolute top-0 bottom-0 right-0 w-24 sm:w-40 bg-gradient-to-l from-surface-base to-transparent z-10 pointer-events-none" />

      <div ref={trackRef} className="flex gap-12 sm:gap-16 w-max whitespace-nowrap items-center">
        {items.map((tech, i) => (
          <div key={`mq-${tech.id}-${i}`} className="flex items-center gap-3 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-accent/60 shrink-0" />
            <div className="w-6 h-6 shrink-0 flex items-center justify-center opacity-85 hover:opacity-100 transition-opacity">
              <TechLogo slug={tech.slug} name={tech.name} customLogo={tech.logo} className="w-5 h-5" />
            </div>
            <span className="text-text-muted/80 hover:text-white text-xs sm:text-sm font-extrabold uppercase tracking-[0.18em] transition-colors">
              {tech.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SECTION HEADER WITH SERVICES-STYLE SCROLL ENTRANCE ─────────────────────
function SectionHeader() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const kids = el.querySelectorAll(".h-anim");
    const ctx = gsap.context(() => {
      gsap.fromTo(
        kids,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: "power3.out",
          stagger: 0.13,
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        }
      );
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={ref} className="text-center mb-10">
      <span className="h-anim opacity-0 block text-accent text-eyebrow mb-4">
        TECH STACK
      </span>
      <h2 className="h-anim opacity-0 text-section-title text-text-secondary mb-5 leading-tight">
        Built With a{" "}
        <span className="text-accent">Trusted Technology Stack</span>
      </h2>
      <p className="h-anim opacity-0 text-body-lg text-text-muted max-w-2xl mx-auto leading-relaxed">
        We build scalable, secure, and high-performance digital products using industry-leading technologies trusted by startups, enterprises, and global organizations.
      </p>
    </div>
  );
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────
export default function TrustedTechStack({ initialTechnologies }: TrustedTechStackProps) {
  const techStack = useMemo(() => {
    const rawList = initialTechnologies && initialTechnologies.length > 0 ? initialTechnologies : DEFAULT_FALLBACK_TECHS;
    return rawList
      .filter((tech) => tech.isActive !== false)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }, [initialTechnologies]);

  return (
    <section
      id="tech-stack"
      className="py-16 sm:py-20 bg-surface-base relative overflow-hidden text-white border-b border-border-dark select-none"
    >
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Header (Services style GSAP animation) */}
        <SectionHeader />

        {/* Marquee Strip (Services style GSAP marquee animation) */}
        <TechMarqueeStrip techList={techStack} />
      </div>
    </section>
  );
}
