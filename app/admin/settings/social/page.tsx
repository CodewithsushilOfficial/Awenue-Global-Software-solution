"use client";

import { useEffect, useState, useCallback } from "react";
import { collection, getDocs, doc, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  X,
  Loader2,
  ArrowUp,
  ArrowDown,
  Eye,
  Settings2,
} from "lucide-react";
import SocialIcon, { PLATFORM_NAMES, SocialPlatform } from "@/components/icons/SocialIcons";

interface SocialLinkItem {
  id: string;
  platform: string;
  displayName: string;
  url: string;
  isActive: boolean;
  displayOrder: number;
  openInNewTab: boolean;
  ariaLabel: string;
  createdAt?: string;
  updatedAt?: string;
}

const PLATFORMS_LIST = [
  { id: "whatsapp", name: "WhatsApp" },
  { id: "linkedin", name: "LinkedIn" },
  { id: "instagram", name: "Instagram" },
  { id: "x", name: "X / Twitter" },
  { id: "facebook", name: "Facebook" },
  { id: "youtube", name: "YouTube" },
  { id: "github", name: "GitHub" },
  { id: "telegram", name: "Telegram" },
  { id: "threads", name: "Threads" },
  { id: "discord", name: "Discord" },
  { id: "pinterest", name: "Pinterest" },
  { id: "custom", name: "Custom Platform" },
];

export default function AdminSocialSettingsPage() {
  const [socialLinks, setSocialLinks] = useState<SocialLinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingLink, setEditingLink] = useState<Partial<SocialLinkItem> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchSocialLinks = useCallback(async () => {
    try {
      const snap = await getDocs(collection(db, "socialLinks"));
      const list: SocialLinkItem[] = [];
      snap.forEach((docSnap) => {
        list.push({ ...docSnap.data(), id: docSnap.id } as SocialLinkItem);
      });
      // Sort by displayOrder ascending
      list.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
      setSocialLinks(list);
    } catch (err) {
      console.error("Error fetching social links:", err);
      showFeedback("error", "Failed to fetch social links from database.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSocialLinks();
  }, [fetchSocialLinks]);

  const showFeedback = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleOpenAdd = () => {
    const nextOrder = socialLinks.length > 0 
      ? Math.max(...socialLinks.map((l) => l.displayOrder || 0)) + 1 
      : 1;

    setEditingLink({
      platform: "linkedin",
      displayName: "LinkedIn",
      url: "",
      isActive: true,
      displayOrder: nextOrder,
      openInNewTab: true,
      ariaLabel: "Visit AWENUE on LinkedIn",
    });
  };

  const handlePlatformChange = (p: string) => {
    if (!editingLink) return;
    const name = PLATFORM_NAMES[p as SocialPlatform] || "Custom";
    setEditingLink({
      ...editingLink,
      platform: p,
      displayName: name,
      ariaLabel: p === "whatsapp" 
        ? `Contact AWENUE on WhatsApp` 
        : p === "custom" 
          ? `Visit AWENUE` 
          : `Follow AWENUE on ${name}`,
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLink || isSaving) return;

    if (!editingLink.url) {
      showFeedback("error", "Profile URL or Phone number is required.");
      return;
    }

    setIsSaving(true);
    try {
      const isNew = !editingLink.id;
      const docId = isNew 
        ? `social-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
        : editingLink.id;

      const res = await fetch("/api/admin/cms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: isNew ? "add" : "update",
          collectionName: "socialLinks",
          docId: isNew ? undefined : docId,
          data: {
            platform: editingLink.platform,
            displayName: editingLink.displayName,
            url: editingLink.url,
            isActive: editingLink.isActive,
            displayOrder: Number(editingLink.displayOrder) || 1,
            openInNewTab: editingLink.openInNewTab,
            ariaLabel: editingLink.ariaLabel,
          },
        }),
      });

      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData?.error || "Failed to save record.");
      }

      showFeedback("success", `Social link ${isNew ? "added" : "updated"} successfully!`);
      setEditingLink(null);
      await fetchSocialLinks();
    } catch (err: any) {
      console.error("Save social link error:", err);
      showFeedback("error", err?.message || "Failed to save. Please ensure URL starts with https://");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (item: SocialLinkItem) => {
    try {
      const updatedStatus = !item.isActive;
      const res = await fetch("/api/admin/cms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          collectionName: "socialLinks",
          docId: item.id,
          data: {
            isActive: updatedStatus,
          },
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData?.error || "Failed to toggle status.");
      }

      setSocialLinks((prev) =>
        prev.map((l) => (l.id === item.id ? { ...l, isActive: updatedStatus } : l))
      );
      showFeedback("success", `Social link status changed to ${updatedStatus ? "Active" : "Inactive"}.`);
    } catch (err: any) {
      console.error("Status toggle error:", err);
      showFeedback("error", err?.message || "Failed to update link status.");
    }
  };

  const handleMoveOrder = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= socialLinks.length) return;

    const current = { ...socialLinks[index] };
    const target = { ...socialLinks[targetIndex] };

    const tempOrder = current.displayOrder;
    current.displayOrder = target.displayOrder;
    target.displayOrder = tempOrder;

    // Optimistic local state update
    const reordered = [...socialLinks];
    reordered[index] = target;
    reordered[targetIndex] = current;
    reordered.sort((a, b) => a.displayOrder - b.displayOrder);
    setSocialLinks(reordered);

    try {
      // Save changes to database
      await Promise.all([
        fetch("/api/admin/cms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "update",
            collectionName: "socialLinks",
            docId: current.id,
            data: { displayOrder: current.displayOrder },
          }),
        }),
        fetch("/api/admin/cms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "update",
            collectionName: "socialLinks",
            docId: target.id,
            data: { displayOrder: target.displayOrder },
          }),
        }),
      ]);
      showFeedback("success", "Display order updated successfully!");
    } catch (err) {
      console.error("Reorder save error:", err);
      showFeedback("error", "Reorder saved locally, but database sync failed.");
      fetchSocialLinks(); // reload to sync back
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch("/api/admin/cms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          collectionName: "socialLinks",
          docId: id,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData?.error || "Failed to delete link.");
      }

      showFeedback("success", "Social link deleted successfully.");
      setDeleteConfirmId(null);
      await fetchSocialLinks();
    } catch (err: any) {
      console.error("Delete error:", err);
      showFeedback("error", err?.message || "Failed to delete social link.");
    }
  };

  // Preview elements
  const activeSocials = socialLinks.filter((s) => s.isActive);

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Page Title & Intro */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mb-1 flex items-center gap-2">
            <Settings2 size={24} className="text-accent" /> Social Media Links
          </h1>
          <p className="text-text-muted text-xs sm:text-sm">
            Manage the social media accounts displayed under "Stay Connected" in the website footer.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-accent text-surface-base font-extrabold text-xs px-5 py-3 rounded-xl hover:bg-accent-hover transition-colors shadow-glow flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus size={16} /> Add Social Media
        </button>
      </div>

      {/* Alerts */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-bold flex items-center gap-2.5 ${
            feedback.type === "success"
              ? "bg-accent/15 border-accent/30 text-accent"
              : "bg-rose-500/15 border-rose-500/30 text-rose-400"
          }`}
        >
          {feedback.type === "success" ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
          <span>{feedback.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Links List (Col 1-2) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface-raised border border-border-dark rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
            <h2 className="text-sm font-extrabold text-white uppercase tracking-widest border-b border-white/10 pb-3">
              Configured Platforms
            </h2>

            {loading ? (
              <div className="py-12 text-center text-text-muted text-xs flex items-center justify-center gap-2">
                <Loader2 className="animate-spin" size={18} /> Loading social media handles...
              </div>
            ) : socialLinks.length === 0 ? (
              <div className="py-12 text-center text-text-muted text-xs">
                <p className="mb-4">No social media links added yet.</p>
                <button
                  onClick={handleOpenAdd}
                  className="px-4 py-2 border border-accent/30 text-accent text-xs font-extrabold rounded-xl bg-accent/5 hover:bg-accent/10 transition-colors"
                >
                  Create First Link
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-text-muted font-bold text-[10px] uppercase tracking-wider">
                      <th className="py-3.5 pl-2">Icon</th>
                      <th className="py-3.5">Platform</th>
                      <th className="py-3.5">Display Name</th>
                      <th className="py-3.5 hidden md:table-cell">Profile URL</th>
                      <th className="py-3.5 text-center">Status</th>
                      <th className="py-3.5 text-center">Order</th>
                      <th className="py-3.5 text-right pr-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {socialLinks.map((item, idx) => (
                      <tr
                        key={item.id}
                        className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="py-4 pl-2">
                          <span className="w-8 h-8 rounded-lg bg-surface-base border border-white/10 flex items-center justify-center text-accent">
                            <SocialIcon platform={item.platform} className="w-4 h-4" />
                          </span>
                        </td>
                        <td className="py-4 font-bold text-white uppercase tracking-wide text-[10px]">
                          {item.platform}
                        </td>
                        <td className="py-4 font-medium text-text-secondary">{item.displayName}</td>
                        <td className="py-4 text-text-muted max-w-[150px] truncate hidden md:table-cell">
                          {item.url}
                        </td>
                        <td className="py-4 text-center">
                          <button
                            onClick={() => handleToggleStatus(item)}
                            className={`px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase transition-all tracking-wider cursor-pointer ${
                              item.isActive
                                ? "bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20"
                                : "bg-white/5 border border-white/15 text-text-muted hover:bg-white/10"
                            }`}
                          >
                            {item.isActive ? "Active" : "Inactive"}
                          </button>
                        </td>
                        <td className="py-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              disabled={idx === 0}
                              onClick={() => handleMoveOrder(idx, "up")}
                              className="p-1 text-text-muted hover:text-white disabled:opacity-30 disabled:hover:text-text-muted cursor-pointer"
                              title="Move Up"
                            >
                              <ArrowUp size={14} />
                            </button>
                            <span className="font-extrabold text-white text-[11px] w-4 text-center">
                              {item.displayOrder}
                            </span>
                            <button
                              disabled={idx === socialLinks.length - 1}
                              onClick={() => handleMoveOrder(idx, "down")}
                              className="p-1 text-text-muted hover:text-white disabled:opacity-30 disabled:hover:text-text-muted cursor-pointer"
                              title="Move Down"
                            >
                              <ArrowDown size={14} />
                            </button>
                          </div>
                        </td>
                        <td className="py-4 text-right pr-2">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setEditingLink(item)}
                              className="p-2 text-text-muted hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                              title="Edit Link"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(item.id)}
                              className="p-2 text-text-muted hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="Delete Link"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Live Footer Preview Column (Col 3) */}
        <div className="space-y-6">
          <div className="bg-[#0A0F0D] border border-border-dark rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[300px]">
            {/* Background Glow exactly like live website */}
            <div
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[250px] h-[100px] pointer-events-none"
              style={{ background: "radial-gradient(ellipse at bottom, rgba(9,184,80,0.15) 0%, transparent 70%)" }}
              aria-hidden="true"
            />

            <div className="space-y-4 relative z-10">
              <div className="flex items-center gap-2 text-xs font-extrabold text-accent uppercase tracking-widest">
                <Eye size={14} /> Live Footer Preview
              </div>

              <div className="border-t border-white/10 pt-4 space-y-4">
                <h3 className="text-xs font-extrabold text-white uppercase tracking-widest border-b border-white/10 pb-2">
                  Stay Connected
                </h3>
                <p className="text-text-muted text-xs leading-relaxed font-normal">
                  Subscribe to get our latest tech logs, software architecture updates, and growth strategies.
                </p>

                {/* Social media icons container */}
                {activeSocials.length === 0 ? (
                  <p className="text-[10px] text-text-muted italic pt-2">No active social links to show</p>
                ) : (
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    {activeSocials.map((link) => (
                      <span
                        key={link.id}
                        className="w-10 h-10 rounded-xl bg-surface-raised border border-white/10 flex items-center justify-center text-text-muted cursor-pointer hover:text-accent hover:border-accent/40 hover:shadow-glow transition-all duration-300 transform hover:scale-110"
                        title={link.displayName}
                      >
                        <SocialIcon platform={link.platform} className="w-5 h-5" />
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-8 border-t border-white/5 text-[9px] text-text-muted relative z-10 flex items-center justify-between">
              <span>All Systems Operational</span>
              <span>© 2026 AWENUE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Save/Edit Modal */}
      {editingLink && (
        <div className="fixed inset-0 bg-surface-base/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-surface-raised border border-border-dark rounded-3xl w-full max-w-xl p-6 sm:p-8 relative shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setEditingLink(null)}
              className="absolute top-4 right-4 p-1.5 text-text-muted hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>

            <div>
              <h2 className="text-lg font-black text-white">
                {editingLink.id ? "Edit Social Media Link" : "Add Social Media Platform"}
              </h2>
              <p className="text-xs text-text-muted">
                Configure a social profile link to be dynamically rendered in the website footer.
              </p>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Platform Dropdown */}
              <div>
                <label className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider block mb-1">
                  Social Platform
                </label>
                <select
                  disabled={!!editingLink.id}
                  value={editingLink.platform}
                  onChange={(e) => handlePlatformChange(e.target.value)}
                  className="w-full bg-surface-base border border-border-dark px-3.5 py-2.5 rounded-xl text-xs text-white outline-none focus:border-accent disabled:opacity-50"
                >
                  {PLATFORMS_LIST.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* URL input */}
              <div>
                <label className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider block mb-1">
                  {editingLink.platform === "whatsapp" 
                    ? "Profile URL or Phone number (with country code)" 
                    : "Profile / Social Media URL"}
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    editingLink.platform === "whatsapp"
                      ? "+919876543210 (normalizes to wa.me link)"
                      : `https://www.${editingLink.platform || "linkedin"}.com/in/...`
                  }
                  value={editingLink.url || ""}
                  onChange={(e) => setEditingLink({ ...editingLink, url: e.target.value })}
                  className="w-full bg-surface-base border border-border-dark px-3.5 py-2.5 rounded-xl text-xs text-white outline-none focus:border-accent"
                />
                {editingLink.platform === "whatsapp" && (
                  <p className="text-[10px] text-text-muted mt-1">
                    Entering a raw phone number (like 9876543210 with country code) will normalize to <code>https://wa.me/9876543210</code> on save.
                  </p>
                )}
              </div>

              {/* Display Name */}
              <div>
                <label className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider block mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  value={editingLink.displayName || ""}
                  onChange={(e) => setEditingLink({ ...editingLink, displayName: e.target.value })}
                  className="w-full bg-surface-base border border-border-dark px-3.5 py-2.5 rounded-xl text-xs text-white outline-none focus:border-accent"
                />
              </div>

              {/* Aria Label */}
              <div>
                <label className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider block mb-1">
                  Accessibility Label (ARIA)
                </label>
                <input
                  type="text"
                  required
                  value={editingLink.ariaLabel || ""}
                  onChange={(e) => setEditingLink({ ...editingLink, ariaLabel: e.target.value })}
                  className="w-full bg-surface-base border border-border-dark px-3.5 py-2.5 rounded-xl text-xs text-white outline-none focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Display Order */}
                <div>
                  <label className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider block mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={editingLink.displayOrder || 1}
                    onChange={(e) => setEditingLink({ ...editingLink, displayOrder: Number(e.target.value) })}
                    className="w-full bg-surface-base border border-border-dark px-3.5 py-2.5 rounded-xl text-xs text-white outline-none focus:border-accent"
                  />
                </div>

                {/* Open In New Tab */}
                <div className="flex flex-col justify-center">
                  <span className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider block mb-1">
                    Open Links
                  </span>
                  <label className="flex items-center gap-2 text-xs font-bold text-white cursor-pointer select-none py-2.5">
                    <input
                      type="checkbox"
                      checked={editingLink.openInNewTab !== false}
                      onChange={(e) => setEditingLink({ ...editingLink, openInNewTab: e.target.checked })}
                      className="accent-accent w-4 h-4 rounded"
                    />
                    <span>Open in new tab</span>
                  </label>
                </div>
              </div>

              {/* Status active/inactive */}
              <div>
                <span className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider block mb-1">
                  Link Visibility
                </span>
                <label className="flex items-center gap-2 text-xs font-bold text-white cursor-pointer select-none py-1">
                  <input
                    type="checkbox"
                    checked={editingLink.isActive !== false}
                    onChange={(e) => setEditingLink({ ...editingLink, isActive: e.target.checked })}
                    className="accent-accent w-4 h-4 rounded"
                  />
                  <span>Active (renders icon on live footer)</span>
                </label>
              </div>

              {/* Submit CTA */}
              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingLink(null)}
                  className="px-5 py-2.5 rounded-xl border border-white/10 text-white hover:bg-white/5 text-xs font-extrabold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-accent text-surface-base font-extrabold text-xs px-6 py-2.5 rounded-xl hover:bg-accent-hover transition-colors shadow-glow flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="animate-spin" size={14} /> Saving...
                    </>
                  ) : (
                    "Save Social Link"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Alert */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-surface-base/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-surface-raised border border-border-dark rounded-3xl w-full max-w-md p-6 sm:p-8 relative shadow-2xl space-y-5">
            <div>
              <h2 className="text-lg font-black text-white">Delete Social Media Link?</h2>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                The configured platform icon will be permanently removed from the website footer and the database record deleted.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2.5 rounded-xl border border-white/10 text-white hover:bg-white/5 text-xs font-extrabold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-5 py-2.5 rounded-xl bg-rose-500 text-white hover:bg-rose-600 text-xs font-extrabold cursor-pointer transition-colors"
              >
                Delete Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
