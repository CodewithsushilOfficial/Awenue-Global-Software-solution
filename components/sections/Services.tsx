"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "motion/react";
import { useModal } from "@/components/providers/ModalProvider";
import {
  Globe, LayoutDashboard, Smartphone, Bot, BarChart3, Palette,
  ArrowRight, CheckCircle2, Sparkles,
} from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

// ─── DATA ─────────────────────────────────────────────────────────────────────
const SERVICES = [
  {
    id: "web",
    num: "01",
    icon: Globe,
    image: "/images/services/web-dev.jpg",
    color: "#3B82F6",
    colorRgb: "59,130,246",
    colorClass: "text-blue-400",
    badgeBg: "bg-blue-500/15 border-blue-400/30",
    title: "Web Development",
    subtitle: "Build a Powerful Digital Presence.",
    desc: "Fast, responsive, conversion-focused websites that help your business look professional and grow online.",
    features: [
      "Business & Corporate Websites",
      "E-Commerce Websites",
      "High-Converting Landing Pages",
      "Custom Web Applications",
      "Website Redesign & Modernization",
      "Maintenance & Performance Optimization",
    ],
    cta: "Explore Web Development",
    modalKey: "Website",
  },
  {
    id: "saas",
    num: "02",
    icon: LayoutDashboard,
    image: "/images/services/saas.jpg",
    color: "#8B5CF6",
    colorRgb: "139,92,246",
    colorClass: "text-violet-400",
    badgeBg: "bg-violet-500/15 border-violet-400/30",
    title: "SaaS Development",
    subtitle: "Turn Your Idea Into a Scalable Software Product.",
    desc: "From MVP to a production-ready SaaS platform — designed for real users and built for future growth.",
    features: [
      "Product Strategy & Planning",
      "UI/UX Product Design",
      "MVP Development",
      "Custom SaaS Platforms",
      "Subscription & Payment Integration",
      "Scalable Cloud Architecture",
    ],
    cta: "Build Your SaaS",
    modalKey: "Custom Software",
  },
  {
    id: "mobile",
    num: "03",
    icon: Smartphone,
    image: "/images/services/mobile.jpg",
    color: "#06B6D4",
    colorRgb: "6,182,212",
    colorClass: "text-cyan-400",
    badgeBg: "bg-cyan-500/15 border-cyan-400/30",
    title: "Mobile App Development",
    subtitle: "Take Your Business Wherever Your Customers Go.",
    desc: "Intuitive, high-performance mobile applications that connect businesses with customers seamlessly.",
    features: [
      "Android Applications",
      "iOS Applications",
      "Cross-Platform Apps",
      "Business & Enterprise Apps",
      "E-Commerce Applications",
      "App Maintenance & Updates",
    ],
    cta: "Build Your App",
    modalKey: "Mobile App",
  },
  {
    id: "ai",
    num: "04",
    icon: Bot,
    image: "/images/services/ai.jpg",
    color: "#09B850",
    colorRgb: "9,184,80",
    colorClass: "text-accent",
    badgeBg: "bg-accent/15 border-accent/30",
    title: "AI & Automation",
    subtitle: "Work Smarter. Automate the Repetitive.",
    desc: "AI-powered automation that eliminates manual workflows — giving your team time to focus on what matters.",
    features: [
      "Business Workflow Automation",
      "AI Chatbots & Assistants",
      "Lead Capture & Follow-Ups",
      "CRM Automation",
      "AI Integration With Existing Systems",
      "Custom AI-Powered Workflows",
    ],
    cta: "Automate Your Business",
    modalKey: "Custom Software",
  },
  {
    id: "marketing",
    num: "05",
    icon: BarChart3,
    image: "/images/services/marketing.jpg",
    color: "#F97316",
    colorRgb: "249,115,22",
    colorClass: "text-orange-400",
    badgeBg: "bg-orange-500/15 border-orange-400/30",
    title: "Digital Marketing",
    subtitle: "Turn Your Digital Presence Into Business Growth.",
    desc: "Reach the right audience, strengthen your online presence, and drive meaningful business growth.",
    features: [
      "Search Engine Optimization — SEO",
      "Local SEO & Google Business Profile",
      "Social Media Marketing",
      "Content Marketing",
      "Performance Marketing",
      "Paid Advertising Campaigns",
    ],
    cta: "Grow Your Business",
    modalKey: "Not Sure Yet",
  },
  {
    id: "branding",
    num: "06",
    icon: Palette,
    image: "/images/services/branding.jpg",
    color: "#EC4899",
    colorRgb: "236,72,153",
    colorClass: "text-pink-400",
    badgeBg: "bg-pink-500/15 border-pink-400/30",
    title: "Graphic Design & Branding",
    subtitle: "Build a Brand People Remember.",
    desc: "Professional visual identities that make your business stand out — from logo to complete brand system.",
    features: [
      "Logo Design",
      "Complete Brand Identity",
      "Brand Guidelines",
      "Social Media Creatives",
      "Marketing & Advertising Graphics",
      "UI/UX Design",
    ],
    cta: "Build Your Brand",
    modalKey: "Not Sure Yet",
  },
] as const;

// ─── FLIP CARD ────────────────────────────────────────────────────────────────
interface FlipCardProps {
  service: ServiceItem;
  index: number;
  onCTA: () => void;
}

function FlipCard({ service, index, onCTA }: FlipCardProps) {
  const Icon = service.icon;
  const wrapRef = useRef<HTMLDivElement>(null);

  // Entrance animation
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 50, scale: 0.93 },
        {
          opacity: 1, y: 0, scale: 1,
          duration: 1.0,
          ease: "power3.out",
          delay: index * 0.20,
          scrollTrigger: {
            trigger: el,
            start: "top 88%",
            toggleActions: "play none none none",
          },
        }
      );
    }, el);
    return () => ctx.revert();
  }, [index]);

  return (
    <div
      ref={wrapRef}
      className="opacity-0 group relative h-[460px] cursor-pointer"
      style={{ perspective: "1400px" }}
      role="article"
      aria-label={service.title}
    >
      {/* Inner flip container */}
      <div
        className="relative w-full h-full transition-transform duration-[950ms] ease-[cubic-bezier(0.45,0,0.15,1)]"
        style={{
          transformStyle: "preserve-3d",
          transform: "rotateY(0deg)",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.transform = "rotateY(180deg)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.transform = "rotateY(0deg)";
        }}
      >
        {/* ── FRONT FACE ───────────────────────────────────────────────── */}
        <div
          className="absolute inset-0 rounded-2xl overflow-hidden border border-white/10"
          style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
        >
          {/* Background image */}
          <Image
            src={service.image}
            alt={service.title}
            fill
            className="object-cover object-center scale-105 group-hover:scale-110 transition-transform duration-700"
            sizes="(max-width:768px) 100vw, 50vw"
            quality={80}
          />

          {/* Gradient overlay — bottom-heavy so content is readable */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(180deg, rgba(10,15,13,0.25) 0%, rgba(10,15,13,0.55) 45%, rgba(10,15,13,0.95) 100%)`,
            }}
          />
          {/* Colored glow at bottom matching service */}
          <div
            className="absolute inset-x-0 bottom-0 h-48 pointer-events-none"
            style={{
              background: `linear-gradient(to top, rgba(${service.colorRgb},0.18) 0%, transparent 100%)`,
            }}
          />

          {/* Number badge */}
          <div className="absolute top-5 left-5">
            <span className="text-[10px] font-black tracking-[0.2em] text-white/40">{service.num}</span>
          </div>

          {/* "Hover to explore" hint */}
          <div className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <span className="text-[9px] font-bold tracking-widest uppercase text-white/50 bg-white/10 backdrop-blur-sm border border-white/10 px-2.5 py-1 rounded-full">
              Explore
            </span>
          </div>

          {/* Content — bottom */}
          <div className="absolute inset-x-0 bottom-0 p-6">
            {/* Icon + Title */}
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`shrink-0 w-10 h-10 rounded-xl border flex items-center justify-center ${service.badgeBg} ${service.colorClass}`}
              >
                <Icon size={18} />
              </div>
              <h3 className="text-xl font-bold text-white leading-tight">{service.title}</h3>
            </div>
            {/* Desc */}
            <p className="text-sm text-white/65 leading-relaxed line-clamp-2">{service.desc}</p>

            {/* Color line */}
            <div
              className="mt-4 h-0.5 w-12 rounded-full opacity-60"
              style={{ backgroundColor: service.color }}
            />
          </div>
        </div>

        {/* ── BACK FACE ────────────────────────────────────────────────── */}
        <div
          className="absolute inset-0 rounded-2xl overflow-hidden border"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            borderColor: `rgba(${service.colorRgb},0.35)`,
            background: "rgba(10,15,13,0.97)",
            boxShadow: `0 0 60px rgba(${service.colorRgb},0.12), inset 0 0 80px rgba(${service.colorRgb},0.05)`,
          }}
        >
          {/* Faint bg image */}
          <Image
            src={service.image}
            alt=""
            fill
            aria-hidden="true"
            className="object-cover object-center opacity-[0.07] scale-110"
            sizes="50vw"
            quality={40}
          />

          {/* Glow top */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 rounded-full pointer-events-none"
            style={{ background: `radial-gradient(ellipse, rgba(${service.colorRgb},0.25) 0%, transparent 70%)` }}
            aria-hidden="true"
          />

          <div className="relative z-10 flex flex-col h-full p-6">
            {/* Header */}
            <div className="mb-5">
              <div className="flex items-center gap-2.5 mb-2">
                <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${service.badgeBg} ${service.colorClass}`}>
                  <Icon size={15} />
                </div>
                <h3 className="text-base font-bold text-white">{service.title}</h3>
              </div>
              <p className="text-[12px] font-bold" style={{ color: service.color }}>{service.subtitle}</p>
            </div>

            {/* Features */}
            <ul className="flex-1 grid grid-cols-1 gap-y-2.5 overflow-hidden">
              {service.features.map((feat, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 size={13} className="shrink-0 mt-0.5" style={{ color: service.color }} aria-hidden="true" />
                  <span className="text-[12px] text-white/70 font-medium leading-snug">{feat}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <button
              onClick={(e) => { e.stopPropagation(); onCTA(); }}
              className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-surface-base transition-all duration-200 active:scale-[0.98] outline-none focus-visible:outline-2 cursor-pointer"
              style={{
                backgroundColor: service.color,
                boxShadow: `0 0 24px rgba(${service.colorRgb},0.4)`,
              }}
            >
              <span>{service.cta}</span>
              <ArrowRight size={15} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MARQUEE ──────────────────────────────────────────────────────────────────
function MarqueeStrip() {
  const trackRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const ctx = gsap.context(() => {
      gsap.to(track, { xPercent: -50, duration: 30, ease: "none", repeat: -1 });
    }, track);
    return () => ctx.revert();
  }, []);
  const titles = SERVICES.map((s) => s.title);
  const items = [...titles, ...titles];
  return (
    <div className="relative overflow-hidden py-4 border-y border-border-dark/50 mb-16 select-none" aria-hidden="true">
      <div ref={trackRef} className="flex gap-14 w-max whitespace-nowrap">
        {items.map((item, i) => (
          <span key={i} className="flex items-center gap-4 text-text-muted/40 text-[10px] font-black uppercase tracking-[0.2em]">
            <span className="w-1.5 h-1.5 rounded-full bg-accent/50 shrink-0" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── BOTTOM CTA ───────────────────────────────────────────────────────────────
function BottomCTA({ onOpen }: { onOpen: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(el,
        { opacity: 0, y: 50, scale: 0.96 },
        {
          opacity: 1, y: 0, scale: 1, duration: 0.9, ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 88%", toggleActions: "play none none none" },
        }
      );
    }, el);
    return () => ctx.revert();
  }, []);

  const pills = [
    { label: "Clear Communication", icon: CheckCircle2 },
    { label: "Dedicated Support", icon: CheckCircle2 },
    { label: "Transparent Process", icon: CheckCircle2 },
    { label: "Solutions Built for Growth", icon: CheckCircle2 },
  ];

  return (
    <motion.div
      ref={ref}
      className="opacity-0 mt-24 relative rounded-3xl border border-accent/30 overflow-hidden px-6 py-16 sm:px-16 sm:py-20 text-center shadow-2xl"
      style={{
        boxShadow: "0 0 80px rgba(9,184,80,0.12), inset 0 0 100px rgba(0,0,0,0.8)",
      }}
      whileHover={{ scale: 1.008 }}
      transition={{ type: "spring", stiffness: 180, damping: 22 }}
    >
      {/* Background Image */}
      <Image
        src="/images/digital_growth.webp"
        alt="Digital Growth"
        fill
        className="object-cover object-center opacity-30 scale-105"
        sizes="(max-width:1280px) 100vw, 1200px"
        quality={85}
        priority={false}
      />

      {/* Dark Vignette Overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, rgba(10,15,13,0.78) 0%, rgba(10,15,13,0.95) 75%, rgba(10,15,13,0.99) 100%)",
        }}
        aria-hidden="true"
      />

      {/* Top and Bottom Accent Lines */}
      <div
        className="absolute top-0 inset-x-0 h-px pointer-events-none"
        style={{ background: "linear-gradient(90deg, transparent, rgba(9,184,80,0.7), transparent)" }}
        aria-hidden="true"
      />
      <div
        className="absolute bottom-0 inset-x-0 h-px pointer-events-none"
        style={{ background: "linear-gradient(90deg, transparent, rgba(9,184,80,0.3), transparent)" }}
        aria-hidden="true"
      />

      {/* Pulsing Central Glow */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[320px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(9,184,80,0.2) 0%, transparent 70%)" }}
        animate={{ opacity: [0.15, 0.35, 0.15], scale: [1, 1.08, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden="true"
      />

      {/* Subtle Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(9,184,80,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(9,184,80,0.8) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative z-10 max-w-3xl mx-auto">
        {/* Eyebrow Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-accent/40 bg-accent/15 backdrop-blur-md text-accent text-eyebrow rounded-full mb-8 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <Sparkles size={13} aria-hidden="true" />
          <span className="font-extrabold tracking-widest text-[11px]">ONE PARTNER. COMPLETE DIGITAL SOLUTIONS.</span>
        </div>

        {/* Title */}
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-text-secondary mb-6 leading-[1.15] tracking-tight">
          Not Sure Which Service Your<br className="hidden sm:block" />{" "}
          <span className="text-transparent bg-clip-text bg-linear-to-r from-accent via-emerald-300 to-accent-tint">
            Business Needs?
          </span>
        </h2>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-text-muted max-w-xl mx-auto mb-10 leading-relaxed font-normal">
          Tell us about your business, idea, or challenge. We&apos;ll help you identify the right digital solution.
        </p>

        {/* Main CTA Button */}
        <div className="mb-12">
          <motion.button
            onClick={onOpen}
            whileHover={{ scale: 1.05, boxShadow: "0 0 50px rgba(9,184,80,0.5)" }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="inline-flex items-center gap-3 bg-accent text-surface-base font-extrabold text-base px-10 py-4.5 rounded-xl shadow-glow outline-none focus-visible:outline-2 focus-visible:outline-accent-tint cursor-pointer"
          >
            <span>Get Free Consultation</span>
            <ArrowRight size={18} aria-hidden="true" />
          </motion.button>
        </div>

        {/* Feature Pills */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {pills.map((p, i) => {
            const IconComponent = p.icon;
            return (
              <motion.div
                key={i}
                whileHover={{ scale: 1.04, borderColor: "rgba(9,184,80,0.45)" }}
                className="inline-flex items-center gap-2 text-xs font-semibold text-white/80 bg-surface-base/80 border border-white/15 backdrop-blur-md px-4 py-2 rounded-full transition-colors duration-200"
              >
                <IconComponent size={13} className="text-accent shrink-0" />
                <span>{p.label}</span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
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
      gsap.fromTo(kids,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.7, ease: "power3.out", stagger: 0.13,
          scrollTrigger: { trigger: el, start: "top 85%", toggleActions: "play none none none" } }
      );
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={ref} className="text-center mb-6">
      <span className="h-anim opacity-0 block text-accent text-eyebrow mb-4">OUR SERVICES</span>
      <h2 className="h-anim opacity-0 text-section-title text-text-secondary mb-5 leading-tight">
        Everything You Need to{" "}
        <span className="text-accent">Build, Automate & Grow</span> Digitally.
      </h2>
      <p className="h-anim opacity-0 text-body-lg text-text-muted max-w-2xl mx-auto leading-relaxed">
        From your first website to scalable software and AI-powered automation —{" "}
        <strong className="text-text-secondary font-semibold">one technology partner for your complete digital journey.</strong>
      </p>
    </div>
  );
}

import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface ServiceItem {
  id: string;
  num: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  image: string;
  color: string;
  colorRgb: string;
  colorClass: string;
  badgeBg: string;
  title: string;
  subtitle: string;
  desc: string;
  features: readonly string[] | string[];
  cta?: string;
  modalKey?: string;
  displayOrder?: number;
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function Services({ initialServices }: { initialServices?: any[] }) {
  const { openModal } = useModal();
  
  const [servicesList, setServicesList] = useState<ServiceItem[]>(() => {
    if (initialServices && initialServices.length > 0) {
      return initialServices.map((data: any) => {
        const defaultMatch = SERVICES.find((s) => s.id === data.id || s.title.toLowerCase() === data.title?.toLowerCase());
        return {
          id: data.id,
          num: String(data.displayOrder || 1).padStart(2, "0"),
          icon: defaultMatch ? defaultMatch.icon : Globe,
          image: defaultMatch ? defaultMatch.image : "/images/services/web-dev.jpg",
          color: defaultMatch ? defaultMatch.color : "#3B82F6",
          colorRgb: defaultMatch ? defaultMatch.colorRgb : "59,130,246",
          colorClass: defaultMatch ? defaultMatch.colorClass : "text-blue-400",
          badgeBg: defaultMatch ? defaultMatch.badgeBg : "bg-blue-500/15 border-blue-400/30",
          title: data.title,
          subtitle: data.shortDescription || (defaultMatch ? defaultMatch.subtitle : "Build a Powerful Digital Presence."),
          desc: data.detailedDescription || data.shortDescription,
          features: data.features || (defaultMatch ? defaultMatch.features : []),
          cta: data.ctaLabel || "Explore Service",
          modalKey: "Website",
          displayOrder: data.displayOrder ?? 99,
        };
      }).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    }
    return [...SERVICES];
  });

  useEffect(() => {
    if (initialServices && initialServices.length > 0) return;
    async function loadServices() {
      try {
        const snap = await getDocs(collection(db, "services"));
        if (!snap.empty) {
          const loaded: ServiceItem[] = [];
          snap.forEach((docSnap) => {
            const data = docSnap.data();
            if (data.published !== false) {
              const defaultMatch = SERVICES.find((s) => s.id === docSnap.id || s.title.toLowerCase() === data.title?.toLowerCase());
              loaded.push({
                id: docSnap.id,
                num: String(data.displayOrder || loaded.length + 1).padStart(2, "0"),
                icon: defaultMatch ? defaultMatch.icon : Globe,
                image: defaultMatch ? defaultMatch.image : "/images/services/web-dev.jpg",
                color: defaultMatch ? defaultMatch.color : "#3B82F6",
                colorRgb: defaultMatch ? defaultMatch.colorRgb : "59,130,246",
                colorClass: defaultMatch ? defaultMatch.colorClass : "text-blue-400",
                badgeBg: defaultMatch ? defaultMatch.badgeBg : "bg-blue-500/15 border-blue-400/30",
                title: data.title,
                subtitle: data.shortDescription || (defaultMatch ? defaultMatch.subtitle : "Build a Powerful Digital Presence."),
                desc: data.detailedDescription || data.shortDescription,
                features: data.features || (defaultMatch ? defaultMatch.features : []),
                cta: data.ctaLabel || "Explore Service",
                modalKey: "Website",
                displayOrder: data.displayOrder ?? 99,
              });
            }
          });
          loaded.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
          if (loaded.length > 0) {
            setServicesList(loaded);
          }
        }
      } catch (err) {
        console.warn("Using default static services (Firestore notice):", err);
      }
    }
    loadServices();
  }, [initialServices]);

  return (
    <section id="services" className="bg-surface-base text-text-secondary py-24 sm:py-32 relative overflow-hidden">
      {/* Background accents */}
      <div className="absolute top-0 right-0 w-[700px] h-[500px] pointer-events-none" style={{ background: "radial-gradient(ellipse at top right, rgba(9,184,80,0.04) 0%, transparent 65%)" }} aria-hidden="true" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[400px] pointer-events-none" style={{ background: "radial-gradient(ellipse at bottom left, rgba(9,184,80,0.03) 0%, transparent 65%)" }} aria-hidden="true" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Header */}
        <SectionHeader />

        {/* Marquee */}
        <MarqueeStrip />

        {/* Hover hint */}
        <p className="text-center text-[11px] font-semibold text-text-muted/40 uppercase tracking-widest mb-10">
          Hover on any card to explore
        </p>

        {/* 3×2 Card Grid — 3 columns, 2 rows */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 xl:gap-6">
          {servicesList.map((service, i) => (
            <FlipCard
              key={service.id}
              service={service}
              index={i}
              onCTA={() => openModal("project", service.modalKey)}
            />
          ))}
        </div>

        {/* Bottom CTA */}
        <BottomCTA onOpen={() => openModal("consultation")} />
      </div>
    </section>
  );
}
