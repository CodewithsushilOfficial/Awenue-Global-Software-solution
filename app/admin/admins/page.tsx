"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  Users,
  UserPlus,
  ShieldCheck,
  Clock,
  XCircle,
  Mail,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Crown,
  Send,
  X,
} from "lucide-react";

interface AdminRecord {
  id: string;
  email: string;
  displayName: string;
  role: string;
  status: string;
  invitedBy?: string;
  invitedAt?: string;
  lastLoginAt?: string;
  activatedAt?: string;
}

interface PendingInvitation {
  id: string;
  email: string;
  displayName: string;
  role: string;
  status: string;
  invitedBy?: string;
  createdAt?: string;
  expiresAt?: string;
}

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  content_admin: "Content Admin",
  support_admin: "Support Admin",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  pending: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  suspended: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  revoked: "bg-gray-500/15 text-gray-400 border-gray-500/30",
};

const ROLE_COLORS: Record<string, string> = {
  super_admin: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  admin: "bg-accent/15 text-accent border-accent/30",
  content_admin: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  support_admin: "bg-orange-500/15 text-orange-400 border-orange-500/30",
};

function Badge({ label, colorClass }: { label: string; colorClass: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${colorClass}`}>
      {label}
    </span>
  );
}

function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

export default function AdminManagementPage() {
  const { admin } = useAuth();
  const isSuperAdmin = admin?.role === "super_admin";

  const [admins, setAdmins] = useState<AdminRecord[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Invite modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ displayName: "", email: "", role: "admin" });
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  // Action feedback
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ id: string; msg: string; ok: boolean } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/invite", { credentials: "include" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Failed to load admin data.");
      }
      const data = await res.json();
      setAdmins(data.admins || []);
      setPendingInvitations(data.pendingInvitations || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      try {
        const res = await fetch("/api/admin/invite", { credentials: "include" });
        if (!mounted) return;
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d.error || "Failed to load admin data.");
        }
        const data = await res.json();
        if (mounted) {
          setAdmins(data.admins || []);
          setPendingInvitations(data.pendingInvitations || []);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to load data.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  // ── Invite new admin ──
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteLoading(true);
    setInviteError(null);
    setInviteSuccess(null);

    try {
      const res = await fetch("/api/admin/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(inviteForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send invitation.");

      setInviteSuccess(`Invitation sent to ${inviteForm.email}!`);
      setInviteForm({ displayName: "", email: "", role: "admin" });
      await fetchData();
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : "Failed to send invitation.");
    } finally {
      setInviteLoading(false);
    }
  };

  // ── Admin action (suspend / reactivate / revoke / change role) ──
  const handleAdminAction = async (
    targetAdminId: string,
    action: string,
    newRole?: string
  ) => {
    setActionLoading(targetAdminId + action);
    setActionFeedback(null);
    try {
      const res = await fetch("/api/admin/invite", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ targetAdminId, action, newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed.");
      setActionFeedback({ id: targetAdminId, msg: data.message || "Done.", ok: true });
      await fetchData();
    } catch (err) {
      setActionFeedback({
        id: targetAdminId,
        msg: err instanceof Error ? err.message : "Action failed.",
        ok: false,
      });
    } finally {
      setActionLoading(null);
    }
  };

  // ── Cancel pending invitation ──
  const handleCancelInvitation = async (invitationId: string) => {
    setActionLoading("inv_" + invitationId);
    try {
      const res = await fetch(`/api/admin/invite?invitationId=${invitationId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to cancel.");
      await fetchData();
    } catch (err) {
      setActionFeedback({
        id: invitationId,
        msg: err instanceof Error ? err.message : "Failed.",
        ok: false,
      });
    } finally {
      setActionLoading(null);
    }
  };

  // ── Resend invitation ──
  const handleResendInvitation = async (invitationId: string) => {
    setActionLoading("resend_" + invitationId);
    try {
      const res = await fetch("/api/admin/invite/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ invitationId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to resend.");
      setActionFeedback({ id: invitationId, msg: "Invitation resent!", ok: true });
      await fetchData();
    } catch (err) {
      setActionFeedback({
        id: invitationId,
        msg: err instanceof Error ? err.message : "Failed.",
        ok: false,
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Stats
  const totalAdmins = admins.length;
  const activeAdmins = admins.filter((a) => a.status === "active").length;
  const suspendedAdmins = admins.filter((a) => a.status === "suspended").length;
  const pendingCount = pendingInvitations.length;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Admin Management</h1>
          <p className="text-sm text-text-muted mt-1">
            Manage administrators, roles, invitations, and access.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="p-2 rounded-lg border border-border-dark text-text-muted hover:text-white transition-colors"
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
          {isSuperAdmin && (
            <button
              onClick={() => { setShowInviteModal(true); setInviteError(null); setInviteSuccess(null); }}
              className="flex items-center gap-2 bg-accent text-surface-base font-bold px-4 py-2 rounded-xl text-sm hover:bg-accent-hover transition-colors shadow-glow"
            >
              <UserPlus size={15} />
              Invite New Admin
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Admins", value: totalAdmins, icon: Users, color: "text-accent" },
          { label: "Active Admins", value: activeAdmins, icon: CheckCircle2, color: "text-emerald-400" },
          { label: "Pending Invitations", value: pendingCount, icon: Clock, color: "text-amber-400" },
          { label: "Suspended", value: suspendedAdmins, icon: XCircle, color: "text-rose-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="bg-surface-raised border border-border-dark rounded-2xl p-5 flex items-center gap-4"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-surface-base ${color}`}>
              <Icon size={18} />
            </div>
            <div>
              <p className="text-2xl font-black text-white">{value}</p>
              <p className="text-[11px] text-text-muted font-semibold">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Admins Table */}
      <div className="bg-surface-raised border border-border-dark rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border-dark flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
            <ShieldCheck size={16} className="text-accent" />
            Administrators
          </h2>
          <span className="text-xs text-text-muted">{totalAdmins} total</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-text-muted">
            <Loader2 className="animate-spin mr-2" size={18} />
            Loading admins...
          </div>
        ) : admins.length === 0 ? (
          <div className="py-16 text-center text-text-muted text-sm">No admins found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border-dark">
                  {["Name", "Email", "Role", "Status", "Invited By", "Last Login", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-bold text-text-muted/70 uppercase tracking-wider text-[10px]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-dark/50">
                {admins.map((a) => {
                  const isCurrentAdmin = a.id === admin?.adminId;
                  const isSuperAdminTarget = a.role === "super_admin";
                  const canModify = isSuperAdmin && !isCurrentAdmin;
                  const isActing = actionLoading === a.id + "suspend" ||
                    actionLoading === a.id + "reactivate" ||
                    actionLoading === a.id + "revoke";

                  return (
                    <tr key={a.id} className={`hover:bg-surface-base/30 transition-colors ${isCurrentAdmin ? "bg-accent/5" : ""}`}>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-accent font-black text-xs shrink-0">
                            {a.displayName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="text-white font-bold">{a.displayName}</span>
                            {isCurrentAdmin && (
                              <span className="ml-1.5 text-[9px] text-accent font-bold">(You)</span>
                            )}
                            {isSuperAdminTarget && (
                              <Crown size={10} className="inline ml-1 text-violet-400" />
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-text-muted">{a.email}</td>
                      <td className="px-4 py-3.5">
                        <Badge
                          label={ROLE_LABELS[a.role] || a.role}
                          colorClass={ROLE_COLORS[a.role] || ROLE_COLORS.admin}
                        />
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge
                          label={a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                          colorClass={STATUS_COLORS[a.status] || STATUS_COLORS.active}
                        />
                      </td>
                      <td className="px-4 py-3.5 text-text-muted">{a.invitedBy || "—"}</td>
                      <td className="px-4 py-3.5 text-text-muted">{formatDate(a.lastLoginAt)}</td>
                      <td className="px-4 py-3.5">
                        {canModify ? (
                          <div className="flex items-center gap-1.5">
                            {a.status === "active" && !isSuperAdminTarget && (
                              <button
                                disabled={!!isActing}
                                onClick={() => handleAdminAction(a.id, "suspend")}
                                className="text-[10px] font-bold text-amber-400 hover:text-amber-300 px-2 py-1 rounded-lg border border-amber-500/20 hover:border-amber-500/40 transition-colors disabled:opacity-50"
                              >
                                {isActing ? <Loader2 size={10} className="animate-spin" /> : "Suspend"}
                              </button>
                            )}
                            {a.status === "suspended" && (
                              <button
                                disabled={!!isActing}
                                onClick={() => handleAdminAction(a.id, "reactivate")}
                                className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 px-2 py-1 rounded-lg border border-emerald-500/20 hover:border-emerald-500/40 transition-colors disabled:opacity-50"
                              >
                                Reactivate
                              </button>
                            )}
                            {a.status !== "revoked" && !isSuperAdminTarget && (
                              <button
                                disabled={!!isActing}
                                onClick={() => {
                                  if (confirm(`Revoke access for ${a.displayName}? This cannot be undone easily.`)) {
                                    handleAdminAction(a.id, "revoke");
                                  }
                                }}
                                className="text-[10px] font-bold text-rose-400 hover:text-rose-300 px-2 py-1 rounded-lg border border-rose-500/20 hover:border-rose-500/40 transition-colors disabled:opacity-50"
                              >
                                Revoke
                              </button>
                            )}
                            {actionFeedback?.id === a.id && (
                              <span className={`text-[10px] font-bold ${actionFeedback.ok ? "text-emerald-400" : "text-rose-400"}`}>
                                {actionFeedback.msg}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-text-muted/40">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <div className="bg-surface-raised border border-border-dark rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border-dark flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Clock size={16} className="text-amber-400" />
              Pending Invitations
            </h2>
            <span className="text-xs text-text-muted">{pendingCount} pending</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border-dark">
                  {["Name", "Email", "Role", "Invited By", "Expires", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-bold text-text-muted/70 uppercase tracking-wider text-[10px]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-dark/50">
                {pendingInvitations.map((inv) => {
                  const isExpired = inv.expiresAt && new Date(inv.expiresAt) < new Date();
                  const isResending = actionLoading === "resend_" + inv.id;
                  const isCancelling = actionLoading === "inv_" + inv.id;

                  return (
                    <tr key={inv.id} className="hover:bg-surface-base/30 transition-colors">
                      <td className="px-4 py-3.5 text-white font-bold">{inv.displayName}</td>
                      <td className="px-4 py-3.5 text-text-muted flex items-center gap-1.5">
                        <Mail size={12} className="text-text-muted/60" />
                        {inv.email}
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge
                          label={ROLE_LABELS[inv.role] || inv.role}
                          colorClass={ROLE_COLORS[inv.role] || ROLE_COLORS.admin}
                        />
                      </td>
                      <td className="px-4 py-3.5 text-text-muted">{inv.invitedBy || "—"}</td>
                      <td className="px-4 py-3.5">
                        <span className={`text-[10px] font-bold ${isExpired ? "text-rose-400" : "text-amber-400"}`}>
                          {isExpired ? "Expired" : formatDate(inv.expiresAt)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        {isSuperAdmin && (
                          <div className="flex items-center gap-1.5">
                            <button
                              disabled={!!isResending}
                              onClick={() => handleResendInvitation(inv.id)}
                              className="text-[10px] font-bold text-accent hover:text-accent-hover px-2 py-1 rounded-lg border border-accent/20 hover:border-accent/40 transition-colors disabled:opacity-50 flex items-center gap-1"
                            >
                              {isResending ? <Loader2 size={10} className="animate-spin" /> : <Send size={10} />}
                              Resend
                            </button>
                            <button
                              disabled={!!isCancelling}
                              onClick={() => handleCancelInvitation(inv.id)}
                              className="text-[10px] font-bold text-rose-400 hover:text-rose-300 px-2 py-1 rounded-lg border border-rose-500/20 hover:border-rose-500/40 transition-colors disabled:opacity-50"
                            >
                              {isCancelling ? <Loader2 size={10} className="animate-spin" /> : "Cancel"}
                            </button>
                            {actionFeedback?.id === inv.id && (
                              <span className={`text-[10px] font-bold ${actionFeedback.ok ? "text-emerald-400" : "text-rose-400"}`}>
                                {actionFeedback.msg}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div
          className="fixed inset-0 bg-surface-base/80 backdrop-blur-md z-50 flex items-center justify-center p-6"
          onClick={(e) => e.target === e.currentTarget && setShowInviteModal(false)}
        >
          <div className="w-full max-w-md bg-surface-raised border border-border-dark rounded-3xl p-8 relative">
            <button
              onClick={() => setShowInviteModal(false)}
              className="absolute top-4 right-4 p-2 text-text-muted hover:text-white transition-colors rounded-lg"
            >
              <X size={18} />
            </button>

            <div className="mb-6">
              <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent mb-3">
                <UserPlus size={20} />
              </div>
              <h2 className="text-lg font-black text-white">Invite New Admin</h2>
              <p className="text-xs text-text-muted mt-1">
                An invitation email with a secure activation link will be sent.
              </p>
            </div>

            {inviteSuccess ? (
              <div className="p-4 bg-accent/10 border border-accent/30 rounded-xl text-accent text-sm flex items-center gap-2">
                <CheckCircle2 size={16} />
                {inviteSuccess}
              </div>
            ) : (
              <form onSubmit={handleInvite} className="space-y-4">
                {inviteError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs">
                    {inviteError}
                  </div>
                )}

                <div>
                  <label className="text-[11px] font-extrabold text-text-muted uppercase tracking-wider block mb-1.5">
                    Full Name *
                  </label>
                  <input
                    required
                    type="text"
                    value={inviteForm.displayName}
                    onChange={(e) => setInviteForm({ ...inviteForm, displayName: e.target.value })}
                    placeholder="e.g. Rahul Kumar"
                    className="w-full bg-surface-base border border-white/10 px-4 py-3 rounded-xl text-sm text-white placeholder-text-muted/50 outline-none focus:border-accent transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-extrabold text-text-muted uppercase tracking-wider block mb-1.5">
                    Email Address *
                  </label>
                  <input
                    required
                    type="email"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    placeholder="e.g. rahul@awenue.com"
                    className="w-full bg-surface-base border border-white/10 px-4 py-3 rounded-xl text-sm text-white placeholder-text-muted/50 outline-none focus:border-accent transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-extrabold text-text-muted uppercase tracking-wider block mb-1.5">
                    Role *
                  </label>
                  <select
                    value={inviteForm.role}
                    onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                    className="w-full bg-surface-base border border-white/10 px-4 py-3 rounded-xl text-sm text-white outline-none focus:border-accent transition-colors"
                  >
                    <option value="admin">Admin</option>
                    <option value="content_admin">Content Admin</option>
                    <option value="support_admin">Support Admin</option>
                  </select>
                  <p className="text-[10px] text-text-muted mt-1.5">
                    Super Admin accounts can only be created via the server bootstrap script.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="w-full bg-accent text-surface-base font-extrabold py-3 rounded-xl hover:bg-accent-hover transition-colors flex items-center justify-center gap-2 mt-2 disabled:opacity-50 shadow-glow"
                >
                  {inviteLoading ? (
                    <><Loader2 className="animate-spin" size={16} /> Sending Invitation...</>
                  ) : (
                    <><Send size={15} /> Send Admin Invitation</>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
