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
  Calendar,
  HelpCircle,
} from "lucide-react";

interface GeneralQuery {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  status: "new" | "replied" | "resolved" | "closed";
  adminNotes?: string;
  createdAt: string;
  updatedAt?: string;
}

export default function AdminGeneralQueriesPage() {
  const [queriesList, setQueriesList] = useState<GeneralQuery[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedQuery, setSelectedQuery] = useState<GeneralQuery | null>(null);
  const [notesInput, setNotesInput] = useState("");
  const [statusInput, setStatusInput] = useState<GeneralQuery["status"]>("new");
  const [isUpdating, setIsUpdating] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchQueries = useCallback(async () => {
    try {
      let list: GeneralQuery[] = [];
      try {
        const q = query(collection(db, "generalQueries"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        snap.forEach((docSnap) => {
          list.push({ ...docSnap.data(), id: docSnap.id } as GeneralQuery);
        });
      } catch {
        const res = await fetch("/api/admin/cms?collectionName=generalQueries");
        const json = await res.json();
        if (res.ok && Array.isArray(json.data)) {
          list = json.data;
        }
      }
      setQueriesList(list);
    } catch (err) {
      console.error("Error fetching general queries:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) fetchQueries();
    });
    return () => {
      active = false;
    };
  }, [fetchQueries]);

  const openDetail = (item: GeneralQuery) => {
    setSelectedQuery(item);
    setNotesInput(item.adminNotes || "");
    setStatusInput(item.status);
  };

  const handleUpdate = async () => {
    if (!selectedQuery) return;
    setIsUpdating(true);
    try {
      const updatedAt = new Date().toISOString();
      const updatePayload = {
        status: statusInput,
        adminNotes: notesInput,
        updatedAt,
      };

      const res = await fetch("/api/admin/cms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          collectionName: "generalQueries",
          docId: selectedQuery.id,
          data: updatePayload,
        }),
      });

      if (!res.ok) {
        const docRef = doc(db, "generalQueries", selectedQuery.id);
        await updateDoc(docRef, updatePayload);
      }

      setQueriesList((prev) =>
        prev.map((item) =>
          item.id === selectedQuery.id
            ? { ...item, status: statusInput, adminNotes: notesInput, updatedAt }
            : item
        )
      );

      setSelectedQuery(null);
      setFeedback("Query updated successfully.");
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      console.error("Error updating query:", err);
      try {
        const docRef = doc(db, "generalQueries", selectedQuery.id);
        await updateDoc(docRef, { status: statusInput, adminNotes: notesInput, updatedAt: new Date().toISOString() });
        setQueriesList((prev) =>
          prev.map((item) =>
            item.id === selectedQuery.id
              ? { ...item, status: statusInput, adminNotes: notesInput }
              : item
          )
        );
        setSelectedQuery(null);
        setFeedback("Query updated successfully.");
        setTimeout(() => setFeedback(null), 3000);
      } catch (fErr) {
        console.error("Fallback update query failed:", fErr);
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
          collectionName: "generalQueries",
          docId: id,
        }),
      });
      setQueriesList((prev) => prev.filter((item) => item.id !== id));
      setDeleteConfirmId(null);
      if (selectedQuery?.id === id) setSelectedQuery(null);
      setFeedback("Query deleted successfully.");
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      console.error("Error deleting query:", err);
      try {
        await deleteDoc(doc(db, "generalQueries", id));
        setQueriesList((prev) => prev.filter((item) => item.id !== id));
        setDeleteConfirmId(null);
        if (selectedQuery?.id === id) setSelectedQuery(null);
      } catch (fErr) {
        console.error("Fallback delete query failed:", fErr);
      }
    }
  };

  const filteredQueries = queriesList.filter((item) => {
    const matchesSearch =
      item.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.subject && item.subject.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === "all" || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mb-1">
            General Queries
          </h1>
          <p className="text-text-muted text-xs sm:text-sm">
            Manage general customer inquiries submitted through contact forms.
          </p>
        </div>

        <span className="text-xs text-text-muted bg-surface-raised border border-border-dark px-3 py-1.5 rounded-xl self-start sm:self-auto">
          Total Queries: <strong className="text-purple-400">{queriesList.length}</strong>
        </span>
      </div>

      {feedback && (
        <div className="p-3 bg-purple-500/15 border border-purple-400/30 rounded-xl text-purple-400 text-xs font-bold">
          {feedback}
        </div>
      )}

      {/* Filters */}
      <div className="bg-surface-raised border border-border-dark p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between shadow-xl">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search name, email, subject..."
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
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="replied">Replied</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface-raised border border-border-dark rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-16 text-center text-text-muted text-xs flex items-center justify-center gap-2">
            <Loader2 className="animate-spin" size={18} /> Loading general queries...
          </div>
        ) : filteredQueries.length === 0 ? (
          <div className="py-16 text-center text-text-muted text-xs space-y-2">
            <HelpCircle size={32} className="mx-auto text-text-muted/40" />
            <p>No general queries received yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-text-muted">
              <thead className="text-[10px] uppercase font-extrabold text-text-muted bg-surface-base/60 border-b border-border-dark">
                <tr>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Submitted Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredQueries.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-base/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white">
                      {item.fullName}
                      <span className="block text-[10px] font-normal text-text-muted">
                        {item.email}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate font-medium text-white/90">
                      {item.subject || "General Query"}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                          item.status === "new"
                            ? "bg-purple-500/15 text-purple-400 border-purple-400/30"
                            : item.status === "replied"
                            ? "bg-accent/15 text-accent border-accent/30"
                            : item.status === "resolved"
                            ? "bg-emerald-500/15 text-emerald-400 border-emerald-400/30"
                            : "bg-gray-500/15 text-gray-400 border-gray-400/30"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-text-muted">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => openDetail(item)}
                        className="p-1.5 text-purple-400 hover:bg-purple-500/10 rounded-lg transition-colors cursor-pointer"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(item.id)}
                        className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                        title="Delete Query"
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
      {selectedQuery && (
        <div className="fixed inset-0 z-50 bg-surface-base/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-surface-raised border border-border-dark p-6 sm:p-8 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedQuery(null)}
              className="absolute right-5 top-5 p-2 text-text-muted hover:text-white rounded-full hover:bg-surface-base"
            >
              <X size={20} />
            </button>

            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-purple-400 block mb-1">
                General Query Details
              </span>
              <h2 className="text-2xl font-black text-white">{selectedQuery.fullName}</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-surface-base p-4 rounded-2xl border border-white/10 text-xs">
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-purple-400 shrink-0" />
                <span className="text-text-muted">Email:</span>
                <a
                  href={`mailto:${selectedQuery.email}`}
                  className="text-purple-400 font-bold hover:underline"
                >
                  {selectedQuery.email}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-purple-400 shrink-0" />
                <span className="text-text-muted">Phone:</span>
                <span className="text-white font-bold">{selectedQuery.phone || "N/A"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-purple-400 shrink-0" />
                <span className="text-text-muted">Submitted:</span>
                <span className="text-white font-bold">
                  {new Date(selectedQuery.createdAt).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="bg-surface-base p-4 rounded-2xl border border-white/10 space-y-1">
              <span className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider block">
                Query Subject & Message:
              </span>
              <h4 className="text-xs font-bold text-white mb-1">
                {selectedQuery.subject || "No Subject"}
              </h4>
              <p className="text-xs text-white/90 whitespace-pre-wrap leading-relaxed">
                {selectedQuery.message}
              </p>
            </div>

            {/* Actions Bar: Reply Email */}
            <div className="flex items-center justify-between border-t border-white/10 pt-4">
              <a
                href={`mailto:${selectedQuery.email}?subject=${encodeURIComponent(selectedQuery.subject ? `Re: ${selectedQuery.subject}` : "Response to Your Inquiry — AWENUE")}`}
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
                  onChange={(e) => setStatusInput(e.target.value as GeneralQuery["status"])}
                  className="w-full bg-surface-base border border-white/10 px-3 py-2.5 rounded-xl text-xs text-white outline-none focus:border-accent"
                >
                  <option value="new">New</option>
                  <option value="replied">Replied</option>
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
                  placeholder="Notes..."
                  className="w-full bg-surface-base border border-white/10 p-3 rounded-xl text-xs text-white outline-none focus:border-accent resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setSelectedQuery(null)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-xs font-bold text-text-muted hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={isUpdating}
                  className="px-6 py-2 rounded-xl bg-purple-500 text-white text-xs font-extrabold hover:bg-purple-600 shadow-glow"
                >
                  {isUpdating ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-surface-base/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-surface-raised border border-border-dark p-6 rounded-2xl max-w-sm w-full text-center space-y-4 shadow-2xl">
            <h3 className="text-lg font-black text-white">Confirm Delete</h3>
            <p className="text-xs text-text-muted">
              Are you sure you want to delete this query?
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
