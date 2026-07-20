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
  Users,
  HelpCircle,
  TrendingUp,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Activity,
  Send,
} from "lucide-react";

interface SummaryData {
  totalUsers: number;
  newInquiries: number;
  totalInquiries: number;
  newConsultations: number;
  totalConsultations: number;
  openQueries: number;
  convertedLeads: number;
  activeServices: number;
  publishedProducts: number;
  publishedPortfolio: number;
}

interface PipelineBreakdown {
  new: number;
  contacted: number;
  inDiscussion: number;
  converted: number;
  closed: number;
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

interface RecentUser {
  id: string;
  fullName: string;
  email: string;
  status: string;
  createdAt: string;
}

interface ActivityItem {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  time: string;
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SummaryData>({
    totalUsers: 0,
    newInquiries: 0,
    totalInquiries: 0,
    newConsultations: 0,
    totalConsultations: 0,
    openQueries: 0,
    convertedLeads: 0,
    activeServices: 6,
    publishedProducts: 3,
    publishedPortfolio: 3,
  });

  const [pipeline, setPipeline] = useState<PipelineBreakdown>({
    new: 0,
    contacted: 0,
    inDiscussion: 0,
    converted: 0,
    closed: 0,
  });

  const [recentInquiries, setRecentInquiries] = useState<RecentInquiry[]>([]);
  const [recentConsultations, setRecentConsultations] = useState<RecentConsultation[]>([]);
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        // 1. Fetch Project Inquiries
        const inqSnap = await getDocs(
          query(collection(db, "projectInquiries"), orderBy("createdAt", "desc"))
        );
        const inqList: RecentInquiry[] = [];
        let newInqCount = 0;
        let convertedInq = 0;

        const pipe: PipelineBreakdown = { new: 0, contacted: 0, inDiscussion: 0, converted: 0, closed: 0 };

        inqSnap.forEach((docSnap) => {
          const data = docSnap.data();
          const st = data.status || "new";
          if (st === "new") newInqCount++;
          if (st === "converted") convertedInq++;

          if (st === "new") pipe.new++;
          else if (st === "contacted") pipe.contacted++;
          else if (st === "in_discussion") pipe.inDiscussion++;
          else if (st === "converted") pipe.converted++;
          else if (st === "closed") pipe.closed++;

          if (inqList.length < 5) {
            inqList.push({ ...data, id: docSnap.id } as RecentInquiry);
          }
        });

        // 2. Fetch Consultations
        const conSnap = await getDocs(
          query(collection(db, "consultationRequests"), orderBy("createdAt", "desc"))
        );
        const conList: RecentConsultation[] = [];
        let newConCount = 0;
        let convertedCon = 0;

        conSnap.forEach((docSnap) => {
          const data = docSnap.data();
          const st = data.status || "new";
          if (st === "new") newConCount++;
          if (st === "resolved" || st === "completed") convertedCon++;

          if (st === "new") pipe.new++;
          else if (st === "contacted") pipe.contacted++;
          else if (st === "resolved") pipe.converted++;
          else if (st === "closed") pipe.closed++;

          if (conList.length < 5) {
            conList.push({ ...data, id: docSnap.id } as RecentConsultation);
          }
        });

        // 3. Fetch General Queries
        let openQueriesCount = 0;
        try {
          const querySnap = await getDocs(collection(db, "generalQueries"));
          querySnap.forEach((docSnap) => {
            if (docSnap.data().status === "new") openQueriesCount++;
          });
        } catch (qErr) {
          console.warn("General queries count fallback:", qErr);
        }

        // 4. Fetch Users count & list
        let usersCount = 0;
        const usersList: RecentUser[] = [];
        try {
          const uRes = await fetch("/api/admin/users");
          const uData = await uRes.json();
          if (uRes.ok && Array.isArray(uData.users)) {
            usersCount = uData.users.length;
            uData.users.slice(0, 5).forEach((u: { uid: string; fullName?: string; email: string; disabled?: boolean; createdAt?: string }) => {
              usersList.push({
                id: u.uid,
                fullName: u.fullName || "User Account",
                email: u.email,
                status: u.disabled ? "disabled" : "active",
                createdAt: u.createdAt || new Date().toISOString(),
              });
            });
          }
        } catch (uErr) {
          console.warn("Users load fallback:", uErr);
        }

        // 5. Fetch Services, Products, Portfolio counts
        const servSnap = await getDocs(collection(db, "services"));
        const prodSnap = await getDocs(collection(db, "products"));
        const portSnap = await getDocs(collection(db, "portfolioProjects"));

        // 6. Build Activity Log
        const activities: ActivityItem[] = [];

        if (inqList.length > 0) {
          activities.push({
            id: `act-inq-${inqList[0].id}`,
            type: "inquiry",
            title: `New Project Inquiry from ${inqList[0].fullName}`,
            subtitle: `${inqList[0].projectType} • Budget: ${inqList[0].budget}`,
            time: new Date(inqList[0].createdAt).toLocaleDateString(),
          });
        }

        if (conList.length > 0) {
          activities.push({
            id: `act-con-${conList[0].id}`,
            type: "consultation",
            title: `Free Consultation Request from ${conList[0].fullName}`,
            subtitle: `${conList[0].consultationType}`,
            time: new Date(conList[0].createdAt).toLocaleDateString(),
          });
        }

        // Add recent email communications
        try {
          const commSnap = await getDocs(
            query(collection(db, "emailCommunications"), orderBy("sentAt", "desc"), limit(3))
          );
          commSnap.forEach((docSnap) => {
            const data = docSnap.data();
            activities.push({
              id: `act-comm-${docSnap.id}`,
              type: "email",
              title: `Admin Sent Email to ${data.recipientEmail}`,
              subtitle: `Subject: ${data.subject}`,
              time: new Date(data.sentAt).toLocaleDateString(),
            });
          });
        } catch (commErr) {
          console.warn("Comm activity log fallback:", commErr);
        }

        setStats({
          totalUsers: usersCount,
          newInquiries: newInqCount,
          totalInquiries: inqSnap.size,
          newConsultations: newConCount,
          totalConsultations: conSnap.size,
          openQueries: openQueriesCount,
          convertedLeads: convertedInq + convertedCon,
          activeServices: servSnap.empty ? 6 : servSnap.size,
          publishedProducts: prodSnap.empty ? 3 : prodSnap.size,
          publishedPortfolio: portSnap.empty ? 3 : portSnap.size,
        });

        setPipeline(pipe);
        setRecentInquiries(inqList);
        setRecentConsultations(conList);
        setRecentActivities(activities);
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
          Admin Dashboard Overview
        </h1>
        <p className="text-text-muted text-sm">
          Centralized command center for website CMS, user accounts, incoming business leads, and customer emails.
        </p>
      </div>

      {/* Primary Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-surface-raised border border-border-dark p-6 rounded-2xl flex items-center justify-between shadow-lg">
          <div>
            <span className="text-[11px] font-extrabold text-text-muted uppercase tracking-wider block mb-1">
              Registered Users
            </span>
            <span className="text-3xl font-black text-white">{stats.totalUsers}</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center">
            <Users size={22} />
          </div>
        </div>

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
              Open General Queries
            </span>
            <span className="text-3xl font-black text-white">{stats.openQueries}</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
            <HelpCircle size={22} />
          </div>
        </div>
      </div>

      {/* Secondary Metrics & Lead Pipeline Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline Widget */}
        <div className="lg:col-span-2 bg-surface-raised border border-border-dark p-6 rounded-2xl space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-border-dark pb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp size={18} className="text-accent" />
              Lead Pipeline Stage Breakdown
            </h2>
            <span className="text-xs font-bold text-accent">
              {stats.convertedLeads} Converted Leads
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
            <div className="bg-surface-base p-4 rounded-xl border border-white/10 text-center">
              <span className="text-[10px] font-extrabold text-text-muted uppercase block">New</span>
              <span className="text-2xl font-black text-white">{pipeline.new}</span>
            </div>
            <div className="bg-surface-base p-4 rounded-xl border border-white/10 text-center">
              <span className="text-[10px] font-extrabold text-blue-400 uppercase block">Contacted</span>
              <span className="text-2xl font-black text-blue-400">{pipeline.contacted}</span>
            </div>
            <div className="bg-surface-base p-4 rounded-xl border border-white/10 text-center">
              <span className="text-[10px] font-extrabold text-purple-400 uppercase block">In Discussion</span>
              <span className="text-2xl font-black text-purple-400">{pipeline.inDiscussion}</span>
            </div>
            <div className="bg-surface-base p-4 rounded-xl border border-white/10 text-center">
              <span className="text-[10px] font-extrabold text-emerald-400 uppercase block">Converted</span>
              <span className="text-2xl font-black text-emerald-400">{pipeline.converted}</span>
            </div>
            <div className="bg-surface-base p-4 rounded-xl border border-white/10 text-center">
              <span className="text-[10px] font-extrabold text-gray-400 uppercase block">Closed</span>
              <span className="text-2xl font-black text-gray-400">{pipeline.closed}</span>
            </div>
          </div>
        </div>

        {/* CMS Quick Summary */}
        <div className="bg-surface-raised border border-border-dark p-6 rounded-2xl space-y-4 shadow-xl">
          <h2 className="text-base font-bold text-white border-b border-border-dark pb-3">
            CMS Catalog Summary
          </h2>
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 bg-surface-base rounded-xl border border-white/5">
              <span className="text-text-muted font-bold flex items-center gap-2">
                <Briefcase size={16} className="text-violet-400" /> Active Services
              </span>
              <span className="text-white font-extrabold">{stats.activeServices}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-surface-base rounded-xl border border-white/5">
              <span className="text-text-muted font-bold flex items-center gap-2">
                <Package size={16} className="text-blue-400" /> Published Products
              </span>
              <span className="text-white font-extrabold">{stats.publishedProducts}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-surface-base rounded-xl border border-white/5">
              <span className="text-text-muted font-bold flex items-center gap-2">
                <CheckCircle2 size={16} className="text-accent" /> Portfolio Showcase
              </span>
              <span className="text-white font-extrabold">{stats.publishedPortfolio}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Data Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Inquiries */}
        <div className="bg-surface-raised border border-border-dark p-6 rounded-2xl space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-border-dark pb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Inbox size={18} className="text-accent" />
              Recent Project Inquiries
            </h2>
            <Link
              href="/admin/inquiries"
              className="text-xs text-accent font-bold hover:underline flex items-center gap-1"
            >
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
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            inq.status === "new"
                              ? "bg-accent/15 text-accent border border-accent/30"
                              : "bg-blue-500/15 text-blue-400 border border-blue-400/30"
                          }`}
                        >
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
            <Link
              href="/admin/consultations"
              className="text-xs text-cyan-400 font-bold hover:underline flex items-center gap-1"
            >
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
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            con.status === "new"
                              ? "bg-cyan-500/15 text-cyan-400 border border-cyan-400/30"
                              : "bg-purple-500/15 text-purple-400 border border-purple-400/30"
                          }`}
                        >
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

      {/* Activity Log Feed */}
      <div className="bg-surface-raised border border-border-dark p-6 rounded-2xl space-y-4 shadow-xl">
        <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-border-dark pb-3">
          <Activity size={18} className="text-accent" /> Recent Activity Log
        </h2>

        {recentActivities.length === 0 ? (
          <div className="py-6 text-center text-text-muted text-xs">
            No recent system activity.
          </div>
        ) : (
          <div className="space-y-3">
            {recentActivities.map((act) => (
              <div
                key={act.id}
                className="flex items-center justify-between p-3.5 bg-surface-base rounded-xl border border-white/5 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-accent/15 text-accent flex items-center justify-center shrink-0">
                    {act.type === "email" ? (
                      <Send size={14} />
                    ) : act.type === "inquiry" ? (
                      <Inbox size={14} />
                    ) : (
                      <MessageSquare size={14} />
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-white block">{act.title}</span>
                    <span className="text-text-muted text-[11px] block">{act.subtitle}</span>
                  </div>
                </div>
                <span className="text-[10px] text-text-muted font-mono">{act.time}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
