"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "motion/react";
import RevealOnScroll from "@/components/motion/RevealOnScroll";
import { useModal } from "@/components/providers/ModalProvider";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  ExternalLink,
  LayoutDashboard,
  GraduationCap,
  HeartPulse,
  Box,
  RotateCw,
} from "lucide-react";

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
    features: [
      "Lead & Contact Management",
      "Visual Sales Pipeline (Kanban)",
      "Deal Tracking & Forecasting",
      "Email & Follow-up Automation",
      "Activity Timeline",
      "Team Collaboration Tools",
      "Analytics & Revenue Reports",
      "Custom Fields & Tags",
    ],
    productStatus: "live",
    externalUrl: "https://crm.awenue.io",
    ctaLabel: "Visit CRM Website",
    displayOrder: 1,
    published: true,
    imageUrl: "/images/products/awenue-crm-dashboard.png",
    image: "/images/products/awenue-crm-dashboard.png",
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
    features: [
      "Student Enrollment & Profiles",
      "Attendance Management",
      "Fee Collection & Receipts",
      "Exam & Result Management",
      "Faculty & Staff Management",
      "Timetable Scheduling",
      "Library Management",
      "Multi-Campus Support",
    ],
    productStatus: "live",
    externalUrl: "https://erp.awenue.io",
    ctaLabel: "Visit ERP Website",
    displayOrder: 2,
    published: true,
    imageUrl: "/images/products/awenue-college-erp-dashboard.png",
    image: "/images/products/awenue-college-erp-dashboard.png",
    imageAlt: "Awenue College ERP Platform Preview",
    accentColor: "#09B850",
    accentRgb: "9,184,80",
  },
  {
    id: "hospital",
    name: "Awenue Hospital Management",
    slug: "hospital-management",
    category: "Healthcare Platform",
    shortDescription: "A connected digital solution designed to simplify hospital and healthcare operations.",
    features: [
      "Patient Records (OPD/IPD)",
      "Appointment Scheduling",
      "Doctor Management",
      "Pharmacy Inventory Management",
      "Lab & Diagnostics Integration",
      "Billing & Insurance Claims",
      "Discharge Summary Generation",
      "Analytics & Health Reports",
    ],
    productStatus: "coming_soon",
    externalUrl: "",
    ctaLabel: "Coming Soon",
    displayOrder: 3,
    published: true,
    imageUrl: "/images/products/awenue-hospital-management-dashboard.png",
    image: "/images/products/awenue-hospital-management-dashboard.png",
    imageAlt: "Awenue Hospital Management System — Coming Soon",
    accentColor: "#09B850",
    accentRgb: "9,184,80",
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
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <RevealOnScroll delay={0.1}>
            <span className="text-accent text-eyebrow mb-4 block">OUR PRODUCTS</span>
          </RevealOnScroll>
          <RevealOnScroll delay={0.15}>
            <h2 className="text-section-title text-text-secondary mb-5 leading-tight">
              Software Built for <span className="text-accent">Real Business.</span>
            </h2>
          </RevealOnScroll>
          <RevealOnScroll delay={0.2}>
            <p className="text-body-lg text-text-muted mb-8 leading-relaxed">
              Practical digital products we&apos;ve designed and built to simplify operations and help organizations grow smarter.
            </p>
          </RevealOnScroll>
          <RevealOnScroll delay={0.25}>
            <motion.button
              onClick={() => openModal("consultation", "I Have a Business Idea")}
              whileHover={{ scale: 1.04, boxShadow: "0 0 30px rgba(9,184,80,0.3)" }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 text-btn text-accent border border-accent/40 bg-accent/10 hover:bg-accent/20 px-7 py-3 rounded-xl transition-all cursor-pointer outline-none focus-visible:outline-2 focus-visible:outline-accent-tint shadow-lg"
            >
              <span>Discuss Product Requirements</span>
              <ArrowRight size={16} aria-hidden="true" />
            </motion.button>
          </RevealOnScroll>
        </div>

        {/* Hover Hint Subtitle */}
        <p className="text-center text-[11px] font-extrabold text-accent/80 uppercase tracking-widest mb-10 flex items-center justify-center gap-2">
          <RotateCw size={12} className="animate-spin text-accent" />
          <span>Hover over card image/title to flip &amp; view features</span>
        </p>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {products.map((product, idx) => (
            <ProductCardItem
              key={product.id || idx}
              product={product}
              delay={0.1 + idx * 0.1}
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

// ─── MODERN CLEAN PRODUCT CARD ITEM ───────────────────────────────────────────
function ProductCardItem({
  product,
  delay,
  onCTA,
}: {
  product: ProductItem;
  delay: number;
  onCTA: () => void;
}) {
  const { openModal } = useModal();
  const [isFlipped, setIsFlipped] = useState(false);
  const isLive = product.productStatus === "live";
  const getProductImage = (p: ProductItem) => {
    const s = (p.slug || p.id || p.name || "").toLowerCase();
    if (s.includes("crm")) return "/images/products/awenue-crm-dashboard.png";
    if (s.includes("erp") || s.includes("college") || s.includes("school")) return "/images/products/awenue-college-erp-dashboard.png";
    if (s.includes("hospital") || s.includes("healthcare") || s.includes("clinic")) return "/images/products/awenue-hospital-management-dashboard.png";
    return p.imageUrl || p.image || "/images/products/awenue-crm-dashboard.png";
  };

  const imgSrc = getProductImage(product);
  // Enforce Main AWENUE Brand Emerald Green (#09B850) Across All Products
  const accentColor = "#09B850";
  const accentRgb = "9,184,80";

  return (
    <RevealOnScroll delay={delay}>
      {/* ── UNIFIED SINGLE PRODUCT CARD SHELL ── */}
      <div
        className="relative flex flex-col justify-between h-[610px] sm:h-[630px] w-full rounded-3xl border border-white/10 bg-surface-raised group transition-all duration-500 hover:border-accent/40 hover:shadow-2xl shadow-xl overflow-hidden"
        onMouseEnter={() => setIsFlipped(true)}
        onMouseLeave={() => setIsFlipped(false)}
        role="article"
        aria-label={product.name}
      >
        {/* Glow accent */}
        <div
          className="absolute -top-24 -right-24 w-48 h-48 rounded-full pointer-events-none transition-opacity duration-500 opacity-20 group-hover:opacity-40"
          style={{ background: `radial-gradient(circle, rgba(${accentRgb}, 0.3) 0%, transparent 70%)` }}
        />

        {/* ── 3D FLIP TOP SECTION (Image, Title & Short Desc ON FRONT; Features ON BACK) ── */}
        <div
          className="relative w-full flex-1 min-h-0 cursor-pointer select-none"
          style={{ perspective: "1400px" }}
        >
          {/* 3D Flip Outer Box */}
          <div
            className="relative w-full h-full transition-transform duration-[800ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
            style={{
              transformStyle: "preserve-3d",
              transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
            }}
          >
            {/* ── FRONT FACE ────────────────── */}
            <div
              className="absolute inset-0 bg-surface-raised flex flex-col justify-between overflow-hidden"
              style={{
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
              }}
            >
              {/* Product Image - Larger Full Fit Top Card Area */}
              <div className="relative w-full h-[260px] sm:h-[285px] rounded-t-3xl overflow-hidden bg-surface-base border-b border-white/10 shrink-0">
                <Image
                  src={imgSrc}
                  alt={product.imageAlt || product.name}
                  fill
                  priority
                  unoptimized
                  sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  className={`object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105 ${
                    !isLive ? "grayscale opacity-85" : "opacity-100"
                  }`}
                />
              </div>

              {/* Front Content Body */}
              <div className="p-5 sm:p-6 pt-4 flex flex-col justify-between flex-1 min-h-0 relative z-10">
                <div>
                  {/* Category & Status */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border border-accent/30 bg-accent/10 text-accent shadow-sm">
                      {product.category || (isLive ? "Live Platform" : "Healthcare Platform")}
                    </span>
                    {isLive ? (
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Live
                      </span>
                    ) : (
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        Soon
                      </span>
                    )}
                  </div>

                  {/* Product Title */}
                  <h3 className="text-xl sm:text-2xl font-black text-white mb-2 leading-tight group-hover:text-accent transition-colors">
                    {product.name}
                  </h3>

                  {/* Short Description */}
                  <p className="text-xs sm:text-sm text-text-muted/90 font-normal leading-relaxed line-clamp-2 sm:line-clamp-3">
                    {product.shortDescription}
                  </p>
                </div>

                {/* Bottom Prompt Bar */}
                <div className="flex items-center justify-between text-[11px] font-bold text-white/50 pt-2.5 border-t border-white/10 mt-3">
                  <span className="text-accent flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                    Hover to view {product.features.length} features
                  </span>
                </div>
              </div>
            </div>

            {/* ── BACK FACE (Full Detailed Features List) ── */}
            <div
              className="absolute inset-0 bg-[#0A0F0D] p-5 sm:p-6 flex flex-col justify-between overflow-hidden"
              style={{
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              }}
            >
              {/* Watermark Background Image */}
              <Image
                src={imgSrc}
                alt=""
                fill
                aria-hidden="true"
                className="object-cover object-center opacity-[0.04] scale-110 pointer-events-none"
                sizes="50vw"
                quality={40}
              />

              {/* Back Header */}
              <div className="relative z-10 mb-2 border-b border-white/10 pb-3 shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-black text-white leading-tight">{product.name}</h3>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-accent">
                      {product.category || (isLive ? "Live Platform" : "Healthcare Platform")}
                    </span>
                  </div>
                  {isLive ? (
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      LIVE
                    </span>
                  ) : (
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      SOON
                    </span>
                  )}
                </div>
              </div>

              {/* Full Features List */}
              <div className="relative z-10 flex-1 overflow-y-auto pr-1 my-2 custom-scrollbar">
                <p className="text-[10px] font-extrabold text-white/50 uppercase tracking-widest mb-2.5">
                  Complete Features &amp; Modules:
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {product.features.map((feat, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl border border-white/5 bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                      <span className="text-xs font-bold text-white/90 leading-snug">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── STATIC NON-FLIP BUTTONS FOOTER ── */}
        <div className="p-4 sm:p-5 bg-surface-base/50 border-t border-white/10 w-full shrink-0 relative z-20">
          <div className="flex items-center gap-2.5 w-full">
            <motion.button
              onClick={onCTA}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-extrabold text-xs sm:text-sm text-surface-base transition-all duration-300 outline-none cursor-pointer shadow-md hover:shadow-lg"
              style={{
                backgroundColor: accentColor,
                boxShadow: `0 4px 16px rgba(${accentRgb}, 0.35)`,
              }}
            >
              <span>{product.ctaLabel || (isLive ? "Visit Website" : "Discuss Requirements")}</span>
            </motion.button>

            {isLive && (
              <motion.button
                onClick={() => openModal("consultation", `Demo Request: ${product.name}`)}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                title="Request Live Demo"
                className="py-3 px-3.5 rounded-xl font-extrabold text-xs text-white bg-white/10 hover:bg-white/20 border border-white/15 transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
              >
                <span>Book Demo</span>
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </RevealOnScroll>
  );
}
