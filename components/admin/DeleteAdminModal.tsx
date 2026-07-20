"use client";

import { useState } from "react";
import { AlertTriangle, Trash2, X, Loader2 } from "lucide-react";
import type { AdminDetailRecord } from "./AdminDetailsModal";

interface DeleteAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: (adminId: string) => Promise<void>;
  admin: AdminDetailRecord | null;
}

export function DeleteAdminModal({ isOpen, onClose, onConfirmDelete, admin }: DeleteAdminModalProps) {
  const [confirmInput, setConfirmInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (!isOpen || !admin) return null;

  const isMatched = confirmInput.trim().toUpperCase() === "DELETE" || confirmInput.trim().toLowerCase() === admin.email.toLowerCase();

  const handleDelete = async () => {
    if (!isMatched || isDeleting) return;
    setIsDeleting(true);
    setErrorMessage("");

    try {
      await onConfirmDelete(admin.id);
      setConfirmInput("");
      onClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to delete administrator.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-base/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-surface-raised border border-rose-500/30 w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl relative text-left">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isDeleting}
          className="absolute top-5 right-5 p-2 rounded-xl text-text-muted hover:text-white hover:bg-surface-base transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Warning Icon */}
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 flex items-center justify-center mb-5">
          <AlertTriangle size={28} />
        </div>

        <h2 className="text-xl font-black text-white mb-2">Permanently Delete Administrator?</h2>

        <p className="text-xs text-text-muted leading-relaxed mb-4">
          You are about to permanently remove <strong className="text-white font-mono">{admin.displayName}</strong> ({admin.email}) from the AWENUE Admin authorization system.
        </p>

        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 mb-5 text-xs text-rose-300 leading-relaxed space-y-1">
          <p className="font-bold">⚠️ Warning — Permanent Action:</p>
          <ul className="list-disc list-inside space-y-0.5 text-[11px]">
            <li>Firestore authorization record will be permanently deleted.</li>
            <li>All active pre-authorization tokens for this email will be purged.</li>
            <li>Signing in with Google will no longer grant Admin access.</li>
            <li>Customer inquiries & business records will remain preserved.</li>
          </ul>
        </div>

        {errorMessage && (
          <div className="bg-rose-500/20 border border-rose-500/40 p-3 rounded-xl text-xs text-rose-200 mb-4">
            {errorMessage}
          </div>
        )}

        {/* Confirmation Input */}
        <div className="space-y-2 mb-6">
          <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider">
            Type <span className="text-rose-400 font-mono">DELETE</span> to confirm:
          </label>
          <input
            type="text"
            value={confirmInput}
            onChange={(e) => setConfirmInput(e.target.value)}
            placeholder="Type DELETE"
            disabled={isDeleting}
            className="w-full bg-surface-base border border-white/10 focus:border-rose-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-text-muted/40 outline-none transition-all font-mono"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2.5 bg-surface-base hover:bg-white/10 text-white text-xs font-bold rounded-xl border border-white/10 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={!isMatched || isDeleting}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
          >
            {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            <span>Permanently Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}
