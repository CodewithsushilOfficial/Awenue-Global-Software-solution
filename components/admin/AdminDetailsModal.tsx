"use client";

import { X, ShieldCheck, Mail, Calendar, User, Clock, CheckCircle2, Lock } from "lucide-react";
import { ROLE_LABELS, ALL_GRANULAR_PERMISSIONS, DEFAULT_ROLE_PERMISSIONS, type AdminRole } from "@/lib/rbac";

const ROLE_COLORS: Record<string, string> = {
  super_admin: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  admin: "bg-accent/15 text-accent border-accent/30",
  content_admin: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  support_admin: "bg-orange-500/15 text-orange-400 border-orange-500/30",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  pending: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  suspended: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  revoked: "bg-gray-500/15 text-gray-400 border-gray-500/30",
};

export interface AdminDetailRecord {
  id: string;
  uid?: string | null;
  email: string;
  displayName: string;
  role: string;
  permissions?: string[];
  status: string;
  emailDeliveryStatus?: string;
  invitedBy?: string | null;
  invitedAt?: string | null;
  activatedAt?: string | null;
  lastLoginAt?: string | null;
  createdAt?: string | null;
}

interface AdminDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  admin: AdminDetailRecord | null;
}

export function AdminDetailsModal({ isOpen, onClose, admin }: AdminDetailsModalProps) {
  if (!isOpen || !admin) return null;

  const isSuperAdmin = admin.role === "super_admin";
  const activePermissions = isSuperAdmin
    ? ALL_GRANULAR_PERMISSIONS.map((p) => p.id)
    : Array.isArray(admin.permissions) && admin.permissions.length > 0
    ? admin.permissions
    : DEFAULT_ROLE_PERMISSIONS[admin.role as AdminRole] || [];

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-base/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-surface-raised border border-border-dark w-full max-w-xl rounded-3xl p-6 sm:p-8 shadow-2xl relative text-left max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent font-black text-lg">
              {admin.displayName ? admin.displayName.charAt(0).toUpperCase() : "A"}
            </div>
            <div>
              <h2 className="text-xl font-black text-white leading-tight">{admin.displayName}</h2>
              <p className="text-xs text-text-muted font-mono">{admin.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-text-muted hover:text-white hover:bg-surface-base transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="py-6 space-y-6 overflow-y-auto pr-1">
          {/* Status & Role Badges */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-surface-base border border-white/10 p-3.5 rounded-2xl space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Assigned Role</span>
              <div>
                <span className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded ${ROLE_COLORS[admin.role] || ROLE_COLORS.admin}`}>
                  {ROLE_LABELS[admin.role as AdminRole] || admin.role}
                </span>
              </div>
            </div>

            <div className="bg-surface-base border border-white/10 p-3.5 rounded-2xl space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Account Status</span>
              <div>
                <span className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded ${STATUS_COLORS[admin.status] || STATUS_COLORS.active}`}>
                  {admin.status.charAt(0).toUpperCase() + admin.status.slice(1)}
                </span>
              </div>
            </div>
          </div>

          {/* Activity Metadata */}
          <div className="bg-surface-base border border-white/10 rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Clock size={14} className="text-accent" />
              <span>Activity & Lifecycle Timestamps</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2 text-text-muted">
                <User size={14} className="shrink-0 text-accent/70" />
                <span>Invited By: <strong className="text-white">{admin.invitedBy || "System Bootstrap"}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-text-muted">
                <Calendar size={14} className="shrink-0 text-accent/70" />
                <span>Created: <strong className="text-white">{formatDate(admin.createdAt || admin.invitedAt)}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-text-muted">
                <CheckCircle2 size={14} className="shrink-0 text-accent/70" />
                <span>Activated: <strong className="text-white">{formatDate(admin.activatedAt)}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-text-muted">
                <Mail size={14} className="shrink-0 text-accent/70" />
                <span>Last Login: <strong className="text-white">{formatDate(admin.lastLoginAt)}</strong></span>
              </div>
            </div>
          </div>

          {/* Granular Permissions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Lock size={14} className="text-accent" />
                <span>Granted RBAC Permissions ({activePermissions.length}/{ALL_GRANULAR_PERMISSIONS.length})</span>
              </h3>
            </div>

            {isSuperAdmin ? (
              <div className="p-3.5 bg-violet-500/10 border border-violet-500/30 rounded-2xl text-violet-300 text-xs font-bold flex items-center gap-2">
                <ShieldCheck size={16} />
                <span>Super Administrator has unrestricted root access across all system modules.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ALL_GRANULAR_PERMISSIONS.map((perm) => {
                  const isGranted = activePermissions.includes(perm.id);
                  return (
                    <div
                      key={perm.id}
                      className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                        isGranted
                          ? "bg-accent/10 border-accent/30 text-white font-semibold"
                          : "bg-surface-base/40 border-white/5 text-text-muted/40"
                      }`}
                    >
                      <div className="truncate pr-2">
                        <span className="block text-[11px] font-bold">{perm.label}</span>
                        <span className="block text-[9px] text-text-muted truncate">{perm.group}</span>
                      </div>
                      <span className={`text-[10px] font-black shrink-0 px-1.5 py-0.5 rounded ${isGranted ? "bg-accent/20 text-accent" : "bg-white/5 text-text-muted/30"}`}>
                        {isGranted ? "ALLOWED" : "DENIED"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-white/10 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-surface-base hover:bg-white/10 text-white text-xs font-bold rounded-xl border border-white/10 transition-colors cursor-pointer"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}
