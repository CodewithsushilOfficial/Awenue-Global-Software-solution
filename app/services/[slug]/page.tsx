import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Navigation from "@/components/sections/Navigation";
import Footer from "@/components/sections/Footer";
import { ArrowRight, CheckCircle2, ChevronRight, HelpCircle, Code2, Layers, Cpu, ShieldCheck } from "lucide-react";
import { ServiceItem } from "@/components/sections/Services";

// Next.js 16 Asynchronous Page params interface
interface PageProps {
  params: Promise<{ slug: string }>;
}

// Enable ISR (revalidated dynamically via CMS API)
export const revalidate = false;

// ─── RICH EXTRA MARKETING CONTENT FOR PRIMARY SERVICES ───────────────────────
interface RichServiceContent {
  valueProposition: string;
  problemsSolved: string[];
  capabilities: string[];
  process: { step: string; title: string; desc: string }[];
  technologies: string[];
  benefits: string[];
  faqs: { q: string; a: string }[];
}

const SERVICE_RICH_DATA: Record<string, RichServiceContent> = {
  "web-development": {
    valueProposition: "Deliver modern, secure, and blazing-fast web experiences built to convert visitors into customers.",
    problemsSolved: [
      "Low lead generation and poor conversion rates from old websites",
      "Slow loading times that hurt Google SEO ranking and user experience",
      "Non-responsive designs that look broken on mobile devices",
      "Difficult content updates and lack of modern CMS integrations"
    ],
    capabilities: [
      "Business & Corporate Websites",
      "E-Commerce Solutions (Shopify, WooCommerce, Custom)",
      "High-Converting Landing Pages",
      "Custom Web Applications (React, Next.js, Node.js)",
      "Website Redesign & Modernization",
      "Maintenance & Performance Optimization"
    ],
    process: [
      { step: "01", title: "Discovery & Strategy", desc: "We analyze your business, research competitor gaps, and map out your site architecture." },
      { step: "02", title: "Design & UX", desc: "Our team designs high-fidelity interactive wireframes focusing on mobile usability and brand identity." },
      { step: "03", title: "Development", desc: "We build your site using Next.js and Tailwind CSS, ensuring clean, performant, and semantic code." },
      { step: "04", title: "QA & SEO Integration", desc: "Rigorous cross-device testing, technical SEO audit, and speed optimization for perfect Core Web Vitals." },
      { step: "05", title: "Launch & Support", desc: "We deploy to Vercel and provide ongoing maintenance to keep your digital storefront secure and fast." }
    ],
    technologies: ["Next.js", "React.js", "TypeScript", "Tailwind CSS", "GSAP", "Framer Motion", "Firebase"],
    benefits: [
      "Core Web Vitals optimized for search engine preference",
      "Mobile-first responsive design ensuring seamless experience on all screens",
      "Blazing fast performance reduces bounce rates and boosts conversion",
      "Dynamic SEO metadata automatically updated via CMS"
    ],
    faqs: [
      { q: "How long does it take to develop a custom website?", a: "A custom marketing website typically takes 3 to 5 weeks from initial strategy to launch. More complex web applications or e-commerce platforms can take 6 to 10 weeks depending on requirements." },
      { q: "Do you build SEO-friendly websites?", a: "Yes, all our websites are built with a strong SEO foundation. We use Next.js for server-side rendering, optimize Core Web Vitals, implement proper heading structures, and ensure valid schema markup." },
      { q: "Will I be able to update content myself?", a: "Yes, we integrate our custom websites with Firebase Firestore or headless CMS options, allowing you to easily update text, images, blog posts, and services through a simple admin dashboard." },
      { q: "Do you provide hosting and maintenance?", a: "Yes, we deploy and host websites on secure, fast cloud platforms like Vercel and AWS, and offer maintenance plans covering updates, backups, security monitoring, and performance checks." },
      { q: "Can you redesign my existing website?", a: "Absolutely. We can perform a full redesign of your existing website to modernize the design, improve loading speeds, migrate to newer technologies like Next.js, and optimize it for conversions." }
    ]
  },
  "saas-development": {
    valueProposition: "Transform your software concept into a production-ready, scalable SaaS platform designed to grow with your business.",
    problemsSolved: [
      "Protracted development timelines delaying product launches",
      "Non-scalable tech stacks that crash under sudden user growth",
      "Clunky user interfaces resulting in high user churn rates",
      "Complex payment gateways and multi-tenant architectures"
    ],
    capabilities: [
      "Product Strategy & Planning",
      "UI/UX Product Design",
      "MVP Development for Startups",
      "Custom SaaS Platforms",
      "Subscription & Payment Integration (Stripe)",
      "Scalable Cloud Architecture (AWS, Vercel)"
    ],
    process: [
      { step: "01", title: "Product Blueprint", desc: "We map user journeys, create wireframes, and design the system architecture." },
      { step: "02", title: "Design System", desc: "We build a premium UI/UX design language focusing on utility, clarity, and aesthetics." },
      { step: "03", title: "Agile Development", desc: "We build the MVP in structured sprints, using robust technologies and automated testing." },
      { step: "04", title: "Billing & Security Integration", desc: "We hook up multi-tenant subscriptions, RBAC access controls, and encryption layers." },
      { step: "05", title: "Deployment & Scaling", desc: "We deploy to high-availability servers and set up telemetry for live performance monitoring." }
    ],
    technologies: ["Next.js", "TypeScript", "Node.js", "PostgreSQL", "Supabase", "Prisma", "Stripe API", "AWS"],
    benefits: [
      "Speed to market with a high-fidelity MVP",
      "Multi-tenant database schema configured for secure data isolation",
      "Modular components facilitate straightforward post-launch feature additions",
      "Optimized load times to retain early user engagement"
    ],
    faqs: [
      { q: "What is a SaaS MVP, and why do I need one?", a: "A Minimum Viable Product (MVP) is the simplest version of your software product that contains core features needed to solve users' primary problems. It allows you to gather user feedback and validate your business idea with minimal cost and risk." },
      { q: "How long does it take to build a SaaS MVP?", a: "An MVP typically takes 6 to 12 weeks to design, develop, and launch. More complex platforms with custom integrations or advanced AI workflows may take longer." },
      { q: "Which payment gateways do you support?", a: "We primarily integrate Stripe for international billing, and Razorpay or similar gateways for the Indian market, configuring multi-tier subscription models, free trials, and coupon codes." },
      { q: "How do you ensure SaaS data security?", a: "We employ strict Row Level Security (RLS) policies, encrypt sensitive data at rest and in transit, implement secure JWT-based authentication, and follow OWASP top 10 security guidelines." },
      { q: "Can you help maintain the SaaS platform after launch?", a: "Yes, we offer monthly retainers covering server management, security patching, bug fixing, database backups, and feature iterations." }
    ]
  },
  "mobile-app-development": {
    valueProposition: "Develop premium, high-performance mobile applications that keep your brand in your customer's pocket.",
    problemsSolved: [
      "High costs of building separate native iOS and Android teams",
      "Slow, unresponsive mobile applications that frustrate users",
      "Unintuitive interfaces causing poor app store ratings",
      "Ineffective push notification strategies and low user retention"
    ],
    capabilities: [
      "Android Native App Development",
      "iOS Native App Development",
      "Cross-Platform Development (React Native, Flutter)",
      "Enterprise & Business Applications",
      "E-Commerce Mobile Integrations",
      "App Store Optimization (ASO) & Deployment"
    ],
    process: [
      { step: "01", title: "App Strategy", desc: "Define user personas, device compatibility matrix, and app flowcharts." },
      { step: "02", title: "Touch-First UI/UX", desc: "Design stunning mobile interfaces using touch target guidelines and interactive prototypes." },
      { step: "03", title: "Mobile Coding", desc: "Build the app using cross-platform frameworks for shared codebase efficiency without native lag." },
      { step: "04", title: "API Integration", desc: "Connect the application with back-end databases, notification triggers, and analytical SDKs." },
      { step: "05", title: "Store Submission", desc: "Prepare metadata, screenshots, privacy declarations, and publish to App Store and Google Play." }
    ],
    technologies: ["React Native", "Flutter", "TypeScript", "Dart", "Node.js", "Expo", "Firebase Push Notifications"],
    benefits: [
      "Single-codebase React Native/Flutter build reduces development cost by 40%",
      "Fast UI rendering at 60fps for native-like responsiveness",
      "Consistent cross-device styling for smartphones and tablets",
      "Built-in crash reporting and remote diagnostics telemetry"
    ],
    faqs: [
      { q: "Is React Native or Flutter better for my app?", a: "Both are excellent cross-platform frameworks. React Native is preferred for applications closely tied to web ecosystems and React, while Flutter excels in graphics-heavy designs requiring highly custom canvas renderings. We help you choose the best fit." },
      { q: "Do you handle the App Store submission process?", a: "Yes, we handle the entire deployment process, including creating developer accounts, setting up app metadata, preparing compliance policies, and managing the review process." },
      { q: "Can you integrate the app with our existing website?", a: "Yes, we can build custom REST or GraphQL APIs to sync data between your existing business website, database, CRM, and the mobile application in real-time." },
      { q: "How do push notifications work?", a: "We integrate Firebase Cloud Messaging (FCM) or OneSignal, allowing you to send targeted notifications to users based on behavior, location, or custom segments." },
      { q: "How do you handle app updates?", a: "We set up Over-The-Air (OTA) updates for quick JavaScript fixes, and coordinate binary updates through App Store Connect and Google Play Console for structural changes." }
    ]
  },
  "ai-automation": {
    valueProposition: "Harness AI workflows and automated pipelines to slash manual tasks and accelerate your operations.",
    problemsSolved: [
      "Hundreds of manual hours wasted on data entry and routing",
      "Slow customer support response times costing sales leads",
      "Siloed tools that don't talk to each other, creating process gaps",
      "Missed lead follow-ups due to delayed manual alerts"
    ],
    capabilities: [
      "AI Workflow Automation (Make, n8n)",
      "Custom AI Chatbots & Intelligent Assistants",
      "Lead Capture & Immediate Auto-Follow-Ups",
      "CRM & Database Synchronization Automation",
      "Custom API & Webhook Integrations",
      "AI Content & Email Processing Agents"
    ],
    process: [
      { step: "01", title: "Process Mapping", desc: "Audit your current manual tasks to identify bottlenecks and design automation schemas." },
      { step: "02", title: "Pipeline Architecture", desc: "Select appropriate models (OpenAI, Anthropic) and design integration nodes." },
      { step: "03", title: "Development & Tuning", desc: "Build automated scenarios, construct custom system prompts, and test error fallbacks." },
      { step: "04", title: "Security & Testing", desc: "Verify credential encryption, API rate limits, and sanitize data pipelines." },
      { step: "05", title: "Deployment & Training", desc: "Activate workflows, monitor queue latency, and train your team to review outputs." }
    ],
    technologies: ["n8n", "Make.com", "OpenAI API", "Anthropic Claude", "Python", "Node.js", "LangChain", "Vector Databases"],
    benefits: [
      "Reduce operational cost of repetitive workflows by up to 80%",
      "Lead response times drop from hours to under 3 minutes",
      "Eliminate human error in multi-step data entry and logging",
      "Scalable pipelines process thousands of tasks without adding headcount"
    ],
    faqs: [
      { q: "Do I need complex programming to automate my business?", a: "No. We build custom integrations using visual automation platforms like n8n or Make, which we hand over with simple interfaces so your team can manage them without writing code." },
      { q: "What kind of workflows can be automated?", a: "Common automations include: sending instant WhatsApp alerts to team members on new leads, extracting attachment data from incoming emails to a CRM, auto-generating documents, and building AI support bots." },
      { q: "How do you ensure AI accuracy?", a: "We design prompts with tight system constraints, set up human-in-the-loop review nodes for sensitive data, and configure strict validation criteria for outputs." },
      { q: "Will our data remain secure?", a: "Yes. We use secure OAuth connections, encrypt API keys, and can deploy workflows on self-hosted, private cloud instances where your business data never trains public models." },
      { q: "How much does AI automation cost to run?", a: "Most automation pipelines cost very little in API usage (often under $10-$20/month for LLM calls). Visual platforms offer free or cheap starter tiers which are highly sufficient for most SMEs." }
    ]
  },
  "digital-marketing": {
    valueProposition: "Maximize your qualified organic search visibility and digital footprint to drive commercial leads.",
    problemsSolved: [
      "Zero search engine visibility for profitable keywords",
      "Spammy ad campaigns that drain budgets with low returns",
      "Social media accounts that get likes but fail to generate sales",
      "Weak local SEO causing competitors to win nearby business"
    ],
    capabilities: [
      "Enterprise & Technical SEO",
      "Local SEO & Google Business Profile Management",
      "Performance Marketing (PPC, Google Ads, Meta)",
      "Social Media Marketing & Brand Management",
      "Content Strategy & Answer Engine Optimization (AEO)",
      "Analytics & Conversion Tracking (GA4)"
    ],
    process: [
      { step: "01", title: "SEO & Content Audit", desc: "Analyze competitor rankings, keyword gaps, and map out your commercial search universe." },
      { step: "02", title: "On-Page Optimization", desc: "Structure heading tags, write compelling meta elements, and implement structured schema tags." },
      { step: "03", title: "Local SEO Alignment", desc: "Build NAP citations, manage Google Business profiles, and establish localized relevance." },
      { step: "04", title: "Performance Campaigns", desc: "Launch targeted search and social campaigns, optimizing for conversion metrics over clicks." },
      { step: "05", title: "Reporting & Refinement", desc: "Provide transparent GA4 conversion reports and continuously optimize content clusters." }
    ],
    technologies: ["Google Analytics 4", "Google Tag Manager", "SEMrush", "Ahrefs", "Google Merchant Center", "Meta Ads Manager"],
    benefits: [
      "Sustainable organic search traffic lowers long-term acquisition costs",
      "Consistently capture commercial and transactional intent keywords",
      "Consolidated Local Business schema boosts Google Maps ranking",
      "Clear attribution setup tracks exactly which channels drive revenue"
    ],
    faqs: [
      { q: "How long does SEO take to show results?", a: "SEO is a medium-to-long-term strategy. While technical quick wins can show impact in 2-4 weeks, competitive organic rankings and topical authority typically build over 3 to 6 months." },
      { q: "Do you guarantee #1 rankings on Google?", a: "No, and you should avoid any agency that does. Search algorithms change constantly and rankings depend on competitors. We guarantee transparent, white-hat practices that drive qualified traffic and business leads." },
      { q: "What is AEO (Answer Engine Optimization)?", a: "AEO is the practice of optimizing content to be cited by AI search assistants like ChatGPT, Perplexity, and Google AI Overviews. It requires highly structured answers, FAQ schema, and authoritative sourcing." },
      { q: "How do you measure marketing success?", a: "We define custom conversion goals in Google Analytics 4 (like form submissions, calls, or sales) and track cost-per-lead (CPL) to ensure your marketing spend is profitable." },
      { q: "Do we need to write blog posts?", a: "Blogging is a powerful tool to build topical authority. We design a targeted content calendar that addresses real questions your prospects search for, maximizing keyword coverage." }
    ]
  },
  "graphic-design-branding": {
    valueProposition: "Forge a memorable visual identity and premium UX design system that establishes market credibility.",
    problemsSolved: [
      "Amateur brand styling that fails to build customer trust",
      "Inconsistent marketing designs across social media and web",
      "Confusing user interfaces causing drop-offs on digital products",
      "Lack of clear design guidelines delaying company growth"
    ],
    capabilities: [
      "Custom Logo & Brandmark Design",
      "Complete Brand Identity Packages",
      "Visual Style Guidelines & Brandbooks",
      "Social Media & Ad Creative templates",
      "High-Fidelity UI/UX Web Design (Figma)",
      "Marketing Collateral & Vector Illustrations"
    ],
    process: [
      { step: "01", title: "Brand Discovery", desc: "Explore your company values, target demographics, and aesthetic preferences." },
      { step: "02", title: "Moodboards & Concepts", desc: "Develop multiple directions for color palette, typography, and logo marks." },
      { step: "03", title: "Identity Development", desc: "Refine the chosen direction, designing complete assets and pattern libraries." },
      { step: "04", title: "Interface Design", desc: "Build mobile and desktop UI screens in Figma following standard accessibility guidelines." },
      { step: "05", title: "Design System Delivery", desc: "Export clean vector files, publish the Figma library, and compile brand guidelines." }
    ],
    technologies: ["Figma", "Adobe Illustrator", "Adobe Photoshop", "After Effects", "Procreate", "Tailwind CSS Design Tokens"],
    benefits: [
      "Consistent visual identity builds customer recognition and trust",
      "Figma UI prototypes streamline front-end web development",
      "High-quality ad graphics boost performance marketing click-through rates (CTR)",
      "Structured guidelines allow internal teams to scale assets quickly"
    ],
    faqs: [
      { q: "What is included in a branding package?", a: "Our standard branding package includes logo design, typography styling, color palette rules, corporate stationary layouts, social media templates, and a comprehensive brand guidebook." },
      { q: "Do we get ownership of the design source files?", a: "Yes. Upon project completion and payment, we hand over full copyright ownership and deliver high-resolution vector source files (AI, EPS, FIG, PNG, etc.)." },
      { q: "What is your approach to UI/UX design?", a: "We focus on accessibility, mobile responsiveness, and clear information hierarchy. We design in Figma, creating prototypes that are tested for intuitive user flows before development starts." },
      { q: "How many revisions do we get?", a: "We work collaboratively and provide up to 3 rounds of structured revisions on selected concepts, ensuring the final design matches your business vision." },
      { q: "Can you design custom icons or illustrations?", a: "Yes, we create custom vector icons, illustrations, and digital art assets tailored specifically to match your brand's unique design system." }
    ]
  }
};

// ─── DYNAMIC METADATA GENERATOR ──────────────────────────────────────────────
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  
  // Fetch service from Firestore
  let serviceDoc: ServiceItem | null = null;
  try {
    const q = query(collection(db, "services"), where("slug", "==", slug));
    const snap = await getDocs(q);
    if (!snap.empty) {
      serviceDoc = { id: snap.docs[0].id, ...snap.docs[0].data() } as ServiceItem;
    }
  } catch (err) {
    console.error("Error fetching metadata for service:", err);
  }

  // Check for custom CMS SEO overrides
  const title = serviceDoc?.seoTitle || (serviceDoc ? `${serviceDoc.title} Services | AWENUE` : `${slug.replace("-", " ")} Services | AWENUE`);
  const description = serviceDoc?.seoDescription || (serviceDoc ? serviceDoc.shortDescription : "Professional digital services provided by AWENUE Global Software Solutions.");
  const canonicalUrl = serviceDoc?.seoCanonical || `https://www.awenueglobalsoftwaresolutions.in/services/${slug}`;
  const ogImage = serviceDoc?.seoOgImage || serviceDoc?.imageUrl || "/images/og-image.jpg";
  const index = serviceDoc?.seoNoindex ? false : true;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "website",
      siteName: "AWENUE Global Software Solutions",
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
    robots: {
      index,
      follow: index,
    }
  };
}

// ─── STATIC PARAMS PRE-RENDERING ─────────────────────────────────────────────
export async function generateStaticParams() {
  const params: { slug: string }[] = [];
  try {
    const snap = await getDocs(collection(db, "services"));
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.slug && data.published !== false) {
        params.push({ slug: data.slug });
      }
    });
  } catch (err) {
    console.error("Error generating static params for services:", err);
  }

  // If DB is empty, pre-render the defaults
  if (params.length === 0) {
    return Object.keys(SERVICE_RICH_DATA).map((slug) => ({ slug }));
  }

  return params;
}

// ─── SERVICE DETAIL PAGE ──────────────────────────────────────────────────────
export default async function ServicePage({ params }: PageProps) {
  const { slug } = await params;

  // Retrieve service from Firestore
  let dbService: ServiceItem | null = null;
  try {
    const q = query(collection(db, "services"), where("slug", "==", slug));
    const snap = await getDocs(q);
    if (!snap.empty) {
      dbService = { id: snap.docs[0].id, ...snap.docs[0].data() } as ServiceItem;
    }
  } catch (err) {
    console.error("Error fetching service data:", err);
  }

  // Check if published
  if (dbService && dbService.published === false) {
    notFound();
  }

  // Fallback to defaults if DB service not found
  const title = dbService ? dbService.title : slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  const shortDescription = dbService ? dbService.shortDescription : "Top-tier custom solutions to build and scale your brand's digital presence.";
  const detailedDescription = dbService ? dbService.detailedDescription : "";
  const features = dbService ? dbService.features : [];

  // Match with rich marketing fallback blocks
  const rich = SERVICE_RICH_DATA[slug] || {
    valueProposition: shortDescription,
    problemsSolved: [
      "Scaling issues with outdated, rigid templates",
      "Slow development cycles causing missed deadlines",
      "Lack of analytics and conversion triggers",
      "Poor user interface design that discourages interaction"
    ],
    capabilities: features.length > 0 ? features : ["Custom Strategy", "Responsive Implementation", "Performance Fine-tuning", "Technical SEO Audits"],
    process: [
      { step: "01", title: "Consultation & Blueprinting", desc: "We align on scope, business requirements, and layout paths." },
      { step: "02", title: "User Experience Design", desc: "Our team designs interactive prototypes optimized for conversions." },
      { step: "03", title: "Engineering & Launch", desc: "We deploy premium code, optimize page load times, and run technical SEO checks." }
    ],
    technologies: ["React.js", "Next.js", "TypeScript", "Tailwind CSS", "Cloudflare", "Firebase"],
    benefits: [
      "Fully customized codebase matches exact specifications",
      "Stellar Core Web Vitals to maximize search engine indexing",
      "Mobile-first architectures scale on any device layout"
    ],
    faqs: [
      { q: `What is included in ${title}?`, a: "We provide end-to-end consulting, professional styling, interface development, API wiring, and deployment configurations." },
      { q: "How do we get started?", a: "Book a consultation call using our contact form. We will analyze your objectives, deliver a proposal, and draft a timeline." }
    ]
  };

  // Structured Data (JSON-LD Schema)
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": dbService?.schemaType || "Service",
    "name": dbService?.seoTitle || title,
    "description": dbService?.seoDescription || shortDescription,
    "provider": {
      "@type": "Organization",
      "name": "AWENUE Global Software Solutions",
      "url": "https://www.awenueglobalsoftwaresolutions.in",
      "logo": "https://www.awenueglobalsoftwaresolutions.in/images/logo.png"
    },
    "serviceType": title,
    "areaServed": [
      {
        "@type": "Country",
        "name": "India"
      },
      {
        "@type": "Country",
        "name": "United States"
      }
    ]
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": rich.faqs.map(faq => ({
      "@type": "Question",
      "name": faq.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.a
      }
    }))
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://www.awenueglobalsoftwaresolutions.in"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Services",
        "item": "https://www.awenueglobalsoftwaresolutions.in/#services"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": title,
        "item": `https://www.awenueglobalsoftwaresolutions.in/services/${slug}`
      }
    ]
  };

  return (
    <>
      {/* Schema Injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <Navigation />
      <main className="grow bg-[#0A0F0D] text-white">
        
        {/* ─── HERO SECTION ──────────────────────────────────────────────────── */}
        <section className="relative pt-32 pb-20 overflow-hidden border-b border-white/5">
          {/* Back glows */}
          <div className="absolute top-1/4 left-1/4 -translate-x-1/2 w-[600px] h-[300px] rounded-full blur-[120px] bg-accent/10 pointer-events-none" />
          
          <div className="max-w-6xl mx-auto px-6 relative z-10">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs text-text-muted mb-6">
              <Link href="/" className="hover:text-accent transition-colors">Home</Link>
              <ChevronRight size={12} />
              <span className="text-white/40">Services</span>
              <ChevronRight size={12} />
              <span className="text-accent font-bold">{title}</span>
            </div>

            {/* Content */}
            <div className="max-w-3xl space-y-6">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] font-display">
                {title}
              </h1>
              <p className="text-lg sm:text-xl text-text-muted leading-relaxed font-normal">
                {detailedDescription || rich.valueProposition}
              </p>
              
              <div className="pt-4 flex flex-wrap gap-4">
                <Link
                  href="/#contact"
                  className="bg-accent text-[#0A0F0D] text-btn px-6 py-4 rounded-lg hover:bg-accent-hover active:translate-y-px transition-all font-bold shadow-md cursor-pointer"
                >
                  Start Your Project
                </Link>
                <Link
                  href="/#services"
                  className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-6 py-4 rounded-lg active:translate-y-px transition-all font-bold cursor-pointer"
                >
                  All Services
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ─── VALUE PROPOSITION & PROBLEMS SOLVED ───────────────────────────── */}
        <section className="py-20 border-b border-white/5 relative">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
              
              <div className="lg:col-span-5 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/20 bg-accent/5 text-accent text-xs font-bold uppercase tracking-wider">
                  <Code2 size={13} />
                  <span>Value Focus</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                  Solving Real Business Challenges
                </h2>
                <p className="text-text-muted text-sm leading-relaxed">
                  We don&apos;t just write code; we design and implement custom systems that target operational inefficiencies, boost user retention, and drive measurable revenue.
                </p>
              </div>

              <div className="lg:col-span-7 bg-[#121917] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6">
                <h3 className="text-lg font-bold text-white/90">Common Bottlenecks We Eliminate:</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {rich.problemsSolved.map((prob, i) => (
                    <div key={i} className="flex gap-3 items-start">
                      <CheckCircle2 size={16} className="text-accent shrink-0 mt-1" />
                      <span className="text-xs text-text-muted leading-relaxed font-normal">{prob}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ─── CAPABILITIES GRID ─────────────────────────────────────────────── */}
        <section className="py-20 border-b border-white/5 bg-[#0C1210]">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/20 bg-accent/5 text-accent text-xs font-bold uppercase tracking-wider">
                <Layers size={13} />
                <span>Capabilities</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
                Our Areas of Expertise
              </h2>
              <p className="text-text-muted text-sm font-normal">
                Comprehensive, robust development covering all sub-verticals and technical requirements.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rich.capabilities.map((cap, i) => (
                <div key={i} className="bg-[#121917] border border-white/10 hover:border-accent/40 rounded-xl p-6 transition-all duration-300 group">
                  <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent mb-4 group-hover:bg-accent group-hover:text-[#0A0F0D] transition-colors">
                    <span className="text-xs font-bold">{i + 1}</span>
                  </div>
                  <h3 className="text-md font-bold mb-2 text-white/95 group-hover:text-accent transition-colors">{cap}</h3>
                  <p className="text-xs text-text-muted leading-relaxed font-normal">
                    Designed to run securely, scale continuously, and align with modern performance standard guidelines.
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── PROCESS TIMELINE ──────────────────────────────────────────────── */}
        <section className="py-20 border-b border-white/5">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/20 bg-accent/5 text-accent text-xs font-bold uppercase tracking-wider">
                <Cpu size={13} />
                <span>Process</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
                How We Deliver Success
              </h2>
              <p className="text-text-muted text-sm font-normal">
                A structured, transparent methodology ensures we ship on-time and with high fidelity.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 items-stretch">
              {rich.process.map((step, i) => (
                <div key={i} className="relative bg-[#121917] border border-white/10 rounded-xl p-6 flex flex-col justify-between">
                  <div className="space-y-4">
                    <span className="text-sm font-black tracking-widest text-accent block">{step.step}</span>
                    <h3 className="text-sm font-bold text-white">{step.title}</h3>
                    <p className="text-xs text-text-muted leading-relaxed font-normal">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── TECH STACK & BENEFITS ─────────────────────────────────────────── */}
        <section className="py-20 border-b border-white/5 bg-[#0C1210]">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              <div className="lg:col-span-6 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/20 bg-accent/5 text-accent text-xs font-bold uppercase tracking-wider">
                  <ShieldCheck size={13} />
                  <span>Quality Assurance</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                  Standard Technical Benefits
                </h2>
                <div className="space-y-4">
                  {rich.benefits.map((benefit, i) => (
                    <div key={i} className="flex gap-3 items-start">
                      <div className="shrink-0 w-5 h-5 rounded-full bg-accent/15 flex items-center justify-center text-accent mt-0.5">
                        <CheckCircle2 size={13} />
                      </div>
                      <span className="text-sm text-text-muted leading-relaxed font-normal">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-6 bg-[#121917] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6">
                <h3 className="text-sm font-bold tracking-widest text-accent uppercase">Technology Ecosystem</h3>
                <p className="text-xs text-text-muted leading-relaxed font-normal">
                  We write clean, semantic code leveraging standard modern libraries, ensuring zero client-side rendering dependency lags.
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  {rich.technologies.map((tech, i) => (
                    <span key={i} className="bg-white/5 text-xs text-white/80 border border-white/10 px-3.5 py-1.5 rounded-lg font-bold">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ─── FAQs ──────────────────────────────────────────────────────────── */}
        <section className="py-20 border-b border-white/5">
          <div className="max-w-4xl mx-auto px-6">
            <div className="text-center mb-16 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/20 bg-accent/5 text-accent text-xs font-bold uppercase tracking-wider">
                <HelpCircle size={13} />
                <span>Q&A</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
                Frequently Asked Questions
              </h2>
              <p className="text-text-muted text-sm font-normal">
                Answers to common queries regarding our project strategy, timeline, and delivery.
              </p>
            </div>

            <div className="space-y-4">
              {rich.faqs.map((faq, i) => (
                <div key={i} className="bg-[#121917] border border-white/10 rounded-xl p-6 space-y-3">
                  <h3 className="text-md font-bold text-white flex items-center gap-3">
                    <span className="text-accent shrink-0">Q.</span>
                    <span>{faq.q}</span>
                  </h3>
                  <div className="h-px bg-white/5 w-full" />
                  <p className="text-sm text-text-muted leading-relaxed font-normal flex items-start gap-3">
                    <span className="text-white/30 shrink-0 font-bold">A.</span>
                    <span>{faq.a}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── FINAL CTA ─────────────────────────────────────────────────────── */}
        <section className="py-20 relative bg-gradient-to-b from-[#0A0F0D] to-[#0E1513]">
          <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight font-display">
              Ready to Accelerate Your Business?
            </h2>
            <p className="text-text-muted text-md leading-relaxed max-w-xl mx-auto">
              Partner with AWENUE Global Software Solutions. Let&apos;s build dynamic platforms and automated workflows custom-fit for your business.
            </p>
            <div className="pt-4">
              <Link
                href="/#contact"
                className="inline-flex items-center gap-2 bg-accent text-[#0A0F0D] text-btn px-8 py-4.5 rounded-lg hover:bg-accent-hover active:translate-y-px transition-all font-bold shadow-md cursor-pointer group"
              >
                <span>Get Free Consultation</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
