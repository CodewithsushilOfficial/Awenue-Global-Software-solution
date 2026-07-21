import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { revalidatePath } from "next/cache";

const PRODUCTS_DATA = [
  {
    id: "prod-awenue-crm",
    name: "Awenue CRM",
    slug: "awenue-crm",
    category: "SaaS Product",
    shortDescription:
      "Manage leads, customers, sales, and business relationships — all in one place. Built for growing teams.",
    detailedDescription:
      "Awenue CRM is a comprehensive Customer Relationship Management platform designed to help businesses organize leads, automate follow-ups, track deals through a visual pipeline, and build lasting customer relationships. It integrates seamlessly with email, calendars, and your existing workflow tools.",
    features: [
      "Lead & Contact Management",
      "Visual Sales Pipeline (Kanban)",
      "Deal Tracking & Forecasting",
      "Email & Follow-up Automation",
      "Activity Timeline",
      "Team Collaboration Tools",
      "Analytics & Revenue Reports",
      "Custom Fields & Tags",
    ],
    productStatus: "live",
    externalUrl: "https://crm.awenue.io",
    ctaLabel: "Visit CRM Website",
    displayOrder: 1,
    published: true,
    imageUrl: "/images/products/crm-hq.png",
    imageAlt: "Awenue CRM Dashboard — Lead and Sales Management Platform",
    accentColor: "#09B850",
    accentRgb: "9,184,80",
    schemaType: "SoftwareApplication",
    seoTitle: "Awenue CRM | Customer Relationship & Sales Management Software",
    seoDescription:
      "Awenue CRM helps businesses manage leads, automate follow-ups, track sales pipelines, and grow customer relationships. Free demo available.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "prod-college-erp",
    name: "Awenue College ERP",
    slug: "awenue-college-erp",
    category: "Education Platform",
    shortDescription:
      "A smarter platform to manage students, faculty, academics, fees, and campus operations end-to-end.",
    detailedDescription:
      "Awenue College ERP is a complete institutional management system built for modern colleges and universities. It covers everything from student enrollment and attendance to fee collection, exam results, timetable scheduling, library management, and HR payroll — all in a single, unified platform.",
    features: [
      "Student Enrollment & Profiles",
      "Attendance Management",
      "Fee Collection & Receipts",
      "Exam & Result Management",
      "Faculty & Staff Management",
      "Timetable Scheduling",
      "Library Management",
      "Multi-Campus Support",
    ],
    productStatus: "live",
    externalUrl: "https://erp.awenue.io",
    ctaLabel: "Visit ERP Website",
    displayOrder: 2,
    published: true,
    imageUrl: "/images/products/erp-hq.png",
    imageAlt: "Awenue College ERP Platform — Education Management System",
    accentColor: "#06B6D4",
    accentRgb: "6,182,212",
    schemaType: "SoftwareApplication",
    seoTitle: "Awenue College ERP | Complete Education Management System",
    seoDescription:
      "Awenue College ERP is a powerful platform for colleges to manage students, attendance, fees, exams, and faculty. Simplify campus operations today.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "prod-hospital-mgmt",
    name: "Awenue Hospital Management",
    slug: "hospital-management",
    category: "Healthcare Platform",
    shortDescription:
      "A connected digital solution designed to simplify hospital operations, patient care, and healthcare administration.",
    detailedDescription:
      "Awenue Hospital Management System is a next-generation healthcare administration platform for hospitals, clinics, and medical centers. It manages patient registration, OPD/IPD workflows, doctor scheduling, pharmacy inventory, billing, lab reports, and insurance claims — reducing manual effort and improving patient care quality.",
    features: [
      "Patient Registration & Records (OPD/IPD)",
      "Appointment Scheduling",
      "Doctor & Ward Management",
      "Pharmacy Inventory Management",
      "Lab & Diagnostics Integration",
      "Billing & Insurance Claims",
      "Discharge Summary Generation",
      "Analytics & Health Reports",
    ],
    productStatus: "coming_soon",
    externalUrl: "",
    ctaLabel: "Coming Soon",
    displayOrder: 3,
    published: true,
    imageUrl: "/images/products/hospital-hq.png",
    imageAlt: "Awenue Hospital Management System — Healthcare Administration Platform",
    accentColor: "#9333EA",
    accentRgb: "147,51,234",
    schemaType: "SoftwareApplication",
    seoTitle: "Awenue Hospital Management System | Healthcare Software Platform",
    seoDescription:
      "Awenue Hospital Management System streamlines patient care, doctor scheduling, pharmacy, billing, and lab operations. Coming soon.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const admin = await getAdminFromRequest(request);
    if (!admin || admin.status !== "active") {
      return NextResponse.json({ error: "Unauthorized. Admin session required." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const force: boolean = body.force === true;

    const results: { id: string; name: string; action: string }[] = [];

    const batch = adminDb.batch();

    for (const product of PRODUCTS_DATA) {
      const { id, ...data } = product;

      if (!force) {
        const existing = await adminDb.collection("products").doc(id).get();
        if (existing.exists) {
          results.push({ id, name: data.name, action: "skipped (already exists)" });
          continue;
        }
      }

      const ref = adminDb.collection("products").doc(id);
      batch.set(ref, { ...data, updatedAt: new Date().toISOString() }, { merge: true });
      results.push({ id, name: data.name, action: force ? "upserted" : "created" });
    }

    await batch.commit();

    try {
      revalidatePath("/");
      revalidatePath("/products/[slug]", "page");
      revalidatePath("/sitemap.xml");
    } catch {}

    return NextResponse.json({
      success: true,
      message: "Products seeded successfully.",
      results,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[seed-products] Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "Products seed endpoint ready. Use POST to seed." });
}
