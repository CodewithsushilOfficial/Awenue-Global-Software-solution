"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  Mail,
  Loader2,
  ArrowRight,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  RotateCw,
  ArrowLeft,
} from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const { isAdmin, loading, refreshSession } = useAuth();

  // Step state: "email" | "otp"
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [challengeToken, setChallengeToken] = useState<string>("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // Resend 60-second cooldown timer
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // If already have a valid session, redirect to dashboard
  useEffect(() => {
    if (!loading && isAdmin) {
      router.replace("/admin/dashboard");
    }
  }, [isAdmin, loading, router]);

  // Cooldown countdown effect
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      setCooldownSeconds((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  // Focus first OTP box on step change to 'otp'
  useEffect(() => {
    if (step === "otp") {
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [step]);

  const safeFetchJson = async (url: string, bodyObj: Record<string, unknown>) => {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyObj),
      });

      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await res.json();
        return { ok: res.ok, status: res.status, data };
      } else {
        const text = await res.text();
        console.warn(`Non-JSON response from ${url} (${res.status}):`, text.slice(0, 200));
        return { ok: false, status: res.status, data: { error: `Server response error (${res.status}).` } };
      }
    } catch (err) {
      console.warn(`Fetch error for ${url}:`, err);
      return { ok: false, status: 500, data: { error: "Network or server connection issue." } };
    }
  };

  // STEP 1: Request Email OTP Code
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setErrorMessage("Please enter a valid admin email address.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setInfoMessage(null);

    try {
      // Primary OTP Endpoint
      let result = await safeFetchJson("/api/admin/otp/request", { email });

      // Secondary Fallback Endpoint if primary fails or returns non-JSON/404
      if (!result.ok && result.status !== 429) {
        console.warn("Primary OTP endpoint failed, attempting fallback endpoint...");
        result = await safeFetchJson("/api/admin/send-otp", { email });
      }

      if (!result.ok) {
        throw new Error(result.data?.error || "Failed to request verification code. Please try again.");
      }

      if (result.data?.challengeToken) {
        setChallengeToken(result.data.challengeToken);
      }

      setStep("otp");
      setOtpDigits(["", "", "", "", "", ""]);
      setCooldownSeconds(60);
      setInfoMessage(result.data?.message || `A verification code has been sent to ${email}.`);
    } catch (err: unknown) {
      console.error("OTP Request error:", err);
      const message = err instanceof Error ? err.message : "An error occurred. Please try again.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // STEP 2: Verify 6-Digit OTP Code
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = otpDigits.join("");
    if (fullOtp.length !== 6) {
      setErrorMessage("Please enter the complete 6-digit verification code.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await safeFetchJson("/api/admin/otp/verify", {
        email,
        otp: fullOtp,
        challengeToken,
      });

      if (!result.ok) {
        throw new Error(result.data?.error || "Invalid verification code.");
      }

      // Refresh session state from server cookie (set by verify endpoint)
      await refreshSession();
      router.push("/admin/dashboard");
    } catch (err: unknown) {
      console.error("OTP Verification error:", err);
      const message = err instanceof Error ? err.message : "Verification failed. Please try again.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resend OTP handler
  const handleResendOtp = async () => {
    if (cooldownSeconds > 0 || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    setInfoMessage(null);

    try {
      let result = await safeFetchJson("/api/admin/otp/request", { email });
      if (!result.ok && result.status !== 429) {
        result = await safeFetchJson("/api/admin/send-otp", { email });
      }

      if (!result.ok) {
        throw new Error(result.data?.error || "Failed to resend verification code.");
      }

      setOtpDigits(["", "", "", "", "", ""]);
      setCooldownSeconds(60);
      setInfoMessage("A new verification code has been sent to your email.");
      inputRefs.current[0]?.focus();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to resend code.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // OTP Input handlers: Auto-focus, Paste, Backspace navigation, and Autofill support
  const handleOtpChange = (index: number, value: string) => {
    const digitsOnly = value.replace(/\D/g, "");
    if (!digitsOnly) {
      const updated = [...otpDigits];
      updated[index] = "";
      setOtpDigits(updated);
      return;
    }

    if (digitsOnly.length > 1) {
      // User pasted or OS auto-filled multiple digits (e.g. "123456")
      const newDigits = [...otpDigits];
      const filledDigits = digitsOnly.slice(0, 6 - index);
      for (let i = 0; i < filledDigits.length; i++) {
        newDigits[index + i] = filledDigits[i];
      }
      setOtpDigits(newDigits);
      const nextFocus = Math.min(index + filledDigits.length, 5);
      inputRefs.current[nextFocus]?.focus();
      return;
    }

    // Single digit input
    const updated = [...otpDigits];
    updated[index] = digitsOnly;
    setOtpDigits(updated);

    if (digitsOnly && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!otpDigits[index] && index > 0) {
        e.preventDefault();
        const updated = [...otpDigits];
        updated[index - 1] = "";
        setOtpDigits(updated);
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pastedData) {
      const newDigits = [...otpDigits];
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pastedData[i] || "";
      }
      setOtpDigits(newDigits);
      const targetIndex = Math.min(pastedData.length, 5);
      inputRefs.current[targetIndex]?.focus();
    }
  };

  return (
    <main className="min-h-screen bg-surface-base flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Radial Orbs */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(ellipse at center, rgba(9,184,80,0.08) 0%, transparent 70%)" }}
        aria-hidden="true"
      />

      <div className="w-full max-w-md bg-surface-raised border border-border-dark p-8 sm:p-10 rounded-3xl shadow-2xl relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-accent/15 border border-accent/30 text-accent mb-4">
            {step === "email" ? <ShieldCheck size={24} /> : <KeyRound size={24} />}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mb-2">
            {step === "email" ? "Welcome Back" : "Verify Your Identity"}
          </h1>
          <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
            {step === "email"
              ? "Sign in to manage your AWENUE website and business inquiries."
              : "Enter the verification code sent to your registered email address."}
          </p>
        </div>

        {/* Feedback Messages */}
        {errorMessage && (
          <div className="mb-6 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-semibold">
            {errorMessage}
          </div>
        )}
        {infoMessage && (
          <div className="mb-6 p-3.5 bg-accent/10 border border-accent/30 rounded-xl text-accent text-xs font-semibold flex items-start gap-2">
            <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
            <span>{infoMessage}</span>
          </div>
        )}

        {step === "email" ? (
          /* STEP 1: EMAIL ADDRESS FORM */
          <form onSubmit={handleRequestOtp} className="space-y-5">
            <div>
              <label
                htmlFor="admin-email"
                className="text-[11px] font-extrabold text-text-muted uppercase tracking-wider block mb-1.5"
              >
                Admin Email Address
              </label>
              <div className="relative">
                <input
                  id="admin-email"
                  type="email"
                  required
                  suppressHydrationWarning
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your registered admin email"
                  className="w-full bg-surface-base border border-white/10 pl-10 pr-4 py-3.5 rounded-xl text-sm text-white placeholder-text-text-muted/60 outline-none focus:border-accent transition-colors"
                />
                <Mail size={16} className="absolute left-3.5 top-4 text-text-muted" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="w-full bg-accent text-surface-base font-extrabold py-3.5 rounded-xl hover:bg-accent-hover transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-glow disabled:opacity-50 mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Sending Verification Code...
                </>
              ) : (
                <>
                  <span>Send Verification Code</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        ) : (
          /* STEP 2: 6-DIGIT OTP VERIFICATION FORM */
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div>
              <label className="text-[11px] font-extrabold text-text-muted uppercase tracking-wider block mb-3 text-center">
                6-Digit Verification Code
              </label>

              {/* 6 Individual Numeric OTP Input Boxes */}
              <div className="grid grid-cols-6 gap-2 sm:gap-3 my-4 max-w-sm mx-auto">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { inputRefs.current[idx] = el; }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={idx === 0 ? 6 : 1}
                    autoComplete={idx === 0 ? "one-time-code" : "off"}
                    suppressHydrationWarning
                    value={digit}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    onPaste={handleOtpPaste}
                    className={`w-full aspect-[4/5] sm:aspect-square max-h-14 bg-surface-base border text-center text-xl sm:text-2xl font-bold font-mono rounded-xl sm:rounded-2xl outline-none transition-all duration-200 ${
                      digit
                        ? "border-accent text-accent shadow-glow bg-accent/5 ring-1 ring-accent/40"
                        : "border-white/15 text-white focus:border-accent focus:ring-2 focus:ring-accent/40 focus:bg-surface-raised"
                    }`}
                    aria-label={`Digit ${idx + 1}`}
                  />
                ))}
              </div>

              <p className="text-[11px] text-text-muted text-center">
                Sent to: <strong className="text-white">{email}</strong>
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || otpDigits.join("").length !== 6}
              className="w-full bg-accent text-surface-base font-extrabold py-3.5 rounded-xl hover:bg-accent-hover transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-glow disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Verifying Identity...
                </>
              ) : (
                <>
                  <span>Verify & Continue</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            {/* Resend Cooldown Timer & Change Email */}
            <div className="flex items-center justify-between pt-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setErrorMessage(null);
                  setInfoMessage(null);
                }}
                className="text-text-muted hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft size={13} />
                <span>Change Email</span>
              </button>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={cooldownSeconds > 0 || isSubmitting}
                className={`font-bold flex items-center gap-1 ${
                  cooldownSeconds > 0
                    ? "text-text-muted cursor-not-allowed opacity-70"
                    : "text-accent hover:underline cursor-pointer"
                }`}
              >
                <RotateCw size={12} className={cooldownSeconds > 0 ? "" : "animate-spin-once"} />
                <span>
                  {cooldownSeconds > 0
                    ? `Resend code in 00:${cooldownSeconds.toString().padStart(2, "0")}`
                    : "Resend Code"}
                </span>
              </button>
            </div>
          </form>
        )}

        {/* Footer Link */}
        <div className="mt-8 pt-6 border-t border-white/10 text-center">
          <Link href="/" className="text-xs text-text-muted hover:text-white transition-colors">
            &larr; Back to Public Website
          </Link>
        </div>
      </div>
    </main>
  );
}
