"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { Save, CheckCircle2, Loader2, Lock } from "lucide-react";

interface AdminSettingsState {
  businessEmail: string;
  contactPhone: string;
  whatsappNumber: string;
  businessAddress: string;
}

const DEFAULT_SETTINGS: AdminSettingsState = {
  businessEmail: "awenueglobalsoftwaresolutions@gmail.com",
  contactPhone: "+91 98765 43210",
  whatsappNumber: "+91 98765 43210",
  businessAddress: "Varanasi, Uttar Pradesh, India",
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<AdminSettingsState>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!active) return;

      async function loadSettings() {
        try {
          const docRef = doc(db, "adminSettings", "general");
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            setSettings({ ...DEFAULT_SETTINGS, ...snap.data() });
          } else {
            const altSnap = await getDoc(doc(db, "settings", "general"));
            if (altSnap.exists()) {
              setSettings({ ...DEFAULT_SETTINGS, ...altSnap.data() });
            }
          }
        } catch (err) {
          console.warn("Using default admin settings:", err);
        } finally {
          if (active) setLoading(false);
        }
      }

      loadSettings();
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // 1. Post to server-side Firebase Admin API route first (bypasses rules)
      const res = await fetch("/api/admin/cms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "set",
          collectionName: "adminSettings",
          docId: "general",
          data: settings,
        }),
      });

      if (!res.ok) {
        const docRef = doc(db, "adminSettings", "general");
        await setDoc(docRef, {
          ...settings,
          updatedAt: new Date().toISOString(),
        });
      }

      setFeedback("Business settings updated successfully!");
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      console.error("Error saving settings:", err);
      try {
        const docRef = doc(db, "adminSettings", "general");
        await setDoc(docRef, {
          ...settings,
          updatedAt: new Date().toISOString(),
        });
        setFeedback("Business settings saved!");
        setTimeout(() => setFeedback(null), 3000);
      } catch (fErr) {
        console.error("Fallback save settings failed:", fErr);
        alert("Failed to save settings. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white mb-1">
          Website Settings
        </h1>
        <p className="text-text-muted text-xs sm:text-sm">
          Manage general business contact info and social links.
        </p>
      </div>

      {feedback && (
        <div className="p-3.5 bg-accent/15 border border-accent/30 rounded-xl text-accent text-xs font-bold flex items-center gap-2">
          <CheckCircle2 size={16} /> {feedback}
        </div>
      )}

      {/* Security Note Box */}
      <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3 text-xs text-amber-300">
        <Lock size={18} className="shrink-0 mt-0.5" />
        <div>
          <strong className="block font-bold mb-0.5">Security Notice — Server Environment Secrets</strong>
          <span>
            Authentication credentials and Firebase Admin private keys are maintained strictly in server-side environment variables for production security.
          </span>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-text-muted text-xs flex items-center justify-center gap-2">
          <Loader2 className="animate-spin" size={18} /> Loading settings...
        </div>
      ) : (
        <form onSubmit={handleSave} className="bg-surface-raised border border-border-dark p-6 sm:p-8 rounded-3xl space-y-5 shadow-xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-extrabold text-text-muted uppercase tracking-wider block mb-1">
                Business Contact Email
              </label>
              <input
                type="email"
                value={settings.businessEmail}
                onChange={(e) => setSettings({ ...settings, businessEmail: e.target.value })}
                className="w-full bg-surface-base border border-border-dark px-3.5 py-2.5 rounded-xl text-xs text-white outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="text-[11px] font-extrabold text-text-muted uppercase tracking-wider block mb-1">
                Contact Phone Number
              </label>
              <input
                type="text"
                value={settings.contactPhone}
                onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                className="w-full bg-surface-base border border-border-dark px-3.5 py-2.5 rounded-xl text-xs text-white outline-none focus:border-accent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-extrabold text-text-muted uppercase tracking-wider block mb-1">
                WhatsApp Business Number
              </label>
              <input
                type="text"
                value={settings.whatsappNumber}
                onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                className="w-full bg-surface-base border border-border-dark px-3.5 py-2.5 rounded-xl text-xs text-white outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="text-[11px] font-extrabold text-text-muted uppercase tracking-wider block mb-1">
                Primary Business Address
              </label>
              <input
                type="text"
                value={settings.businessAddress}
                onChange={(e) => setSettings({ ...settings, businessAddress: e.target.value })}
                className="w-full bg-surface-base border border-border-dark px-3.5 py-2.5 rounded-xl text-xs text-white outline-none focus:border-accent"
              />
            </div>
          </div>



          <div className="flex justify-end pt-4 border-t border-white/10">
            <button
              type="submit"
              disabled={saving}
              className="bg-accent text-surface-base font-extrabold px-8 py-3 rounded-xl hover:bg-accent-hover transition-colors shadow-glow flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin" size={16} /> Saving Settings...
                </>
              ) : (
                <>
                  <Save size={16} /> Save Settings
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
