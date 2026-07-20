"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "motion/react";
import RevealOnScroll from "@/components/motion/RevealOnScroll";
import { useModal } from "@/components/providers/ModalProvider";
import { ArrowRight, ArrowUpRight, CheckCircle2, ExternalLink } from "lucide-react";

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
  // CMS image fields (imageUrl is canonical; image is legacy fallback)
  imageUrl?: string;
  image?: string;
  imageAlt?: string;
  accentColor?: string;
  accentRgb?: string;
  category?: string;
}

const DEFAULT_PRODUCTS: ProductItem[] = [
  {
    id: "crm",
    name: "Awenue CRM",
    slug: "awenue-crm",
    category: "SaaS Product",
    shortDescription: "Manage leads, customers, sales, and business relationships — all in one place.",
    features: ["Lead Management", "Sales Pipeline", "Customer Management"],
    productStatus: "live",
    externalUrl: "https://crm.awenue.io",
    ctaLabel: "Visit CRM Website",
    displayOrder: 1,
    published: true,
    image: "/images/services/saas.jpg",
    imageAlt: "Awenue CRM Dashboard Preview",
    accentColor: "#3B82F6",
    accentRgb: "59,130,246",
  },
  {
    id: "erp",
    name: "Awenue College ERP",
    slug: "awenue-college-erp",
    category: "Business Platform",
    shortDescription: "A smarter platform to manage students, faculty, academics, fees, and campus operations.",
    features: ["Student Management", "Attendance", "Fee Management"],
    productStatus: "live",
    externalUrl: "https://erp.awenue.io",
    ctaLabel: "Visit ERP Website",
    displayOrder: 2,
    published: true,
    image: "/images/web_design.png",
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
    features: ["Patient Management", "Appointments", "Hospital Operations"],
    productStatus: "coming_soon",
    externalUrl: "",
    ctaLabel: "Coming Soon",
    displayOrder: 3,
    published: true,
    image: "/images/services/ai.jpg",
    imageAlt: "Awenue Hospital Management — Coming Soon",
    accentColor: "#9333EA",
    accentRgb: "147,51,234",
  },
];

export default function Products() {
  const { openModal } = useModal();
  const [products, setProducts] = useState<ProductItem[]>(DEFAULT_PRODUCTS);

  useEffect(() => {
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
  }, []);

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
        {/* Header — Center Aligned */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <RevealOnScroll delay={0.1}>
            <span className="text-accent text-eyebrow block mb-3">OUR PRODUCTS</span>
          </RevealOnScroll>
          <RevealOnScroll delay={0.15}>
            <h2 className="text-section-title mb-4 leading-tight">
              Software Built for <span className="text-accent">Real Business.</span>
            </h2>
          </RevealOnScroll>
          <RevealOnScroll delay={0.2}>
            <p className="text-text-muted text-body-lg max-w-xl mx-auto mb-6 leading-relaxed">
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

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {products.map((product, idx) => (
            <ProductCard key={product.id} product={product} delay={0.1 + idx * 0.1} />
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

// ─── PRODUCT CARD COMPONENT ───────────────────────────────────────────────────
function ProductCard({
  product,
  delay,
}: {
  product: ProductItem;
  delay: number;
}) {
  const [hovered, setHovered] = useState(false);
  const isLive = product.productStatus === "live";

  const handleProductClick = () => {
    if (isLive && product.externalUrl) {
      window.open(product.externalUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <RevealOnScroll delay={delay}>
      <motion.div
        whileHover={{ y: isLive ? -6 : 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 20 }}
        className={`group flex flex-col rounded-3xl border bg-surface-raised overflow-hidden h-full transition-all duration-400 ${
          !isLive
            ? "border-border-dark/60 opacity-85"
            : "border-white/10 hover:border-accent/40 shadow-xl cursor-pointer"
        }`}
        style={{
          boxShadow: hovered && isLive
            ? `0 20px 50px rgba(${product.accentRgb || "9,184,80"}, 0.15), 0 0 0 1px rgba(${product.accentRgb || "9,184,80"}, 0.3)`
            : "0 8px 30px rgba(0,0,0,0.4)",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={handleProductClick}
      >
        {/* Image Preview Container */}
        <div className="relative w-full h-[220px] sm:h-[230px] overflow-hidden bg-surface-base shrink-0">
          {/* Use standard img for CMS external imageUrl; fallback to next/image for local static assets */}
          {(() => {
            const src = product.imageUrl || product.image || "";
            const alt = product.imageAlt || product.name;
            if (src && (src.startsWith("http://") || src.startsWith("https://"))) {
              return (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={src}
                  alt={alt}
                  className={`w-full h-full object-cover object-center transition-transform duration-700 ease-out ${
                    hovered && isLive ? "scale-108" : "scale-100"
                  } ${!isLive ? "grayscale opacity-60" : "opacity-95"}`}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              );
            }
            return (
              <Image
                src={src || "/images/services/saas.jpg"}
                alt={alt}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                className={`object-cover object-center transition-transform duration-700 ease-out ${
                  hovered && isLive ? "scale-108" : "scale-100"
                } ${!isLive ? "grayscale opacity-60" : "opacity-95"}`}
                quality={90}
              />
            );
          })()}

          {/* Bottom Vignette Gradient */}
          <div
            className="absolute inset-0 transition-opacity duration-300 pointer-events-none"
            style={{
              background: `linear-gradient(180deg, transparent 60%, rgba(10,15,13,0.5) 100%)`,
            }}
            aria-hidden="true"
          />

          {/* Hover Action Icon for Live Products */}
          {isLive && (
            <div
              className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
                hovered ? "opacity-100" : "opacity-0"
              }`}
              aria-hidden="true"
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center shadow-glow transition-transform duration-300 scale-90 group-hover:scale-100"
                style={{ backgroundColor: product.accentColor || "#09B850" }}
              >
                <ArrowUpRight size={22} className="text-surface-base" />
              </div>
            </div>
          )}

          {/* Coming Soon Badge */}
          {!isLive && (
            <div className="absolute top-3 right-3 z-10">
              <span className="text-[10px] font-extrabold text-amber-400 border border-amber-400/40 bg-surface-base/90 backdrop-blur-md px-3 py-1 rounded-full shadow-lg uppercase tracking-wider">
                Coming Soon
              </span>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-7 flex flex-col gap-5 flex-1 justify-between relative z-10">
          <div>
            {/* Badges Row */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border bg-accent/15 border-accent/35 text-accent">
                AWENUE PRODUCT
              </span>
              <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                isLive ? "bg-blue-500/15 border-blue-400/30 text-blue-400" : "bg-purple-500/15 border-purple-400/30 text-purple-400"
              }`}>
                {product.category || (isLive ? "Live Platform" : "Healthcare Platform")}
              </span>
            </div>

            {/* Name */}
            <h3 className="text-xl sm:text-2xl font-black text-text-secondary mb-2 group-hover:text-white transition-colors">
              {product.name}
            </h3>

            {/* Description */}
            <p className="text-xs sm:text-sm text-text-muted font-normal leading-relaxed mb-4">
              {product.shortDescription}
            </p>

            {/* Features List */}
            <div className="flex flex-col gap-2 mb-4 pt-3 border-t border-white/10">
              {product.features.map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="shrink-0 text-accent" />
                  <span className="text-xs font-semibold text-white/80">{f}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            {/* Action Row */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              {isLive ? (
                <a
                  href={product.externalUrl || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-2 text-sm font-extrabold text-accent hover:text-accent-tint transition-colors"
                >
                  <span>{product.ctaLabel || "Visit Product Website"}</span>
                  <ExternalLink size={15} />
                </a>
              ) : (
                <span className="text-sm font-extrabold text-text-muted/50 cursor-default">
                  Coming Soon
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </RevealOnScroll>
  );
}
