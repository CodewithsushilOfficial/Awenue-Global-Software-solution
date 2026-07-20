"use client";

import RevealOnScroll from "@/components/motion/RevealOnScroll";
import { Target, MessageSquare, Layers, TrendingUp } from "lucide-react";

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

export default function TrustBar() {
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
      </div>
    </section>
  );
}
