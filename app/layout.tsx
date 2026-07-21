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
  "@type": ["Organization", "LocalBusiness", "ProfessionalService"],
  "@id": "https://www.awenueglobalsoftwaresolutions.in/#organization",
  "name": "AWENUE Global Software Solutions",
  "legalName": "Avenue Global Software Solutions",
  "alternateName": "AWENUE",
  "url": "https://www.awenueglobalsoftwaresolutions.in",
  "logo": {
    "@type": "ImageObject",
    "url": "https://www.awenueglobalsoftwaresolutions.in/images/logo.png",
    "width": "200",
    "height": "60"
  },
  "image": "https://www.awenueglobalsoftwaresolutions.in/images/og-image.jpg",
  "description": "AWENUE Global Software Solutions is a full-service software development agency specializing in web development, mobile applications, SaaS platforms, AI automation, and digital transformation for businesses across India and globally.",
  "foundingDate": "2024",
  "priceRange": "$$",
  "sameAs": [
    "https://github.com/CodewithsushilOfficial"
  ],
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Varanasi",
    "addressLocality": "Varanasi",
    "addressRegion": "Uttar Pradesh",
    "postalCode": "221001",
    "addressCountry": "IN"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": "25.3176",
    "longitude": "82.9739"
  },
  "areaServed": [
    {
      "@type": "Country",
      "name": "India"
    },
    {
      "@type": "Country",
      "name": "United States"
    }
  ],
  "contactPoint": [
    {
      "@type": "ContactPoint",
      "contactType": "customer support",
      "email": "hello@awenue.io",
      "availableLanguage": ["English", "Hindi"]
    },
    {
      "@type": "ContactPoint",
      "contactType": "sales",
      "email": "hello@awenue.io",
      "availableLanguage": ["English", "Hindi"]
    }
  ],
  "knowsAbout": [
    "Web Development",
    "Mobile App Development",
    "SaaS Development",
    "AI Automation",
    "Business Process Automation",
    "Digital Marketing",
    "UI/UX Design",
    "Branding",
    "ERP Software",
    "CRM Software"
  ]
};

const webSiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://www.awenueglobalsoftwaresolutions.in/#website",
  "name": "AWENUE Global Software Solutions",
  "url": "https://www.awenueglobalsoftwaresolutions.in",
  "description": "Software Development Agency — Web, Apps, SaaS, AI Automation",
  "publisher": {
    "@id": "https://www.awenueglobalsoftwaresolutions.in/#organization"
  },
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://www.awenueglobalsoftwaresolutions.in/?q={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  }
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

