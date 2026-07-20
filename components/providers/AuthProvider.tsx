"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithCustomToken,
  signOut,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

interface AuthContextType {
  user: User | { email: string; displayName?: string } | null;
  isAdmin: boolean;
  isOtpVerified: boolean;
  setOtpVerified: (val: boolean, email?: string) => void;
  loading: boolean;
  loginWithCustomToken: (customToken?: string, targetEmail?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | { email: string; displayName?: string } | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isOtpVerified, setIsOtpVerifiedState] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return (
        localStorage.getItem("awenue_admin_otp_verified") === "true" ||
        sessionStorage.getItem("awenue_admin_otp_verified") === "true"
      );
    }
    return false;
  });
  const [loading, setLoading] = useState<boolean>(true);

  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "Codewithsushil7236@gmail.com";

  const setOtpVerified = (val: boolean, email?: string) => {
    setIsOtpVerifiedState(val);
    if (typeof window !== "undefined") {
      if (val) {
        localStorage.setItem("awenue_admin_otp_verified", "true");
        sessionStorage.setItem("awenue_admin_otp_verified", "true");
        if (email) {
          localStorage.setItem("awenue_admin_email", email.toLowerCase());
        }
      } else {
        localStorage.removeItem("awenue_admin_otp_verified");
        localStorage.removeItem("awenue_admin_email");
        sessionStorage.removeItem("awenue_admin_otp_verified");
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      const isPersistentVerified =
        typeof window !== "undefined" &&
        (localStorage.getItem("awenue_admin_otp_verified") === "true" ||
          sessionStorage.getItem("awenue_admin_otp_verified") === "true");

      const savedEmail =
        (typeof window !== "undefined" && localStorage.getItem("awenue_admin_email")) ||
        adminEmail;

      if (currentUser) {
        setUser(currentUser);
        setIsAdmin(true);
        if (isPersistentVerified) {
          setIsOtpVerifiedState(true);
        }
      } else if (isPersistentVerified) {
        // Persistent admin session stored in device localStorage
        setIsAdmin(true);
        setIsOtpVerifiedState(true);
        setUser({ email: savedEmail, displayName: "AWENUE Administrator" });
      } else {
        setIsAdmin(false);
        setIsOtpVerifiedState(false);
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [adminEmail]);

  const loginWithCustomToken = async (customToken?: string, targetEmail?: string) => {
    setLoading(true);
    const emailToUse = targetEmail || adminEmail;
    try {
      if (customToken && typeof customToken === "string" && customToken.split(".").length === 3) {
        try {
          await signInWithCustomToken(auth, customToken);
        } catch (authErr) {
          console.warn("Client Firebase Auth custom token sign-in notice:", authErr);
        }
      }
      // Guarantee persistent OTP verification & admin state in device storage
      setOtpVerified(true, emailToUse);
      setIsAdmin(true);
      setUser({ email: emailToUse, displayName: "AWENUE Administrator" });
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch (err) {
      console.warn("Logout API call failed:", err);
    }
    try {
      await signOut(auth);
    } catch (sErr) {
      console.warn("Firebase signOut notice:", sErr);
    }
    setOtpVerified(false);
    setIsAdmin(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        isOtpVerified,
        setOtpVerified,
        loading,
        loginWithCustomToken,
        logout,
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
