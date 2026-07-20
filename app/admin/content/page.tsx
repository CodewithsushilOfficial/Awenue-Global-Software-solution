"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Save, Loader2, CheckCircle2, Sparkles } from "lucide-react";

interface ContentState {
  heroEyebrow: string;
  heroHeading: string;
  heroHighlight: string;
  heroDescription: string;
  heroPrimaryCta: string;
  heroSecondaryCta: string;

  trustEyebrow: string;
  trustHeading: string;
  trustDescription: string;

  finalCtaEyebrow: string;
  finalCtaHeading: string;
  finalCtaDescription: string;
  finalCtaPrimary: string;
  finalCtaSecondary: string;

  footerBrandDesc: string;
  footerAddress: string;
  footerEmail: string;
  footerCopyright: string;
}

const DEFAULT_CONTENT: ContentState = {
  heroEyebrow: "YOUR DIGITAL GROWTH PARTNER",
  heroHeading: "We Build Digital Solutions That",
  heroHighlight: "Turn Ideas Into Growth.",
  heroDescription: "From websites and mobile apps to SaaS products and AI automation — we build technology that helps your business move forward.",
  heroPrimaryCta: "Start Your Project",
  heroSecondaryCta: "Get Free Consultation",

  trustEyebrow: "WHY AWENUE",
  trustHeading: "Built for Business. Focused on Results.",
  trustDescription: "We partner with businesses to transform strategic goals into scalable software.",

  finalCtaEyebrow: "LET'S BUILD SOMETHING GREAT",
  finalCtaHeading: "Ready to Take Your Business Digital?",
  finalCtaDescription: "Whether you need your first website, have a new product idea, or want to automate and grow your existing business — let's make it happen together.",
  finalCtaPrimary: "Start Your Project",
  finalCtaSecondary: "Get Free Consultation",

  footerBrandDesc: "We build high-converting websites, mobile applications, scalable SaaS platforms, and custom AI automation for forward-thinking businesses.",
  footerAddress: "Varanasi, Uttar Pradesh, India",
  footerEmail: "hello@awenue.io",
  footerCopyright: "© 2026 Avenue Global Software Solutions. All Rights Reserved.",
};

export default function AdminContentPage() {
  const [content, setContent] = useState<ContentState>(DEFAULT_CONTENT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    async function loadContent() {
      try {
        const docRef = doc(db, "siteContent", "homepage");
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setContent({ ...DEFAULT_CONTENT, ...snap.data() });
        }
      } catch (err) {
        console.warn("Using default site content:", err);
      } finally {
        setLoading(false);
      }
    }
    loadContent();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const docRef = doc(db, "siteContent", "homepage");
      await setDoc(docRef, {
        ...content,
        updatedAt: new Date().toISOString(),
      });
      setFeedback("Website content updated successfully!");
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      console.error("Error updating site content:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mb-1">
            Website Content Management
          </h1>
          <p className="text-text-muted text-xs sm:text-sm">
            Dynamically update hero text, Trust section headings, Final CTA, and footer information.
          </p>
        </div>
      </div>

      {feedback && (
        <div className="p-3.5 bg-accent/15 border border-accent/30 rounded-xl text-accent text-xs font-bold flex items-center gap-2">
          <CheckCircle2 size={16} /> {feedback}
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-text-muted text-xs flex items-center justify-center gap-2">
          <Loader2 className="animate-spin" size={18} /> Loading homepage CMS content...
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-8">
          {/* Hero Section CMS */}
          <div className="bg-surface-raised border border-border-dark p-6 sm:p-8 rounded-3xl space-y-4 shadow-xl">
            <h2 className="text-lg font-black text-white border-b border-border-dark pb-3 flex items-center gap-2">
              <Sparkles size={18} className="text-accent" /> Hero Section Content
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-extrabold text-text-muted uppercase tracking-wider block mb-1">
                  Hero Eyebrow Badge
                </label>
                <input
                  type="text"
                  value={content.heroEyebrow}
                  onChange={(e) => setContent({ ...content, heroEyebrow: e.target.value })}
                  className="w-full bg-surface-base border border-border-dark px-3.5 py-2.5 rounded-xl text-xs text-white outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="text-[11px] font-extrabold text-text-muted uppercase tracking-wider block mb-1">
                  Highlighted Ending Phrase
                </label>
                <input
                  type="text"
                  value={content.heroHighlight}
                  onChange={(e) => setContent({ ...content, heroHighlight: e.target.value })}
                  className="w-full bg-surface-base border border-border-dark px-3.5 py-2.5 rounded-xl text-xs text-accent font-bold outline-none focus:border-accent"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-extrabold text-text-muted uppercase tracking-wider block mb-1">
                Main Hero Title
              </label>
              <input
                type="text"
                value={content.heroHeading}
                onChange={(e) => setContent({ ...content, heroHeading: e.target.value })}
                className="w-full bg-surface-base border border-border-dark px-3.5 py-2.5 rounded-xl text-xs text-white outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="text-[11px] font-extrabold text-text-muted uppercase tracking-wider block mb-1">
                Hero Description Paragraph
              </label>
              <textarea
                rows={3}
                value={content.heroDescription}
                onChange={(e) => setContent({ ...content, heroDescription: e.target.value })}
                className="w-full bg-surface-base border border-border-dark p-3 rounded-xl text-xs text-white outline-none focus:border-accent resize-none"
              />
            </div>
          </div>

          {/* Final CTA CMS */}
          <div className="bg-surface-raised border border-border-dark p-6 sm:p-8 rounded-3xl space-y-4 shadow-xl">
            <h2 className="text-lg font-black text-white border-b border-border-dark pb-3">
              Final CTA Section Content
            </h2>

            <div>
              <label className="text-[11px] font-extrabold text-text-muted uppercase tracking-wider block mb-1">
                CTA Eyebrow Badge
              </label>
              <input
                type="text"
                value={content.finalCtaEyebrow}
                onChange={(e) => setContent({ ...content, finalCtaEyebrow: e.target.value })}
                className="w-full bg-surface-base border border-border-dark px-3.5 py-2.5 rounded-xl text-xs text-white outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="text-[11px] font-extrabold text-text-muted uppercase tracking-wider block mb-1">
                CTA Section Heading
              </label>
              <input
                type="text"
                value={content.finalCtaHeading}
                onChange={(e) => setContent({ ...content, finalCtaHeading: e.target.value })}
                className="w-full bg-surface-base border border-border-dark px-3.5 py-2.5 rounded-xl text-xs text-white outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="text-[11px] font-extrabold text-text-muted uppercase tracking-wider block mb-1">
                CTA Description
              </label>
              <textarea
                rows={2}
                value={content.finalCtaDescription}
                onChange={(e) => setContent({ ...content, finalCtaDescription: e.target.value })}
                className="w-full bg-surface-base border border-border-dark p-3 rounded-xl text-xs text-white outline-none focus:border-accent resize-none"
              />
            </div>
          </div>

          {/* Footer CMS */}
          <div className="bg-surface-raised border border-border-dark p-6 sm:p-8 rounded-3xl space-y-4 shadow-xl">
            <h2 className="text-lg font-black text-white border-b border-border-dark pb-3">
              Footer & Contact Information
            </h2>

            <div>
              <label className="text-[11px] font-extrabold text-text-muted uppercase tracking-wider block mb-1">
                Footer Brand Summary
              </label>
              <textarea
                rows={2}
                value={content.footerBrandDesc}
                onChange={(e) => setContent({ ...content, footerBrandDesc: e.target.value })}
                className="w-full bg-surface-base border border-border-dark p-3 rounded-xl text-xs text-white outline-none focus:border-accent resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-extrabold text-text-muted uppercase tracking-wider block mb-1">
                  Office Location
                </label>
                <input
                  type="text"
                  value={content.footerAddress}
                  onChange={(e) => setContent({ ...content, footerAddress: e.target.value })}
                  className="w-full bg-surface-base border border-border-dark px-3.5 py-2.5 rounded-xl text-xs text-white outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="text-[11px] font-extrabold text-text-muted uppercase tracking-wider block mb-1">
                  Official Contact Email
                </label>
                <input
                  type="email"
                  value={content.footerEmail}
                  onChange={(e) => setContent({ ...content, footerEmail: e.target.value })}
                  className="w-full bg-surface-base border border-border-dark px-3.5 py-2.5 rounded-xl text-xs text-white outline-none focus:border-accent"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-accent text-surface-base font-extrabold px-8 py-3.5 rounded-xl hover:bg-accent-hover transition-colors shadow-glow flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin" size={16} /> Saving CMS Content...
                </>
              ) : (
                <>
                  <Save size={16} /> Save All Changes
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
