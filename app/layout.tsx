import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { MotionProvider } from "@/components/providers/MotionProvider";
import { ModalProvider } from "@/components/providers/ModalProvider";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AWENUE | Web Development, Apps, AI Automation & Digital Solutions",
  description:
    "AWENUE helps local businesses, startups, and growing companies build websites, mobile apps, SaaS products, AI automation workflows, and powerful digital experiences.",
  keywords: [
    "digital growth partner",
    "web development",
    "mobile app development",
    "SaaS product development",
    "AI automation workflows",
    "business process automation",
    "IT consulting",
    "graphic design & branding",
    "Next.js development",
    "Varanasi software agency",
  ],
  authors: [{ name: "Awenue Team" }],
};

import { AuthProvider } from "@/components/providers/AuthProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} h-full antialiased`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="google-site-verification" content="hVtrtXlVhE4krp56ab8RaEDILwPAbJXHXRL8wn-mHEc" />
      </head>
      <body className="min-h-full bg-surface-base text-text-secondary flex flex-col selection:bg-accent selection:text-surface-base">
        <AuthProvider>
          <ModalProvider>
            <MotionProvider>{children}</MotionProvider>
          </ModalProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
