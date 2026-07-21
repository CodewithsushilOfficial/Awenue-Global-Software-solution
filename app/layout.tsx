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
  metadataBase: new URL("https://www.awenueglobalsoftwaresolutions.in"),
  title: {
    default: "AWENUE | Web Development, Apps, AI Automation & Digital Solutions",
    template: "%s | AWENUE",
  },
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
  alternates: {
    canonical: "https://www.awenueglobalsoftwaresolutions.in",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://www.awenueglobalsoftwaresolutions.in",
    siteName: "AWENUE Global Software Solutions",
    title: "AWENUE | Web Development, Apps, AI Automation & Digital Solutions",
    description:
      "AWENUE helps local businesses, startups, and growing companies build websites, mobile apps, SaaS products, AI automation workflows, and powerful digital experiences.",
  },
  twitter: {
    card: "summary_large_image",
    title: "AWENUE | Web Development, Apps, AI Automation & Digital Solutions",
    description:
      "AWENUE helps local businesses, startups, and growing companies build websites, mobile apps, SaaS products, AI automation workflows, and powerful digital experiences.",
  },
};

const orgSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "AWENUE Global Software Solutions",
  "alternateName": "Avenue Global Software Solutions",
  "url": "https://www.awenueglobalsoftwaresolutions.in",
  "logo": "https://www.awenueglobalsoftwaresolutions.in/images/logo.png",
  "sameAs": [
    "https://github.com/CodewithsushilOfficial"
  ],
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Varanasi",
    "addressRegion": "Uttar Pradesh",
    "addressCountry": "IN"
  }
};

const webSiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "AWENUE Global Software Solutions",
  "url": "https://www.awenueglobalsoftwaresolutions.in"
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
        />
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

