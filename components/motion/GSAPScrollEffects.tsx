"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function GSAPScrollEffects() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    gsap.registerPlugin(ScrollTrigger);

    // 1. GSAP Smooth Top Scroll Progress Bar
    const progressBar = document.getElementById("gsap-scroll-progress");
    if (progressBar) {
      gsap.to(progressBar, {
        scaleX: 1,
        ease: "none",
        scrollTrigger: {
          trigger: document.documentElement,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.2,
        },
      });
    }

    // 2. GSAP Parallax & Fade-in Effects for Headings
    const headings = document.querySelectorAll(".gsap-reveal-heading");
    headings.forEach((heading) => {
      gsap.fromTo(
        heading,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: heading,
            start: "top 88%",
            toggleActions: "play none none reverse",
          },
        }
      );
    });

    // 3. Refresh triggers
    ScrollTrigger.refresh();

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return (
    <div
      id="gsap-scroll-progress"
      className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-accent via-emerald-400 to-accent z-[100] origin-left scale-x-0 pointer-events-none shadow-[0_0_12px_rgba(9,184,80,0.8)]"
      aria-hidden="true"
    />
  );
}
