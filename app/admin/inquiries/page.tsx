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
  Phone,
  Mail,
  Building,
  Calendar,
  DollarSign,
  MessageCircle,
} from "lucide-react";
import EmailReplyModal from "@/components/admin/EmailReplyModal";

interface ProjectInquiry {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  companyName?: string;
  projectType: string;
  budget: string;
  message: string;
  status: "new" | "contacted" | "in_discussion" | "converted" | "closed";
  adminNotes?: string;
  createdAt: string;
  updatedAt?: string;
  notificationStatus?: string;
}

export default function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState<ProjectInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedInquiry, setSelectedInquiry] = useState<ProjectInquiry | null>(null);
  const [notesInput, setNotesInput] = useState("");
  const [statusInput, setStatusInput] = useState<ProjectInquiry["status"]>("new");
  const [isUpdating, setIsUpdating] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [replyModalOpen, setReplyModalOpen] = useState(false);


  const fetchInquiries = useCallback(async () => {
    try {
      const q = query(collection(db, "projectInquiries"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const list: ProjectInquiry[] = [];
      snap.forEach((docSnap) => {
        list.push({ ...docSnap.data(), id: docSnap.id } as ProjectInquiry);
      });
      setInquiries(list);
    } catch (err) {
      console.error("Error fetching project inquiries:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) fetchInquiries();
    });
    return () => {
      active = false;
    };
  }, [fetchInquiries]);

  const openDetail = (inquiry: ProjectInquiry) => {
    setSelectedInquiry(inquiry);
    setNotesInput(inquiry.adminNotes || "");
    setStatusInput(inquiry.status);
  };

  const handleUpdate = async () => {
    if (!selectedInquiry) return;
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
          collectionName: "projectInquiries",
          docId: selectedInquiry.id,
          data: payload,
        }),
      });

      if (!res.ok) {
        const docRef = doc(db, "projectInquiries", selectedInquiry.id);
        await updateDoc(docRef, payload);
      }

      setInquiries((prev) =>
        prev.map((item) =>
          item.id === selectedInquiry.id
            ? { ...item, status: statusInput, adminNotes: notesInput, updatedAt }
            : item
        )
      );

      setSelectedInquiry(null);
      setFeedback("Inquiry updated successfully.");
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      console.error("Error updating inquiry:", err);
      try {
        const docRef = doc(db, "projectInquiries", selectedInquiry.id);
        await updateDoc(docRef, { status: statusInput, adminNotes: notesInput, updatedAt: new Date().toISOString() });
        setInquiries((prev) =>
          prev.map((item) =>
            item.id === selectedInquiry.id
              ? { ...item, status: statusInput, adminNotes: notesInput }
              : item
          )
        );
        setSelectedInquiry(null);
      } catch (fErr) {
        console.error("Fallback update inquiry failed:", fErr);
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
          collectionName: "projectInquiries",
          docId: id,
        }),
      });

      setInquiries((prev) => prev.filter((item) => item.id !== id));
      setDeleteConfirmId(null);
      if (selectedInquiry?.id === id) setSelectedInquiry(null);
      setFeedback("Inquiry deleted successfully.");
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      console.error("Error deleting inquiry:", err);
      try {
        await deleteDoc(doc(db, "projectInquiries", id));
        setInquiries((prev) => prev.filter((item) => item.id !== id));
        setDeleteConfirmId(null);
        if (selectedInquiry?.id === id) setSelectedInquiry(null);
      } catch (fErr) {
        console.error("Fallback delete inquiry failed:", fErr);
      }
    }
  };

  // Filtering
  const filteredInquiries = inquiries.filter((inq) => {
    const matchesSearch =
      inq.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inq.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inq.phone.includes(searchQuery);

    const matchesStatus = statusFilter === "all" || inq.status === statusFilter;
    const matchesType = typeFilter === "all" || inq.projectType === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mb-1">
            Project Inquiries
          </h1>
          <p className="text-text-muted text-xs sm:text-sm">
            Manage incoming &apos;Start Your Project&apos; business leads.
          </p>
        </div>

        <span className="text-xs text-text-muted bg-surface-raised border border-border-dark px-3 py-1.5 rounded-xl self-start sm:self-auto">
          Total Leads: <strong className="text-accent">{inquiries.length}</strong>
        </span>
      </div>

      {feedback && (
        <div className="p-3 bg-accent/15 border border-accent/30 rounded-xl text-accent text-xs font-bold">
          {feedback}
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-surface-raised border border-border-dark p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder="Search by name, email, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-base border border-white/10 focus:border-accent-tint pl-9 pr-4 py-2.5 rounded-xl text-xs text-white outline-none transition-colors"
          />
          <Search size={14} className="absolute left-3 top-3 text-text-muted" />
        </div>

        {/* Filter Dropdowns */}
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
              <option value="in_discussion">In Discussion</option>
              <option value="converted">Converted</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-surface-base border border-white/10 focus:border-accent-tint px-3 py-2 rounded-xl text-xs text-white outline-none cursor-pointer transition-colors"
          >
            <option value="all">All Project Types</option>
            <option value="Website">Website</option>
            <option value="Web Application">Web Application</option>
            <option value="SaaS Product">SaaS Product</option>
            <option value="Mobile App">Mobile App</option>
            <option value="AI & Automation">AI & Automation</option>
            <option value="Digital Marketing">Digital Marketing</option>
            <option value="Graphic Design & Branding">Graphic Design & Branding</option>
            <option value="Custom Software">Custom Software</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface-raised border border-border-dark rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-16 text-center text-text-muted text-xs flex items-center justify-center gap-2">
            <Loader2 className="animate-spin" size={18} /> Loading project inquiries...
          </div>
        ) : filteredInquiries.length === 0 ? (
          <div className="py-16 text-center text-text-muted text-xs">
            No matching project inquiries found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-text-muted">
              <thead className="text-[10px] uppercase font-extrabold text-text-muted bg-surface-base/60 border-b border-border-dark">
                <tr>
                  <th className="py-3 px-4">Client Name</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Project Type</th>
                  <th className="py-3 px-4">Budget</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Submitted Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredInquiries.map((inq) => (
                  <tr key={inq.id} className="hover:bg-surface-base/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white">
                      {inq.fullName}
                      {inq.companyName && (
                        <span className="block text-[10px] font-normal text-text-muted">
                          {inq.companyName}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div>{inq.email}</div>
                      <div className="text-[10px] font-semibold text-text-muted">{inq.phone}</div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-white/90">{inq.projectType}</td>
                    <td className="py-3.5 px-4 font-bold text-accent">{inq.budget}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                        inq.status === "new"
                          ? "bg-accent/15 text-accent border-accent/30"
                          : inq.status === "contacted"
                          ? "bg-blue-500/15 text-blue-400 border-blue-400/30"
                          : inq.status === "in_discussion"
                          ? "bg-purple-500/15 text-purple-400 border-purple-400/30"
                          : inq.status === "converted"
                          ? "bg-emerald-500/15 text-emerald-400 border-emerald-400/30"
                          : "bg-gray-500/15 text-gray-400 border-gray-400/30"
                      }`}>
                        {inq.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-text-muted">
                      {new Date(inq.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => openDetail(inq)}
                        className="p-1.5 text-accent hover:bg-accent/10 rounded-lg transition-colors cursor-pointer"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(inq.id)}
                        className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                        title="Delete Inquiry"
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

      {/* Inquiry Detail Modal */}
      {selectedInquiry && (
        <div className="fixed inset-0 z-50 bg-surface-base/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-surface-raised border border-border-dark p-6 sm:p-8 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedInquiry(null)}
              className="absolute right-5 top-5 p-2 text-text-muted hover:text-white rounded-full hover:bg-surface-base"
            >
              <X size={20} />
            </button>

            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-accent block mb-1">
                Project Inquiry Details
              </span>
              <h2 className="text-2xl font-black text-white">
                {selectedInquiry.fullName}
              </h2>
            </div>

            {/* Grid details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-surface-base p-4 rounded-2xl border border-white/10 text-xs">
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-accent shrink-0" />
                <span className="text-text-muted">Email:</span>
                <a href={`mailto:${selectedInquiry.email}`} className="text-accent font-bold hover:underline">
                  {selectedInquiry.email}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-accent shrink-0" />
                <span className="text-text-muted">Phone:</span>
                <span className="text-white font-bold">{selectedInquiry.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Building size={14} className="text-accent shrink-0" />
                <span className="text-text-muted">Company:</span>
                <span className="text-white font-bold">{selectedInquiry.companyName || "N/A"}</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign size={14} className="text-accent shrink-0" />
                <span className="text-text-muted">Budget:</span>
                <span className="text-accent font-bold">{selectedInquiry.budget}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-accent shrink-0" />
                <span className="text-text-muted">Submitted:</span>
                <span className="text-white font-bold">{new Date(selectedInquiry.createdAt).toLocaleString()}</span>
              </div>
            </div>

            {/* Requirements Box */}
            <div className="bg-surface-base p-4 rounded-2xl border border-white/10 space-y-1">
              <span className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider block">
                Project Requirements:
              </span>
              <p className="text-xs text-white/90 whitespace-pre-wrap leading-relaxed">
                {selectedInquiry.message}
              </p>
            </div>

            {/* Email Communication Action */}
            <div className="flex items-center justify-between border-t border-white/10 pt-4">
              <button
                onClick={() => setReplyModalOpen(true)}
                className="px-4 py-2 bg-accent text-surface-base text-xs font-extrabold rounded-xl hover:bg-accent-hover shadow-glow flex items-center gap-2 cursor-pointer"
              >
                <MessageCircle size={15} /> Reply via Email
              </button>
            </div>

            {/* Update Form */}
            <div className="space-y-4 pt-2 border-t border-white/10">
              <div>
                <label className="text-[11px] font-extrabold text-text-muted uppercase tracking-wider block mb-1">
                  Lead Status Workflow
                </label>
                <select
                  value={statusInput}
                  onChange={(e) => setStatusInput(e.target.value as ProjectInquiry["status"])}
                  className="w-full bg-surface-base border border-white/10 px-3 py-2.5 rounded-xl text-xs text-white outline-none focus:border-accent"
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="in_discussion">In Discussion</option>
                  <option value="converted">Converted</option>
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
                  placeholder="Add internal notes about phone calls, quotes sent, next follow-up date..."
                  className="w-full bg-surface-base border border-white/10 p-3 rounded-xl text-xs text-white outline-none focus:border-accent resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setSelectedInquiry(null)}
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

      {/* Reply Modal */}
      {selectedInquiry && (
        <EmailReplyModal
          isOpen={replyModalOpen}
          onClose={() => setReplyModalOpen(false)}
          recipientEmail={selectedInquiry.email}
          customerName={selectedInquiry.fullName}
          leadId={selectedInquiry.id}
          leadType="projectInquiry"
          defaultSubject={`Re: AWENUE Project Request — ${selectedInquiry.projectType}`}
          onSuccess={() => {
            fetchInquiries();
            if (selectedInquiry) {
              setSelectedInquiry({ ...selectedInquiry, status: "contacted" });
            }
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-surface-base/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-surface-raised border border-border-dark p-6 rounded-2xl max-w-sm w-full text-center space-y-4 shadow-2xl">
            <h3 className="text-lg font-black text-white">Confirm Delete</h3>
            <p className="text-xs text-text-muted">
              Are you sure you want to delete this inquiry? This action cannot be undone.
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
