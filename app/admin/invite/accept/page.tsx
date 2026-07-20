"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { ShieldCheck, Loader2, CheckCircle2, AlertCircle, ArrowRight, Lock } from "lucide-react";

interface InvitationData {
  id: string;
  email: string;
  displayName: string;
  role: string;
  roleLabel: string;
  invitedBy?: string;
  createdAt?: string;
}

function AcceptInvitationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isActivating, setIsActivating] = useState(false);
  const [activationSuccess, setActivationSuccess] = useState(false);

  useEffect(() => {
    let active = true;

    const verifyToken = async () => {
      if (!token) {
        if (active) {
          setError("No invitation token provided in URL.");
          setLoading(false);
        }
        return;
      }

      try {
        const res = await fetch(`/api/admin/invite?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Invalid or expired invitation token.");
        }
        if (active) setInvitation(data.invitation);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Failed to verify invitation.");
      } finally {
        if (active) setLoading(false);
      }
    };

    verifyToken();

    return () => {
      active = false;
    };
  }, [token]);

  const handleGoogleSignIn = async () => {
    if (!invitation) return;
    setIsActivating(true);
    setError(null);

    try {
      // 1. Google Authentication
      const credential = await signInWithPopup(auth, googleProvider);
      const idToken = await credential.user.getIdToken(true);

      // 2. Server Authorization & Activation
      const res = await fetch("/api/admin/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to activate admin account.");
      }

      setActivationSuccess(true);
      setTimeout(() => {
        router.replace("/admin/dashboard");
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Google authentication failed.");
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-base flex items-center justify-center p-4">
      <div className="bg-surface-raised border border-border-dark p-8 sm:p-10 rounded-3xl max-w-md w-full shadow-2xl relative text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent/15 border border-accent/30 text-accent mb-4">
          <ShieldCheck size={28} />
        </div>

        <h1 className="text-2xl font-black text-white">AWENUE Admin Invitation</h1>
        <p className="text-xs text-text-muted mt-1 leading-relaxed">
          Accept your pre-authorized administrator access
        </p>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-text-muted text-xs font-bold gap-2">
            <Loader2 className="animate-spin" size={24} />
            Verifying invitation token...
          </div>
        ) : error ? (
          <div className="my-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 text-xs font-semibold text-left flex items-start gap-2.5">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <div className="leading-relaxed">{error}</div>
          </div>
        ) : activationSuccess ? (
          <div className="my-6 p-4 bg-accent/10 border border-accent/30 rounded-2xl text-accent text-xs font-semibold flex items-center justify-center gap-2">
            <CheckCircle2 size={18} />
            <span>Account Activated! Redirecting to Dashboard...</span>
          </div>
        ) : invitation ? (
          <div className="my-6 space-y-4 text-left">
            <div className="bg-surface-base border border-white/10 rounded-2xl p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-text-muted font-bold uppercase">Name</span>
                <span className="text-xs text-white font-bold">{invitation.displayName}</span>
              </div>
              <div className="flex justify-between items-center border-t border-white/5 pt-2">
                <span className="text-[11px] text-text-muted font-bold uppercase">Role</span>
                <span className="text-xs text-accent font-extrabold bg-accent/10 border border-accent/20 px-2 py-0.5 rounded">
                  {invitation.roleLabel}
                </span>
              </div>
              <div className="flex justify-between items-center border-t border-white/5 pt-2">
                <span className="text-[11px] text-text-muted font-bold uppercase">Authorized Email</span>
                <span className="text-xs text-white font-mono">{invitation.email}</span>
              </div>
              {invitation.invitedBy && (
                <div className="flex justify-between items-center border-t border-white/5 pt-2">
                  <span className="text-[11px] text-text-muted font-bold uppercase">Invited By</span>
                  <span className="text-xs text-text-muted">{invitation.invitedBy}</span>
                </div>
              )}
            </div>

            <p className="text-[11px] text-text-muted leading-relaxed bg-surface-base/60 p-3 rounded-xl border border-white/5 flex items-start gap-2">
              <Lock size={14} className="shrink-0 text-accent mt-0.5" />
              <span>
                Please click below and sign in using the exact Google account (<strong>{invitation.email}</strong>).
              </span>
            </p>

            <button
              onClick={handleGoogleSignIn}
              disabled={isActivating}
              className="w-full bg-accent text-surface-base font-extrabold py-3.5 rounded-xl hover:bg-accent-hover transition-all flex items-center justify-center gap-2 cursor-pointer shadow-glow text-xs"
            >
              {isActivating ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Activating Account...
                </>
              ) : (
                <>
                  <span>Continue with Google</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface-base flex items-center justify-center text-text-muted text-xs font-bold">Loading invitation...</div>}>
      <AcceptInvitationContent />
    </Suspense>
  );
}
