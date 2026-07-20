"use client";

/**
 * AWENUE Admin AuthProvider
 *
 * Session state is determined EXCLUSIVELY by the server-side signed
 * HttpOnly cookie — never by localStorage or client-side flags.
 *
 * On mount: calls /api/admin/auth/me to hydrate admin state.
 * On logout: calls /api/admin/logout to clear the server session cookie.
 *
 * This eliminates the localStorage bypass vulnerability from the previous
 * implementation where setting "awenue_admin_otp_verified" = "true" in
 * localStorage would grant admin access without a valid server session.
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export interface AdminUser {
  adminId: string;
  email: string;
  role: string;
  displayName: string;
  status?: string;
}

interface AuthContextType {
  admin: AdminUser | null;
  isAdmin: boolean;
  loading: boolean;
  refreshSession: () => Promise<void>;
  logout: () => Promise<void>;
  /** @deprecated Use admin.email instead */
  user: { email: string; displayName?: string } | null;
  /** @deprecated Session is server-side — always true if admin is set */
  isOtpVerified: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/auth/me", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (res.ok) {
        const data = await res.json();
        setAdmin({
          adminId: data.adminId,
          email: data.email,
          role: data.role,
          displayName: data.displayName,
          status: data.status,
        });
      } else {
        setAdmin(null);
      }
    } catch {
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Hydrate session on mount
  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const refreshSession = useCallback(async () => {
    setLoading(true);
    await fetchSession();
  }, [fetchSession]);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/admin/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Even if API call fails, clear local state
    }

    // Also sign out of Firebase client if applicable
    try {
      await signOut(auth);
    } catch {
      // Non-fatal
    }

    setAdmin(null);
  }, []);

  const isAdmin = admin !== null && admin.status !== "suspended" && admin.status !== "revoked";

  return (
    <AuthContext.Provider
      value={{
        admin,
        isAdmin,
        loading,
        refreshSession,
        logout,
        // Backwards-compatibility shims
        user: admin ? { email: admin.email, displayName: admin.displayName } : null,
        isOtpVerified: isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
