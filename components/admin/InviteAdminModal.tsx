"use client";

import { useState } from "react";
import { UserPlus, Mail, User, ShieldCheck, Loader2, CheckCircle2, X, CheckSquare, Square } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { ALL_GRANULAR_PERMISSIONS, DEFAULT_ROLE_PERMISSIONS, AdminRole } from "@/lib/rbac";

interface InviteAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function InviteAdminModal({ isOpen, onClose, onSuccess }: InviteAdminModalProps) {
  const { admin } = useAuth();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<AdminRole>("admin");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
    DEFAULT_ROLE_PERMISSIONS.admin || []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleRoleChange = (newRole: AdminRole) => {
    setRole(newRole);
    const defaultPerms = DEFAULT_ROLE_PERMISSIONS[newRole] || [];
    setSelectedPermissions([...defaultPerms]);
  };

  if (!isOpen) return null;

  const togglePermission = (permId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
    );
  };

  const handleSelectAllRecommended = () => {
    const defaultPerms = DEFAULT_ROLE_PERMISSIONS[role] || [];
    setSelectedPermissions([...defaultPerms]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setErrorMessage("Please enter a valid Google email address.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const cleanFullName = fullName.trim() || "Administrator";

      const res = await fetch("/api/admin/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizedEmail,
          displayName: cleanFullName,
          role,
          permissions: selectedPermissions,
        }),
      });

      const text = await res.text();
      let data: Record<string, unknown> = {};
      try {
        data = JSON.parse(text);
      } catch {
        data = {};
      }

      if (!res.ok) {
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : "Failed to pre-authorize admin email."
        );
      }

      setSuccessMessage(
        `Google email ${normalizedEmail} pre-authorized! When they sign in at /admin/login using Google, their access activates automatically.`
      );
      setEmail("");
      setFullName("");
      setRole("admin");

      if (onSuccess) {
        onSuccess();
      }

      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred while authorizing admin.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group permissions by category
  const permissionGroups = ALL_GRANULAR_PERMISSIONS.reduce((acc, perm) => {
    if (!acc[perm.group]) acc[perm.group] = [];
    acc[perm.group].push(perm);
    return acc;
  }, {} as Record<string, typeof ALL_GRANULAR_PERMISSIONS>);

  return (
    <div className="fixed inset-0 z-50 bg-surface-base/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-surface-raised border border-border-dark p-6 sm:p-8 rounded-3xl max-w-2xl w-full shadow-2xl relative my-8 max-h-[90vh] flex flex-col">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-text-muted hover:text-white p-1 transition-colors cursor-pointer"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="text-center mb-5 shrink-0">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-accent/15 border border-accent/30 text-accent mb-3">
            <UserPlus size={24} />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">Pre-Authorize New Admin</h2>
          <p className="text-xs text-text-muted mt-1 leading-relaxed">
            Pre-authorize a Google account and assign granular permissions.
          </p>
        </div>

        {/* Feedback Messages */}
        {errorMessage && (
          <div className="mb-4 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-semibold shrink-0">
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="mb-4 p-3.5 bg-accent/10 border border-accent/30 rounded-xl text-accent text-xs font-semibold flex items-start gap-2 shrink-0">
            <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
            <span className="leading-relaxed">{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1 flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-extrabold text-text-muted uppercase tracking-wider block mb-1">
                Admin Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. Ashutosh Chatterjee"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-surface-base border border-white/10 pl-10 pr-4 py-3 rounded-xl text-xs text-white placeholder-text-text-muted/60 outline-none focus:border-accent"
                />
                <User size={15} className="absolute left-3.5 top-3.5 text-text-muted" />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-extrabold text-text-muted uppercase tracking-wider block mb-1">
                Authorized Google Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="awenueglobalsoftwaresolutions@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface-base border border-white/10 pl-10 pr-4 py-3 rounded-xl text-xs text-white placeholder-text-text-muted/60 outline-none focus:border-accent"
                />
                <Mail size={15} className="absolute left-3.5 top-3.5 text-text-muted" />
              </div>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-extrabold text-text-muted uppercase tracking-wider block mb-1">
              Admin Role Preset
            </label>
            <div className="relative">
              <select
                value={role}
                onChange={(e) => handleRoleChange(e.target.value as AdminRole)}
                className="w-full bg-surface-base border border-white/10 pl-10 pr-4 py-3 rounded-xl text-xs text-white outline-none focus:border-accent cursor-pointer appearance-none"
              >
                <option value="admin">Admin (Standard Dashboard Access)</option>
                <option value="content_admin">Content Admin (CMS & Portfolio Access)</option>
                <option value="support_admin">Support Admin (Leads & Queries Access)</option>
              </select>
              <ShieldCheck size={15} className="absolute left-3.5 top-3.5 text-text-muted" />
            </div>
          </div>

          {/* Granular Permissions Section */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-extrabold text-text-muted uppercase tracking-wider block">
                Granular Access Permissions ({selectedPermissions.length} selected)
              </label>
              <button
                type="button"
                onClick={handleSelectAllRecommended}
                className="text-[11px] font-bold text-accent hover:underline cursor-pointer"
              >
                Select Recommended
              </button>
            </div>

            <div className="bg-surface-base border border-white/10 rounded-2xl p-4 max-h-60 overflow-y-auto space-y-4">
              {Object.entries(permissionGroups).map(([groupName, groupPerms]) => (
                <div key={groupName} className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase text-accent tracking-wider block border-b border-white/5 pb-1">
                    {groupName}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {groupPerms.map((perm) => {
                      const isChecked = selectedPermissions.includes(perm.id);
                      return (
                        <button
                          key={perm.id}
                          type="button"
                          onClick={() => togglePermission(perm.id)}
                          className={`flex items-start gap-2.5 p-2 rounded-xl border text-left transition-colors cursor-pointer ${
                            isChecked
                              ? "bg-accent/10 border-accent/40 text-white"
                              : "bg-surface-raised/40 border-white/5 text-text-muted hover:border-white/20"
                          }`}
                        >
                          {isChecked ? (
                            <CheckSquare size={14} className="text-accent shrink-0 mt-0.5" />
                          ) : (
                            <Square size={14} className="text-text-muted/60 shrink-0 mt-0.5" />
                          )}
                          <span className="text-[11px] leading-snug font-medium">{perm.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-text-muted leading-relaxed bg-surface-base p-3 rounded-xl border border-white/5">
            <strong>Google Auth Pre-Authorization:</strong> No email invitation token required. When this person visits <code className="text-accent">/admin/login</code> and clicks &quot;Continue with Google&quot; using this exact Google account, their access activates automatically with these assigned permissions.
          </p>

          <div className="pt-2 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-white/10 text-xs font-bold text-text-muted hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || admin?.role !== "super_admin"}
              className="bg-accent text-surface-base font-extrabold px-5 py-2.5 rounded-xl hover:bg-accent-hover transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-glow disabled:opacity-50 text-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Pre-Authorizing...
                </>
              ) : (
                <>
                  <UserPlus size={15} />
                  <span>Pre-Authorize Google Account</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
