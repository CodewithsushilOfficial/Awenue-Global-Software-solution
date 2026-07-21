"use client";

import { useEffect, useState, useRef, createElement } from "react";
import Image from "next/image";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "motion/react";
import RevealOnScroll from "@/components/motion/RevealOnScroll";
import { useModal } from "@/components/providers/ModalProvider";
import { ArrowRight, CheckCircle2, LayoutDashboard, GraduationCap, HeartPulse, Box } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export interface ProductItem {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  detailedDescription?: string;
  features: string[];
  productStatus: "live" | "coming_soon";
  externalUrl?: string;
  ctaLabel?: string;
  displayOrder: number;
  published: boolean;
  imageUrl?: string;
  image?: string;
  imageAlt?: string;
  accentColor?: string;
  accentRgb?: string;
  category?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoCanonical?: string;
  seoOgImage?: string;
  seoNoindex?: boolean;
  schemaType?: string;
}

const DEFAULT_PRODUCTS: ProductItem[] = [
  {
    id: "crm",
    name: "Awenue CRM",
    slug: "awenue-crm",
    category: "SaaS Product",
    shortDescription: "Manage leads, customers, sales, and business relationships — all in one place.",
    features: ["Lead Management", "Sales Pipeline", "Customer Management", "Deal Tracking", "Analytics & Reports"],
    productStatus: "live",
    externalUrl: "https://crm.awenue.io",
    ctaLabel: "Visit CRM Website",
    displayOrder: 1,
    published: true,
    imageUrl: "/images/products/crm-hq.png",
    image: "/images/products/crm-hq.png",
    imageAlt: "Awenue CRM Dashboard Preview",
    accentColor: "#09B850",
    accentRgb: "9,184,80",
  },
  {
    id: "erp",
    name: "Awenue College ERP",
    slug: "awenue-college-erp",
    category: "Education Platform",
    shortDescription: "A smarter platform to manage students, faculty, academics, fees, and campus operations.",
    features: ["Student Management", "Attendance", "Fee Collection", "Exam Results", "Timetable Scheduling"],
    productStatus: "live",
    externalUrl: "https://erp.awenue.io",
    ctaLabel: "Visit ERP Website",
    displayOrder: 2,
    published: true,
    imageUrl: "/images/products/erp-hq.png",
    image: "/images/products/erp-hq.png",
    imageAlt: "Awenue College ERP Platform Preview",
    accentColor: "#06B6D4",
    accentRgb: "6,182,212",
  },
  {
    id: "hospital",
    name: "Awenue Hospital Management",
    slug: "hospital-management",
    category: "Healthcare Platform",
    shortDescription: "A connected digital solution designed to simplify hospital and healthcare operations.",
    features: ["Patient Records (OPD/IPD)", "Appointment Scheduling", "Doctor Management", "Pharmacy", "Billing & Insurance"],
    productStatus: "coming_soon",
    externalUrl: "",
    ctaLabel: "Coming Soon",
    displayOrder: 3,
    published: true,
    imageUrl: "/images/products/hospital-hq.png",
    image: "/images/products/hospital-hq.png",
    imageAlt: "Awenue Hospital Management System — Coming Soon",
    accentColor: "#9333EA",
    accentRgb: "147,51,234",
  },
];

const getProductIcon = (slug: string) => {
  const s = slug.toLowerCase();
  if (s.includes("crm")) return LayoutDashboard;
  if (s.includes("erp") || s.includes("college") || s.includes("school")) return GraduationCap;
  if (s.includes("hospital") || s.includes("healthcare") || s.includes("clinic")) return HeartPulse;
  return Box;
};

export default function Products({ initialProducts }: { initialProducts?: ProductItem[] }) {
  const { openModal } = useModal();
  const [products, setProducts] = useState<ProductItem[]>(initialProducts || DEFAULT_PRODUCTS);

  useEffect(() => {
    if (initialProducts && initialProducts.length > 0) return;
    async function fetchProducts() {
      try {
        const snap = await getDocs(collection(db, "products"));
        if (!snap.empty) {
          const loaded: ProductItem[] = [];
          snap.forEach((docSnap) => {
            const data = docSnap.data() as ProductItem;
            if (data.published !== false) {
              loaded.push({ ...data, id: docSnap.id });
            }
          });
          loaded.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
          if (loaded.length > 0) {
            setProducts(loaded);
          }
        }
      } catch (err) {
        console.warn("Using default products (Firestore load bypassed):", err);
      }
    }
    fetchProducts();
  }, [initialProducts]);

  return (
    <section
      id="products"
      className="bg-surface-base text-text-secondary py-24 sm:py-32 relative overflow-hidden border-y border-border-dark/60"
    >
      {/* Background glow effects */}
      <div
        className="absolute top-0 right-1/4 w-[700px] h-[500px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse at top, rgba(9,184,80,0.05) 0%, transparent 65%)" }}
        aria-hidden="true"
      />
      <div
        className="absolute bottom-0 left-1/4 w-[600px] h-[400px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse at bottom, rgba(59,130,246,0.04) 0%, transparent 65%)" }}
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Header */}
        <SectionHeader />

        {/* Marquee Strip */}
        <MarqueeStrip products={products} />

        {/* Hover hint */}
        <p className="text-center text-[11px] font-semibold text-text-muted/40 uppercase tracking-widest mb-10">
          Hover on any card to explore
        </p>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 xl:gap-6">
          {products.map((product, idx) => (
            <ProductCard
              key={product.id}
              product={product}
              index={idx}
              onCTA={() => {
                if (product.productStatus === "live" && product.externalUrl) {
                  window.open(product.externalUrl, "_blank", "noopener,noreferrer");
                } else {
                  openModal("consultation", product.name);
                }
              }}
            />
          ))}
        </div>

        {/* Bottom CTA bar */}
        <RevealOnScroll delay={0.2} className="mt-16 text-center">
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full border border-white/10 bg-surface-raised/80 backdrop-blur-md">
            <span className="text-body-sm text-text-muted">Need a custom SaaS platform built for your company?</span>
            <button
              onClick={() => openModal("project", "SaaS Product")}
              className="text-accent font-extrabold hover:text-accent-tint transition-colors inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Let&apos;s build it together</span>
              <ArrowRight size={14} aria-hidden="true" />
            </button>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}

// ─── SECTION HEADER ───────────────────────────────────────────────────────────
function SectionHeader() {
  const { openModal } = useModal();
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
          scrollTrigger: { trigger: el, start: "top 85%", toggleActions: "play none none none" },
        }
      );
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={ref} className="text-center mb-6">
      <span className="h-anim opacity-0 block text-accent text-eyebrow mb-4">OUR PRODUCTS</span>
      <h2 className="h-anim opacity-0 text-section-title text-text-secondary mb-5 leading-tight">
        Software Built for <span className="text-accent">Real Business.</span>
      </h2>
      <p className="h-anim opacity-0 text-body-lg text-text-muted max-w-xl mx-auto mb-8 leading-relaxed">
        Practical digital products we&apos;ve designed and built to simplify operations and help organizations grow smarter.
      </p>
      <div className="h-anim opacity-0 mb-8">
        <motion.button
          onClick={() => openModal("consultation", "I Have a Business Idea")}
          whileHover={{ scale: 1.04, boxShadow: "0 0 30px rgba(9,184,80,0.3)" }}
          whileTap={{ scale: 0.97 }}
          className="inline-flex items-center gap-2 text-btn text-accent border border-accent/40 bg-accent/10 hover:bg-accent/20 px-7 py-3 rounded-xl transition-all cursor-pointer outline-none focus-visible:outline-2 focus-visible:outline-accent-tint shadow-lg"
        >
          <span>Discuss Product Requirements</span>
          <ArrowRight size={16} aria-hidden="true" />
        </motion.button>
      </div>
    </div>
  );
}

// ─── MARQUEE ──────────────────────────────────────────────────────────────────
function MarqueeStrip({ products }: { products: ProductItem[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const ctx = gsap.context(() => {
      gsap.to(track, { xPercent: -50, duration: 25, ease: "none", repeat: -1 });
    }, track);
    return () => ctx.revert();
  }, []);

  const titles = products.map((p) => p.name);
  const items = [...titles, ...titles, ...titles];
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

// ─── PRODUCT CARD COMPONENT ───────────────────────────────────────────────────
function ProductCard({
  product,
  index,
  onCTA,
}: {
  product: ProductItem;
  index: number;
  onCTA: () => void;
}) {
  const productIcon = getProductIcon(product.slug || product.id);
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
          opacity: 1,
          y: 0,
          scale: 1,
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

  const accentColor = product.accentColor || "#09B850";
  const accentRgb = product.accentRgb || "9,184,80";
  const isLive = product.productStatus === "live";
  const src = product.imageUrl || product.image || "/images/services/saas.jpg";
  const alt = product.imageAlt || product.name;

  return (
    <div
      ref={wrapRef}
      className="opacity-0 group relative h-[460px] cursor-pointer"
      style={{ perspective: "1400px" }}
      role="article"
      aria-label={product.name}
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
          {src.startsWith("http://") || src.startsWith("https://") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={alt}
              className="w-full h-full object-cover object-center scale-105 group-hover:scale-110 transition-transform duration-700"
              loading="lazy"
              decoding="async"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "/images/services/saas.jpg";
              }}
            />
          ) : (
            <Image
              src={src}
              alt={alt}
              fill
              className="object-cover object-center scale-105 group-hover:scale-110 transition-transform duration-700"
              sizes="(max-width:768px) 100vw, 50vw"
              quality={80}
            />
          )}

          {/* Gradient overlay — bottom-heavy so content is readable */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(180deg, rgba(10,15,13,0.25) 0%, rgba(10,15,13,0.55) 45%, rgba(10,15,13,0.95) 100%)`,
            }}
          />
          {/* Colored glow at bottom matching product */}
          <div
            className="absolute inset-x-0 bottom-0 h-48 pointer-events-none"
            style={{
              background: `linear-gradient(to top, rgba(${accentRgb},0.18) 0%, transparent 100%)`,
            }}
          />

          {/* Number badge */}
          <div className="absolute top-5 left-5">
            <span className="text-[10px] font-black tracking-[0.2em] text-white/40">
              {String(product.displayOrder || index + 1).padStart(2, "0")}
            </span>
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
                className="shrink-0 w-10 h-10 rounded-xl border flex items-center justify-center transition-colors duration-300"
                style={{
                  backgroundColor: `rgba(${accentRgb}, 0.15)`,
                  borderColor: `rgba(${accentRgb}, 0.35)`,
                  color: accentColor,
                }}
              >
                {createElement(productIcon, { size: 18 })}
              </div>
              <h3 className="text-xl font-bold text-white leading-tight">{product.name}</h3>
            </div>
            {/* Desc */}
            <p className="text-sm text-white/65 leading-relaxed line-clamp-2">{product.shortDescription}</p>

            {/* Color line */}
            <div
              className="mt-4 h-0.5 w-12 rounded-full opacity-60"
              style={{ backgroundColor: accentColor }}
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
            borderColor: `rgba(${accentRgb},0.35)`,
            background: "rgba(10,15,13,0.97)",
            boxShadow: `0 0 60px rgba(${accentRgb},0.12), inset 0 0 80px rgba(${accentRgb},0.05)`,
          }}
        >
          {/* Faint bg image */}
          {src.startsWith("http://") || src.startsWith("https://") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt=""
              aria-hidden="true"
              className="object-cover object-center opacity-[0.07] scale-110 absolute inset-0 w-full h-full"
              loading="lazy"
            />
          ) : (
            <Image
              src={src}
              alt=""
              fill
              aria-hidden="true"
              className="object-cover object-center opacity-[0.07] scale-110"
              sizes="50vw"
              quality={40}
            />
          )}

          {/* Glow top */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 rounded-full pointer-events-none"
            style={{ background: `radial-gradient(ellipse, rgba(${accentRgb},0.25) 0%, transparent 70%)` }}
            aria-hidden="true"
          />

          <div className="relative z-10 flex flex-col h-full p-6">
            {/* Header */}
            <div className="mb-5">
              <div className="flex items-center gap-2.5 mb-2">
                <div
                  className="w-8 h-8 rounded-lg border flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: `rgba(${accentRgb}, 0.15)`,
                    borderColor: `rgba(${accentRgb}, 0.35)`,
                    color: accentColor,
                  }}
                >
                  {createElement(productIcon, { size: 15 })}
                </div>
                <h3 className="text-base font-bold text-white">{product.name}</h3>
              </div>
              <p className="text-[12px] font-bold" style={{ color: accentColor }}>
                {product.category || (isLive ? "Live Platform" : "Coming Soon")}
              </p>
            </div>

            {/* Features */}
            <ul className="flex-1 grid grid-cols-1 gap-y-2.5 overflow-hidden">
              {product.features.map((feat, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 size={13} className="shrink-0 mt-0.5" style={{ color: accentColor }} aria-hidden="true" />
                  <span className="text-[12px] text-white/70 font-medium leading-snug">{feat}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCTA();
              }}
              className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-surface-base transition-all duration-200 active:scale-[0.98] outline-none focus-visible:outline-2 cursor-pointer"
              style={{
                backgroundColor: accentColor,
                boxShadow: `0 0 24px rgba(${accentRgb},0.4)`,
              }}
            >
              <span>{product.ctaLabel || (isLive ? "Visit Website" : "Coming Soon")}</span>
              <ArrowRight size={15} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
