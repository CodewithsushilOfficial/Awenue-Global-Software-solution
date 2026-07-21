"use client";

import { useEffect, useRef, useMemo } from "react";
import RevealOnScroll from "@/components/motion/RevealOnScroll";
import { Target, MessageSquare, Layers, TrendingUp } from "lucide-react";
import gsap from "gsap";
import TechLogo from "@/lib/techLogos";
import { Technology } from "@/components/sections/TrustedTechStack";

const trustItems = [
  {
    icon: Target,
    title: "Business-First Approach",
    desc: "We understand your goals before recommending any technology.",
  },
  {
    icon: MessageSquare,
    title: "Transparent Process",
    desc: "Clear communication and structured milestones throughout.",
  },
  {
    icon: Layers,
    title: "End-to-End Solutions",
    desc: "Strategy, design, development, launch, and ongoing support.",
  },
  {
    icon: TrendingUp,
    title: "Built for Growth",
    desc: "Solutions designed to evolve as your business scales.",
  },
];

const DEFAULT_FALLBACK_TECHS: Technology[] = [
  { id: "1", name: "React", slug: "react", category: "Frontend", displayOrder: 1, isActive: true },
  { id: "2", name: "Next.js", slug: "nextjs", category: "Frontend", displayOrder: 2, isActive: true },
  { id: "3", name: "TypeScript", slug: "typescript", category: "Frontend", displayOrder: 3, isActive: true },
  { id: "4", name: "Tailwind CSS", slug: "tailwindcss", category: "Frontend", displayOrder: 4, isActive: true },
  { id: "5", name: "Node.js", slug: "nodejs", category: "Backend", displayOrder: 5, isActive: true },
  { id: "6", name: "Express.js", slug: "express", category: "Backend", displayOrder: 6, isActive: true },
  { id: "7", name: "Python", slug: "python", category: "Backend", displayOrder: 7, isActive: true },
  { id: "8", name: "Firebase", slug: "firebase", category: "Backend", displayOrder: 8, isActive: true },
  { id: "9", name: "MongoDB", slug: "mongodb", category: "Database", displayOrder: 9, isActive: true },
  { id: "10", name: "PostgreSQL", slug: "postgresql", category: "Database", displayOrder: 10, isActive: true },
  { id: "11", name: "Prisma", slug: "prisma", category: "Database", displayOrder: 11, isActive: true },
  { id: "12", name: "Docker", slug: "docker", category: "Cloud & DevOps", displayOrder: 12, isActive: true },
  { id: "13", name: "Kubernetes", slug: "kubernetes", category: "Cloud & DevOps", displayOrder: 13, isActive: true },
  { id: "14", name: "AWS", slug: "aws", category: "Cloud & DevOps", displayOrder: 14, isActive: true },
  { id: "15", name: "Microsoft Azure", slug: "azure", category: "Cloud & DevOps", displayOrder: 15, isActive: true },
  { id: "16", name: "Google Cloud", slug: "gcp", category: "Cloud & DevOps", displayOrder: 16, isActive: true },
  { id: "17", name: "Vercel", slug: "vercel", category: "Cloud & DevOps", displayOrder: 17, isActive: true },
  { id: "18", name: "Nginx", slug: "nginx", category: "Cloud & DevOps", displayOrder: 18, isActive: true },
  { id: "19", name: "GitHub", slug: "github", category: "Cloud & DevOps", displayOrder: 19, isActive: true },
  { id: "20", name: "Flutter", slug: "flutter", category: "AI & Mobile", displayOrder: 20, isActive: true },
  { id: "21", name: "React Native", slug: "reactnative", category: "AI & Mobile", displayOrder: 21, isActive: true },
  { id: "22", name: "OpenAI", slug: "openai", category: "AI & Mobile", displayOrder: 22, isActive: true },
];

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
    <div className="relative overflow-hidden py-4 mt-8 select-none" aria-hidden="true">
      {/* Edge Gradient Fades */}
      <div className="absolute top-0 bottom-0 left-0 w-20 sm:w-32 bg-gradient-to-r from-surface-raised to-transparent z-10 pointer-events-none" />
      <div className="absolute top-0 bottom-0 right-0 w-20 sm:w-32 bg-gradient-to-l from-surface-raised to-transparent z-10 pointer-events-none" />

      <div ref={trackRef} className="flex gap-10 sm:gap-14 w-max whitespace-nowrap items-center">
        {items.map((tech, i) => (
          <div key={`trust-mq-${tech.id}-${i}`} className="flex items-center gap-3 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-accent/60 shrink-0" />
            <div className="w-5 h-5 shrink-0 flex items-center justify-center opacity-85">
              <TechLogo slug={tech.slug} name={tech.name} customLogo={tech.logo} className="w-4.5 h-4.5" />
            </div>
            <span className="text-text-muted/70 hover:text-white text-[11px] sm:text-xs font-extrabold uppercase tracking-[0.18em] transition-colors">
              {tech.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TrustBar({ initialTechnologies }: { initialTechnologies?: Technology[] }) {
  const techStack = useMemo(() => {
    const rawList = initialTechnologies && initialTechnologies.length > 0 ? initialTechnologies : DEFAULT_FALLBACK_TECHS;
    return rawList
      .filter((tech) => tech.isActive !== false)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }, [initialTechnologies]);

  return (
    <section
      id="about"
      className="bg-surface-raised text-text-secondary border-y border-border-dark py-20 sm:py-24 relative overflow-hidden"
    >
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_100%,rgba(9,184,80,0.05)_0%,transparent_70%)] pointer-events-none"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* WHY AWENUE Header */}
        <div className="max-w-3xl mb-16 text-center mx-auto">
          <RevealOnScroll delay={0.1}>
            <span className="text-accent text-eyebrow block mb-3">WHY AWENUE</span>
          </RevealOnScroll>
          <RevealOnScroll delay={0.15}>
            <h2 className="text-section-title mb-4">
              Built Around Your Business.{" "}
              <span className="text-accent">Focused on Your Growth.</span>
            </h2>
          </RevealOnScroll>
          <RevealOnScroll delay={0.2}>
            <p className="text-text-muted text-body-lg max-w-xl mx-auto">
              We partner with local businesses, startups, and growing companies to turn ideas into powerful digital solutions.
            </p>
          </RevealOnScroll>
        </div>

        {/* 4 Trust Pillars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 rounded-2xl overflow-hidden border border-border-dark">
          {trustItems.map((item, idx) => {
            const Icon = item.icon;
            const isLastCol = idx === trustItems.length - 1;
            return (
              <RevealOnScroll key={idx} delay={0.1 + idx * 0.08}>
                <div
                  className={`group p-8 flex flex-col gap-4 hover:bg-surface-base/60 transition-colors duration-300 h-full
                    ${!isLastCol ? "border-b lg:border-b-0 lg:border-r border-border-dark" : ""}
                    ${idx === 1 ? "sm:border-r-0 lg:border-r border-border-dark" : ""}
                    ${idx === 0 ? "sm:border-r border-border-dark" : ""}
                  `}
                >
                  <div className="w-11 h-11 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent group-hover:bg-accent/20 group-hover:border-accent/40 transition-all duration-300 shrink-0">
                    <Icon size={20} />
                  </div>
                  <div>
                    <h3 className="text-h4 text-text-secondary mb-1.5">{item.title}</h3>
                    <p className="text-body-sm text-text-muted font-normal leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </RevealOnScroll>
            );
          })}
        </div>

        {/* Tech Stack Heading & Subtitle Content */}
        <div className="mt-20 pt-16 border-t border-border-dark/60 max-w-4xl text-center mx-auto">
          <RevealOnScroll delay={0.1}>
            <span className="text-accent text-eyebrow block mb-3">TECH STACK</span>
          </RevealOnScroll>
          <RevealOnScroll delay={0.15}>
            <h2 className="text-section-title mb-4 sm:whitespace-nowrap text-white">
              Built With a Trusted{" "}
              <span className="text-accent">Technology Stack</span>
            </h2>
          </RevealOnScroll>
          <RevealOnScroll delay={0.2}>
            <p className="text-text-muted text-body-lg max-w-4xl sm:max-w-5xl mx-auto leading-relaxed">
              Powered by industry-leading technologies, we develop secure, scalable, and future-ready<br className="hidden sm:block" />
              digital solutions that help businesses innovate, grow, and succeed with confidence.
            </p>
          </RevealOnScroll>
        </div>

        {/* Embedded Tech Stack Marquee Strip */}
        <TechMarqueeStrip techList={techStack} />
      </div>
    </section>
  );
}
