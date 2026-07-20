"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { useAuth } from "@/components/providers/AuthProvider";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const { isAdmin, loading, refreshSession } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If already authenticated with active admin session, redirect to dashboard
  useEffect(() => {
    if (!loading && isAdmin) {
      router.replace("/admin/dashboard");
    }
  }, [isAdmin, loading, router]);

  const handleGoogleSignIn = async () => {
    if (isSubmitting || loading) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // 1. Sign in with Google via Firebase Web SDK popup
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      if (!user) {
        throw new Error("Google Sign-In was cancelled or failed.");
      }

      // 2. Obtain Firebase ID Token
      const idToken = await user.getIdToken(true);

      // 3. Verify ID token & authorize admin server-side
      const res = await fetch("/api/admin/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      const contentType = res.headers.get("content-type") || "";
      let data: { error?: string } = {};

      if (contentType.includes("application/json")) {
        try {
          data = await res.json();
        } catch {
          // Fallback if parsing fails
        }
      }

      if (!res.ok) {
        // Sign out Firebase client auth if authorization denied server-side
        await signOut(auth).catch(() => {});
        throw new Error(
          data.error ||
            "This Google account is not authorized to access the AWENUE Admin Dashboard."
        );
      }

      // 4. Refresh session state and navigate to dashboard
      await refreshSession();
      router.push("/admin/dashboard");
    } catch (err: unknown) {
      console.error("[ADMIN LOGIN] Google auth error:", err);

      let msg = "An error occurred during Google authentication. Please try again.";

      if (err instanceof Error) {
        if (err.message.includes("auth/popup-closed-by-user")) {
          msg = "Sign-in popup was closed before completing authentication.";
        } else if (err.message.includes("auth/popup-blocked")) {
          msg = "Sign-in popup was blocked by your browser. Please allow popups for this site.";
        } else if (err.message.includes("auth/network-request-failed")) {
          msg = "Network connection error. Please check your internet connection.";
        } else if (err.message.includes("Server returned error status")) {
          msg = "Authentication service temporarily unavailable. Please try again in a moment.";
        } else if (err.message) {
          msg = err.message;
        }
      }

      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-surface-base flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Radial Orbs */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(9,184,80,0.08) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      <div className="w-full max-w-md bg-surface-raised border border-border-dark p-8 sm:p-10 rounded-3xl shadow-2xl relative z-10">
        {/* Header with AWENUE Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent/15 border border-accent/30 text-accent mb-4">
            <span className="text-xl font-black tracking-wider text-accent">AW</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mb-2">
            Welcome Back
          </h1>
          <p className="text-xs sm:text-sm text-text-muted leading-relaxed max-w-xs mx-auto">
            Sign in with your authorized Google account to access the{" "}
            <strong className="text-white font-semibold">AWENUE Admin Dashboard</strong>.
          </p>
        </div>

        {/* Error Feedback */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 text-xs font-semibold flex items-start gap-3">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <div className="leading-relaxed">{errorMessage}</div>
          </div>
        )}

        {/* Primary CTA: Continue with Google */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isSubmitting || loading}
          className="w-full bg-white hover:bg-slate-100 text-slate-900 font-extrabold py-4 px-6 rounded-2xl transition-all flex items-center justify-center gap-3 cursor-pointer shadow-lg hover:shadow-xl disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin text-slate-700" size={20} />
              <span className="text-sm font-bold text-slate-800">Verifying Admin Authorization...</span>
            </>
          ) : (
            <>
              {/* Official Google SVG Icon */}
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span className="text-sm font-extrabold tracking-wide">Continue with Google</span>
            </>
          )}
        </button>

        {/* Security Note */}
        <p className="text-[11px] text-text-muted text-center mt-4 leading-relaxed">
          Authorized personnel only. Access attempts are monitored and logged.
        </p>

        {/* Secondary Navigation */}
        <div className="mt-8 pt-6 border-t border-white/10 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-white transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Back to Public Website</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
