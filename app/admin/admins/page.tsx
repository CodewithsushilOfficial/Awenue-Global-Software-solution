"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import InviteAdminModal from "@/components/admin/InviteAdminModal";
import { AdminDetailsModal, type AdminDetailRecord } from "@/components/admin/AdminDetailsModal";
import { DeleteAdminModal } from "@/components/admin/DeleteAdminModal";
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
  Eye,
  Trash2,
  Send,
  Ban,
  RotateCcw,
} from "lucide-react";

interface AdminRecord {
  id: string;
  uid?: string | null;
  email: string;
  displayName: string;
  role: string;
  permissions?: string[];
  status: string;
  invitedBy?: string | null;
  invitedAt?: string | null;
  lastLoginAt?: string | null;
  activatedAt?: string | null;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter Tabs: 'all' | 'active' | 'pending' | 'suspended'
  const [activeTab, setActiveTab] = useState<"all" | "active" | "pending" | "suspended">("all");

  // Modals state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [viewingAdmin, setViewingAdmin] = useState<AdminDetailRecord | null>(null);
  const [deletingAdmin, setDeletingAdmin] = useState<AdminDetailRecord | null>(null);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadAdmins = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/admin/invite", { credentials: "include" });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d.error || "Failed to load admin data.");
        }
        const data = await res.json();
        if (mounted) setAdmins(data.admins || []);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : "Failed to load data.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadAdmins();
    return () => { mounted = false; };
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

  // Admin action (suspend / reactivate / resend_email)
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

  // Hard Database Delete Admin
  const handleConfirmPermanentDelete = async (targetAdminId: string) => {
    const res = await fetch(`/api/admin/invite?targetAdminId=${targetAdminId}`, {
      method: "DELETE",
      credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to delete admin from database.");

    // Update state immediately
    setAdmins((prev) => prev.filter((a) => a.id !== targetAdminId));
    await fetchData();
  };

  // Stats
  const totalAdmins = admins.length;
  const activeAdmins = admins.filter((a) => a.status === "active").length;
  const pendingAdmins = admins.filter((a) => a.status === "pending").length;
  const suspendedAdmins = admins.filter((a) => a.status === "suspended").length;

  // Filtered List
  const filteredAdmins = admins.filter((a) => {
    if (activeTab === "active") return a.status === "active";
    if (activeTab === "pending") return a.status === "pending";
    if (activeTab === "suspended") return a.status === "suspended";
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Admin Management & RBAC Permissions</h1>
          <p className="text-xs text-text-muted mt-1">
            Pre-authorize Google emails, manage role-based access control, and suspend/delete admins.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="p-2.5 rounded-xl bg-surface-raised border border-white/10 hover:border-white/20 text-text-muted hover:text-white transition-colors cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>

          {isSuperAdmin && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="px-4 py-2.5 bg-accent hover:bg-accent/90 text-surface-base font-bold text-xs rounded-xl shadow-lg shadow-accent/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <UserPlus size={16} />
              <span>Invite New Admin</span>
            </button>
          )}
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-raised border border-white/10 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-accent/15 border border-accent/30 text-accent flex items-center justify-center shrink-0">
            <Users size={22} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Total Administrators</span>
            <p className="text-2xl font-black text-white">{totalAdmins}</p>
          </div>
        </div>

        <div className="bg-surface-raised border border-emerald-500/20 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Active Admins</span>
            <p className="text-2xl font-black text-emerald-400">{activeAdmins}</p>
          </div>
        </div>

        <div className="bg-surface-raised border border-amber-500/20 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
            <Clock size={22} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Pending Pre-Auth</span>
            <p className="text-2xl font-black text-amber-400">{pendingAdmins}</p>
          </div>
        </div>

        <div className="bg-surface-raised border border-rose-500/20 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
            <XCircle size={22} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Suspended</span>
            <p className="text-2xl font-black text-rose-400">{suspendedAdmins}</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
        {(["all", "active", "pending", "suspended"] as const).map((tab) => {
          const count =
            tab === "all"
              ? totalAdmins
              : tab === "active"
              ? activeAdmins
              : tab === "pending"
              ? pendingAdmins
              : suspendedAdmins;

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer capitalize flex items-center gap-2 ${
                activeTab === tab
                  ? "bg-accent/20 text-accent border border-accent/40 shadow-md"
                  : "bg-surface-raised/40 text-text-muted hover:text-white hover:bg-surface-raised border border-transparent"
              }`}
            >
              <span>{tab === "all" ? "All Accounts" : tab}</span>
              <span className="px-1.5 py-0.5 rounded-md bg-white/10 text-[10px]">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Table Section */}
      <div className="bg-surface-raised border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck size={16} className="text-accent" />
            <span>Authorized Admin Roster ({filteredAdmins.length})</span>
          </h2>
        </div>

        {loading ? (
          <div className="p-12 text-center text-text-muted flex items-center justify-center gap-3">
            <Loader2 size={20} className="animate-spin text-accent" />
            <span>Fetching Firestore administrator database...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-400 flex items-center justify-center gap-2">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        ) : filteredAdmins.length === 0 ? (
          <div className="p-12 text-center text-text-muted">
            <Users size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-xs font-bold">No administrator accounts match the selected tab filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-surface-base/60 text-text-muted text-[10px] font-bold uppercase tracking-wider border-b border-white/10">
                  <th className="px-4 py-3">Administrator</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Permissions Summary</th>
                  <th className="px-4 py-3">Invited By</th>
                  <th className="px-4 py-3">Last Login</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium">
                {filteredAdmins.map((a) => {
                  const isSuperAdminTarget = a.role === "super_admin" || a.id === "super_admin_permanent";
                  const currentAdminId = admin?.adminId;
                  const canModify = isSuperAdmin && !isSuperAdminTarget && a.id !== currentAdminId;
                  const permsCount = isSuperAdminTarget
                    ? ALL_GRANULAR_PERMISSIONS.length
                    : Array.isArray(a.permissions) && a.permissions.length > 0
                    ? a.permissions.length
                    : (DEFAULT_ROLE_PERMISSIONS[a.role as AdminRole] || []).length;

                  return (
                    <tr key={a.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-accent/10 border border-accent/30 text-accent font-bold flex items-center justify-center text-xs shrink-0">
                            {a.displayName ? a.displayName.charAt(0).toUpperCase() : "A"}
                          </div>
                          <div>
                            <div className="font-bold text-white flex items-center gap-1.5">
                              <span>{a.displayName}</span>
                              {isSuperAdminTarget && <Crown size={12} className="text-amber-400" />}
                            </div>
                            <div className="text-[10px] text-text-muted font-mono">{a.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <Badge label={ROLE_LABELS[a.role] || a.role} colorClass={ROLE_COLORS[a.role] || ROLE_COLORS.admin} />
                      </td>

                      <td className="px-4 py-3.5">
                        <Badge
                          label={a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                          colorClass={STATUS_COLORS[a.status] || STATUS_COLORS.active}
                        />
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-surface-base border border-white/10 text-white font-mono">
                          {isSuperAdminTarget ? "All (30+ Root)" : `${permsCount} Module Perms`}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-text-muted">{a.invitedBy || "System Bootstrap"}</td>

                      <td className="px-4 py-3.5 text-text-muted font-mono">{formatDate(a.lastLoginAt || a.activatedAt)}</td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Details Button */}
                          <button
                            onClick={() => setViewingAdmin(a as AdminDetailRecord)}
                            className="p-1.5 text-text-muted hover:text-white rounded-lg border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                            title="View Complete Admin Details"
                          >
                            <Eye size={13} />
                          </button>

                          {/* Edit Permissions Button */}
                          {canModify && (
                            <button
                              onClick={() => openEditPermissions(a)}
                              className="p-1.5 text-accent hover:text-white rounded-lg border border-accent/30 hover:bg-accent/20 transition-colors cursor-pointer"
                              title="Edit Granular RBAC Permissions"
                            >
                              <Edit3 size={13} />
                            </button>
                          )}

                          {/* Resend Email for Pending */}
                          {canModify && a.status === "pending" && (
                            <button
                              onClick={() => handleAdminAction(a.id, "resend_email")}
                              className="p-1.5 text-sky-400 hover:text-sky-300 rounded-lg border border-sky-500/30 hover:bg-sky-500/20 transition-colors cursor-pointer"
                              title="Resend Invitation Email"
                            >
                              <Send size={13} />
                            </button>
                          )}

                          {/* Suspend / Reactivate */}
                          {canModify && a.status === "active" && (
                            <button
                              onClick={() => handleAdminAction(a.id, "suspend")}
                              className="p-1.5 text-amber-400 hover:text-amber-300 rounded-lg border border-amber-500/30 hover:bg-amber-500/20 transition-colors cursor-pointer"
                              title="Suspend Admin Access"
                            >
                              <Ban size={13} />
                            </button>
                          )}

                          {canModify && a.status === "suspended" && (
                            <button
                              onClick={() => handleAdminAction(a.id, "reactivate")}
                              className="p-1.5 text-emerald-400 hover:text-emerald-300 rounded-lg border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors cursor-pointer"
                              title="Reactivate Admin Access"
                            >
                              <RotateCcw size={13} />
                            </button>
                          )}

                          {/* Hard Delete Button */}
                          {canModify && (
                            <button
                              onClick={() => setDeletingAdmin(a as AdminDetailRecord)}
                              className="p-1.5 text-rose-400 hover:text-rose-300 rounded-lg border border-rose-500/30 hover:bg-rose-500/20 transition-colors cursor-pointer"
                              title="Permanently Delete Admin from Database"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
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

      {/* View Admin Details Modal */}
      <AdminDetailsModal
        isOpen={!!viewingAdmin}
        onClose={() => setViewingAdmin(null)}
        admin={viewingAdmin}
      />

      {/* Permanent Delete Modal */}
      <DeleteAdminModal
        isOpen={!!deletingAdmin}
        onClose={() => setDeletingAdmin(null)}
        onConfirmDelete={handleConfirmPermanentDelete}
        admin={deletingAdmin}
      />

      {/* Edit Permissions Modal */}
      {editingAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-base/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-surface-raised border border-border-dark w-full max-w-2xl rounded-3xl p-6 sm:p-8 shadow-2xl relative text-left max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
              <div>
                <h2 className="text-xl font-black text-white">Edit RBAC Permissions</h2>
                <p className="text-xs text-text-muted font-mono">{editingAdmin.displayName} ({editingAdmin.email})</p>
              </div>
              <button onClick={() => setEditingAdmin(null)} className="p-2 rounded-xl text-text-muted hover:text-white cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <div className="py-6 space-y-6 overflow-y-auto pr-1">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-text-muted uppercase">Admin Role</label>
                <select
                  value={editRole}
                  onChange={(e) => {
                    const r = e.target.value;
                    setEditRole(r);
                    setEditPermissionsList([...(DEFAULT_ROLE_PERMISSIONS[r as AdminRole] || [])]);
                  }}
                  className="w-full bg-surface-base border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-accent"
                >
                  <option value="admin">Admin</option>
                  <option value="content_admin">Content Admin</option>
                  <option value="support_admin">Support Admin</option>
                  {isSuperAdmin && <option value="super_admin">Super Admin</option>}
                </select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-text-muted uppercase">Granular Permissions</label>
                  <button
                    type="button"
                    onClick={() => {
                      if (editPermissionsList.length === ALL_GRANULAR_PERMISSIONS.length) {
                        setEditPermissionsList([]);
                      } else {
                        setEditPermissionsList(ALL_GRANULAR_PERMISSIONS.map((p) => p.id));
                      }
                    }}
                    className="text-[11px] font-bold text-accent hover:underline cursor-pointer"
                  >
                    {editPermissionsList.length === ALL_GRANULAR_PERMISSIONS.length ? "Deselect All" : "Select All"}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ALL_GRANULAR_PERMISSIONS.map((perm) => {
                    const isChecked = editPermissionsList.includes(perm.id);
                    return (
                      <div
                        key={perm.id}
                        onClick={() => {
                          if (isChecked) {
                            setEditPermissionsList(editPermissionsList.filter((k) => k !== perm.id));
                          } else {
                            setEditPermissionsList([...editPermissionsList, perm.id]);
                          }
                        }}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                          isChecked ? "bg-accent/15 border-accent/40 text-white" : "bg-surface-base border-white/5 text-text-muted"
                        }`}
                      >
                        <div>
                          <div className="font-bold text-white">{perm.label}</div>
                          <div className="text-[10px] text-text-muted">{perm.group}</div>
                        </div>
                        {isChecked ? <CheckSquare size={16} className="text-accent shrink-0" /> : <Square size={16} className="text-text-muted/40 shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex justify-end gap-3 shrink-0">
              <button onClick={() => setEditingAdmin(null)} className="px-4 py-2.5 bg-surface-base text-white text-xs font-bold rounded-xl border border-white/10 cursor-pointer">
                Cancel
              </button>
              <button onClick={handleSavePermissions} disabled={isUpdatingPerms} className="px-5 py-2.5 bg-accent text-surface-base text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer">
                {isUpdatingPerms && <Loader2 size={14} className="animate-spin" />}
                <span>Save Permissions</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
