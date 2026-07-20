"use client";

import React, { useRef, useSyncExternalStore } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";

function subscribeHover(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const mediaQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
  mediaQuery.addEventListener("change", callback);
  return () => mediaQuery.removeEventListener("change", callback);
}

function getHoverSnapshot() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

function getServerSnapshot() {
  return false;
}

export default function TiltCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const hasHoverSupport = useSyncExternalStore(
    subscribeHover,
    getHoverSnapshot,
    getServerSnapshot
  );

  // Motion values for tracking cursor relative positions
  const xRotationVal = useMotionValue(0);
  const yRotationVal = useMotionValue(0);

  // Smooth spring motion configs
  const springConfig = { damping: 25, stiffness: 180, mass: 0.5 };
  const rotateX = useSpring(xRotationVal, springConfig);
  const rotateY = useSpring(yRotationVal, springConfig);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!hasHoverSupport || !cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Normalize mouse coords relative to center of card (-0.5 to 0.5)
    const xNormalized = (e.clientX - rect.left) / width - 0.5;
    const yNormalized = (e.clientY - rect.top) / height - 0.5;

    // Clamp rotation to maximum of 8 degrees
    xRotationVal.set(-yNormalized * 8);
    yRotationVal.set(xNormalized * 8);
  };

  const handlePointerLeave = () => {
    xRotationVal.set(0);
    yRotationVal.set(0);
  };

  return (
    <div
      ref={cardRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={{ perspective: 1000 }}
      className={`relative h-full w-full select-none ${className}`}
    >
      <motion.div
        style={{
          rotateX: hasHoverSupport ? rotateX : 0,
          rotateY: hasHoverSupport ? rotateY : 0,
          transformStyle: "preserve-3d",
        }}
        className="h-full w-full transition-shadow duration-300"
      >
        {children}
      </motion.div>
    </div>
  );
}
