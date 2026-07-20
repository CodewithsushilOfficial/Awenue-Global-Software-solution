"use client";

import { useEffect, useState, useCallback } from "react";
import {
  collection,
  query,
  orderBy,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Search,
  Filter,
  Eye,
  Trash2,
  X,
  Loader2,
  Mail,
  Phone,
  Building,
  Calendar,
} from "lucide-react";

interface ConsultationRequest {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  companyName?: string;
  consultationType: string;
  message: string;
  status: "new" | "contacted" | "scheduled" | "completed" | "resolved" | "archived";
  createdAt: string;
  adminNotes?: string;
  updatedAt?: string;
}

export default function AdminConsultationsPage() {
  const [consultations, setConsultations] = useState<ConsultationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedConsultation, setSelectedConsultation] = useState<ConsultationRequest | null>(null);
  const [notesInput, setNotesInput] = useState("");
  const [statusInput, setStatusInput] = useState<ConsultationRequest["status"]>("new");
  const [isUpdating, setIsUpdating] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);


  const fetchConsultations = useCallback(async () => {
    try {
      let list: ConsultationRequest[] = [];
      try {
        const q = query(collection(db, "consultationRequests"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        snap.forEach((docSnap) => {
          list.push({ ...docSnap.data(), id: docSnap.id } as ConsultationRequest);
        });
      } catch {
        const res = await fetch("/api/admin/cms?collectionName=consultationRequests");
        const json = await res.json();
        if (res.ok && Array.isArray(json.data)) {
          list = json.data;
        }
      }
      setConsultations(list);
    } catch (err) {
      console.error("Error fetching consultations:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) fetchConsultations();
    });
    return () => {
      active = false;
    };
  }, [fetchConsultations]);

  const openDetail = (item: ConsultationRequest) => {
    setSelectedConsultation(item);
    setNotesInput(item.adminNotes || "");
    setStatusInput(item.status);
  };

  const handleUpdate = async () => {
    if (!selectedConsultation) return;
    setIsUpdating(true);
    try {
      const updatedAt = new Date().toISOString();
      const payload = {
        status: statusInput,
        adminNotes: notesInput,
        updatedAt,
      };

      const res = await fetch("/api/admin/cms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          collectionName: "consultationRequests",
          docId: selectedConsultation.id,
          data: payload,
        }),
      });

      if (!res.ok) {
        const docRef = doc(db, "consultationRequests", selectedConsultation.id);
        await updateDoc(docRef, payload);
      }

      setConsultations((prev) =>
        prev.map((item) =>
          item.id === selectedConsultation.id
            ? { ...item, status: statusInput, adminNotes: notesInput, updatedAt }
            : item
        )
      );

      setSelectedConsultation(null);
      setFeedback("Consultation status updated.");
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      console.error("Error updating consultation:", err);
      try {
        const docRef = doc(db, "consultationRequests", selectedConsultation.id);
        await updateDoc(docRef, { status: statusInput, adminNotes: notesInput, updatedAt: new Date().toISOString() });
        setConsultations((prev) =>
          prev.map((item) =>
            item.id === selectedConsultation.id
              ? { ...item, status: statusInput, adminNotes: notesInput }
              : item
          )
        );
        setSelectedConsultation(null);
      } catch (fErr) {
        console.error("Fallback update consultation failed:", fErr);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch("/api/admin/cms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          collectionName: "consultationRequests",
          docId: id,
        }),
      });

      setConsultations((prev) => prev.filter((item) => item.id !== id));
      setDeleteConfirmId(null);
      if (selectedConsultation?.id === id) setSelectedConsultation(null);
      setFeedback("Consultation deleted.");
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      console.error("Error deleting consultation:", err);
      try {
        await deleteDoc(doc(db, "consultationRequests", id));
        setConsultations((prev) => prev.filter((item) => item.id !== id));
        setDeleteConfirmId(null);
        if (selectedConsultation?.id === id) setSelectedConsultation(null);
      } catch (fErr) {
        console.error("Fallback delete consultation failed:", fErr);
      }
    }
  };

  const filteredConsultations = consultations.filter((con) => {
    const matchesSearch =
      con.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      con.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (con.phone && con.phone.includes(searchQuery));

    const matchesStatus = statusFilter === "all" || con.status === statusFilter;
    const matchesType = typeFilter === "all" || con.consultationType === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mb-1">
            Free Consultations
          </h1>
          <p className="text-text-muted text-xs sm:text-sm">
            Manage incoming consultation and advice requests.
          </p>
        </div>

        <span className="text-xs text-text-muted bg-surface-raised border border-border-dark px-3 py-1.5 rounded-xl self-start sm:self-auto">
          Total Requests: <strong className="text-cyan-400">{consultations.length}</strong>
        </span>
      </div>

      {feedback && (
        <div className="p-3 bg-cyan-500/15 border border-cyan-400/30 rounded-xl text-cyan-400 text-xs font-bold">
          {feedback}
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-surface-raised border border-border-dark p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder="Search by name, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-base border border-white/10 focus:border-accent-tint pl-9 pr-4 py-2.5 rounded-xl text-xs text-white outline-none transition-colors"
          />
          <Search size={14} className="absolute left-3 top-3 text-text-muted" />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-text-muted" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-surface-base border border-white/10 focus:border-accent-tint px-3 py-2 rounded-xl text-xs text-white outline-none cursor-pointer transition-colors"
            >
              <option value="all">All Statuses</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-surface-base border border-white/10 focus:border-accent-tint px-3 py-2 rounded-xl text-xs text-white outline-none cursor-pointer transition-colors"
          >
            <option value="all">All Categories</option>
            <option value="I Need a Consultation">I Need a Consultation</option>
            <option value="I Have a Business Idea">I Have a Business Idea</option>
            <option value="I Need Technology Guidance">I Need Technology Guidance</option>
            <option value="I Have a General Query">I Have a General Query</option>
            <option value="Partnership / Collaboration">Partnership / Collaboration</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface-raised border border-border-dark rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-16 text-center text-text-muted text-xs flex items-center justify-center gap-2">
            <Loader2 className="animate-spin" size={18} /> Loading consultations...
          </div>
        ) : filteredConsultations.length === 0 ? (
          <div className="py-16 text-center text-text-muted text-xs">
            No matching consultation requests found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-text-muted">
              <thead className="text-[10px] uppercase font-extrabold text-text-muted bg-surface-base/60 border-b border-border-dark">
                <tr>
                  <th className="py-3 px-4">Client Name</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Help Topic</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Submitted Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredConsultations.map((con) => (
                  <tr key={con.id} className="hover:bg-surface-base/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white">
                      {con.fullName}
                      {con.companyName && (
                        <span className="block text-[10px] font-normal text-text-muted">
                          {con.companyName}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div>{con.email}</div>
                      {con.phone && <div className="text-[10px] text-text-muted">{con.phone}</div>}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-white/90">{con.consultationType}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                        con.status === "new"
                          ? "bg-cyan-500/15 text-cyan-400 border-cyan-400/30"
                          : con.status === "contacted"
                          ? "bg-purple-500/15 text-purple-400 border-purple-400/30"
                          : con.status === "resolved"
                          ? "bg-emerald-500/15 text-emerald-400 border-emerald-400/30"
                          : "bg-gray-500/15 text-gray-400 border-gray-400/30"
                      }`}>
                        {con.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-text-muted">
                      {new Date(con.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => openDetail(con)}
                        className="p-1.5 text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors cursor-pointer"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(con.id)}
                        className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                        title="Delete Request"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedConsultation && (
        <div className="fixed inset-0 z-50 bg-surface-base/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-surface-raised border border-border-dark p-6 sm:p-8 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedConsultation(null)}
              className="absolute right-5 top-5 p-2 text-text-muted hover:text-white rounded-full hover:bg-surface-base"
            >
              <X size={20} />
            </button>

            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-400 block mb-1">
                Free Consultation Details
              </span>
              <h2 className="text-2xl font-black text-white">
                {selectedConsultation.fullName}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-surface-base p-4 rounded-2xl border border-white/10 text-xs">
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-cyan-400 shrink-0" />
                <span className="text-text-muted">Email:</span>
                <a href={`mailto:${selectedConsultation.email}`} className="text-cyan-400 font-bold hover:underline">
                  {selectedConsultation.email}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-cyan-400 shrink-0" />
                <span className="text-text-muted">Phone:</span>
                <span className="text-white font-bold">{selectedConsultation.phone || "N/A"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Building size={14} className="text-cyan-400 shrink-0" />
                <span className="text-text-muted">Company:</span>
                <span className="text-white font-bold">{selectedConsultation.companyName || "N/A"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-cyan-400 shrink-0" />
                <span className="text-text-muted">Submitted:</span>
                <span className="text-white font-bold">{new Date(selectedConsultation.createdAt).toLocaleString()}</span>
              </div>
            </div>

            <div className="bg-surface-base p-4 rounded-2xl border border-white/10 space-y-1">
              <span className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider block">
                User Query / Message:
              </span>
              <p className="text-xs text-white/90 whitespace-pre-wrap leading-relaxed">
                {selectedConsultation.message}
              </p>
            </div>

            {/* Actions Bar: Reply Email */}
            <div className="flex items-center justify-between border-t border-white/10 pt-4">
              <a
                href={`mailto:${selectedConsultation.email}?subject=${encodeURIComponent(`Re: Free Consultation Request — ${selectedConsultation.consultationType}`)}`}
                className="px-4 py-2 bg-accent text-surface-base text-xs font-extrabold rounded-xl hover:bg-accent-hover shadow-glow flex items-center gap-2 cursor-pointer"
              >
                <Mail size={15} /> Reply via Email
              </a>
            </div>

            <div className="space-y-4 pt-2 border-t border-white/10">
              <div>
                <label className="text-[11px] font-extrabold text-text-muted uppercase tracking-wider block mb-1">
                  Status Workflow
                </label>
                <select
                  value={statusInput}
                  onChange={(e) => setStatusInput(e.target.value as ConsultationRequest["status"])}
                  className="w-full bg-surface-base border border-white/10 focus:border-accent-tint px-3 py-2.5 rounded-xl text-xs text-white outline-none transition-colors"
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-extrabold text-text-muted uppercase tracking-wider block mb-1">
                  Internal Admin Notes
                </label>
                <textarea
                  rows={3}
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="Notes about client discussion, recommendation..."
                  className="w-full bg-surface-base border border-white/10 focus:border-accent-tint p-3 rounded-xl text-xs text-white outline-none transition-colors resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setSelectedConsultation(null)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-xs font-bold text-text-muted hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={isUpdating}
                  className="px-6 py-2 rounded-xl bg-accent text-surface-base text-xs font-extrabold hover:bg-accent-hover shadow-glow"
                >
                  {isUpdating ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-surface-base/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-surface-raised border border-border-dark p-6 rounded-2xl max-w-sm w-full text-center space-y-4 shadow-2xl">
            <h3 className="text-lg font-black text-white">Confirm Delete</h3>
            <p className="text-xs text-text-muted">
              Are you sure you want to delete this consultation request?
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl border border-white/10 text-xs font-bold text-text-muted hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-5 py-2 rounded-xl bg-rose-500 text-white text-xs font-extrabold hover:bg-rose-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
