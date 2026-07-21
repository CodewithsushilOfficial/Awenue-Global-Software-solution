import { Metadata } from "next";
import Navigation from "@/components/sections/Navigation";
import Footer from "@/components/sections/Footer";
import { MapPin, Mail, Clock, MessageSquare, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const revalidate = false;

export const metadata: Metadata = {
  title: "Contact Us | AWENUE Global Software Solutions",
  description:
    "Get in touch with AWENUE Global Software Solutions. We help businesses in Varanasi, India and worldwide build websites, mobile apps, SaaS platforms, and AI automation solutions. Free consultation available.",
  alternates: {
    canonical: "https://www.awenueglobalsoftwaresolutions.in/contact",
  },
  openGraph: {
    title: "Contact AWENUE | Free Software Development Consultation",
    description:
      "Reach out to AWENUE for a free consultation on web development, mobile apps, SaaS, and AI automation. Based in Varanasi, India.",
    url: "https://www.awenueglobalsoftwaresolutions.in/contact",
    type: "website",
    siteName: "AWENUE Global Software Solutions",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact AWENUE | Free Software Development Consultation",
    description:
      "Reach out to AWENUE for a free consultation on web development, mobile apps, SaaS, and AI automation.",
  },
};

const faqs = [
  {
    q: "How do I get a free consultation from AWENUE?",
    a: "Click 'Get Free Consultation' on any page or email us at hello@awenue.io. We respond within 24 hours on business days."
  },
  {
    q: "What is AWENUE's service area?",
    a: "AWENUE is based in Varanasi, Uttar Pradesh, India and serves clients across India and internationally including the United States, UK, and UAE."
  },
  {
    q: "What types of projects does AWENUE take on?",
    a: "We handle web development, mobile app development, SaaS platforms, e-commerce stores, AI automation workflows, UI/UX design, branding, and digital marketing."
  },
  {
    q: "How long does a typical project take?",
    a: "A landing page typically takes 5-7 days. A full business website takes 2-4 weeks. SaaS MVPs typically take 6-12 weeks depending on scope."
  }
];

export default async function ContactPage() {
  let contactEmail = "hello@awenue.io";
  let contactPhone = "+91 98765 43210";
  let whatsappNumber = "+91 98765 43210";
  let businessAddress = "Varanasi, Uttar Pradesh 221001, India";

  try {
    const snap = await getDoc(doc(db, "adminSettings", "general"));
    if (snap.exists()) {
      const data = snap.data();
      contactEmail = data.businessEmail || contactEmail;
      contactPhone = data.contactPhone || contactPhone;
      whatsappNumber = data.whatsappNumber || whatsappNumber;
      businessAddress = data.businessAddress || businessAddress;
    }
  } catch (err) {
    console.warn("Using default settings for contact page:", err);
  }

  const contactPageSchema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "@id": "https://www.awenueglobalsoftwaresolutions.in/contact#contactpage",
    "name": "Contact AWENUE Global Software Solutions",
    "url": "https://www.awenueglobalsoftwaresolutions.in/contact",
    "description": "Contact page for AWENUE Global Software Solutions — a software development agency from Varanasi, India.",
    "mainEntity": {
      "@type": "Organization",
      "@id": "https://www.awenueglobalsoftwaresolutions.in/#organization",
      "name": "AWENUE Global Software Solutions",
      "email": contactEmail,
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Varanasi",
        "addressRegion": "Uttar Pradesh",
        "postalCode": "221001",
        "addressCountry": "IN"
      },
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "customer support",
        "email": contactEmail,
        "telephone": contactPhone,
        "availableLanguage": ["English", "Hindi"]
      }
    }
  };

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": "https://www.awenueglobalsoftwaresolutions.in/#localbusiness",
    "name": "AWENUE Global Software Solutions",
    "image": "https://www.awenueglobalsoftwaresolutions.in/images/og-image.jpg",
    "url": "https://www.awenueglobalsoftwaresolutions.in",
    "email": contactEmail,
    "telephone": contactPhone,
    "priceRange": "$$",
    "currenciesAccepted": "INR, USD",
    "paymentAccepted": "Cash, Bank Transfer, UPI",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": businessAddress,
      "addressLocality": "Varanasi",
      "addressRegion": "Uttar Pradesh",
      "postalCode": "221001",
      "addressCountry": "IN"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 25.3176,
      "longitude": 82.9739
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "opens": "10:00",
        "closes": "19:00"
      },
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Saturday"],
        "opens": "10:00",
        "closes": "15:00"
      }
    ],
    "areaServed": [
      { "@type": "City", "name": "Varanasi" },
      { "@type": "State", "name": "Uttar Pradesh" },
      { "@type": "Country", "name": "India" }
    ]
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.awenueglobalsoftwaresolutions.in" },
      { "@type": "ListItem", "position": 2, "name": "Contact", "item": "https://www.awenueglobalsoftwaresolutions.in/contact" }
    ]
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map((faq) => ({
      "@type": "Question",
      "name": faq.q,
      "acceptedAnswer": { "@type": "Answer", "text": faq.a }
    }))
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(contactPageSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <Navigation />
      <main className="grow bg-[#0A0F0D] text-white">

        {/* HERO */}
        <section className="relative pt-32 pb-20 overflow-hidden border-b border-white/5">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/4 left-1/3 -translate-x-1/2 w-[600px] h-[300px] rounded-full blur-[120px] bg-accent/10" />
          </div>
          <div className="max-w-6xl mx-auto px-6 relative z-10">
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-white/40 mb-8">
              <Link href="/" className="hover:text-accent transition-colors">Home</Link>
              <span>/</span>
              <span className="text-accent font-semibold">Contact</span>
            </nav>
            <div className="max-w-2xl space-y-6">
              <span className="inline-block px-4 py-1.5 rounded-full border border-accent/30 bg-accent/10 text-accent text-xs font-bold uppercase tracking-widest">
                Get In Touch
              </span>
              <h1 className="text-5xl sm:text-6xl font-black tracking-tight leading-[1.05]">
                {"Let's Build Something "}
                <span className="text-accent">Remarkable</span>
              </h1>
              <p className="text-lg text-white/60 leading-relaxed max-w-xl">
                Whether you are a startup with a big idea or an established business ready to scale digitally,
                we are here to help you build it right. Free consultation, no strings attached.
              </p>
            </div>
          </div>
        </section>

        {/* CONTACT INFO */}
        <section className="py-24">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">

              <div className="space-y-10">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">Contact Information</h2>
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                        <MapPin size={18} className="text-accent" />
                      </div>
                      <div>
                        <p className="text-white font-semibold">Office Location</p>
                        <p className="text-white/50 text-sm mt-1 leading-relaxed">
                          {businessAddress}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                        <Mail size={18} className="text-accent" />
                      </div>
                      <div>
                        <p className="text-white font-semibold">Email</p>
                        <a href={`mailto:${contactEmail}`} className="text-accent text-sm mt-1 hover:underline block">
                          {contactEmail}
                        </a>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                        <Clock size={18} className="text-accent" />
                      </div>
                      <div>
                        <p className="text-white font-semibold">Business Hours</p>
                        <p className="text-white/50 text-sm mt-1 leading-relaxed">
                          Mon - Fri: 10:00 AM - 7:00 PM IST<br />Sat: 10:00 AM - 3:00 PM IST
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                        <MessageSquare size={18} className="text-accent" />
                      </div>
                      <div>
                        <p className="text-white font-semibold">Response Time</p>
                        <p className="text-white/50 text-sm mt-1">Typically within 24 hours on business days.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                  <h3 className="text-white font-bold text-lg mb-4">We Can Help With</h3>
                  <ul className="space-y-3">
                    {[
                      "Website & Landing Page Development",
                      "Mobile App Development (iOS & Android)",
                      "SaaS MVP & Platform Development",
                      "AI Automation & Workflow Integration",
                      "E-Commerce Store Development",
                      "UI/UX Design & Branding",
                      "Business Process Automation",
                      "Digital Consulting & Strategy"
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-3 text-sm text-white/60">
                        <CheckCircle2 size={15} className="text-accent shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex flex-col gap-8">
                <div className="rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/10 via-transparent to-transparent p-8 space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-white">Book a Free Consultation</h2>
                    <p className="text-white/50 text-sm leading-relaxed">
                      Tell us about your project and we will get back to you with a detailed proposal.
                    </p>
                  </div>
                  <a
                    href={`mailto:${contactEmail}?subject=Project%20Inquiry`}
                    className="group inline-flex items-center gap-3 bg-accent hover:bg-accent/90 text-black font-bold px-6 py-4 rounded-xl transition-all duration-200 text-sm w-full justify-center"
                  >
                    <Mail size={18} />
                    Email Us Your Project Details
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </a>
                  <p className="text-center text-xs text-white/30">Or use the consultation form at the top of any page.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Free Consultation", sub: "No commitment required" },
                    { label: "Fast Response", sub: "Reply within 24 hours" },
                    { label: "NDA Available", sub: "Confidentiality assured" },
                    { label: "Global Reach", sub: "India, US, UK & more" }
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-white font-bold text-sm">{item.label}</p>
                      <p className="text-white/40 text-xs mt-0.5">{item.sub}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 border-t border-white/5">
          <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-3xl font-black text-white mb-12 text-center">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {faqs.map((faq) => (
                <div key={faq.q} className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
                  <h3 className="text-white font-semibold text-base mb-2">{faq.q}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* BOTTOM CTA */}
        <section className="py-20 border-t border-white/5 text-center">
          <div className="max-w-2xl mx-auto px-6 space-y-6">
            <h2 className="text-3xl font-black text-white">Ready to start your project?</h2>
            <p className="text-white/50">Join businesses across India and globally who trust AWENUE for their digital growth.</p>
            <Link href="/" className="inline-flex items-center gap-2 bg-accent hover:bg-accent/90 text-black font-bold px-8 py-4 rounded-xl transition-all">
              Back to Home
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
