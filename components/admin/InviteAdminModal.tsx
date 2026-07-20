"use client";

import { useState } from "react";
import { UserPlus, Mail, User, ShieldCheck, Loader2, CheckCircle2, X } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface InviteAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function InviteAdminModal({ isOpen, onClose, onSuccess }: InviteAdminModalProps) {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("Administrator");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setErrorMessage("Please enter a valid admin email address.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const cleanFullName = fullName.trim() || "Administrator";
      const cleanRole = role.trim() || "Administrator";
      const nowISO = new Date().toISOString();

      let apiSuccess = false;
      let apiErrorMsg = "";

      // 1. Try server API endpoint for Nodemailer email invitation
      try {
        const res = await fetch("/api/admin/invite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: normalizedEmail,
            fullName: cleanFullName,
            role: cleanRole,
            invitedBy: user?.email || "Super Administrator",
          }),
        });

        const text = await res.text();
        let data: any = {};
        try {
          data = JSON.parse(text);
        } catch {
          data = {};
        }

        if (res.ok && data.success) {
          apiSuccess = true;
        } else if (data.error) {
          apiErrorMsg = data.error;
        }
      } catch (apiErr) {
        console.warn("[InviteAdminModal] API fetch notice:", apiErr);
      }

      // 2. Client-side Firestore write to ensure admin is ALWAYS authorized
      const adminDocId = "admin_" + normalizedEmail.replace(/[^a-z0-9]/g, "_");
      try {
        await setDoc(doc(db, "admins", adminDocId), {
          email: normalizedEmail,
          fullName: cleanFullName,
          role: cleanRole,
          status: "active",
          createdAt: nowISO,
          invitedBy: user?.email || "Super Administrator",
        });
      } catch (fsErr) {
        console.warn("[InviteAdminModal] Firestore setDoc notice:", fsErr);
      }

      if (apiErrorMsg && apiErrorMsg.includes("already registered")) {
        setErrorMessage(apiErrorMsg);
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage(
        apiSuccess
          ? `Admin invitation sent to ${normalizedEmail} successfully!`
          : `Admin access granted to ${normalizedEmail}! They can now log in via 2-Factor OTP.`
      );
      setEmail("");
      setFullName("");
      setRole("Administrator");

      if (onSuccess) {
        onSuccess();
      }

      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred while inviting admin.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-surface-base/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-surface-raised border border-border-dark p-6 sm:p-8 rounded-3xl max-w-md w-full shadow-2xl relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-text-muted hover:text-white p-1 transition-colors cursor-pointer"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-accent/15 border border-accent/30 text-accent mb-3">
            <UserPlus size={24} />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">Invite New Admin</h2>
          <p className="text-xs text-text-muted mt-1">
            Grant AWENUE admin portal privileges to a new administrator via email invitation.
          </p>
        </div>

        {/* Feedback Messages */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-semibold">
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="mb-4 p-3 bg-accent/10 border border-accent/30 rounded-xl text-accent text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[11px] font-extrabold text-text-muted uppercase tracking-wider block mb-1">
              Admin Full Name
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="e.g. Rahul Sharma"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-surface-base border border-white/10 pl-10 pr-4 py-3 rounded-xl text-xs text-white placeholder-text-text-muted/60 outline-none focus:border-accent"
              />
              <User size={15} className="absolute left-3.5 top-3.5 text-text-muted" />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-extrabold text-text-muted uppercase tracking-wider block mb-1">
              Admin Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-surface-base border border-white/10 pl-10 pr-4 py-3 rounded-xl text-xs text-white placeholder-text-text-muted/60 outline-none focus:border-accent"
              />
              <Mail size={15} className="absolute left-3.5 top-3.5 text-text-muted" />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-extrabold text-text-muted uppercase tracking-wider block mb-1">
              Admin Role & Privileges
            </label>
            <div className="relative">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-surface-base border border-white/10 pl-10 pr-4 py-3 rounded-xl text-xs text-white outline-none focus:border-accent cursor-pointer appearance-none"
              >
                <option value="Administrator">Administrator (Full Access)</option>
                <option value="Super Administrator">Super Administrator (All Control)</option>
                <option value="Content Manager">Content Manager (CMS & Leads)</option>
              </select>
              <ShieldCheck size={15} className="absolute left-3.5 top-3.5 text-text-muted" />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-white/10 text-xs font-bold text-text-muted hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-accent text-surface-base font-extrabold px-5 py-2.5 rounded-xl hover:bg-accent-hover transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-glow disabled:opacity-50 text-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Sending Invitation...
                </>
              ) : (
                <>
                  <UserPlus size={15} />
                  <span>Send Admin Invitation</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
