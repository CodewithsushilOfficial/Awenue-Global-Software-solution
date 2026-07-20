"use client";

import { useEffect, useState, useCallback } from "react";
import {
  collection,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  X,
  Loader2,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

interface ServiceItem {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  detailedDescription: string;
  iconIdentifier: string;
  features: string[];
  ctaLabel: string;
  ctaLink: string;
  displayOrder: number;
  published: boolean;
}

export default function AdminServicesPage() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingService, setEditingService] = useState<Partial<ServiceItem> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [featuresText, setFeaturesText] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchServices = useCallback(async () => {
    try {
      const q = query(collection(db, "services"), orderBy("displayOrder", "asc"));
      const snap = await getDocs(q);
      const list: ServiceItem[] = [];
      snap.forEach((docSnap) => {
        list.push({ ...docSnap.data(), id: docSnap.id } as ServiceItem);
      });

      if (list.length === 0) {
        // Auto-seed default services to Firestore so admin can manage them immediately
        const initialServices: Omit<ServiceItem, "id">[] = [
          {
            title: "Web Development",
            slug: "web-development",
            shortDescription: "Build a Powerful Digital Presence.",
            detailedDescription: "Fast, responsive, conversion-focused websites that help your business look professional and grow online.",
            iconIdentifier: "Globe",
            features: ["Business & Corporate Websites", "E-Commerce Websites", "High-Converting Landing Pages", "Custom Web Applications", "Website Redesign & Modernization", "Maintenance & Performance Optimization"],
            ctaLabel: "Explore Web Development",
            ctaLink: "#contact",
            displayOrder: 1,
            published: true,
          },
          {
            title: "SaaS Development",
            slug: "saas-development",
            shortDescription: "Turn Your Idea Into a Scalable Software Product.",
            detailedDescription: "From MVP to a production-ready SaaS platform — designed for real users and built for future growth.",
            iconIdentifier: "LayoutDashboard",
            features: ["Product Strategy & Planning", "UI/UX Product Design", "MVP Development", "Custom SaaS Platforms", "Subscription & Payment Integration", "Scalable Cloud Architecture"],
            ctaLabel: "Build Your SaaS",
            ctaLink: "#contact",
            displayOrder: 2,
            published: true,
          },
          {
            title: "Mobile App Development",
            slug: "mobile-app-development",
            shortDescription: "Take Your Business Wherever Your Customers Go.",
            detailedDescription: "Intuitive, high-performance mobile applications that connect businesses with customers seamlessly.",
            iconIdentifier: "Smartphone",
            features: ["Android Applications", "iOS Applications", "Cross-Platform Apps", "Business & Enterprise Apps", "E-Commerce Applications", "App Maintenance & Updates"],
            ctaLabel: "Build Your App",
            ctaLink: "#contact",
            displayOrder: 3,
            published: true,
          },
          {
            title: "AI & Automation",
            slug: "ai-automation",
            shortDescription: "Work Smarter. Automate the Repetitive.",
            detailedDescription: "AI-powered automation that eliminates manual workflows — giving your team time to focus on what matters.",
            iconIdentifier: "Bot",
            features: ["Business Workflow Automation", "AI Chatbots & Assistants", "Lead Capture & Follow-Ups", "CRM Automation", "AI Integration With Existing Systems", "Custom AI-Powered Workflows"],
            ctaLabel: "Automate Your Business",
            ctaLink: "#contact",
            displayOrder: 4,
            published: true,
          },
          {
            title: "Digital Marketing",
            slug: "digital-marketing",
            shortDescription: "Turn Your Digital Presence Into Business Growth.",
            detailedDescription: "Reach the right audience, strengthen your online presence, and drive meaningful business growth.",
            iconIdentifier: "BarChart3",
            features: ["Search Engine Optimization — SEO", "Local SEO & Google Business Profile", "Social Media Marketing", "Content Marketing", "Performance Marketing", "Paid Advertising Campaigns"],
            ctaLabel: "Grow Your Business",
            ctaLink: "#contact",
            displayOrder: 5,
            published: true,
          },
          {
            title: "Graphic Design & Branding",
            slug: "graphic-design-branding",
            shortDescription: "Build a Brand People Remember.",
            detailedDescription: "Professional visual identities that make your business stand out — from logo to complete brand system.",
            iconIdentifier: "Palette",
            features: ["Logo Design", "Complete Brand Identity", "Brand Guidelines", "Social Media Creatives", "Marketing & Advertising Graphics", "UI/UX Design"],
            ctaLabel: "Build Your Brand",
            ctaLink: "#contact",
            displayOrder: 6,
            published: true,
          },
        ];

        for (const item of initialServices) {
          const docId = `serv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
          await fetch("/api/admin/cms", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "set", collectionName: "services", docId, data: item }),
          });
          list.push({ ...item, id: docId });
        }
      }

      setServices(list);
    } catch (err) {
      console.error("Error fetching services:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) fetchServices();
    });
    return () => {
      active = false;
    };
  }, [fetchServices]);

  const openNewService = () => {
    const minOrder = services.length > 0 ? Math.min(...services.map((s) => s.displayOrder || 1)) : 1;
    setEditingService({
      title: "",
      slug: "",
      shortDescription: "",
      detailedDescription: "",
      iconIdentifier: "Globe",
      features: [],
      ctaLabel: "Explore Service",
      ctaLink: "#contact",
      displayOrder: minOrder <= 1 ? minOrder - 1 : 1,
      published: true,
    });
    setFeaturesText("");
  };

  const moveService = async (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= services.length) return;

    const current = { ...services[index] };
    const target = { ...services[targetIdx] };

    const tempOrder = current.displayOrder;
    current.displayOrder = target.displayOrder;
    target.displayOrder = tempOrder;

    const updated = [...services];
    updated[index] = target;
    updated[targetIdx] = current;
    updated.sort((a, b) => a.displayOrder - b.displayOrder);
    setServices(updated);

    try {
      await fetch("/api/admin/cms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update", collectionName: "services", docId: current.id, data: { displayOrder: current.displayOrder } }),
      });
      await fetch("/api/admin/cms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update", collectionName: "services", docId: target.id, data: { displayOrder: target.displayOrder } }),
      });
      setFeedback("Display order updated.");
      setTimeout(() => setFeedback(null), 2500);
    } catch (err) {
      console.error("Error updating display order:", err);
    }
  };

  const openEditService = (service: ServiceItem) => {
    setEditingService(service);
    setFeaturesText((service.features || []).join("\n"));
  };

  const handleSave = async () => {
    if (!editingService || !editingService.title || !editingService.shortDescription) return;

    setIsSaving(true);
    const parsedFeatures = featuresText
      .split("\n")
      .map((f) => f.trim())
      .filter(Boolean);

    const payload = {
      title: editingService.title,
      slug: editingService.slug || editingService.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      shortDescription: editingService.shortDescription,
      detailedDescription: editingService.detailedDescription || editingService.shortDescription,
      iconIdentifier: editingService.iconIdentifier || "Globe",
      features: parsedFeatures,
      ctaLabel: editingService.ctaLabel || "Explore Service",
      ctaLink: editingService.ctaLink || "#contact",
      displayOrder: Number(editingService.displayOrder) || 1,
      published: editingService.published !== false,
      updatedAt: new Date().toISOString(),
    };

    try {
      const isEdit = Boolean(editingService.id);
      const action = isEdit ? "update" : "add";
      const docId = editingService.id || `service-${Date.now()}`;

      const res = await fetch("/api/admin/cms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          collectionName: "services",
          docId,
          data: payload,
        }),
      });

      if (!res.ok) {
        if (isEdit && editingService.id) {
          await updateDoc(doc(db, "services", editingService.id), payload);
        } else {
          await addDoc(collection(db, "services"), { ...payload, createdAt: new Date().toISOString() });
        }
      }

      setFeedback(isEdit ? "Service updated successfully." : "New service created successfully.");
      setEditingService(null);
      fetchServices();
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      console.error("Error saving service:", err);
      try {
        if (editingService.id) {
          await updateDoc(doc(db, "services", editingService.id), payload);
        } else {
          await addDoc(collection(db, "services"), { ...payload, createdAt: new Date().toISOString() });
        }
        setEditingService(null);
        fetchServices();
      } catch (fErr) {
        console.error("Fallback service save failed:", fErr);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const togglePublish = async (service: ServiceItem) => {
    try {
      await fetch("/api/admin/cms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          collectionName: "services",
          docId: service.id,
          data: { published: !service.published },
        }),
      });

      setServices((prev) =>
        prev.map((item) => (item.id === service.id ? { ...item, published: !item.published } : item))
      );
      setFeedback(`Service ${service.published ? "unpublished" : "published"}.`);
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      console.error("Error toggling publish:", err);
      try {
        const docRef = doc(db, "services", service.id);
        await updateDoc(docRef, { published: !service.published });
        setServices((prev) =>
          prev.map((item) => (item.id === service.id ? { ...item, published: !item.published } : item))
        );
      } catch (fErr) {
        console.error("Fallback publish toggle failed:", fErr);
      }
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch("/api/admin/cms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          collectionName: "services",
          docId: id,
        }),
      });

      setServices((prev) => prev.filter((item) => item.id !== id));
      setDeleteConfirmId(null);
      setFeedback("Service deleted.");
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      console.error("Error deleting service:", err);
      try {
        await deleteDoc(doc(db, "services", id));
        setServices((prev) => prev.filter((item) => item.id !== id));
        setDeleteConfirmId(null);
      } catch (fErr) {
        console.error("Fallback delete service failed:", fErr);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mb-1">
            Services Management
          </h1>
          <p className="text-text-muted text-xs sm:text-sm">
            Create, edit, reorder, and publish AWENUE service offerings.
          </p>
        </div>

        <button
          onClick={openNewService}
          className="inline-flex items-center gap-2 bg-accent text-surface-base text-xs font-extrabold px-5 py-2.5 rounded-xl hover:bg-accent-hover transition-colors shadow-glow cursor-pointer self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Add New Service</span>
        </button>
      </div>

      {feedback && (
        <div className="p-3 bg-accent/15 border border-accent/30 rounded-xl text-accent text-xs font-bold">
          {feedback}
        </div>
      )}

      {/* Services List */}
      <div className="bg-surface-raised border border-border-dark rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-16 text-center text-text-muted text-xs flex items-center justify-center gap-2">
            <Loader2 className="animate-spin" size={18} /> Loading services...
          </div>
        ) : services.length === 0 ? (
          <div className="py-16 text-center text-text-muted text-xs space-y-3">
            <p>No services found in database.</p>
            <button
              onClick={openNewService}
              className="text-accent font-bold underline cursor-pointer"
            >
              Create your first service
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-text-muted">
              <thead className="text-[10px] uppercase font-extrabold text-text-muted bg-surface-base/60 border-b border-border-dark">
                <tr>
                  <th className="py-3 px-4">Order</th>
                  <th className="py-3 px-4">Service Title</th>
                  <th className="py-3 px-4">Short Description</th>
                  <th className="py-3 px-4">Features</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {services.map((serv, index) => (
                  <tr key={serv.id} className="hover:bg-surface-base/50 transition-colors">
                    <td className="py-3.5 px-4 font-extrabold text-white">
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 text-center">{serv.displayOrder}</span>
                        <div className="flex flex-col">
                          <button
                            disabled={index === 0}
                            onClick={() => moveService(index, "up")}
                            className="p-0.5 text-text-muted hover:text-accent disabled:opacity-20 cursor-pointer"
                            title="Move Up"
                          >
                            <ArrowUp size={12} />
                          </button>
                          <button
                            disabled={index === services.length - 1}
                            onClick={() => moveService(index, "down")}
                            className="p-0.5 text-text-muted hover:text-accent disabled:opacity-20 cursor-pointer"
                            title="Move Down"
                          >
                            <ArrowDown size={12} />
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white">{serv.title}</td>
                    <td className="py-3.5 px-4 max-w-xs truncate">{serv.shortDescription}</td>
                    <td className="py-3.5 px-4 font-semibold text-accent">
                      {serv.features?.length || 0} items
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => togglePublish(serv)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border cursor-pointer ${
                          serv.published
                            ? "bg-accent/15 text-accent border-accent/30"
                            : "bg-gray-500/15 text-gray-400 border-gray-400/30"
                        }`}
                      >
                        {serv.published ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                        <span>{serv.published ? "Published" : "Draft"}</span>
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => openEditService(serv)}
                        className="p-1.5 text-accent hover:bg-accent/10 rounded-lg transition-colors cursor-pointer"
                        title="Edit Service"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(serv.id)}
                        className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                        title="Delete Service"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingService && (
        <div className="fixed inset-0 z-50 bg-surface-base/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-surface-raised border border-border-dark p-6 sm:p-8 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-5 shadow-2xl relative">
            <button
              onClick={() => setEditingService(null)}
              className="absolute right-5 top-5 p-2 text-text-muted hover:text-white rounded-full hover:bg-surface-base"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl sm:text-2xl font-black text-white">
              {editingService.id ? "Edit Service" : "Create New Service"}
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-extrabold text-text-muted uppercase tracking-wider block mb-1">
                    Service Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingService.title || ""}
                    onChange={(e) => setEditingService({ ...editingService, title: e.target.value })}
                    placeholder="e.g. Web Development"
                    className="w-full bg-surface-base border border-white/10 px-3.5 py-2.5 rounded-xl text-xs text-white outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-extrabold text-text-muted uppercase tracking-wider block mb-1">
                    Slug
                  </label>
                  <input
                    type="text"
                    value={editingService.slug || ""}
                    onChange={(e) => setEditingService({ ...editingService, slug: e.target.value })}
                    placeholder="web-development"
                    className="w-full bg-surface-base border border-white/10 px-3.5 py-2.5 rounded-xl text-xs text-white outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-extrabold text-text-muted uppercase tracking-wider block mb-1">
                  Short Description *
                </label>
                <textarea
                  rows={2}
                  value={editingService.shortDescription || ""}
                  onChange={(e) => setEditingService({ ...editingService, shortDescription: e.target.value })}
                  placeholder="Summary for cards and homepage overview..."
                  className="w-full bg-surface-base border border-white/10 p-3 rounded-xl text-xs text-white outline-none focus:border-accent resize-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-extrabold text-text-muted uppercase tracking-wider block mb-1">
                  Features List (One per line)
                </label>
                <textarea
                  rows={4}
                  value={featuresText}
                  onChange={(e) => setFeaturesText(e.target.value)}
                  placeholder="Business & Corporate Websites&#10;E-Commerce Solutions&#10;High-Converting Landing Pages"
                  className="w-full bg-surface-base border border-white/10 p-3 rounded-xl text-xs text-white outline-none focus:border-accent resize-none font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-extrabold text-text-muted uppercase tracking-wider block mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={editingService.displayOrder || 1}
                    onChange={(e) => setEditingService({ ...editingService, displayOrder: Number(e.target.value) })}
                    className="w-full bg-surface-base border border-white/10 px-3.5 py-2.5 rounded-xl text-xs text-white outline-none focus:border-accent"
                  />
                </div>

                <div className="flex items-center gap-3 pt-6">
                  <label className="text-xs font-bold text-white flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingService.published !== false}
                      onChange={(e) => setEditingService({ ...editingService, published: e.target.checked })}
                      className="w-4 h-4 accent-accent rounded cursor-pointer"
                    />
                    Published Status
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  onClick={() => setEditingService(null)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-xs font-bold text-text-muted hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-accent text-surface-base text-xs font-extrabold hover:bg-accent-hover shadow-glow"
                >
                  {isSaving ? "Saving..." : "Save Service"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-surface-base/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-surface-raised border border-border-dark p-6 rounded-2xl max-w-sm w-full text-center space-y-4 shadow-2xl">
            <h3 className="text-lg font-black text-white">Confirm Delete</h3>
            <p className="text-xs text-text-muted">
              Are you sure you want to delete this service?
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl border border-white/10 text-xs font-bold text-text-muted hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-5 py-2 rounded-xl bg-rose-500 text-white text-xs font-extrabold hover:bg-rose-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
