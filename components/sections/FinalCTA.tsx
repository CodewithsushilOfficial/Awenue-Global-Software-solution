"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import RevealOnScroll from "@/components/motion/RevealOnScroll";
import { useModal } from "@/components/providers/ModalProvider";
import { ArrowRight, Sparkles, MessageSquare, ShieldCheck, Zap } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function FinalCTA() {
  const { openModal } = useModal();
  const [cmsContent, setCmsContent] = useState({
    finalCtaEyebrow: "LET'S BUILD SOMETHING GREAT",
    finalCtaHeading: "Ready to Take Your Business Digital?",
    finalCtaDescription:
      "Whether you need your first website, have a new product idea, or want to automate and grow your existing business — let's make it happen together.",
    finalCtaPrimary: "Start Your Project",
    finalCtaSecondary: "Get Free Consultation",
  });

  useEffect(() => {
    async function loadCms() {
      try {
        const snap = await getDoc(doc(db, "websiteContent", "homepage"));
        if (snap.exists()) {
          const data = snap.data();
          setCmsContent((prev) => ({
            finalCtaEyebrow: data.finalCtaEyebrow || prev.finalCtaEyebrow,
            finalCtaHeading: data.finalCtaHeading || prev.finalCtaHeading,
            finalCtaDescription: data.finalCtaDescription || prev.finalCtaDescription,
            finalCtaPrimary: data.finalCtaPrimary || prev.finalCtaPrimary,
            finalCtaSecondary: data.finalCtaSecondary || prev.finalCtaSecondary,
          }));
        }
      } catch (err) {
        console.warn("FinalCTA CMS load notice:", err);
      }
    }
    loadCms();
  }, []);

  return (
    <section
      id="contact"
      className="bg-surface-base text-text-secondary py-28 sm:py-36 relative overflow-hidden border-t border-border-dark flex items-center justify-center"
    >
      {/* Background Image */}
      <Image
        src="/images/hero/scene-05-growth.jpg"
        alt="Digital Growth"
        fill
        className="object-cover object-center opacity-25 scale-105"
        sizes="100vw"
        quality={85}
      />

      {/* Dark Radial Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, rgba(10,15,13,0.75) 0%, rgba(10,15,13,0.95) 70%, rgba(10,15,13,0.99) 100%)",
        }}
        aria-hidden="true"
      />

      {/* Central Pulsing Glow */}
      <motion.div
        className="absolute w-[700px] h-[400px] rounded-full pointer-events-none z-0"
        style={{ background: "radial-gradient(ellipse, rgba(9,184,80,0.18) 0%, transparent 70%)" }}
        animate={{ opacity: [0.15, 0.35, 0.15], scale: [1, 1.06, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden="true"
      />

      {/* Top Accent Line */}
      <div
        className="absolute top-0 inset-x-0 h-px pointer-events-none"
        style={{ background: "linear-gradient(90deg, transparent, rgba(9,184,80,0.7), transparent)" }}
        aria-hidden="true"
      />

      {/* Grid Overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(9,184,80,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(9,184,80,0.8) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }}
        aria-hidden="true"
      />

      <div className="max-w-4xl mx-auto px-6 relative z-10 text-center flex flex-col items-center">
        {/* Eyebrow Badge */}
        <RevealOnScroll delay={0.1}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-accent/40 bg-accent/15 backdrop-blur-md text-accent text-eyebrow rounded-full mb-8 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <Sparkles size={13} aria-hidden="true" />
            <span className="font-extrabold tracking-widest text-[11px] uppercase">{cmsContent.finalCtaEyebrow}</span>
          </div>
        </RevealOnScroll>

        {/* Title */}
        <RevealOnScroll delay={0.15}>
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-text-secondary mb-6 leading-[1.12] tracking-tight max-w-3xl">
            {cmsContent.finalCtaHeading}
          </h2>
        </RevealOnScroll>

        {/* Subtitle */}
        <RevealOnScroll delay={0.2} className="max-w-2xl mx-auto">
          <p className="text-text-muted text-base sm:text-lg leading-relaxed font-normal mb-10">
            {cmsContent.finalCtaDescription}
          </p>
        </RevealOnScroll>

        {/* Dual Action Buttons */}
        <RevealOnScroll delay={0.25}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto mb-10">
            <motion.button
              onClick={() => openModal("project")}
              whileHover={{ scale: 1.05, boxShadow: "0 0 50px rgba(9,184,80,0.5)" }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="bg-accent text-surface-base font-extrabold text-base px-9 py-4 rounded-xl shadow-glow transition-all outline-none focus-visible:outline-2 focus-visible:outline-accent-tint cursor-pointer flex items-center justify-center gap-2.5 w-full sm:w-auto"
            >
              <span>{cmsContent.finalCtaPrimary}</span>
              <ArrowRight size={18} aria-hidden="true" />
            </motion.button>

            <motion.button
              onClick={() => openModal("consultation")}
              whileHover={{ scale: 1.04, borderColor: "rgba(9,184,80,0.5)", backgroundColor: "rgba(14,20,17,0.9)" }}
              whileTap={{ scale: 0.97 }}
              className="border border-white/20 bg-surface-raised/80 backdrop-blur-md text-text-secondary font-bold text-base px-8 py-4 rounded-xl transition-all outline-none focus-visible:outline-2 focus-visible:outline-accent-tint cursor-pointer flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <MessageSquare size={16} className="text-accent" />
              <span>{cmsContent.finalCtaSecondary}</span>
            </motion.button>
          </div>
        </RevealOnScroll>

        {/* Tagline Pills */}
        <RevealOnScroll delay={0.3}>
          <div className="flex items-center justify-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-accent bg-accent/10 border border-accent/30 px-3.5 py-1.5 rounded-full">
              <Zap size={12} /> Build
            </span>
            <span className="text-white/30">•</span>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-400/30 px-3.5 py-1.5 rounded-full">
              <ShieldCheck size={12} /> Automate
            </span>
            <span className="text-white/30">•</span>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-400/30 px-3.5 py-1.5 rounded-full">
              <Sparkles size={12} /> Grow
            </span>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
