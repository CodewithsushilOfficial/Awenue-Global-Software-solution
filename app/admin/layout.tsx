"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  Package,
  FolderKanban,
  Inbox,
  MessageSquare,
  HelpCircle,
  Users,
  Mail,
  Settings,
  UserCheck,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Layers,
} from "lucide-react";

interface NavGroup {
  label: string;
  items: {
    name: string;
    href: string;
    icon: React.ElementType;
    badge?: string;
  }[];
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAdmin, isOtpVerified, loading, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (pathname === "/admin/login") return;
    if (!loading && (!user || !isAdmin || !isOtpVerified)) {
      router.replace("/admin/login");
    }
  }, [loading, user, isAdmin, isOtpVerified, pathname, router]);

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (loading || !user || !isAdmin || !isOtpVerified) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center text-text-muted text-sm font-bold">
        Authenticating admin session & 2FA security...
      </div>
    );
  }

  const navGroups: NavGroup[] = [
    {
      label: "OVERVIEW",
      items: [
        { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
      ],
    },
    {
      label: "WEBSITE MANAGEMENT",
      items: [
        { name: "Website Content", href: "/admin/content", icon: FileText },
        { name: "Services", href: "/admin/services", icon: Briefcase },
        { name: "Products", href: "/admin/products", icon: Package },
        { name: "Our Process", href: "/admin/process", icon: Layers },
        { name: "Portfolio / Work", href: "/admin/portfolio", icon: FolderKanban },
      ],
    },
    {
      label: "CUSTOMER MANAGEMENT",
      items: [
        { name: "Users", href: "/admin/users", icon: Users },
        { name: "Project Inquiries", href: "/admin/inquiries", icon: Inbox },
        { name: "Consultations", href: "/admin/consultations", icon: MessageSquare },
        { name: "General Queries", href: "/admin/queries", icon: HelpCircle },
      ],
    },
    {
      label: "COMMUNICATION",
      items: [
        { name: "Email / Communication", href: "/admin/communication", icon: Mail },
      ],
    },
    {
      label: "CONFIGURATION",
      items: [
        { name: "Website Settings", href: "/admin/settings", icon: Settings },
      ],
    },
    {
      label: "ACCOUNT",
      items: [
        { name: "Admin Profile", href: "/admin/profile", icon: UserCheck },
      ],
    },
  ];

  const handleLogout = async () => {
    await logout();
    router.push("/admin/login");
  };

  return (
    <div className="min-h-screen bg-surface-base flex text-text-secondary">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col bg-surface-raised border-r border-border-dark shrink-0 h-screen sticky top-0">
        <div className="p-5 border-b border-border-dark flex items-center justify-between">
          <Link href="/admin/dashboard" className="text-lg font-black tracking-wider text-white">
            AWEN<span className="text-accent">UE</span> CMS
          </Link>
          <span className="text-[10px] font-extrabold text-accent bg-accent/10 border border-accent/30 px-2 py-0.5 rounded">
            ADMIN
          </span>
        </div>

        <nav className="flex-1 p-3 space-y-4 overflow-y-auto custom-scrollbar">
          {navGroups.map((group) => (
            <div key={group.label} className="space-y-1">
              <span className="px-3 text-[10px] font-black tracking-wider text-text-muted/60 uppercase block mb-1">
                {group.label}
              </span>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? "bg-accent text-surface-base shadow-glow"
                        : "text-text-muted hover:text-white hover:bg-surface-base"
                    }`}
                  >
                    <Icon size={15} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-border-dark">
          <div className="mb-2 px-3 py-2 bg-surface-base rounded-xl border border-white/10">
            <span className="text-[10px] text-text-muted font-bold block">Logged in as</span>
            <span className="text-xs text-white font-bold truncate block">{user?.email || "Admin User"}</span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-xs font-bold transition-colors cursor-pointer"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Nav Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-surface-base/80 backdrop-blur-md z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-surface-raised border-r border-border-dark flex flex-col transition-transform duration-300 lg:hidden ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-5 border-b border-border-dark flex items-center justify-between">
          <span className="text-lg font-black text-white">AWENUE Admin</span>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-1 text-text-muted hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
          {navGroups.map((group) => (
            <div key={group.label} className="space-y-1">
              <span className="px-3 text-[10px] font-black tracking-wider text-text-muted/60 uppercase block mb-1">
                {group.label}
              </span>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? "bg-accent text-surface-base"
                        : "text-text-muted hover:text-white hover:bg-surface-base"
                    }`}
                  >
                    <Icon size={15} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-border-dark">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs font-bold"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header */}
        <header className="h-16 bg-surface-raised border-b border-border-dark px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 text-text-muted hover:text-white"
            >
              <Menu size={20} />
            </button>
            <span className="text-sm font-extrabold text-white">Admin Control Panel</span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              target="_blank"
              className="text-xs text-accent font-bold hover:underline hidden sm:block"
            >
              View Live Website &rarr;
            </Link>
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <ShieldCheck size={16} className="text-accent" />
              <span className="hidden sm:inline">Protected Admin Session</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 sm:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

