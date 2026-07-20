"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import InviteAdminModal from "@/components/admin/InviteAdminModal";
import { ALL_GRANULAR_PERMISSIONS, DEFAULT_ROLE_PERMISSIONS, AdminRole } from "@/lib/rbac";
import {
  Users,
  UserPlus,
  ShieldCheck,
  Clock,
  XCircle,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Crown,
  X,
  Edit3,
  CheckSquare,
  Square,
} from "lucide-react";

interface AdminRecord {
  id: string;
  email: string;
  displayName: string;
  role: string;
  permissions?: string[];
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
  permissions?: string[];
  status: string;
  invitedBy?: string;
  createdAt?: string;
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

  // Edit Permissions Modal
  const [editingAdmin, setEditingAdmin] = useState<AdminRecord | null>(null);
  const [editPermissionsList, setEditPermissionsList] = useState<string[]>([]);
  const [editRole, setEditRole] = useState<string>("admin");
  const [isUpdatingPerms, setIsUpdatingPerms] = useState(false);

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

  // Open Edit Permissions Modal
  const openEditPermissions = (a: AdminRecord) => {
    setEditingAdmin(a);
    setEditRole(a.role);
    const perms = Array.isArray(a.permissions) && a.permissions.length > 0
      ? a.permissions
      : DEFAULT_ROLE_PERMISSIONS[a.role as AdminRole] || [];
    setEditPermissionsList([...perms]);
  };

  // Save Permissions & Role
  const handleSavePermissions = async () => {
    if (!editingAdmin) return;
    setIsUpdatingPerms(true);
    try {
      const res = await fetch("/api/admin/invite", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          targetAdminId: editingAdmin.id,
          action: "edit_permissions",
          role: editRole,
          permissions: editPermissionsList,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update permissions.");
      setEditingAdmin(null);
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error updating permissions.");
    } finally {
      setIsUpdatingPerms(false);
    }
  };

  // Admin action (suspend / reactivate / revoke)
  const handleAdminAction = async (targetAdminId: string, action: string, newRole?: string) => {
    try {
      const res = await fetch("/api/admin/invite", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ targetAdminId, action, newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed.");
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Action failed.");
    }
  };

  // Cancel pending pre-authorization
  const handleCancelInvitation = async (invitationId: string) => {
    try {
      const res = await fetch(`/api/admin/invite?invitationId=${invitationId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to cancel.");
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to cancel.");
    }
  };

  // Stats
  const totalAdmins = admins.length;
  const activeAdmins = admins.filter((a) => a.status === "active").length;
  const suspendedAdmins = admins.filter((a) => a.status === "suspended").length;
  const pendingCount = admins.filter((a) => a.status === "pending").length + pendingInvitations.length;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Admin Management & RBAC Permissions</h1>
          <p className="text-sm text-text-muted mt-1">
            Pre-authorize Google emails, assign granular permissions, and manage active administrator accounts.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="p-2.5 rounded-xl border border-border-dark text-text-muted hover:text-white hover:bg-surface-raised transition-colors cursor-pointer"
            title="Refresh list"
          >
            <RefreshCw size={16} />
          </button>
          {isSuperAdmin && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center gap-2 bg-accent text-surface-base font-extrabold px-5 py-2.5 rounded-xl text-xs hover:bg-accent-hover transition-colors shadow-glow cursor-pointer"
            >
              <UserPlus size={16} />
              <span>Pre-Authorize New Admin</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Admins", value: totalAdmins, icon: Users, color: "text-accent" },
          { label: "Active Admins", value: activeAdmins, icon: CheckCircle2, color: "text-emerald-400" },
          { label: "Pending Activation", value: pendingCount, icon: Clock, color: "text-amber-400" },
          { label: "Suspended", value: suspendedAdmins, icon: XCircle, color: "text-rose-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="bg-surface-raised border border-border-dark rounded-2xl p-5 flex items-center gap-4 shadow-sm"
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
      <div className="bg-surface-raised border border-border-dark rounded-2xl overflow-hidden shadow-md">
        <div className="px-6 py-4 border-b border-border-dark flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
            <ShieldCheck size={16} className="text-accent" />
            Administrators & Assigned Permissions
          </h2>
          <span className="text-xs text-text-muted font-bold">{totalAdmins} total accounts</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-text-muted text-xs font-bold">
            <Loader2 className="animate-spin mr-2" size={18} />
            Loading admin accounts...
          </div>
        ) : admins.length === 0 ? (
          <div className="py-16 text-center text-text-muted text-xs">No admin accounts found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border-dark bg-surface-base/40">
                  {["Admin Name", "Authorized Google Email", "Role Preset", "Status", "Permissions Summary", "Invited By", "Last Activity", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-extrabold text-text-muted/70 uppercase tracking-wider text-[10px]">
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
                  const permsCount = Array.isArray(a.permissions) ? a.permissions.length : 0;

                  return (
                    <tr key={a.id} className={`hover:bg-surface-base/30 transition-colors ${isCurrentAdmin ? "bg-accent/5" : ""}`}>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-accent font-black text-xs shrink-0">
                            {a.displayName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="text-white font-bold block">{a.displayName}</span>
                            {isCurrentAdmin && (
                              <span className="text-[9px] text-accent font-bold block">(You)</span>
                            )}
                            {isSuperAdminTarget && (
                              <span className="text-[9px] text-violet-400 font-bold flex items-center gap-0.5">
                                <Crown size={10} /> Super Admin
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-text-muted font-mono">{a.email}</td>
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
                      <td className="px-4 py-3.5 text-text-muted">
                        <span className="text-[11px] font-bold text-accent bg-accent/10 border border-accent/20 px-2 py-0.5 rounded">
                          {isSuperAdminTarget ? "All Permissions (100%)" : `${permsCount} Modules Granted`}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-text-muted">{a.invitedBy || "—"}</td>
                      <td className="px-4 py-3.5 text-text-muted font-mono">{formatDate(a.lastLoginAt || a.activatedAt)}</td>
                      <td className="px-4 py-3.5">
                        {canModify ? (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                              onClick={() => openEditPermissions(a)}
                              className="text-[10px] font-bold text-accent hover:text-white px-2 py-1 rounded-lg border border-accent/30 hover:bg-accent/20 transition-colors flex items-center gap-1 cursor-pointer"
                              title="Edit Granular Permissions"
                            >
                              <Edit3 size={11} />
                              <span>Permissions</span>
                            </button>

                            {a.status === "pending" && (
                              <>
                                <button
                                  onClick={() => handleAdminAction(a.id, "resend_email")}
                                  className="text-[10px] font-bold text-sky-400 hover:text-sky-300 px-2 py-1 rounded-lg border border-sky-500/20 hover:border-sky-500/40 transition-colors cursor-pointer"
                                >
                                  Resend Email
                                </button>
                                <button
                                  onClick={() => handleCancelInvitation(a.id)}
                                  className="text-[10px] font-bold text-rose-400 hover:text-rose-300 px-2 py-1 rounded-lg border border-rose-500/20 hover:border-rose-500/40 transition-colors cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </>
                            )}

                            {a.status === "active" && !isSuperAdminTarget && (
                              <button
                                onClick={() => handleAdminAction(a.id, "suspend")}
                                className="text-[10px] font-bold text-amber-400 hover:text-amber-300 px-2 py-1 rounded-lg border border-amber-500/20 hover:border-amber-500/40 transition-colors cursor-pointer"
                              >
                                Suspend
                              </button>
                            )}

                            {a.status === "suspended" && (
                              <button
                                onClick={() => handleAdminAction(a.id, "reactivate")}
                                className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 px-2 py-1 rounded-lg border border-emerald-500/20 hover:border-emerald-500/40 transition-colors cursor-pointer"
                              >
                                Reactivate
                              </button>
                            )}

                            {a.status !== "revoked" && !isSuperAdminTarget && (
                              <button
                                onClick={() => {
                                  if (confirm(`Revoke access for ${a.displayName}?`)) {
                                    handleAdminAction(a.id, "revoke");
                                  }
                                }}
                                className="text-[10px] font-bold text-rose-400 hover:text-rose-300 px-2 py-1 rounded-lg border border-rose-500/20 hover:border-rose-500/40 transition-colors cursor-pointer"
                              >
                                Revoke
                              </button>
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

      {/* Pre-Authorization Modal Component */}
      <InviteAdminModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onSuccess={fetchData}
      />

      {/* Edit Permissions Modal */}
      {editingAdmin && (
        <div className="fixed inset-0 z-50 bg-surface-base/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-surface-raised border border-border-dark p-6 sm:p-8 rounded-3xl max-w-xl w-full shadow-2xl relative max-h-[90vh] flex flex-col">
            <button
              onClick={() => setEditingAdmin(null)}
              className="absolute top-5 right-5 text-text-muted hover:text-white p-1"
            >
              <X size={20} />
            </button>

            <div className="mb-4">
              <h3 className="text-lg font-black text-white">Edit Permissions: {editingAdmin.displayName}</h3>
              <p className="text-xs text-text-muted mt-0.5">{editingAdmin.email}</p>
            </div>

            <div className="space-y-4 overflow-y-auto pr-1 flex-1">
              <div className="bg-surface-base border border-white/10 rounded-2xl p-4 space-y-3">
                {ALL_GRANULAR_PERMISSIONS.map((perm) => {
                  const isChecked = editPermissionsList.includes(perm.id);
                  return (
                    <button
                      key={perm.id}
                      type="button"
                      onClick={() => {
                        setEditPermissionsList((prev) =>
                          prev.includes(perm.id) ? prev.filter((p) => p !== perm.id) : [...prev, perm.id]
                        );
                      }}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                        isChecked
                          ? "bg-accent/10 border-accent/40 text-white"
                          : "bg-surface-raised/40 border-white/5 text-text-muted hover:border-white/20"
                      }`}
                    >
                      {isChecked ? (
                        <CheckSquare size={16} className="text-accent shrink-0" />
                      ) : (
                        <Square size={16} className="text-text-muted/60 shrink-0" />
                      )}
                      <div>
                        <span className="text-xs font-bold block text-white">{perm.label}</span>
                        <span className="text-[10px] text-text-muted">{perm.group}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-border-dark shrink-0">
              <button
                onClick={() => setEditingAdmin(null)}
                className="px-4 py-2 rounded-xl border border-white/10 text-xs font-bold text-text-muted hover:text-white"
              >
                Cancel
              </button>
              <button
                disabled={isUpdatingPerms}
                onClick={handleSavePermissions}
                className="px-5 py-2 bg-accent text-surface-base font-extrabold text-xs rounded-xl hover:bg-accent-hover flex items-center gap-2"
              >
                {isUpdatingPerms ? <Loader2 size={14} className="animate-spin" /> : "Save Permissions"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
