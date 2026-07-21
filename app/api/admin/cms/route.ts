import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { revalidatePath } from "next/cache";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { hasPermission, Permission } from "@/lib/rbac";

// Permission mapping for admin collections
const COLLECTION_PERMISSIONS: Record<string, { create: string; edit: string; delete: string }> = {
  websiteContent: { create: "content.edit", edit: "content.edit", delete: "content.edit" },
  siteContent: { create: "content.edit", edit: "content.edit", delete: "content.edit" },
  services: { create: "services.create", edit: "services.edit", delete: "services.delete" },
  products: { create: "products.create", edit: "products.edit", delete: "products.delete" },
  portfolioProjects: { create: "portfolio.create", edit: "portfolio.edit", delete: "portfolio.delete" },
  processSteps: { create: "process.edit", edit: "process.edit", delete: "process.edit" },
  adminSettings: { create: "settings.edit", edit: "settings.edit", delete: "settings.edit" },
  socialLinks: { create: "settings.edit", edit: "settings.edit", delete: "settings.edit" },
  generalQueries: { create: "inquiries.update_status", edit: "inquiries.update_status", delete: "inquiries.delete" },
  projectInquiries: { create: "inquiries.update_status", edit: "inquiries.update_status", delete: "inquiries.delete" },
  consultationRequests: { create: "inquiries.update_status", edit: "inquiries.update_status", delete: "inquiries.delete" },
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const collectionName = searchParams.get("collectionName");

    if (!collectionName || typeof collectionName !== "string") {
      return NextResponse.json({ error: "Target collection name is required." }, { status: 400 });
    }

    // Authenticate Admin session
    const admin = await getAdminFromRequest(request);
    if (!admin || admin.status !== "active") {
      return NextResponse.json(
        { error: "Unauthorized. Valid active admin session is required." },
        { status: 401 }
      );
    }

    const snap = await adminDb.collection(collectionName).orderBy("createdAt", "desc").get();
    const list = snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ success: true, data: list });
  } catch (err: unknown) {
    console.error("API /api/admin/cms GET error:", err);
    return NextResponse.json({ error: "Failed to fetch collection data." }, { status: 500 });
  }
}

// Helper to revalidate homepage on-demand for relevant collections
function triggerHomepageRevalidation(collectionName: string, slug?: string) {
  const homepageCollections = [
    "services",
    "products",
    "portfolioProjects",
    "websiteContent",
    "siteContent",
    "adminSettings",
    "socialLinks",
  ];
  if (homepageCollections.includes(collectionName)) {
    try {
      revalidatePath("/");
      revalidatePath("/sitemap.xml");
      
      // Revalidate individual dynamic page routes
      if (collectionName === "services") {
        revalidatePath("/services/[slug]", "page");
        if (slug) revalidatePath(`/services/${slug}`);
      } else if (collectionName === "products") {
        revalidatePath("/products/[slug]", "page");
        if (slug) revalidatePath(`/products/${slug}`);
      } else if (collectionName === "portfolioProjects") {
        revalidatePath("/portfolio/[slug]", "page");
        if (slug) revalidatePath(`/portfolio/${slug}`);
      }
      console.log(`[REVALIDATE] Paths revalidated for collection: ${collectionName}, slug: ${slug || "none"}`);
    } catch (err) {
      console.error("[REVALIDATE] Error in revalidatePath:", err);
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate Admin session
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized. Valid admin session is required." },
        { status: 401 }
      );
    }

    // Verify Active status
    if (admin.status !== "active") {
      return NextResponse.json(
        { error: "Forbidden. Admin account is not active." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action = "set", collectionName, docId, data } = body;

    if (!collectionName || typeof collectionName !== "string") {
      return NextResponse.json(
        { error: "Target collection name is required." },
        { status: 400 }
      );
    }

    // Check RBAC permissions for the target collection and action
    const permConfig = COLLECTION_PERMISSIONS[collectionName];
    if (permConfig) {
      let requiredPermission = permConfig.edit;
      if (action === "delete") {
        requiredPermission = permConfig.delete;
      } else if (action === "add") {
        requiredPermission = permConfig.create;
      }

      if (!hasPermission(admin.role, requiredPermission as Permission, admin.permissions)) {
        return NextResponse.json(
          { error: `Forbidden. You do not have permission to modify ${collectionName}.` },
          { status: 403 }
        );
      }
    }

    // URL Normalization & Safety Validation for socialLinks
    if (collectionName === "socialLinks") {
      if (action === "add" || action === "update" || action === "set") {
        if (!data || typeof data !== "object") {
          return NextResponse.json({ error: "Invalid data payload." }, { status: 400 });
        }

        const platform = data.platform;
        let url = data.url;

        // WhatsApp Phone Number Normalization
        if (platform === "whatsapp" && url) {
          const trimmedUrl = String(url).trim();
          // Check if it's a phone number (only digits, spaces, dashes, parentheses, or +)
          if (!trimmedUrl.startsWith("http") && /^\+?[0-9\s\-()]+$/.test(trimmedUrl)) {
            const digits = trimmedUrl.replace(/\D/g, "");
            url = `https://wa.me/${digits}`;
            data.url = url;
          }
        }

        // Validate URL
        if (!url || typeof url !== "string") {
          return NextResponse.json({ error: "Profile URL is required." }, { status: 400 });
        }

        const lowerUrl = url.trim().toLowerCase();
        if (
          lowerUrl.startsWith("javascript:") ||
          lowerUrl.startsWith("data:") ||
          lowerUrl.startsWith("file:")
        ) {
          return NextResponse.json({ error: "Unsafe URL protocol detected." }, { status: 400 });
        }

        if (!lowerUrl.startsWith("https://")) {
          return NextResponse.json({ error: "URLs must start with https:// for production security." }, { status: 400 });
        }
      }
    }

    const targetCollection = adminDb.collection(collectionName);
    const nowISO = new Date().toISOString();

    if (action === "delete") {
      if (!docId) {
        return NextResponse.json({ error: "Document ID is required for deletion." }, { status: 400 });
      }
      await targetCollection.doc(docId).delete();
      triggerHomepageRevalidation(collectionName);
      return NextResponse.json({ success: true, message: "Document deleted successfully." });
    }

    if (action === "add" || !docId) {
      const docRef = await targetCollection.add({
        ...data,
        createdAt: data?.createdAt || nowISO,
        updatedAt: nowISO,
      });
      triggerHomepageRevalidation(collectionName, data?.slug);
      return NextResponse.json({ success: true, id: docRef.id, message: "Document added successfully." });
    }

    if (action === "update") {
      await targetCollection.doc(docId).update({
        ...data,
        updatedAt: nowISO,
      });
      triggerHomepageRevalidation(collectionName, data?.slug);
      return NextResponse.json({ success: true, id: docId, message: "Document updated successfully." });
    }

    // Default "set" action (UPSERT)
    await targetCollection.doc(docId).set(
      {
        ...data,
        updatedAt: nowISO,
      },
      { merge: true }
    );

    triggerHomepageRevalidation(collectionName, data?.slug);
    return NextResponse.json({ success: true, id: docId, message: "CMS content saved successfully." });
  } catch (err: unknown) {
    const errorDetails = err instanceof Error ? err.message : String(err);
    console.error("API /api/admin/cms POST error:", errorDetails);
    return NextResponse.json({ error: errorDetails || "Failed to update content." }, { status: 500 });
  }
}
