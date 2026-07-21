import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Navigation from "@/components/sections/Navigation";
import Footer from "@/components/sections/Footer";
import { ArrowRight, CheckCircle2, ChevronRight, Package, ExternalLink, Sparkles, Code2 } from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = false;

// ─── DYNAMIC METADATA GENERATOR ──────────────────────────────────────────────
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  
  let productDoc: any = null;
  try {
    const q = query(collection(db, "products"), where("slug", "==", slug));
    const snap = await getDocs(q);
    if (!snap.empty) {
      productDoc = snap.docs[0].data();
    }
  } catch (err) {
    console.error("Error fetching metadata for product:", err);
  }

  const title = productDoc?.seoTitle || (productDoc ? `${productDoc.name} | AWENUE Products` : `${slug.replace("-", " ")} | AWENUE Products`);
  const description = productDoc?.seoDescription || (productDoc ? productDoc.shortDescription : "High-utility enterprise and digital software solutions built by AWENUE.");
  const canonicalUrl = productDoc?.seoCanonical || `https://www.awenueglobalsoftwaresolutions.in/products/${slug}`;
  const ogImage = productDoc?.seoOgImage || productDoc?.imageUrl || "/images/og-image.jpg";
  const index = productDoc?.seoNoindex ? false : true;

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
    const snap = await getDocs(collection(db, "products"));
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.slug && data.published !== false) {
        params.push({ slug: data.slug });
      }
    });
  } catch (err) {
    console.error("Error generating static params for products:", err);
  }
  return params;
}

// ─── PRODUCT DETAIL PAGE ─────────────────────────────────────────────────────
export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;

  let dbProduct: any = null;
  try {
    const q = query(collection(db, "products"), where("slug", "==", slug));
    const snap = await getDocs(q);
    if (!snap.empty) {
      dbProduct = { id: snap.docs[0].id, ...snap.docs[0].data() };
    }
  } catch (err) {
    console.error("Error fetching product data:", err);
  }

  if (!dbProduct || dbProduct.published === false) {
    notFound();
  }

  const {
    name,
    shortDescription,
    detailedDescription = "",
    features = [],
    productStatus = "live",
    externalUrl = "",
    ctaLabel = "Learn More",
    imageUrl = ""
  } = dbProduct;

  // Schema Markup (JSON-LD)
  const productSchema = {
    "@context": "https://schema.org",
    "@type": dbProduct.schemaType || "SoftwareApplication",
    "name": dbProduct.seoTitle || name,
    "description": dbProduct.seoDescription || shortDescription,
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web, Cloud",
    "provider": {
      "@type": "Organization",
      "name": "AWENUE Global Software Solutions",
      "url": "https://www.awenueglobalsoftwaresolutions.in"
    },
    "offers": {
      "@type": "Offer",
      "price": "0.00",
      "priceCurrency": "INR",
      "priceValidUntil": "2027-12-31",
      "availability": productStatus === "live" ? "https://schema.org/InStock" : "https://schema.org/PreOrder"
    }
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
        "name": "Products",
        "item": "https://www.awenueglobalsoftwaresolutions.in/#products"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": name,
        "item": `https://www.awenueglobalsoftwaresolutions.in/products/${slug}`
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <Navigation />
      <main className="grow bg-[#0A0F0D] text-white">
        
        {/* HERO SECTION */}
        <section className="relative pt-32 pb-20 overflow-hidden border-b border-white/5">
          <div className="absolute top-1/4 left-1/3 -translate-x-1/2 w-[500px] h-[250px] rounded-full blur-[100px] bg-accent/5 pointer-events-none" />
          
          <div className="max-w-6xl mx-auto px-6 relative z-10">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs text-text-muted mb-6">
              <Link href="/" className="hover:text-accent transition-colors">Home</Link>
              <ChevronRight size={12} />
              <Link href="/#products" className="hover:text-accent transition-colors">Products</Link>
              <ChevronRight size={12} />
              <span className="text-accent font-bold">{name}</span>
            </div>

            {/* Main grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              <div className="lg:col-span-7 space-y-6">
                {/* Status Badge */}
                <div>
                  {productStatus === "coming_soon" ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-400 text-xs font-bold uppercase tracking-wider">
                      <Sparkles size={12} />
                      <span>Coming Soon</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-accent/30 bg-accent/10 text-accent text-xs font-bold uppercase tracking-wider">
                      <Package size={12} />
                      <span>Live Product</span>
                    </span>
                  )}
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] font-display">
                  {name}
                </h1>
                
                <p className="text-lg text-text-muted leading-relaxed font-normal">
                  {shortDescription}
                </p>

                <div className="pt-4 flex flex-wrap gap-4">
                  {productStatus === "coming_soon" ? (
                    <Link
                      href="/#contact"
                      className="bg-accent hover:bg-accent-hover text-[#0A0F0D] text-btn px-6 py-4 rounded-lg active:translate-y-px transition-all font-bold cursor-pointer"
                    >
                      Get Early Access / Inquire
                    </Link>
                  ) : (
                    <>
                      {externalUrl ? (
                        <a
                          href={externalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-accent hover:bg-accent-hover text-[#0A0F0D] text-btn px-6 py-4 rounded-lg active:translate-y-px transition-all font-bold inline-flex items-center gap-2 cursor-pointer"
                        >
                          <span>{ctaLabel}</span>
                          <ExternalLink size={15} />
                        </a>
                      ) : (
                        <Link
                          href="/#contact"
                          className="bg-accent hover:bg-accent-hover text-[#0A0F0D] text-btn px-6 py-4 rounded-lg active:translate-y-px transition-all font-bold cursor-pointer"
                        >
                          Request Demo
                        </Link>
                      )}
                    </>
                  )}
                  <Link
                    href="/#products"
                    className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-6 py-4 rounded-lg active:translate-y-px transition-all font-bold cursor-pointer"
                  >
                    Back to Products
                  </Link>
                </div>
              </div>

              {/* Mockup / Image Column */}
              <div className="lg:col-span-5 relative">
                <div className="aspect-[4/3] rounded-2xl border border-white/10 bg-[#121917] overflow-hidden flex items-center justify-center p-8 relative group shadow-lg">
                  {imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imageUrl}
                      alt={name}
                      className="w-full h-full object-contain object-center scale-100 group-hover:scale-[1.03] transition-transform duration-500"
                    />
                  ) : (
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 rounded-2xl bg-accent/10 text-accent flex items-center justify-center mx-auto">
                        <Package size={32} />
                      </div>
                      <span className="text-xs text-text-muted uppercase tracking-widest block font-bold">System Interface Mockup</span>
                    </div>
                  )}
                  
                  {/* Outer edge glows */}
                  <div className="absolute inset-0 rounded-2xl border border-accent/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* DETAILS SECTION */}
        <section className="py-20 border-b border-white/5">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
              
              <div className="lg:col-span-7 space-y-6">
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                  Overview & Value Proposition
                </h2>
                <div className="text-sm text-text-muted leading-relaxed font-normal space-y-4">
                  <p>
                    {detailedDescription || `${name} is engineered to address workflows directly. By combining modern front-end technologies with high-availability cloud storage layers, we deliver speeds that outperform legacy management suites.`}
                  </p>
                  <p>
                    Built to follow modern enterprise guidelines, it incorporates Role-Based Access Control (RBAC), automatic audit logging, and custom analytics dashboards to ensure business operations are transparent, safe, and efficient.
                  </p>
                </div>
              </div>

              <div className="lg:col-span-5 bg-[#121917] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6">
                <h3 className="text-sm font-bold text-accent tracking-widest uppercase flex items-center gap-2">
                  <Code2 size={15} />
                  <span>Key Product Features</span>
                </h3>
                <div className="space-y-4">
                  {features.map((feat: string, i: number) => (
                    <div key={i} className="flex gap-3 items-center">
                      <CheckCircle2 size={16} className="text-accent shrink-0" />
                      <span className="text-sm text-white/90 leading-none">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* CTA BOTTOM */}
        <section className="py-20 relative bg-gradient-to-b from-[#0A0F0D] to-[#0E1513]">
          <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight font-display">
              Interested in {name}?
            </h2>
            <p className="text-text-muted text-sm leading-relaxed max-w-lg mx-auto">
              Get in touch with our product engineers to arrange a personalized demonstration or discuss Custom SaaS integrations for your organization.
            </p>
            <div className="pt-4">
              <Link
                href="/#contact"
                className="inline-flex items-center gap-2 bg-accent text-[#0A0F0D] text-btn px-8 py-4.5 rounded-lg hover:bg-accent-hover active:translate-y-px transition-all font-bold shadow-md cursor-pointer group"
              >
                <span>Request Custom Demo</span>
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
