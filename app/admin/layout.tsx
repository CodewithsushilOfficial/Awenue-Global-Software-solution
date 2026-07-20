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
  Settings,
  LogOut,
  Menu,
  X,
  ShieldCheck,
} from "lucide-react";

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

  // Skip layout sidebar for login page
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  // Render loading state while authenticating or redirecting
  if (loading || !user || !isAdmin || !isOtpVerified) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center text-text-muted text-sm">
        Authenticating admin session & 2FA security...
      </div>
    );
  }

  const navItems = [
    { name: "Overview", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Website Content", href: "/admin/content", icon: FileText },
    { name: "Services", href: "/admin/services", icon: Briefcase },
    { name: "Products", href: "/admin/products", icon: Package },
    { name: "Portfolio", href: "/admin/portfolio", icon: FolderKanban },
    { name: "Project Inquiries", href: "/admin/inquiries", icon: Inbox },
    { name: "Consultations", href: "/admin/consultations", icon: MessageSquare },
    { name: "Settings", href: "/admin/settings", icon: Settings },
  ];

  const handleLogout = async () => {
    await logout();
    router.push("/admin/login");
  };

  return (
    <div className="min-h-screen bg-surface-base flex text-text-secondary">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col bg-surface-raised border-r border-border-dark shrink-0">
        <div className="p-6 border-b border-border-dark flex items-center justify-between">
          <Link href="/admin/dashboard" className="text-xl font-black tracking-wider text-white">
            AWEN<span className="text-accent">UE</span> CMS
          </Link>
          <span className="text-[10px] font-extrabold text-accent bg-accent/10 border border-accent/30 px-2 py-0.5 rounded">
            ADMIN
          </span>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-colors ${
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
        </nav>

        <div className="p-4 border-t border-border-dark">
          <div className="mb-3 px-3 py-2 bg-surface-base rounded-xl border border-white/10">
            <span className="text-[10px] text-text-muted font-bold block">Logged in as</span>
            <span className="text-xs text-white font-bold truncate block">{user?.email || "Admin User"}</span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-xs font-bold transition-colors cursor-pointer"
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
        <div className="p-6 border-b border-border-dark flex items-center justify-between">
          <span className="text-xl font-black text-white">AWENUE Admin</span>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-1 text-text-muted hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-colors ${
                  isActive
                    ? "bg-accent text-surface-base"
                    : "text-text-muted hover:text-white hover:bg-surface-base"
                }`}
              >
                <Icon size={16} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border-dark">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs font-bold"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-surface-raised border-b border-border-dark px-6 flex items-center justify-between">
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
