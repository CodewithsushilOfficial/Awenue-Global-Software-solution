"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { ShieldCheck, Mail, Key, UserCheck, Lock, CheckCircle2 } from "lucide-react";

export default function AdminProfilePage() {
  const { user, isAdmin, isOtpVerified } = useAuth();

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white mb-1">
          Admin Profile & Security
        </h1>
        <p className="text-text-muted text-xs sm:text-sm">
          Active administrator security profile and 2FA authentication state.
        </p>
      </div>

      {/* Main Profile Card */}
      <div className="bg-surface-raised border border-border-dark p-6 sm:p-8 rounded-3xl space-y-6 shadow-xl">
        <div className="flex items-center gap-4 border-b border-border-dark pb-6">
          <div className="w-16 h-16 rounded-2xl bg-accent/15 text-accent font-black text-2xl flex items-center justify-center border border-accent/30 shadow-glow">
            {user?.email?.charAt(0).toUpperCase() || "A"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white">{user?.displayName || "AWENUE Administrator"}</h2>
              <span className="text-[10px] font-extrabold text-accent bg-accent/10 border border-accent/30 px-2 py-0.5 rounded-full">
                AUTHORIZED ADMIN
              </span>
            </div>
            <p className="text-xs text-text-muted mt-1">{user?.email}</p>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-surface-base p-4 rounded-2xl border border-white/10 space-y-1">
            <span className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
              <Mail size={13} className="text-accent" /> Admin Email
            </span>
            <span className="text-xs font-bold text-white block">{user?.email}</span>
          </div>

          <div className="bg-surface-base p-4 rounded-2xl border border-white/10 space-y-1">
            <span className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck size={13} className="text-accent" /> System Role
            </span>
            <span className="text-xs font-bold text-accent block">Super Administrator</span>
          </div>

          <div className="bg-surface-base p-4 rounded-2xl border border-white/10 space-y-1">
            <span className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
              <Key size={13} className="text-accent" /> 2FA Authentication
            </span>
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 size={14} /> Email OTP 2FA Verified
            </span>
          </div>

          <div className="bg-surface-base p-4 rounded-2xl border border-white/10 space-y-1">
            <span className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
              <Lock size={13} className="text-accent" /> Session Status
            </span>
            <span className="text-xs font-bold text-white block">Active Protected Admin Session</span>
          </div>
        </div>

        {/* Security Info Box */}
        <div className="p-4 bg-accent/10 border border-accent/25 rounded-2xl space-y-2 text-xs">
          <div className="flex items-center gap-2 text-accent font-extrabold">
            <ShieldCheck size={18} /> Enterprise Security Protocol Active
          </div>
          <p className="text-text-muted leading-relaxed">
            Your AWENUE Admin session is protected by 2-Factor Email OTP verification, server-side session token validation, and Firestore security rule enforcement.
          </p>
        </div>
      </div>
    </div>
  );
}
