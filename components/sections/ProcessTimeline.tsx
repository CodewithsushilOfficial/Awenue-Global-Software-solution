"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "motion/react";
import { Quote, Sparkles, CheckCircle2 } from "lucide-react";
import * as Icons from "lucide-react";

function getIconComponent(name: string) {
  const IconComponent = (Icons as any)[name];
  return IconComponent || Icons.HelpCircle;
}

gsap.registerPlugin(ScrollTrigger);

// ─── STEP DATA ────────────────────────────────────────────────────────────────
const STEPS = [
  {
    num: "01",
    name: "Discover",
    icon: Icons.Search,
    desc: "We dive deep into your business goals, target audience, and project scope to align on clear objectives.",
    highlights: ["Scope & Goals Alignment", "Requirement Matrix"],
    image: "/images/process/discover.jpg",
    tag: "01 — Business Discovery",
    color: "#09B850",
    colorRgb: "9,184,80",
    side: "left",
  },
  {
    num: "02",
    name: "Research",
    icon: Icons.Microscope,
    desc: "We analyze market trends, competitor strategies, and evaluate the ideal technology stack for your product.",
    highlights: ["Competitor Intelligence", "Tech Architecture Audit"],
    image: "/images/process/research.jpg",
    tag: "02 — Tech & Market Audit",
    color: "#3B82F6",
    colorRgb: "59,130,246",
    side: "right",
  },
  {
    num: "03",
    name: "Strategy",
    icon: Icons.Map,
    desc: "We build an actionable product roadmap, sprint plans, and system architecture before writing code.",
    highlights: ["Sprint & Milestone Roadmap", "System Design Blueprint"],
    image: "/images/digital_growth.webp",
    tag: "03 — Strategic Roadmap",
    color: "#8B5CF6",
    colorRgb: "139,92,246",
    side: "left",
  },
  {
    num: "04",
    name: "Design",
    icon: Icons.Palette,
    desc: "We create interactive wireframes, modern UI component libraries, and polished high-fidelity prototypes.",
    highlights: ["Interactive Prototypes", "Design System & Tokens"],
    image: "/images/web_design.webp",
    tag: "04 — UI/UX & Prototyping",
    color: "#EC4899",
    colorRgb: "236,72,153",
    side: "right",
  },
  {
    num: "05",
    name: "Develop",
    icon: Icons.Code2,
    desc: "We build your product using clean code, scalable APIs, and modern frameworks with weekly staging builds.",
    highlights: ["Weekly Staging Previews", "Clean & Scalable Code"],
    image: "/images/services/web-dev.jpg",
    tag: "05 — Full-Stack Engineering",
    color: "#06B6D4",
    colorRgb: "6,182,212",
    side: "left",
  },
  {
    num: "06",
    name: "Test",
    icon: Icons.FlaskConical,
    desc: "We perform rigorous quality assurance, cross-browser testing, security audits, and performance tuning.",
    highlights: ["End-to-End QA Testing", "Security & Load Audits"],
    image: "/images/mobile_app.webp",
    tag: "06 — QA & Security Audit",
    color: "#F97316",
    colorRgb: "249,115,22",
    side: "right",
  },
  {
    num: "07",
    name: "Launch",
    icon: Icons.Rocket,
    desc: "We deploy your solution to production cloud infrastructure with zero downtime and real-time monitoring.",
    highlights: ["Zero-Downtime Deployment", "Cloud Infra Setup"],
    image: "/images/services/saas.jpg",
    tag: "07 — Go-Live & Launch",
    color: "#EAB308",
    colorRgb: "234,179,8",
    side: "left",
  },
  {
    num: "08",
    name: "Grow",
    icon: Icons.TrendingUp,
    desc: "We continuously optimize, scale server capacity, add new features, and provide long-term technical support.",
    highlights: ["Continuous Upgrades", "24/7 SLA Support"],
    image: "/images/services/ai.jpg",
    tag: "08 — Continuous Scaling",
    color: "#09B850",
    colorRgb: "9,184,80",
    side: "right",
  },
] as const;

// ─── STEP CARD ────────────────────────────────────────────────────────────────
function StepCard({ step }: { step: typeof STEPS[number] }) {
  const Icon = step.icon;
  const cardRef = useRef<HTMLDivElement>(null);
  const isLeft = step.side === "left";

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        {
          opacity: 0,
          x: isLeft ? -60 : 60,
          scale: 0.94,
        },
        {
          opacity: 1,
          x: 0,
          scale: 1,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        }
      );
    }, el);
    return () => ctx.revert();
  }, [isLeft]);

  return (
    <div
      ref={cardRef}
      className="opacity-0 group relative rounded-2xl overflow-hidden border cursor-pointer h-[230px] sm:h-[240px] flex flex-col justify-between"
      style={{
        borderColor: `rgba(${step.colorRgb}, 0.28)`,
        background: "rgba(12,18,15,0.96)",
        boxShadow: `0 0 0 1px rgba(${step.colorRgb},0.1), 0 12px 40px rgba(0,0,0,0.45)`,
        transition: "box-shadow 0.4s ease, transform 0.4s ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 0 1px rgba(${step.colorRgb},0.45), 0 16px 50px rgba(${step.colorRgb},0.18), 0 12px 40px rgba(0,0,0,0.6)`;
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 0 1px rgba(${step.colorRgb},0.1), 0 12px 40px rgba(0,0,0,0.45)`;
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
      }}
    >
      {/* Gradient BG */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at ${isLeft ? "bottom right" : "bottom left"}, rgba(${step.colorRgb},0.2) 0%, rgba(${step.colorRgb},0.05) 50%, transparent 75%)`,
        }}
        aria-hidden="true"
      />
      {/* Top edge glow */}
      <div
        className="absolute top-0 inset-x-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, rgba(${step.colorRgb},0.7), transparent)` }}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative z-10 p-6 flex flex-col justify-between h-full">
        <div>
          {/* Step number + icon row */}
          <div className="flex items-center justify-between mb-3">
            <span
              className="text-[10px] font-black tracking-[0.2em] uppercase"
              style={{ color: `rgba(${step.colorRgb},0.85)` }}
            >
              Phase {step.num}
            </span>
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center border transition-all duration-300 group-hover:scale-110"
              style={{
                background: `rgba(${step.colorRgb},0.15)`,
                borderColor: `rgba(${step.colorRgb},0.35)`,
                color: step.color,
              }}
            >
              <Icon size={16} />
            </div>
          </div>

          {/* Title */}
          <h3
            className="text-xl font-bold mb-2 transition-colors duration-300"
            style={{ color: "#F0F6F2" }}
          >
            {step.name}
          </h3>

          {/* Description */}
          <p className="text-xs sm:text-[13px] text-white/70 leading-relaxed font-normal mb-4">
            {step.desc}
          </p>
        </div>

        {/* Deliverables / Highlights list */}
        <div>
          <div className="grid grid-cols-1 gap-1.5 pt-2 border-t border-white/10">
            {step.highlights.map((h, i) => (
              <div key={i} className="flex items-center gap-2">
                <CheckCircle2 size={12} className="shrink-0" style={{ color: step.color }} />
                <span className="text-[11px] font-semibold text-white/80">{h}</span>
              </div>
            ))}
          </div>

          {/* Bottom accent line */}
          <div
            className="mt-3 h-0.5 rounded-full transition-all duration-500 group-hover:w-full"
            style={{
              width: "36px",
              background: `linear-gradient(90deg, rgba(${step.colorRgb},0.9), rgba(${step.colorRgb},0.2))`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── STEP VISUAL (LARGE CLEAR IMAGE OPPOSITE CELL) ────────────────────────────
function StepVisual({ step }: { step: typeof STEPS[number] }) {
  const visualRef = useRef<HTMLDivElement>(null);
  const isLeft = step.side === "left"; // if card is left, visual is right

  useEffect(() => {
    const el = visualRef.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        {
          opacity: 0,
          x: isLeft ? 60 : -60,
          scale: 0.94,
        },
        {
          opacity: 1,
          x: 0,
          scale: 1,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        }
      );
    }, el);
    return () => ctx.revert();
  }, [isLeft]);

  return (
    <div
      ref={visualRef}
      className="opacity-0 group relative rounded-2xl overflow-hidden border h-[230px] sm:h-[240px] cursor-pointer"
      style={{
        borderColor: `rgba(${step.colorRgb}, 0.3)`,
        boxShadow: `0 0 25px rgba(${step.colorRgb},0.12), 0 10px 30px rgba(0,0,0,0.5)`,
      }}
    >
      {/* Background Image — Clear & Crisp */}
      <Image
        src={step.image}
        alt={step.name}
        fill
        className="object-cover object-center group-hover:scale-106 transition-transform duration-700 ease-out"
        sizes="550px"
        quality={90}
      />

      {/* Subtle Bottom & Top Vignette Gradients for Text Readability */}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          background: `linear-gradient(180deg, rgba(10,15,13,0.3) 0%, rgba(10,15,13,0.1) 40%, rgba(10,15,13,0.75) 100%)`,
        }}
      />

      {/* Hover glow tint */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center, rgba(${step.colorRgb},0.15) 0%, transparent 80%)`,
        }}
      />

      {/* Subtle border glow */}
      <div
        className="absolute inset-0 border rounded-2xl pointer-events-none transition-colors duration-300"
        style={{ borderColor: `rgba(${step.colorRgb},0.4)` }}
      />

      {/* Floating Badge Tag */}
      <div className="absolute bottom-3.5 left-3.5 z-10">
        <span
          className="text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-lg border backdrop-blur-md flex items-center gap-1.5 shadow-lg"
          style={{
            background: `rgba(10,15,13,0.85)`,
            borderColor: `rgba(${step.colorRgb},0.45)`,
            color: step.color,
          }}
        >
          <Sparkles size={11} />
          {step.tag}
        </span>
      </div>
    </div>
  );
}

// ─── CENTER DOT ───────────────────────────────────────────────────────────────
function CenterDot({ step, index }: { step: typeof STEPS[number]; index: number }) {
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = dotRef.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { opacity: 0, scale: 0 },
        {
          opacity: 1, scale: 1, duration: 0.6, ease: "back.out(2)",
          scrollTrigger: { trigger: el, start: "top 85%", toggleActions: "play none none none" },
        }
      );
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={dotRef} className="opacity-0 flex flex-col items-center">
      {/* Dot */}
      <div
        className="relative w-10 h-10 rounded-full flex items-center justify-center border-2 shrink-0 z-10"
        style={{
          background: `rgba(${step.colorRgb},0.18)`,
          borderColor: step.color,
          boxShadow: `0 0 16px rgba(${step.colorRgb},0.35)`,
        }}
      >
        {/* Pulse ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-2"
          style={{ borderColor: step.color }}
          animate={{ scale: [1, 1.6], opacity: [0.5, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: index * 0.3 }}
          aria-hidden="true"
        />
        <span className="text-[11px] font-black" style={{ color: step.color }}>
          {step.num}
        </span>
      </div>
    </div>
  );
}

// ─── VERTICAL LINE ────────────────────────────────────────────────────────────
function VerticalLine() {
  const lineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = lineRef.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { scaleY: 0, transformOrigin: "top center" },
        {
          scaleY: 1, duration: 2.5, ease: "none",
          scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 20%", scrub: 1 },
        }
      );
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={lineRef}
      className="absolute left-1/2 -translate-x-1/2 top-6 bottom-6 w-px pointer-events-none z-0"
      style={{
        background: "linear-gradient(to bottom, transparent 0%, rgba(9,184,80,0.6) 5%, rgba(9,184,80,0.3) 50%, rgba(9,184,80,0.6) 95%, transparent 100%)",
        transformOrigin: "top center",
      }}
      aria-hidden="true"
    />
  );
}

// ─── SECTION HEADER ───────────────────────────────────────────────────────────
function SectionHeader() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const kids = el.querySelectorAll(".h-anim");
    const ctx = gsap.context(() => {
      gsap.fromTo(
        kids,
        { opacity: 0, y: 28 },
        {
          opacity: 1, y: 0, duration: 0.75, ease: "power3.out", stagger: 0.13,
          scrollTrigger: { trigger: el, start: "top 85%", toggleActions: "play none none none" },
        }
      );
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={ref} className="text-center mb-16">
      <span className="h-anim opacity-0 block text-accent text-eyebrow mb-3">HOW WE WORK</span>
      <h2 className="h-anim opacity-0 text-section-title text-text-secondary mb-4 leading-tight">
        From Idea to <span className="text-accent">Impact.</span>
      </h2>
      <p className="h-anim opacity-0 text-body-lg text-text-muted max-w-xl mx-auto leading-relaxed">
        A simple, transparent journey to turn your vision into reality.
      </p>
    </div>
  );
}

// ─── QUOTE BLOCK ──────────────────────────────────────────────────────────────
function QuoteBlock() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 40 },
        {
          opacity: 1, y: 0, duration: 0.9, ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 88%", toggleActions: "play none none none" },
        }
      );
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={ref} className="opacity-0 mt-16 max-w-3xl mx-auto">
      <div className="relative rounded-2xl border border-accent/20 bg-surface-raised p-7 sm:p-9 text-center overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-24 pointer-events-none" style={{ background: "radial-gradient(ellipse, rgba(9,184,80,0.15) 0%, transparent 70%)" }} aria-hidden="true" />
        <motion.div
          animate={{ opacity: [0.06, 0.16, 0.06] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at center, rgba(9,184,80,0.1) 0%, transparent 70%)" }}
          aria-hidden="true"
        />
        <Quote size={24} className="text-accent/40 mx-auto mb-3" aria-hidden="true" />
        <p className="relative z-10 text-lg sm:text-xl font-semibold text-text-secondary leading-relaxed italic">
          You get a live staging link from Week 2 onward — you watch your product get built, you don&apos;t wait for a reveal.
        </p>
      </div>
    </div>
  );
}

// ─── MOBILE TIMELINE ──────────────────────────────────────────────────────────
function MobileTimeline({ steps }: { steps: readonly any[] }) {
  return (
    <div className="lg:hidden relative pl-8 border-l border-accent/20 space-y-8">
      {steps.map((step) => {
        const Icon = step.icon;
        return (
          <div key={step.num} className="relative">
            {/* Dot */}
            <div
              className="absolute -left-[41px] top-2 w-7 h-7 rounded-full border-2 flex items-center justify-center text-[9px] font-black z-10"
              style={{
                background: `rgba(${step.colorRgb},0.15)`,
                borderColor: step.color,
                color: step.color,
                boxShadow: `0 0 10px rgba(${step.colorRgb},0.3)`,
              }}
            >
              {step.num}
            </div>

            {/* Card with top image banner */}
            <div
              className="rounded-2xl border overflow-hidden"
              style={{
                borderColor: `rgba(${step.colorRgb},0.3)`,
                background: "rgba(12,18,15,0.96)",
              }}
            >
              {/* Image preview banner */}
              <div className="relative h-36 w-full">
                <Image
                  src={step.image}
                  alt={step.name}
                  fill
                  className="object-cover"
                  sizes="(max-width:768px) 100vw, 400px"
                  quality={85}
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(180deg, transparent 20%, rgba(12,18,15,0.95) 100%)`,
                  }}
                />
                <div className="absolute top-3 left-3">
                  <span
                    className="text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-md border backdrop-blur-md text-white"
                    style={{
                      background: `rgba(10,15,13,0.8)`,
                      borderColor: `rgba(${step.colorRgb},0.5)`,
                      color: step.color,
                    }}
                  >
                    Phase {step.num}
                  </span>
                </div>
              </div>

              {/* Text content */}
              <div className="p-5 pt-2">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center border shrink-0" style={{ background: `rgba(${step.colorRgb},0.12)`, borderColor: `rgba(${step.colorRgb},0.3)`, color: step.color }}>
                    <Icon size={14} />
                  </div>
                  <h3 className="font-bold text-text-secondary text-lg">{step.name}</h3>
                </div>
                <p className="text-xs text-white/70 leading-relaxed mb-3">{step.desc}</p>
                <div className="grid grid-cols-1 gap-1 pt-2 border-t border-white/10">
                  {step.highlights.map((h: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2">
                      <CheckCircle2 size={11} style={{ color: step.color }} />
                      <span className="text-[11px] font-medium text-white/80">{h}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function ProcessTimeline({ initialSteps }: { initialSteps?: any[] }) {
  const steps = (initialSteps && initialSteps.length > 0)
    ? initialSteps.map((step) => ({
        ...step,
        icon: step.iconName ? getIconComponent(step.iconName) : (Icons as any)[step.iconName || step.name] || Icons.HelpCircle
      }))
    : STEPS;

  return (
    <section id="process" className="bg-surface-base text-text-secondary py-24 sm:py-32 relative overflow-hidden">
      {/* Section bg glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] pointer-events-none" style={{ background: "radial-gradient(ellipse, rgba(9,184,80,0.03) 0%, transparent 65%)" }} aria-hidden="true" />

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <SectionHeader />

        {/* ── DESKTOP ALTERNATING TIMELINE ── */}
        <div className="hidden lg:block relative">
          <VerticalLine />

          {/* Unified CSS grid — Card on one side, Large Clear Visual on opposite side */}
          <div
            className="grid items-center"
            style={{
              gridTemplateColumns: "1fr 64px 1fr",
              rowGap: "28px",
              columnGap: "24px",
            }}
          >
            {steps.map((step, i) => {
              const isLeft = step.side === "left";
              return (
                <div key={`step-row-${step.num}`} className="contents">
                  {/* LEFT column: Card if left, Visual if right */}
                  {isLeft ? (
                    <StepCard step={step} />
                  ) : (
                    <StepVisual step={step} />
                  )}

                  {/* CENTER column: Dot */}
                  <div className="flex justify-center z-10">
                    <CenterDot step={step} index={i} />
                  </div>

                  {/* RIGHT column: Visual if left, Card if right */}
                  {isLeft ? (
                    <StepVisual step={step} />
                  ) : (
                    <StepCard step={step} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── MOBILE TIMELINE ── */}
        <MobileTimeline steps={steps} />

        {/* Quote */}
        <QuoteBlock />
      </div>
    </section>
  );
}
