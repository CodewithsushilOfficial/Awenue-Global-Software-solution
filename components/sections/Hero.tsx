"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";

import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { useModal } from "@/components/providers/ModalProvider";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

// ─── HERO SLIDE DATA ──────────────────────────────────────────────────────────
const heroSlides = [
  {
    src: "/hero-dev-team.jpg",
    alt: "AWENUE software developer team collaborating in emerald green tech office",
    kenBurns: "ken-zoom-in",
    label: "Software Development",
  },
  {
    src: "/hero-ai-workflow.jpg",
    alt: "AI and automation workflows with green nodes and machine learning metrics",
    kenBurns: "ken-pan-right",
    label: "AI Automation",
  },
  {
    src: "/hero-web-dev-green.jpg",
    alt: "AWENUE developers working on custom web and app solutions",
    kenBurns: "ken-pan-left",
    label: "Custom Solutions",
  },
  {
    src: "/hero-consultation.jpg",
    alt: "AWENUE professional consultation and digital strategy session",
    kenBurns: "ken-zoom-out",
    label: "Expert Consultation",
  },
  {
    src: "/images/hero/scene-01-business.jpg",
    alt: "Visionary entrepreneur in a modern tech office with analytics dashboard",
    kenBurns: "ken-zoom-in-top",
    label: "Digital Vision",
  },
  {
    src: "/images/hero/scene-02-webdev.jpg",
    alt: "Premium website design interface on a MacBook in a dark studio",
    kenBurns: "ken-zoom-in",
    label: "Web Development",
  },
] as const;

// Rotating service phrases (in sync with slides)
const services = heroSlides.map((s) => s.label);

// Trust indicators
const trustItems = [
  "Built Around Your Business",
  "End-to-End Solutions",
  "Long-Term Support",
];

const SLIDE_DURATION = 6000;    // ms each slide is visible (6s)
const TRANSITION_DURATION = 1500; // ms crossfade (1.5s smooth)

export default function Hero() {
  const { openModal } = useModal();
  const prefersReducedMotion = useReducedMotion();

  const [current, setCurrent] = useState(0);
  const [serviceIdx, setServiceIdx] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [cmsContent, setCmsContent] = useState({
    heroEyebrow: "YOUR DIGITAL GROWTH PARTNER",
    heroHeading: "We Build Digital Solutions That",
    heroHighlight: "Turn Ideas Into Growth.",
    heroDescription:
      "From websites and mobile apps to SaaS products and AI automation — we build technology that helps your business move forward.",
    heroPrimaryCta: "Start Your Project",
    heroSecondaryCta: "Get Free Consultation",
  });

  useEffect(() => {
    async function loadCms() {
      try {
        const snap = await getDoc(doc(db, "websiteContent", "homepage"));
        if (snap.exists()) {
          const data = snap.data();
          setCmsContent((prev) => ({
            heroEyebrow: data.heroEyebrow || prev.heroEyebrow,
            heroHeading: data.heroHeading || prev.heroHeading,
            heroHighlight: data.heroHighlight || prev.heroHighlight,
            heroDescription: data.heroDescription || prev.heroDescription,
            heroPrimaryCta: data.heroPrimaryCta || prev.heroPrimaryCta,
            heroSecondaryCta: data.heroSecondaryCta || prev.heroSecondaryCta,
          }));
        } else {
          const altSnap = await getDoc(doc(db, "siteContent", "homepage"));
          if (altSnap.exists()) {
            const data = altSnap.data();
            setCmsContent((prev) => ({
              heroEyebrow: data.heroEyebrow || prev.heroEyebrow,
              heroHeading: data.heroHeading || prev.heroHeading,
              heroHighlight: data.heroHighlight || prev.heroHighlight,
              heroDescription: data.heroDescription || prev.heroDescription,
              heroPrimaryCta: data.heroPrimaryCta || prev.heroPrimaryCta,
              heroSecondaryCta: data.heroSecondaryCta || prev.heroSecondaryCta,
            }));
          }
        }
      } catch (err) {
        console.warn("Hero CMS load notice:", err);
      }
    }
    loadCms();
  }, []);


  // Advance slide
  const advance = useCallback(() => {
    setCurrent((i) => (i + 1) % heroSlides.length);
    setServiceIdx((i) => (i + 1) % services.length);
  }, []);

  // Auto-advance (disabled for reduced motion)
  useEffect(() => {
    if (prefersReducedMotion) return;
    timerRef.current = setInterval(advance, SLIDE_DURATION);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [advance, prefersReducedMotion]);

  // Entrance animation helper
  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 22 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.65, delay, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  });

  return (
    <section
      aria-label="Hero — AWENUE Digital Growth Partner"
      className="relative w-full flex flex-col justify-center overflow-hidden bg-surface-base"
      style={{ minHeight: "max(100svh, 780px)" }}
    >
      {/* ─── SLIDESHOW BACKGROUND ────────────────────────────────────────── */}
      <div className="absolute inset-0" aria-hidden="true">
        {heroSlides.map((slide, idx) => {
          const isActive = idx === current;
          return (
            <motion.div
              key={idx}
              className="absolute inset-0 overflow-hidden"
              initial={false}
              animate={{
                opacity: isActive ? 1 : 0,
              }}
              transition={{
                duration: 1.5,
                ease: "easeInOut",
              }}
              style={{
                zIndex: isActive ? 10 : 1,
                pointerEvents: isActive ? "auto" : "none",
              }}
            >
              <div
                className="absolute inset-0 w-full h-full"
                style={
                  prefersReducedMotion
                    ? {}
                    : {
                        animation: isActive
                          ? `${slide.kenBurns} ${(SLIDE_DURATION + TRANSITION_DURATION) / 1000}s ease-in-out forwards`
                          : "none",
                        willChange: "transform",
                      }
                }
              >
                <Image
                  src={slide.src}
                  alt={slide.alt}
                  fill
                  sizes="100vw"
                  priority={true}
                  quality={90}
                  className="object-cover object-right"
                  draggable={false}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ─── OVERLAY SYSTEM ──────────────────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {/* Global dark tint — reduced so images breathe */}
        <div className="absolute inset-0 bg-surface-base/40" />
        {/* Left-to-right gradient — deep dark on left for text, opens up on right */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(100deg, rgba(10,15,13,0.96) 0%, rgba(10,15,13,0.85) 28%, rgba(10,15,13,0.45) 52%, rgba(10,15,13,0.10) 75%, rgba(10,15,13,0.0) 100%)",
          }}
        />
        {/* Top vignette (navbar) */}
        <div
          className="absolute inset-x-0 top-0 h-44"
          style={{ background: "linear-gradient(to bottom, rgba(10,15,13,0.7), transparent)" }}
        />
        {/* Bottom vignette (scroll indicator) */}
        <div
          className="absolute inset-x-0 bottom-0 h-36"
          style={{ background: "linear-gradient(to top, rgba(10,15,13,0.75), transparent)" }}
        />
        {/* Green ambient glow (center-left) */}
        <div
          className="absolute -bottom-20 -left-20 w-[500px] h-[500px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(9,184,80,0.07) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* ─── HERO CONTENT ────────────────────────────────────────────────── */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full pt-28 pb-24 flex flex-col justify-center" style={{ minHeight: "inherit" }}>
        <div className="max-w-[640px]">

          {/* Eyebrow */}
          <motion.div {...fadeUp(0)}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-accent/30 bg-accent/10 backdrop-blur-sm text-accent text-eyebrow rounded-full mb-7 shadow-[0_0_24px_rgba(9,184,80,0.12)]">
              <Sparkles size={13} className="text-accent shrink-0" aria-hidden="true" />
              <span>{cmsContent.heroEyebrow}</span>
            </div>
          </motion.div>

          {/* Main Heading */}
          <motion.h1 {...fadeUp(0.1)} className="text-hero-title text-text-secondary mb-6">
            {cmsContent.heroHeading}{" "}
            <span className="text-accent">{cmsContent.heroHighlight}</span>
          </motion.h1>

          {/* Description */}
          <motion.p
            {...fadeUp(0.2)}
            className="text-body-lg text-text-muted mb-8 max-w-[560px] leading-relaxed"
          >
            {cmsContent.heroDescription}
          </motion.p>

          {/* Rotating "We Build → …" */}
          <motion.div
            {...fadeUp(0.25)}
            className="flex items-center gap-3 mb-8"
            aria-live="polite"
            aria-atomic="true"
          >
            <span className="text-text-muted text-body-sm font-medium shrink-0">We Build</span>
            <div className="relative h-7 overflow-hidden" style={{ minWidth: "160px" }}>
              <AnimatePresence mode="wait">
                <motion.span
                  key={serviceIdx}
                  initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -16 }}
                  transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-0 flex items-center text-accent font-bold text-body-sm whitespace-nowrap"
                >
                  {services[serviceIdx]}
                </motion.span>
              </AnimatePresence>
            </div>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            {...fadeUp(0.3)}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-8"
          >
            <button
              onClick={() => openModal()}
              className="group relative bg-accent text-surface-base text-btn px-8 py-4 rounded-xl
                hover:bg-accent-hover active:scale-[0.98] transition-all duration-200
                outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-tint
                cursor-pointer shadow-glow hover:shadow-[0_0_48px_rgba(9,184,80,0.45)]
                flex items-center justify-center gap-2"
              aria-label="Start your project with AWENUE"
            >
              <span>{cmsContent.heroPrimaryCta}</span>
              <ArrowRight size={17} className="group-hover:translate-x-1 transition-transform duration-300" aria-hidden="true" />
            </button>

            <button
              onClick={() => openModal("consultation")}
              className="group border border-white/15 bg-white/5 backdrop-blur-sm
                hover:border-accent/40 hover:bg-accent/5 text-text-secondary text-btn
                px-8 py-4 rounded-xl transition-all duration-200
                outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-tint
                flex items-center justify-center cursor-pointer"
              aria-label="Get a free consultation"
            >
              Get Free Consultation
            </button>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            {...fadeUp(0.4)}
            className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-5 border-t border-white/10"
          >
            {trustItems.map((item) => (
              <div key={item} className="flex items-center gap-1.5 text-body-sm text-text-muted">
                <CheckCircle2 size={15} className="text-accent shrink-0" aria-hidden="true" />
                <span>{item}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ─── SLIDE DOTS (bottom center) ───────────────────────────────────── */}
      <div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2"
        aria-hidden="true"
      >
        {heroSlides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => {
              setCurrent(idx);
              setServiceIdx(idx);
              if (timerRef.current) clearInterval(timerRef.current);
              if (!prefersReducedMotion) {
                timerRef.current = setInterval(advance, SLIDE_DURATION);
              }
            }}
            className={`rounded-full transition-all duration-400 cursor-pointer focus-visible:outline-2 focus-visible:outline-accent ${
              idx === current
                ? "w-6 h-2 bg-accent shadow-[0_0_8px_rgba(9,184,80,0.6)]"
                : "w-2 h-2 bg-white/25 hover:bg-white/50"
            }`}
            aria-label={`Go to slide ${idx + 1}: ${heroSlides[idx].label}`}
          />
        ))}
      </div>

      {/* ─── SCROLL INDICATOR ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.6 }}
        className="absolute bottom-10 right-8 z-10 hidden lg:flex flex-col items-center gap-1 text-white/30 pointer-events-none"
        aria-hidden="true"
      >
        <span className="text-[9px] font-semibold uppercase tracking-[0.15em] [writing-mode:vertical-rl] rotate-180">
          Scroll to Explore
        </span>
        <div className="w-px h-12 bg-linear-to-b from-white/0 via-white/30 to-white/0 mt-1" />
      </motion.div>
    </section>
  );
}
