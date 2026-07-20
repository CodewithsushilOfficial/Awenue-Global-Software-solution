"use client";

import { useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { ShieldCheck, Mail, Key, UserCheck, Lock, CheckCircle2, UserPlus } from "lucide-react";
import InviteAdminModal from "@/components/admin/InviteAdminModal";

export default function AdminProfilePage() {
  const { user } = useAuth();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mb-1">
            Admin Profile & Security
          </h1>
          <p className="text-text-muted text-xs sm:text-sm">
            Active administrator security profile, device auto-login state, and admin access control.
          </p>
        </div>

        <button
          onClick={() => setIsInviteModalOpen(true)}
          className="flex items-center gap-2 text-xs text-surface-base font-extrabold bg-accent hover:bg-accent-hover px-4 py-2.5 rounded-xl shadow-glow transition-all cursor-pointer self-start sm:self-auto"
        >
          <UserPlus size={15} />
          <span>Invite New Admin</span>
        </button>
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
              <Key size={13} className="text-accent" /> Device Session Status
            </span>
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 size={14} /> Persistent Auto-Login Active
            </span>
          </div>

          <div className="bg-surface-base p-4 rounded-2xl border border-white/10 space-y-1">
            <span className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
              <Lock size={13} className="text-accent" /> Security Protocol
            </span>
            <span className="text-xs font-bold text-white block">2FA Email OTP & Claims Verified</span>
          </div>
        </div>

        {/* Admin Team Invitation Action Card */}
        <div className="p-5 bg-surface-base border border-accent/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-white font-extrabold text-sm">
              <UserPlus size={16} className="text-accent" /> Expand Admin Team
            </div>
            <p className="text-xs text-text-muted">
              Invite additional team members or partners as authorized administrators.
            </p>
          </div>
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="px-4 py-2 bg-accent/15 border border-accent/30 text-accent hover:bg-accent hover:text-surface-base rounded-xl text-xs font-extrabold transition-all cursor-pointer shrink-0"
          >
            + Invite Admin
          </button>
        </div>

        {/* Security Info Box */}
        <div className="p-4 bg-accent/10 border border-accent/25 rounded-2xl space-y-2 text-xs">
          <div className="flex items-center gap-2 text-accent font-extrabold">
            <ShieldCheck size={18} /> Enterprise Security Protocol Active
          </div>
          <p className="text-text-muted leading-relaxed">
            Your AWENUE Admin session is protected by 2-Factor Email OTP verification, device persistence, and server-side session token validation.
          </p>
        </div>
      </div>

      {/* Invite Admin Modal */}
      <InviteAdminModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
      />
    </div>
  );
}

