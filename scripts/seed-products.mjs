import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "awenue-global";
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

if (!clientEmail || !privateKey) {
  console.error("Missing FIREBASE_ADMIN_CLIENT_EMAIL or FIREBASE_ADMIN_PRIVATE_KEY in .env.local");
  process.exit(1);
}

if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
  privateKey = privateKey.slice(1, -1);
}
privateKey = privateKey.replace(/\\n/g, "\n");

const app = getApps().length === 0 ? initializeApp({
  credential: cert({
    projectId,
    clientEmail,
    privateKey,
  }),
}) : getApps()[0];

const db = getFirestore(app);

const PRODUCTS = [
  {
    id: "prod-awenue-crm",
    name: "Awenue CRM",
    slug: "awenue-crm",
    category: "SaaS Product",
    shortDescription: "Manage leads, customers, sales, and business relationships — all in one place.",
    detailedDescription: "Awenue CRM is a comprehensive Customer Relationship Management platform designed to help businesses organize leads, automate follow-ups, track deals through a visual pipeline, and build lasting customer relationships.",
    features: [
      "Lead & Contact Management",
      "Visual Sales Pipeline (Kanban)",
      "Deal Tracking & Forecasting",
      "Email & Follow-up Automation",
      "Activity Timeline",
      "Team Collaboration Tools",
      "Analytics & Revenue Reports",
      "Custom Fields & Tags"
    ],
    productStatus: "live",
    externalUrl: "https://crm.awenue.io",
    ctaLabel: "Visit CRM Website",
    displayOrder: 1,
    published: true,
    imageUrl: "/images/products/awenue-crm-dashboard.png",
    image: "/images/products/awenue-crm-dashboard.png",
    imageAlt: "Awenue CRM Dashboard Preview",
    accentColor: "#09B850",
    accentRgb: "9,184,80",
    schemaType: "SoftwareApplication",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "prod-college-erp",
    name: "Awenue College ERP",
    slug: "awenue-college-erp",
    category: "Education Platform",
    shortDescription: "A smarter platform to manage students, faculty, academics, fees, and campus operations.",
    detailedDescription: "Awenue College ERP is a complete institutional management system built for modern colleges and universities. It covers student enrollment, attendance, fee collection, exam results, and faculty management.",
    features: [
      "Student Enrollment & Profiles",
      "Attendance Management",
      "Fee Collection & Receipts",
      "Exam & Result Management",
      "Faculty & Staff Management",
      "Timetable Scheduling",
      "Library Management",
      "Multi-Campus Support"
    ],
    productStatus: "live",
    externalUrl: "https://erp.awenue.io",
    ctaLabel: "Visit ERP Website",
    displayOrder: 2,
    published: true,
    imageUrl: "/images/products/awenue-college-erp-dashboard.png",
    image: "/images/products/awenue-college-erp-dashboard.png",
    imageAlt: "Awenue College ERP Platform Preview",
    accentColor: "#09B850",
    accentRgb: "9,184,80",
    schemaType: "SoftwareApplication",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "prod-hospital-mgmt",
    name: "Awenue Hospital Management",
    slug: "hospital-management",
    category: "Healthcare Platform",
    shortDescription: "A connected digital solution designed to simplify hospital and healthcare operations.",
    detailedDescription: "Awenue Hospital Management System is a next-generation healthcare administration platform for hospitals, clinics, and medical centers.",
    features: [
      "Patient Registration & Records (OPD/IPD)",
      "Appointment Scheduling",
      "Doctor & Ward Management",
      "Pharmacy Inventory Management",
      "Lab & Diagnostics Integration",
      "Billing & Insurance Claims",
      "Discharge Summary Generation",
      "Analytics & Health Reports"
    ],
    productStatus: "coming_soon",
    externalUrl: "",
    ctaLabel: "Coming Soon",
    displayOrder: 3,
    published: true,
    imageUrl: "/images/products/awenue-hospital-management-dashboard.png",
    image: "/images/products/awenue-hospital-management-dashboard.png",
    imageAlt: "Awenue Hospital Management System — Coming Soon",
    accentColor: "#09B850",
    accentRgb: "9,184,80",
    schemaType: "SoftwareApplication",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

async function seed() {
  console.log("Seeding new brand-aligned product images into Firestore 'products' collection...");
  const batch = db.batch();
  for (const prod of PRODUCTS) {
    const { id, ...data } = prod;
    const ref = db.collection("products").doc(id);
    batch.set(ref, data, { merge: true });
  }
  await batch.commit();
  console.log("✅ Successfully seeded 3 brand-aligned product images to Firestore!");
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
