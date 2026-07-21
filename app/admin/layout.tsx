"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { hasPermission, Permission, AdminRole } from "@/lib/rbac";
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
  UserCog,
  Lock,
  ArrowLeft,
  Cpu,
  Share2,
  Globe,
  ExternalLink,
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  permission: Permission;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { admin, isAdmin, loading, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (pathname === "/admin/login") return;
    if (pathname === "/admin/invite/accept") return;
    if (!loading && !isAdmin) {
      router.replace("/admin/login");
    }
  }, [loading, isAdmin, pathname, router]);

  if (pathname === "/admin/login" || pathname.startsWith("/admin/invite/accept")) {
    return <>{children}</>;
  }

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center text-text-muted text-sm font-bold">
        Authenticating admin session & permissions...
      </div>
    );
  }

  const role = (admin?.role || "admin") as AdminRole;
  const userPerms = admin?.permissions;

  const rawNavGroups: NavGroup[] = [
    {
      label: "OVERVIEW",
      items: [
        { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard, permission: "dashboard.view" },
      ],
    },
    {
      label: "WEBSITE MANAGEMENT",
      items: [
        { name: "Website Content", href: "/admin/content", icon: FileText, permission: "content.view" },
        { name: "Services", href: "/admin/services", icon: Briefcase, permission: "services.view" },
        { name: "Products", href: "/admin/products", icon: Package, permission: "products.view" },
        { name: "Our Process", href: "/admin/process", icon: Layers, permission: "process.view" },
        { name: "Technology Stack", href: "/admin/technologies", icon: Cpu, permission: "content.view" },
        { name: "Portfolio / Work", href: "/admin/portfolio", icon: FolderKanban, permission: "portfolio.view" },
      ],
    },
    {
      label: "CUSTOMER MANAGEMENT",
      items: [
        { name: "Users", href: "/admin/users", icon: Users, permission: "users.view" },
        { name: "Project Inquiries", href: "/admin/inquiries", icon: Inbox, permission: "inquiries.view" },
        { name: "Consultations", href: "/admin/consultations", icon: MessageSquare, permission: "inquiries.view" },
        { name: "General Queries", href: "/admin/queries", icon: HelpCircle, permission: "inquiries.view" },
      ],
    },
    {
      label: "COMMUNICATION",
      items: [
        { name: "Email / Communication", href: "/admin/communication", icon: Mail, permission: "inquiries.view" },
      ],
    },
    {
      label: "CONFIGURATION",
      items: [
        { name: "Website Settings", href: "/admin/settings", icon: Settings, permission: "settings.view" },
        { name: "Social Media Links", href: "/admin/settings/social", icon: Share2, permission: "settings.view" },
      ],
    },
    {
      label: "ACCOUNT",
      items: [
        { name: "Admin Profile", href: "/admin/profile", icon: UserCheck, permission: "dashboard.view" },
        { name: "Admin Management", href: "/admin/admins", icon: UserCog, permission: "admins.view" },
      ],
    },
  ];

  // Filter navigation items based on granular permissions
  const navGroups = rawNavGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => hasPermission(role, item.permission, userPerms)),
    }))
    .filter((group) => group.items.length > 0);

  // Check if current route is allowed
  const allRoutePermissions: Record<string, Permission> = {
    "/admin/dashboard": "dashboard.view",
    "/admin/content": "content.view",
    "/admin/services": "services.view",
    "/admin/products": "products.view",
    "/admin/process": "process.view",
    "/admin/technologies": "content.view",
    "/admin/portfolio": "portfolio.view",
    "/admin/users": "users.view",
    "/admin/inquiries": "inquiries.view",
    "/admin/consultations": "inquiries.view",
    "/admin/queries": "inquiries.view",
    "/admin/communication": "inquiries.view",
    "/admin/settings": "settings.view",
    "/admin/settings/social": "settings.view",
    "/admin/profile": "dashboard.view",
    "/admin/admins": "admins.view",
  };

  const requiredPerm = allRoutePermissions[pathname];
  const isRouteAllowed = !requiredPerm || hasPermission(role, requiredPerm, userPerms);

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
          <div className="flex flex-col items-end gap-1">
            <span className="text-[10px] font-extrabold text-accent bg-accent/10 border border-accent/30 px-2 py-0.5 rounded">
              ADMIN
            </span>
            {role && (
              <span className="text-[9px] font-bold text-text-muted/60 uppercase tracking-wider">
                {role.replace("_", " ")}
              </span>
            )}
          </div>
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
            <span className="text-xs text-white font-bold truncate block">{admin?.email || "Admin User"}</span>
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
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 sm:w-80 bg-surface-raised border-r border-border-dark flex flex-col transition-transform duration-300 ease-out lg:hidden shadow-2xl ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 sm:p-5 border-b border-border-dark flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link
              href="/admin/dashboard"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-base font-black tracking-wider text-white"
            >
              AWEN<span className="text-accent">UE</span> CMS
            </Link>
            <span className="text-[9px] font-extrabold text-accent bg-accent/10 border border-accent/30 px-2 py-0.5 rounded">
              ADMIN
            </span>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 text-text-muted hover:text-white rounded-xl bg-surface-base border border-white/10 transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
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
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? "bg-accent text-surface-base shadow-glow"
                        : "text-text-muted hover:text-white hover:bg-surface-base"
                    }`}
                  >
                    <Icon size={16} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-border-dark space-y-3">
          <div className="px-3 py-2 bg-surface-base rounded-xl border border-white/10">
            <span className="text-[10px] text-text-muted font-bold block">Logged in as</span>
            <span className="text-xs text-white font-bold truncate block">{admin?.email || "Admin User"}</span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-xs font-bold transition-colors cursor-pointer"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen max-w-full">
        {/* Top Header Navbar */}
        <header className="h-[68px] sm:h-[72px] bg-surface-raised/95 backdrop-blur-xl border-b border-border-dark px-3.5 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30 shadow-lg">
          {/* Left: Mobile Hamburger & Page Brand Title */}
          <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2.5 sm:p-3 rounded-xl bg-surface-base border border-white/10 text-text-muted hover:text-white hover:border-accent/40 active:scale-95 transition-all cursor-pointer shrink-0"
              aria-label="Open mobile menu"
            >
              <Menu size={20} />
            </button>

            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <Link href="/admin/dashboard" className="flex items-center gap-1.5 sm:gap-2 shrink-0 group">
                <span className="text-base sm:text-lg font-black tracking-wider text-white group-hover:text-accent transition-colors">
                  AWEN<span className="text-accent">UE</span>
                </span>
                <span className="text-[10px] sm:text-xs font-black text-accent bg-accent/15 border border-accent/30 px-2 py-0.5 rounded-md font-mono tracking-widest uppercase shadow-sm">
                  CMS
                </span>
              </Link>

              <span className="hidden sm:inline-block text-border-dark font-light text-base">/</span>

              <span className="hidden sm:inline-block text-xs sm:text-sm font-extrabold text-text-muted/90 tracking-wide truncate">
                Admin Control Panel
              </span>
            </div>
          </div>

          {/* Right: Actions & Session Status (Boxed Action Cards) */}
          <div className="flex items-center gap-2 sm:gap-3.5 shrink-0">
            {/* View Site Box Card */}
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-extrabold text-accent bg-accent/10 hover:bg-accent/20 border border-accent/30 hover:border-accent/50 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl transition-all shadow-sm shrink-0 cursor-pointer active:scale-95"
            >
              <Globe size={15} className="shrink-0" />
              <span>View Site</span>
              <ExternalLink size={12} className="hidden sm:inline shrink-0 opacity-70" />
            </Link>

            {/* Protected Session Box Card */}
            <div className="inline-flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-extrabold text-white bg-surface-base border border-white/10 px-2.5 sm:px-3.5 py-2 sm:py-2.5 rounded-xl shrink-0 shadow-sm">
              <div className="relative flex items-center justify-center">
                <ShieldCheck size={16} className="text-accent shrink-0" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-accent animate-pulse" />
              </div>
              <span className="hidden sm:inline text-xs font-bold text-white">Protected</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto w-full max-w-full min-w-0">
          {!isRouteAllowed ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-surface-raised/40 border border-rose-500/20 rounded-3xl">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mb-4">
                <Lock size={32} />
              </div>
              <h2 className="text-xl font-black text-white">Access Denied (403 Forbidden)</h2>
              <p className="text-xs text-text-muted mt-2 max-w-md leading-relaxed">
                Your admin account does not have permission to access <code className="text-accent">{pathname}</code>.
              </p>
              <Link
                href="/admin/dashboard"
                className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-surface-base font-extrabold text-xs hover:bg-accent-hover transition-colors"
              >
                <ArrowLeft size={16} />
                <span>Return to Dashboard</span>
              </Link>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
