"use client";

import { useEffect, useState, useCallback } from "react";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Mail,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Loader2,
  RefreshCw,
} from "lucide-react";

interface EmailRecord {
  id: string;
  leadId?: string;
  leadType?: string;
  recipientEmail: string;
  customerName?: string;
  subject: string;
  message: string;
  status: "sent" | "failed";
  failureReason?: string;
  sentByAdminEmail: string;
  sentAt: string;
}

export default function AdminCommunicationPage() {
  const [emails, setEmails] = useState<EmailRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedRecord, setSelectedRecord] = useState<EmailRecord | null>(null);

  const fetchEmailLogs = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "emailCommunications"),
        orderBy("sentAt", "desc")
      );
      const snap = await getDocs(q);
      const list: EmailRecord[] = [];
      snap.forEach((docSnap) => {
        list.push({ ...docSnap.data(), id: docSnap.id } as EmailRecord);
      });
      setEmails(list);
    } catch (err) {
      console.error("Error fetching email logs:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) fetchEmailLogs();
    });
    return () => {
      active = false;
    };
  }, [fetchEmailLogs]);

  const filteredEmails = emails.filter((item) => {
    const matchesSearch =
      item.recipientEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.customerName && item.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.subject.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    const matchesType = typeFilter === "all" || item.leadType === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mb-1">
            Email Communication History Log
          </h1>
          <p className="text-text-muted text-xs sm:text-sm">
            View all outbound customer emails sent via Nodemailer and track delivery history.
          </p>
        </div>

        <button
          onClick={fetchEmailLogs}
          className="flex items-center gap-2 text-xs text-accent font-bold bg-surface-raised border border-border-dark hover:border-accent/40 px-3.5 py-2 rounded-xl self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh Logs
        </button>
      </div>

      {/* Filters */}
      <div className="bg-surface-raised border border-border-dark p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between shadow-xl">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search email, name, subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-base border border-white/10 pl-9 pr-4 py-2.5 rounded-xl text-xs text-white outline-none focus:border-accent"
          />
          <Search size={14} className="absolute left-3 top-3 text-text-muted" />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-text-muted" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-surface-base border border-white/10 px-3 py-2 rounded-xl text-xs text-white outline-none cursor-pointer focus:border-accent"
            >
              <option value="all">All Delivery Statuses</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-surface-base border border-white/10 px-3 py-2 rounded-xl text-xs text-white outline-none cursor-pointer focus:border-accent"
          >
            <option value="all">All Lead Sources</option>
            <option value="projectInquiry">Project Inquiries</option>
            <option value="consultation">Consultations</option>
            <option value="generalQuery">General Queries</option>
            <option value="general">Direct Replies</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface-raised border border-border-dark rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-16 text-center text-text-muted text-xs flex items-center justify-center gap-2">
            <Loader2 className="animate-spin" size={18} /> Loading email logs...
          </div>
        ) : filteredEmails.length === 0 ? (
          <div className="py-16 text-center text-text-muted text-xs space-y-2">
            <Mail size={32} className="mx-auto text-text-muted/40" />
            <p>No email communication records found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-text-muted">
              <thead className="text-[10px] uppercase font-extrabold text-text-muted bg-surface-base/60 border-b border-border-dark">
                <tr>
                  <th className="py-3 px-4">Recipient</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Lead Context</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Sent Date</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredEmails.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-base/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white">
                      {item.customerName || "Customer"}
                      <span className="block text-[10px] font-normal text-accent">
                        {item.recipientEmail}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate font-medium text-white/90">
                      {item.subject}
                    </td>
                    <td className="py-3.5 px-4 text-[11px]">
                      <span className="bg-surface-base border border-white/10 px-2 py-0.5 rounded text-text-muted font-mono">
                        {item.leadType || "general"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                          item.status === "sent"
                            ? "bg-accent/15 text-accent border-accent/30"
                            : "bg-rose-500/15 text-rose-400 border-rose-500/30"
                        }`}
                      >
                        {item.status === "sent" ? (
                          <CheckCircle2 size={12} />
                        ) : (
                          <XCircle size={12} />
                        )}
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-text-muted text-[11px]">
                      {new Date(item.sentAt).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedRecord(item)}
                        className="px-3 py-1 bg-surface-base border border-white/10 hover:border-accent/40 rounded-lg text-xs font-bold text-text-muted hover:text-white cursor-pointer"
                      >
                        View Content
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Log Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-surface-base/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-surface-raised border border-border-dark p-6 sm:p-8 rounded-3xl max-w-2xl w-full space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedRecord(null)}
              className="absolute right-5 top-5 p-2 text-text-muted hover:text-white rounded-full hover:bg-surface-base"
            >
              <XCircle size={20} />
            </button>

            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-accent block mb-1">
                Email Communication Record
              </span>
              <h2 className="text-xl font-black text-white">{selectedRecord.subject}</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-surface-base p-4 rounded-2xl border border-white/10 text-xs">
              <div>
                <span className="text-text-muted block text-[10px] uppercase font-bold">To Customer</span>
                <span className="text-accent font-bold">{selectedRecord.recipientEmail}</span>
              </div>
              <div>
                <span className="text-text-muted block text-[10px] uppercase font-bold">Sent By Admin</span>
                <span className="text-white font-bold">{selectedRecord.sentByAdminEmail}</span>
              </div>
              <div>
                <span className="text-text-muted block text-[10px] uppercase font-bold">Delivery Status</span>
                <span className={`font-extrabold ${selectedRecord.status === "sent" ? "text-accent" : "text-rose-400"}`}>
                  {selectedRecord.status.toUpperCase()}
                </span>
              </div>
              <div>
                <span className="text-text-muted block text-[10px] uppercase font-bold">Sent Time</span>
                <span className="text-white font-bold">{new Date(selectedRecord.sentAt).toLocaleString()}</span>
              </div>
            </div>

            <div className="bg-surface-base p-4 rounded-2xl border border-white/10 space-y-2">
              <span className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider block">
                Email Message Body:
              </span>
              <pre className="text-xs text-white/90 whitespace-pre-wrap font-sans leading-relaxed">
                {selectedRecord.message}
              </pre>
            </div>

            {selectedRecord.failureReason && (
              <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-2xl text-xs text-rose-300">
                <strong>Failure Reason:</strong> {selectedRecord.failureReason}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
