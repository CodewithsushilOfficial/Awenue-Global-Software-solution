"use client";

import { useState, useEffect } from "react";
import { useModal } from "@/components/providers/ModalProvider";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { openModal } = useModal();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Home", href: "#" },
    { name: "Services", href: "#services" },
    { name: "Products", href: "#products" },
    { name: "About", href: "#about" },
    { name: "Contact", href: "#contact" },
  ];

  return (
    <>
      <nav
        className={cn(
          "fixed top-0 left-0 right-0 z-40 transition-colors duration-300 border-b border-transparent",
          isScrolled
            ? "bg-surface-base/95 backdrop-blur-md border-border-dark py-4"
            : "bg-transparent py-6"
        )}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <a
            href="#"
            className="text-lg sm:text-xl font-extrabold tracking-wider text-text-secondary outline-none focus-visible:outline-2 focus-visible:outline-accent-tint focus-visible:outline-offset-2"
          >
            AWEN<span className="text-accent">UE</span>
          </a>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-nav-link text-text-muted hover:text-text-secondary transition-colors outline-none focus-visible:outline-2 focus-visible:outline-accent-tint focus-visible:outline-offset-2"
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:block">
            <button
              onClick={() => openModal()}
              className="bg-accent text-surface-base text-btn px-6 py-3.5 rounded-lg hover:bg-accent-hover active:translate-y-px transition-all outline-none focus-visible:outline-2 focus-visible:outline-accent-tint focus-visible:outline-offset-2 cursor-pointer shadow-sm"
            >
              Get Free Consultation
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-text-secondary hover:text-accent outline-none focus-visible:outline-2 focus-visible:outline-accent-tint focus-visible:outline-offset-2 cursor-pointer"
            aria-expanded={isMobileMenuOpen}
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-30 bg-surface-base/98 md:hidden transition-transform duration-300 ease-awenue pt-28 px-6 flex flex-col justify-between pb-10",
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex flex-col gap-6">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-2xl font-extrabold text-text-secondary hover:text-accent transition-colors"
            >
              {link.name}
            </a>
          ))}
        </div>

        <div className="flex flex-col gap-6">
          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              openModal();
            }}
            className="w-full text-center bg-accent text-surface-base text-btn py-4 rounded-lg hover:bg-accent-hover active:translate-y-px transition-all cursor-pointer"
          >
            Get Free Consultation
          </button>
          <div className="text-center text-xs text-text-muted">
            Varanasi, Uttar Pradesh, India
          </div>
        </div>
      </div>
    </>
  );
}
