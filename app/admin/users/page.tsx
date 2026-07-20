"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Users,
  Search,
  Filter,
  UserCheck,
  UserX,
  ShieldAlert,
  Loader2,
  RefreshCw,
  Mail,
  Calendar,
  Phone,
} from "lucide-react";

interface UserAccount {
  id: string;
  uid: string;
  fullName: string;
  email: string;
  phone?: string;
  disabled: boolean;
  status: "active" | "disabled";
  createdAt: string;
  lastLogin?: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updatingUid, setUpdatingUid] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ user: UserAccount; nextDisabled: boolean } | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (res.ok && Array.isArray(data.users)) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error("Error loading users:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) fetchUsers();
    });
    return () => {
      active = false;
    };
  }, [fetchUsers]);

  const handleToggleUserStatus = async (user: UserAccount, nextDisabled: boolean) => {
    setUpdatingUid(user.uid);
    setConfirmModal(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: user.uid, disabled: nextDisabled }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update user.");

      setUsers((prev) =>
        prev.map((u) =>
          u.uid === user.uid
            ? { ...u, disabled: nextDisabled, status: nextDisabled ? "disabled" : "active" }
            : u
        )
      );

      setFeedback(`User ${user.email} is now ${nextDisabled ? "disabled" : "enabled"}.`);
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error updating user status.";
      setFeedback(`Error: ${msg}`);
    } finally {
      setUpdatingUid(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.uid.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && !u.disabled) ||
      (statusFilter === "disabled" && u.disabled);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mb-1">
            Registered User Management
          </h1>
          <p className="text-text-muted text-xs sm:text-sm">
            Manage registered web accounts and access privileges securely via Firebase Admin SDK.
          </p>
        </div>

        <button
          onClick={fetchUsers}
          className="flex items-center gap-2 text-xs text-accent font-bold bg-surface-raised border border-border-dark hover:border-accent/40 px-3.5 py-2 rounded-xl self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh Users
        </button>
      </div>

      {feedback && (
        <div className="p-3.5 bg-accent/15 border border-accent/30 rounded-xl text-accent text-xs font-bold">
          {feedback}
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-surface-raised border border-border-dark p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between shadow-xl">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search by name, email, UID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-base border border-white/10 pl-9 pr-4 py-2.5 rounded-xl text-xs text-white outline-none focus:border-accent"
          />
          <Search size={14} className="absolute left-3 top-3 text-text-muted" />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Filter size={14} className="text-text-muted" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-surface-base border border-white/10 px-3.5 py-2 rounded-xl text-xs text-white outline-none cursor-pointer focus:border-accent"
          >
            <option value="all">All User Statuses</option>
            <option value="active">Active Accounts</option>
            <option value="disabled">Disabled Accounts</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface-raised border border-border-dark rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-16 text-center text-text-muted text-xs flex items-center justify-center gap-2">
            <Loader2 className="animate-spin" size={18} /> Loading user accounts...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-16 text-center text-text-muted text-xs space-y-2">
            <Users size={32} className="mx-auto text-text-muted/40" />
            <p>No registered user accounts found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-text-muted">
              <thead className="text-[10px] uppercase font-extrabold text-text-muted bg-surface-base/60 border-b border-border-dark">
                <tr>
                  <th className="py-3 px-4">User Details</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4">Joined Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredUsers.map((u) => (
                  <tr key={u.uid} className="hover:bg-surface-base/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white">
                      {u.fullName}
                      <span className="block text-[10px] font-mono font-normal text-text-muted/70">
                        UID: {u.uid}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-white/90">{u.email}</div>
                      {u.phone && <div className="text-[10px] text-text-muted">{u.phone}</div>}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                          !u.disabled
                            ? "bg-accent/15 text-accent border-accent/30"
                            : "bg-rose-500/15 text-rose-400 border-rose-500/30"
                        }`}
                      >
                        {!u.disabled ? <UserCheck size={12} /> : <UserX size={12} />}
                        {!u.disabled ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-text-muted">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {updatingUid === u.uid ? (
                        <span className="text-[10px] font-bold text-accent animate-pulse">
                          Updating...
                        </span>
                      ) : u.disabled ? (
                        <button
                          onClick={() => setConfirmModal({ user: u, nextDisabled: false })}
                          className="px-3 py-1 bg-accent/10 border border-accent/30 text-accent hover:bg-accent hover:text-surface-base rounded-lg text-xs font-bold transition-all cursor-pointer"
                        >
                          Enable User
                        </button>
                      ) : (
                        <button
                          onClick={() => setConfirmModal({ user: u, nextDisabled: true })}
                          className="px-3 py-1 bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500 hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                        >
                          Disable User
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Status Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 bg-surface-base/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-surface-raised border border-border-dark p-6 rounded-3xl max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center mx-auto">
              <ShieldAlert size={24} />
            </div>

            <h3 className="text-lg font-black text-white">
              {confirmModal.nextDisabled ? "Disable User Account?" : "Enable User Account?"}
            </h3>

            <p className="text-xs text-text-muted leading-relaxed">
              Are you sure you want to {confirmModal.nextDisabled ? "disable" : "enable"} access for{" "}
              <strong className="text-white">{confirmModal.user.email}</strong>?
            </p>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 rounded-xl border border-white/10 text-xs font-bold text-text-muted hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  handleToggleUserStatus(confirmModal.user, confirmModal.nextDisabled)
                }
                className={`px-5 py-2 rounded-xl text-xs font-extrabold cursor-pointer ${
                  confirmModal.nextDisabled
                    ? "bg-rose-500 text-white hover:bg-rose-600"
                    : "bg-accent text-surface-base hover:bg-accent-hover"
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
