"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Inbox,
  MessageSquare,
  Briefcase,
  Package,
  ArrowRight,
  Loader2,
} from "lucide-react";

interface SummaryData {
  newInquiries: number;
  totalInquiries: number;
  newConsultations: number;
  totalConsultations: number;
  activeServices: number;
  publishedProducts: number;
  publishedPortfolio: number;
}

interface RecentInquiry {
  id: string;
  fullName: string;
  projectType: string;
  budget: string;
  status: string;
  createdAt: string;
}

interface RecentConsultation {
  id: string;
  fullName: string;
  consultationType: string;
  status: string;
  createdAt: string;
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SummaryData>({
    newInquiries: 0,
    totalInquiries: 0,
    newConsultations: 0,
    totalConsultations: 0,
    activeServices: 6,
    publishedProducts: 3,
    publishedPortfolio: 3,
  });
  const [recentInquiries, setRecentInquiries] = useState<RecentInquiry[]>([]);
  const [recentConsultations, setRecentConsultations] = useState<RecentConsultation[]>([]);

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        // Fetch Recent Project Inquiries
        const inqSnap = await getDocs(
          query(collection(db, "projectInquiries"), orderBy("createdAt", "desc"), limit(5))
        );
        const inqList: RecentInquiry[] = [];
        let newInqCount = 0;
        inqSnap.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.status === "new") newInqCount++;
          inqList.push({ ...data, id: docSnap.id } as RecentInquiry);
        });

        // Fetch Recent Consultations
        const conSnap = await getDocs(
          query(collection(db, "consultationRequests"), orderBy("createdAt", "desc"), limit(5))
        );
        const conList: RecentConsultation[] = [];
        let newConCount = 0;
        conSnap.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.status === "new") newConCount++;
          conList.push({ ...data, id: docSnap.id } as RecentConsultation);
        });

        // Fetch Count for Services
        const servSnap = await getDocs(collection(db, "services"));
        // Fetch Count for Products
        const prodSnap = await getDocs(collection(db, "products"));
        // Fetch Count for Portfolio
        const portSnap = await getDocs(collection(db, "portfolioProjects"));

        setStats({
          newInquiries: newInqCount,
          totalInquiries: inqSnap.size,
          newConsultations: newConCount,
          totalConsultations: conSnap.size,
          activeServices: servSnap.empty ? 6 : servSnap.size,
          publishedProducts: prodSnap.empty ? 3 : prodSnap.size,
          publishedPortfolio: portSnap.empty ? 3 : portSnap.size,
        });

        setRecentInquiries(inqList);
        setRecentConsultations(conList);
      } catch (err) {
        console.warn("Firestore dashboard load fallback:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white mb-2">
          Dashboard Overview
        </h1>
        <p className="text-text-muted text-sm">
          Welcome back to AWENUE Admin. Here is your business leads & dynamic website summary.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-surface-raised border border-border-dark p-6 rounded-2xl flex items-center justify-between shadow-lg">
          <div>
            <span className="text-[11px] font-extrabold text-text-muted uppercase tracking-wider block mb-1">
              Project Inquiries
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">{stats.totalInquiries}</span>
              {stats.newInquiries > 0 && (
                <span className="text-xs font-bold text-accent bg-accent/10 border border-accent/30 px-2 py-0.5 rounded-full">
                  +{stats.newInquiries} New
                </span>
              )}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-accent/15 text-accent flex items-center justify-center">
            <Inbox size={22} />
          </div>
        </div>

        <div className="bg-surface-raised border border-border-dark p-6 rounded-2xl flex items-center justify-between shadow-lg">
          <div>
            <span className="text-[11px] font-extrabold text-text-muted uppercase tracking-wider block mb-1">
              Free Consultations
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">{stats.totalConsultations}</span>
              {stats.newConsultations > 0 && (
                <span className="text-xs font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-400/30 px-2 py-0.5 rounded-full">
                  +{stats.newConsultations} New
                </span>
              )}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center">
            <MessageSquare size={22} />
          </div>
        </div>

        <div className="bg-surface-raised border border-border-dark p-6 rounded-2xl flex items-center justify-between shadow-lg">
          <div>
            <span className="text-[11px] font-extrabold text-text-muted uppercase tracking-wider block mb-1">
              Active Services
            </span>
            <span className="text-3xl font-black text-white">{stats.activeServices}</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-violet-500/15 text-violet-400 flex items-center justify-center">
            <Briefcase size={22} />
          </div>
        </div>

        <div className="bg-surface-raised border border-border-dark p-6 rounded-2xl flex items-center justify-between shadow-lg">
          <div>
            <span className="text-[11px] font-extrabold text-text-muted uppercase tracking-wider block mb-1">
              Published Products
            </span>
            <span className="text-3xl font-black text-white">{stats.publishedProducts}</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
            <Package size={22} />
          </div>
        </div>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Project Inquiries */}
        <div className="bg-surface-raised border border-border-dark p-6 rounded-2xl space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-border-dark pb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Inbox size={18} className="text-accent" />
              Recent Project Inquiries
            </h2>
            <Link href="/admin/inquiries" className="text-xs text-accent font-bold hover:underline flex items-center gap-1">
              View All <ArrowRight size={12} />
            </Link>
          </div>

          {loading ? (
            <div className="py-12 text-center text-text-muted text-xs flex items-center justify-center gap-2">
              <Loader2 className="animate-spin" size={16} /> Loading inquiries...
            </div>
          ) : recentInquiries.length === 0 ? (
            <div className="py-12 text-center text-text-muted text-xs">
              No project inquiries received yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-text-muted">
                <thead className="text-[10px] uppercase font-extrabold text-text-muted border-b border-white/10">
                  <tr>
                    <th className="py-2 px-3">Client</th>
                    <th className="py-2 px-3">Type</th>
                    <th className="py-2 px-3">Budget</th>
                    <th className="py-2 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {recentInquiries.map((inq) => (
                    <tr key={inq.id} className="hover:bg-surface-base/50 transition-colors">
                      <td className="py-3 px-3 font-bold text-white">{inq.fullName}</td>
                      <td className="py-3 px-3">{inq.projectType}</td>
                      <td className="py-3 px-3 text-accent font-bold">{inq.budget}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          inq.status === "new"
                            ? "bg-accent/15 text-accent border border-accent/30"
                            : "bg-blue-500/15 text-blue-400 border border-blue-400/30"
                        }`}>
                          {inq.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Consultation Requests */}
        <div className="bg-surface-raised border border-border-dark p-6 rounded-2xl space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-border-dark pb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <MessageSquare size={18} className="text-cyan-400" />
              Recent Consultations
            </h2>
            <Link href="/admin/consultations" className="text-xs text-cyan-400 font-bold hover:underline flex items-center gap-1">
              View All <ArrowRight size={12} />
            </Link>
          </div>

          {loading ? (
            <div className="py-12 text-center text-text-muted text-xs flex items-center justify-center gap-2">
              <Loader2 className="animate-spin" size={16} /> Loading consultations...
            </div>
          ) : recentConsultations.length === 0 ? (
            <div className="py-12 text-center text-text-muted text-xs">
              No consultation requests received yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-text-muted">
                <thead className="text-[10px] uppercase font-extrabold text-text-muted border-b border-white/10">
                  <tr>
                    <th className="py-2 px-3">Client</th>
                    <th className="py-2 px-3">Category</th>
                    <th className="py-2 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {recentConsultations.map((con) => (
                    <tr key={con.id} className="hover:bg-surface-base/50 transition-colors">
                      <td className="py-3 px-3 font-bold text-white">{con.fullName}</td>
                      <td className="py-3 px-3">{con.consultationType}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          con.status === "new"
                            ? "bg-cyan-500/15 text-cyan-400 border border-cyan-400/30"
                            : "bg-purple-500/15 text-purple-400 border border-purple-400/30"
                        }`}>
                          {con.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
