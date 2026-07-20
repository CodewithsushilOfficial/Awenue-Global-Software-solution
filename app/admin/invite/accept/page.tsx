"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Loader2, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { Suspense } from "react";

function AcceptInvitationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get("token") || "";
  const invitationId = searchParams.get("invitation") || "";

  const [status, setStatus] = useState<"loading" | "success" | "error" | "idle">("idle");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate params on mount
  useEffect(() => {
    if (!token || !invitationId) {
      setStatus("error");
      setMessage("Invalid invitation link. Token or invitation ID is missing. Please use the exact link from your email.");
    }
  }, [token, invitationId]);

  const handleAccept = async () => {
    if (!token || !invitationId || isSubmitting) return;
    setIsSubmitting(true);
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/admin/invite/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, invitationId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "Failed to accept invitation. Please contact a Super Admin.");
        return;
      }

      setStatus("success");
      setMessage(data.message || "Your account has been activated! You can now log in.");

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/admin/login");
      }, 3000);
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again or contact a Super Admin.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-surface-base flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Orb */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(ellipse at center, rgba(9,184,80,0.07) 0%, transparent 70%)" }}
        aria-hidden="true"
      />

      <div className="w-full max-w-md bg-surface-raised border border-border-dark p-8 sm:p-10 rounded-3xl shadow-2xl relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-accent/15 border border-accent/30 text-accent mb-4">
            <ShieldCheck size={24} />
          </div>
          <h1 className="text-2xl font-black text-white mb-2">
            Admin Invitation
          </h1>
          <p className="text-sm text-text-muted leading-relaxed">
            You&apos;ve been invited to join the <strong className="text-white">AWENUE Admin Dashboard</strong>.
            Click below to activate your account.
          </p>
        </div>

        {/* Status Messages */}
        {status === "success" && (
          <div className="mb-6 p-4 bg-accent/10 border border-accent/30 rounded-xl text-accent text-sm flex items-start gap-3">
            <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-bold mb-1">Account Activated!</p>
              <p className="text-xs text-accent/80">{message}</p>
              <p className="text-xs text-accent/60 mt-2">Redirecting to login page...</p>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm flex items-start gap-3">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-bold mb-1">Activation Failed</p>
              <p className="text-xs text-rose-300/80">{message}</p>
            </div>
          </div>
        )}

        {/* What Happens */}
        {status === "idle" && token && invitationId && (
          <div className="mb-6 p-4 bg-surface-base rounded-xl border border-white/10 space-y-2.5">
            <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2">
              Activation Steps
            </p>
            {[
              "Your invitation link will be verified",
              "Your admin account will be created",
              "You can then log in using Email OTP",
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-text-muted">
                <div className="w-5 h-5 rounded-full bg-accent/20 text-accent flex items-center justify-center font-black text-[10px] shrink-0">
                  {i + 1}
                </div>
                {step}
              </div>
            ))}
          </div>
        )}

        {/* Action Button */}
        {status !== "success" && (
          <button
            onClick={handleAccept}
            disabled={isSubmitting || !token || !invitationId || status === "loading"}
            className="w-full bg-accent text-surface-base font-extrabold py-3.5 rounded-xl hover:bg-accent-hover transition-colors flex items-center justify-center gap-2 shadow-glow disabled:opacity-50"
          >
            {status === "loading" ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Activating Account...
              </>
            ) : (
              <>
                Activate My Admin Account
                <ArrowRight size={16} />
              </>
            )}
          </button>
        )}

        {status === "success" && (
          <Link
            href="/admin/login"
            className="w-full bg-accent text-surface-base font-extrabold py-3.5 rounded-xl hover:bg-accent-hover transition-colors flex items-center justify-center gap-2 shadow-glow"
          >
            Go to Login
            <ArrowRight size={16} />
          </Link>
        )}

        <div className="mt-6 pt-5 border-t border-white/10 text-center">
          <Link href="/" className="text-xs text-text-muted hover:text-white transition-colors">
            ← Back to Public Website
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-surface-base flex items-center justify-center">
        <Loader2 className="animate-spin text-accent" size={24} />
      </div>
    }>
      <AcceptInvitationContent />
    </Suspense>
  );
}
