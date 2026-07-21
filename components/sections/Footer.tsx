"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { newsletterSchema, type NewsletterFormValues } from "@/lib/validations";
import { Loader2, MapPin, Mail, ArrowRight, CheckCircle2 } from "lucide-react";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import SocialIcon from "@/components/icons/SocialIcons";

export interface FooterCmsContent {
  footerBrandDesc?: string;
  footerAddress?: string;
  footerEmail?: string;
  footerCopyright?: string;
}

export interface SocialLink {
  id: string;
  platform: string;
  displayName: string;
  url: string;
  isActive: boolean;
  displayOrder: number;
  openInNewTab: boolean;
  ariaLabel: string;
}

export default function Footer({
  initialCmsContent,
  initialSocialLinks,
}: {
  initialCmsContent?: FooterCmsContent;
  initialSocialLinks?: SocialLink[];
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(initialSocialLinks || []);

  const [cmsData, setCmsData] = useState({
    footerBrandDesc:
      initialCmsContent?.footerBrandDesc ||
      "We build high-converting websites, mobile applications, scalable SaaS platforms, and custom AI automation for forward-thinking businesses.",
    footerAddress: initialCmsContent?.footerAddress || "Varanasi, Uttar Pradesh, India",
    footerEmail: initialCmsContent?.footerEmail || "hello@awenue.io",
    footerCopyright: initialCmsContent?.footerCopyright || "© 2026 Avenue Global Software Solutions. All Rights Reserved.",
  });

  useEffect(() => {
    if (initialCmsContent) return; // Skip client-side load if server pre-loaded
    async function loadFooterCms() {
      try {
        const snap = await getDoc(doc(db, "websiteContent", "homepage"));
        if (snap.exists()) {
          const data = snap.data();
          setCmsData((prev) => ({
            footerBrandDesc: data.footerBrandDesc || prev.footerBrandDesc,
            footerAddress: data.footerAddress || prev.footerAddress,
            footerEmail: data.footerEmail || prev.footerEmail,
            footerCopyright: data.footerCopyright || prev.footerCopyright,
          }));
        } else {
          const altSnap = await getDoc(doc(db, "adminSettings", "general"));
          if (altSnap.exists()) {
            const data = altSnap.data();
            setCmsData((prev) => ({
              footerBrandDesc: prev.footerBrandDesc,
              footerAddress: data.businessAddress || prev.footerAddress,
              footerEmail: data.businessEmail || prev.footerEmail,
              footerCopyright: prev.footerCopyright,
            }));
          }
        }
      } catch (err) {
        console.warn("Footer CMS load notice:", err);
      }
    }
    loadFooterCms();
  }, [initialCmsContent]);

  useEffect(() => {
    if (initialSocialLinks) return; // Skip client-side load if server pre-loaded
    async function loadSocialLinks() {
      try {
        const snap = await getDocs(collection(db, "socialLinks"));
        const links: SocialLink[] = [];
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.isActive !== false) {
            links.push({ id: docSnap.id, ...data } as SocialLink);
          }
        });
        // Sort by displayOrder ascending
        links.sort((a, b) => (Number(a.displayOrder) || 0) - (Number(b.displayOrder) || 0));
        setSocialLinks(links);
      } catch (err) {
        console.warn("Footer social links load notice:", err);
      }
    }
    loadSocialLinks();
  }, [initialSocialLinks]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NewsletterFormValues>({
    resolver: zodResolver(newsletterSchema),
  });

  const onSubmit = async (values: NewsletterFormValues) => {
    setIsSubmitting(true);
    try {
      await fetch("/api/queries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: "Newsletter Subscriber",
          email: values.email,
          subject: "Newsletter Subscription",
          message: "User subscribed to newsletter via website footer.",
        }),
      });
      setIsSuccess(true);
      reset();
    } catch (err) {
      console.error("Newsletter submission error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const services = [
    { label: "Web Development", href: "/services/web-development" },
    { label: "SaaS Development", href: "/services/saas-development" },
    { label: "Mobile App Development", href: "/services/mobile-app-development" },
    { label: "AI & Automation", href: "/services/ai-automation" },
    { label: "Digital Marketing", href: "/services/digital-marketing" },
    { label: "Branding & UI/UX", href: "/services/graphic-design-branding" },
  ];

  const products = [
    { label: "Awenue CRM", badge: "SaaS", href: "/products/awenue-crm" },
    { label: "Awenue College ERP", badge: "Platform", href: "/products/awenue-college-erp" },
    { label: "Hospital Management", badge: "Soon", href: "/products/hospital-management" },
  ];

  const company = [
    { label: "Home", href: "/" },
    { label: "Services", href: "/#services" },
    { label: "Products", href: "/#products" },
    { label: "How We Work", href: "/#process" },
    { label: "Get Consultation", href: "/#contact" },
  ];


  return (
    <footer className="bg-surface-base text-text-secondary border-t border-border-dark pt-20 pb-10 relative overflow-hidden z-10">
      {/* Background glow behind footer */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1000px] h-[350px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse at bottom, rgba(9,184,80,0.06) 0%, transparent 70%)" }}
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-16 items-start">
          
          {/* Brand Column (Col 1-5) */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <a href="#" className="text-3xl font-black tracking-wider block mb-2 font-display">
                AWEN<span className="text-accent">UE</span>
              </a>
              <span className="text-xs font-bold text-accent tracking-widest uppercase block">
                Avenue Global Software Solutions
              </span>
            </div>

            <p className="text-text-muted text-sm font-normal leading-relaxed max-w-sm">
              {cmsData.footerBrandDesc}
            </p>

            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-accent/30 bg-accent/10 text-accent text-xs font-bold">
              <span>Build. Automate. Grow.</span>
            </div>

            {/* Office & Contact Info */}
            <div className="pt-2 space-y-2.5">
              <div className="flex items-center gap-2.5 text-xs text-text-muted">
                <MapPin size={15} className="text-accent shrink-0" />
                <span>{cmsData.footerAddress}</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-text-muted">
                <Mail size={15} className="text-accent shrink-0" />
                <a
                  href={`mailto:${cmsData.footerEmail}`}
                  className="text-accent hover:text-accent-tint font-bold transition-colors"
                >
                  {cmsData.footerEmail}
                </a>
              </div>
            </div>
          </div>

          {/* Directory Links (Col 6-9) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 lg:col-span-4 w-full">
            {/* Services */}
            <div className="space-y-4">
              <h3 className="text-xs font-extrabold text-white uppercase tracking-widest border-b border-white/10 pb-2">
                Services
              </h3>
              <ul className="space-y-2.5">
                {services.map((item, idx) => (
                  <li key={idx}>
                    <a
                      href={item.href}
                      className="text-xs text-text-muted hover:text-accent transition-colors flex items-center gap-1 group"
                    >
                      <ArrowRight size={10} className="opacity-0 group-hover:opacity-100 transition-opacity -ml-3 group-hover:ml-0" />
                      <span>{item.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Products */}
            <div className="space-y-4">
              <h3 className="text-xs font-extrabold text-white uppercase tracking-widest border-b border-white/10 pb-2">
                Products
              </h3>
              <ul className="space-y-2.5">
                {products.map((item, idx) => (
                  <li key={idx}>
                    <a
                      href={item.href}
                      className="text-xs text-text-muted hover:text-accent transition-colors flex items-center justify-between group pr-2"
                    >
                      <span>{item.label}</span>
                      <span className="text-[9px] font-bold text-accent bg-accent/10 px-1.5 py-0.5 rounded">
                        {item.badge}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div className="space-y-4">
              <h3 className="text-xs font-extrabold text-white uppercase tracking-widest border-b border-white/10 pb-2">
                Company
              </h3>
              <ul className="space-y-2.5">
                {company.map((item, idx) => (
                  <li key={idx}>
                    <a
                      href={item.href}
                      className="text-xs text-text-muted hover:text-white transition-colors block"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Newsletter Column (Col 10-12) */}
          <div className="lg:col-span-3 space-y-4 w-full">
            <h3 className="text-xs font-extrabold text-white uppercase tracking-widest border-b border-white/10 pb-2">
              Stay Connected
            </h3>
            <p className="text-text-muted text-xs font-normal leading-relaxed">
              Subscribe to get our latest tech logs, software architecture updates, and growth strategies.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-2.5 pt-1">
              <div className="flex gap-2 items-stretch">
                <input
                  type="email"
                  placeholder="Enter work email"
                  {...register("email")}
                  className="w-full bg-surface-raised border border-white/15 px-3.5 py-2.5 rounded-xl text-text-secondary outline-none text-xs transition-colors h-11 focus:border-accent"
                  aria-label="Work email for newsletter"
                  suppressHydrationWarning
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-accent text-surface-base font-extrabold text-xs px-5 rounded-xl hover:bg-accent-tint transition-all h-11 flex items-center justify-center shrink-0 cursor-pointer shadow-glow disabled:opacity-45"
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin" size={15} />
                  ) : (
                    "Join"
                  )}
                </button>
              </div>

              {errors.email && (
                <p className="text-xs text-rose-400 mt-1">
                  {errors.email.message}
                </p>
              )}
              {isSuccess && (
                <p className="text-xs text-accent mt-1 font-bold flex items-center gap-1">
                  <CheckCircle2 size={13} /> Subscribed successfully!
                </p>
              )}
            </form>

            {/* Social Media Links */}
            {socialLinks && socialLinks.length > 0 && (
              <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-white/5 mt-4">
                {socialLinks.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    title={link.displayName}
                    aria-label={link.ariaLabel || `Visit AWENUE on ${link.displayName}`}
                    target={link.openInNewTab !== false ? "_blank" : undefined}
                    rel={link.openInNewTab !== false ? "noopener noreferrer" : undefined}
                    className="w-9 h-9 rounded-xl bg-surface-raised border border-white/10 flex items-center justify-center text-text-muted hover:text-accent hover:border-accent/40 hover:shadow-glow transition-all duration-300 transform hover:scale-110 focus-visible:scale-110 focus-visible:text-accent focus-visible:border-accent/40 focus-visible:ring-2 focus-visible:ring-accent/50 outline-none"
                  >
                    <SocialIcon platform={link.platform} className="w-4.5 h-4.5" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Line */}
        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-xs text-text-muted font-medium">All Systems Operational</span>
          </div>

          <p className="text-xs text-text-muted text-center select-none">
            {cmsData.footerCopyright}
          </p>

          <div className="flex items-center gap-5 text-xs text-text-muted">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <span>•</span>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
