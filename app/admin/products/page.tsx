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
  ExternalLink,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

interface ProductItem {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  detailedDescription?: string;
  features: string[];
  productStatus: "live" | "coming_soon";
  externalUrl?: string;
  ctaLabel?: string;
  displayOrder: number;
  published: boolean;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Partial<ProductItem> | null>(null);
  const [featuresText, setFeaturesText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      const q = query(collection(db, "products"), orderBy("displayOrder", "asc"));
      const snap = await getDocs(q);
      const list: ProductItem[] = [];
      snap.forEach((docSnap) => {
        list.push({ ...docSnap.data(), id: docSnap.id } as ProductItem);
      });

      if (list.length === 0) {
        // Auto-seed default products to Firestore so admin can manage them immediately
        const initialProducts: Omit<ProductItem, "id">[] = [
          {
            name: "Awenue CRM",
            slug: "awenue-crm",
            shortDescription: "Manage leads, customers, sales, and business relationships — all in one place.",
            detailedDescription: "Comprehensive CRM designed to organize leads, automate follow-ups, and track business growth effortlessly.",
            features: ["Lead Management", "Sales Pipeline", "Customer Management"],
            productStatus: "live",
            externalUrl: "https://crm.awenue.io",
            ctaLabel: "Visit CRM Website",
            displayOrder: 1,
            published: true,
          },
          {
            name: "Awenue College ERP",
            slug: "awenue-college-erp",
            shortDescription: "A smarter platform to manage students, faculty, academics, fees, and campus operations.",
            detailedDescription: "Complete institutional management software for modern colleges and universities.",
            features: ["Student Management", "Attendance", "Fee Management"],
            productStatus: "live",
            externalUrl: "https://erp.awenue.io",
            ctaLabel: "Visit ERP Website",
            displayOrder: 2,
            published: true,
          },
          {
            name: "Awenue Hospital Management",
            slug: "hospital-management",
            shortDescription: "A connected digital solution designed to simplify hospital and healthcare operations.",
            detailedDescription: "Next-generation healthcare administrative software for hospitals and medical clinics.",
            features: ["Patient Management", "Appointments", "Hospital Operations"],
            productStatus: "coming_soon",
            externalUrl: "",
            ctaLabel: "Coming Soon",
            displayOrder: 3,
            published: true,
          },
        ];

        for (const item of initialProducts) {
          const docId = `prod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
          await fetch("/api/admin/cms", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "set", collectionName: "products", docId, data: item }),
          });
          list.push({ ...item, id: docId });
        }
      }

      setProducts(list);
    } catch (err) {
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) fetchProducts();
    });
    return () => {
      active = false;
    };
  }, [fetchProducts]);

  const openNewProduct = () => {
    const minOrder = products.length > 0 ? Math.min(...products.map((p) => p.displayOrder || 1)) : 1;
    setEditingProduct({
      name: "",
      slug: "",
      shortDescription: "",
      features: [],
      productStatus: "live",
      externalUrl: "https://",
      ctaLabel: "Visit Product Website",
      displayOrder: minOrder <= 1 ? minOrder - 1 : 1,
      published: true,
    });
    setFeaturesText("");
  };

  const moveProduct = async (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= products.length) return;

    const current = { ...products[index] };
    const target = { ...products[targetIdx] };

    const tempOrder = current.displayOrder;
    current.displayOrder = target.displayOrder;
    target.displayOrder = tempOrder;

    const updated = [...products];
    updated[index] = target;
    updated[targetIdx] = current;
    updated.sort((a, b) => a.displayOrder - b.displayOrder);
    setProducts(updated);

    try {
      await fetch("/api/admin/cms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update", collectionName: "products", docId: current.id, data: { displayOrder: current.displayOrder } }),
      });
      await fetch("/api/admin/cms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update", collectionName: "products", docId: target.id, data: { displayOrder: target.displayOrder } }),
      });
      setFeedback("Display order updated.");
      setTimeout(() => setFeedback(null), 2500);
    } catch (err) {
      console.error("Error updating display order:", err);
    }
  };

  const openEditProduct = (product: ProductItem) => {
    setEditingProduct(product);
    setFeaturesText((product.features || []).join("\n"));
  };

  const handleSave = async () => {
    if (!editingProduct || !editingProduct.name || !editingProduct.shortDescription) return;

    setIsSaving(true);
    const parsedFeatures = featuresText
      .split("\n")
      .map((f) => f.trim())
      .filter(Boolean);

    const payload = {
      name: editingProduct.name,
      slug: editingProduct.slug || editingProduct.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      shortDescription: editingProduct.shortDescription,
      features: parsedFeatures,
      productStatus: editingProduct.productStatus || "live",
      externalUrl: editingProduct.externalUrl || "",
      ctaLabel: editingProduct.ctaLabel || (editingProduct.productStatus === "live" ? "Visit Website" : "Coming Soon"),
      displayOrder: Number(editingProduct.displayOrder) || 1,
      published: editingProduct.published !== false,
      updatedAt: new Date().toISOString(),
    };

    try {
      const isEdit = Boolean(editingProduct.id);
      const action = isEdit ? "update" : "add";
      const docId = editingProduct.id || `product-${Date.now()}`;

      const res = await fetch("/api/admin/cms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          collectionName: "products",
          docId,
          data: payload,
        }),
      });

      if (!res.ok) {
        if (isEdit && editingProduct.id) {
          await updateDoc(doc(db, "products", editingProduct.id), payload);
        } else {
          await addDoc(collection(db, "products"), { ...payload, createdAt: new Date().toISOString() });
        }
      }

      setFeedback(isEdit ? "Product updated successfully." : "New product created successfully.");
      setEditingProduct(null);
      fetchProducts();
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      console.error("Error saving product:", err);
      try {
        if (editingProduct.id) {
          await updateDoc(doc(db, "products", editingProduct.id), payload);
        } else {
          await addDoc(collection(db, "products"), { ...payload, createdAt: new Date().toISOString() });
        }
        setEditingProduct(null);
        fetchProducts();
      } catch (fErr) {
        console.error("Fallback product save failed:", fErr);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const togglePublish = async (product: ProductItem) => {
    try {
      await fetch("/api/admin/cms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          collectionName: "products",
          docId: product.id,
          data: { published: !product.published },
        }),
      });

      setProducts((prev) =>
        prev.map((item) => (item.id === product.id ? { ...item, published: !item.published } : item))
      );
      setFeedback(`Product ${product.published ? "unpublished" : "published"}.`);
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      console.error("Error toggling publish:", err);
      try {
        const docRef = doc(db, "products", product.id);
        await updateDoc(docRef, { published: !product.published });
        setProducts((prev) =>
          prev.map((item) => (item.id === product.id ? { ...item, published: !item.published } : item))
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
          collectionName: "products",
          docId: id,
        }),
      });

      setProducts((prev) => prev.filter((item) => item.id !== id));
      setDeleteConfirmId(null);
      setFeedback("Product deleted.");
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      console.error("Error deleting product:", err);
      try {
        await deleteDoc(doc(db, "products", id));
        setProducts((prev) => prev.filter((item) => item.id !== id));
        setDeleteConfirmId(null);
      } catch (fErr) {
        console.error("Fallback delete product failed:", fErr);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mb-1">
            Products Management
          </h1>
          <p className="text-text-muted text-xs sm:text-sm">
            Manage AWENUE digital products, status (Live / Coming Soon), and dedicated external URLs.
          </p>
        </div>

        <button
          onClick={openNewProduct}
          className="inline-flex items-center gap-2 bg-accent text-surface-base text-xs font-extrabold px-5 py-2.5 rounded-xl hover:bg-accent-hover transition-colors shadow-glow cursor-pointer self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Add New Product</span>
        </button>
      </div>

      {feedback && (
        <div className="p-3 bg-accent/15 border border-accent/30 rounded-xl text-accent text-xs font-bold">
          {feedback}
        </div>
      )}

      {/* Table */}
      <div className="bg-surface-raised border border-border-dark rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-16 text-center text-text-muted text-xs flex items-center justify-center gap-2">
            <Loader2 className="animate-spin" size={18} /> Loading products...
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center text-text-muted text-xs space-y-3">
            <p>No products found.</p>
            <button onClick={openNewProduct} className="text-accent font-bold underline cursor-pointer">
              Create your first product
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-text-muted">
              <thead className="text-[10px] uppercase font-extrabold text-text-muted bg-surface-base/60 border-b border-border-dark">
                <tr>
                  <th className="py-3 px-4">Order</th>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">External URL</th>
                  <th className="py-3 px-4">Published</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {products.map((prod, index) => (
                  <tr key={prod.id} className="hover:bg-surface-base/50 transition-colors">
                    <td className="py-3.5 px-4 font-extrabold text-white">
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 text-center">{prod.displayOrder}</span>
                        <div className="flex flex-col">
                          <button
                            disabled={index === 0}
                            onClick={() => moveProduct(index, "up")}
                            className="p-0.5 text-text-muted hover:text-accent disabled:opacity-20 cursor-pointer"
                            title="Move Up"
                          >
                            <ArrowUp size={12} />
                          </button>
                          <button
                            disabled={index === products.length - 1}
                            onClick={() => moveProduct(index, "down")}
                            className="p-0.5 text-text-muted hover:text-accent disabled:opacity-20 cursor-pointer"
                            title="Move Down"
                          >
                            <ArrowDown size={12} />
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white">{prod.name}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                        prod.productStatus === "live"
                          ? "bg-blue-500/15 text-blue-400 border-blue-400/30"
                          : "bg-amber-500/15 text-amber-400 border-amber-400/30"
                      }`}>
                        {prod.productStatus === "live" ? "Live" : "Coming Soon"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {prod.externalUrl ? (
                        <a
                          href={prod.externalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent font-bold hover:underline flex items-center gap-1"
                        >
                          <span className="max-w-[160px] truncate">{prod.externalUrl}</span>
                          <ExternalLink size={12} />
                        </a>
                      ) : (
                        <span className="text-text-muted/50">N/A</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => togglePublish(prod)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border cursor-pointer ${
                          prod.published
                            ? "bg-accent/15 text-accent border-accent/30"
                            : "bg-gray-500/15 text-gray-400 border-gray-400/30"
                        }`}
                      >
                        {prod.published ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                        <span>{prod.published ? "Published" : "Draft"}</span>
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => openEditProduct(prod)}
                        className="p-1.5 text-accent hover:bg-accent/10 rounded-lg transition-colors cursor-pointer"
                        title="Edit Product"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(prod.id)}
                        className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                        title="Delete Product"
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
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-surface-base/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-surface-raised border border-border-dark p-6 sm:p-8 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-5 shadow-2xl relative">
            <button
              onClick={() => setEditingProduct(null)}
              className="absolute right-5 top-5 p-2 text-text-muted hover:text-white rounded-full hover:bg-surface-base"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl sm:text-2xl font-black text-white">
              {editingProduct.id ? "Edit Product" : "Create New Product"}
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-extrabold text-text-muted uppercase tracking-wider block mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingProduct.name || ""}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    placeholder="e.g. Awenue CRM"
                    className="w-full bg-surface-base border border-white/10 px-3.5 py-2.5 rounded-xl text-xs text-white outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-extrabold text-text-muted uppercase tracking-wider block mb-1">
                    Product Status *
                  </label>
                  <select
                    value={editingProduct.productStatus || "live"}
                    onChange={(e) => setEditingProduct({ ...editingProduct, productStatus: e.target.value as ProductItem["productStatus"] })}
                    className="w-full bg-surface-base border border-white/10 px-3 py-2.5 rounded-xl text-xs text-white outline-none focus:border-accent cursor-pointer"
                  >
                    <option value="live">Live (Active Website)</option>
                    <option value="coming_soon">Coming Soon</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-extrabold text-text-muted uppercase tracking-wider block mb-1">
                  Short Description *
                </label>
                <textarea
                  rows={2}
                  value={editingProduct.shortDescription || ""}
                  onChange={(e) => setEditingProduct({ ...editingProduct, shortDescription: e.target.value })}
                  placeholder="Summary for product cards..."
                  className="w-full bg-surface-base border border-white/10 p-3 rounded-xl text-xs text-white outline-none focus:border-accent resize-none"
                />
              </div>

              {editingProduct.productStatus === "live" && (
                <div>
                  <label className="text-[11px] font-extrabold text-text-muted uppercase tracking-wider block mb-1">
                    External Dedicated Website URL *
                  </label>
                  <input
                    type="url"
                    value={editingProduct.externalUrl || ""}
                    onChange={(e) => setEditingProduct({ ...editingProduct, externalUrl: e.target.value })}
                    placeholder="https://crm.awenue.io"
                    className="w-full bg-surface-base border border-white/10 px-3.5 py-2.5 rounded-xl text-xs text-white outline-none focus:border-accent"
                  />
                  <p className="text-[10px] text-text-muted mt-1">
                    Clicking &apos;Visit Website&apos; on live products will open this dedicated URL.
                  </p>
                </div>
              )}

              <div>
                <label className="text-[11px] font-extrabold text-text-muted uppercase tracking-wider block mb-1">
                  Features List (One per line)
                </label>
                <textarea
                  rows={3}
                  value={featuresText}
                  onChange={(e) => setFeaturesText(e.target.value)}
                  placeholder="Lead Management&#10;Sales Pipeline&#10;Customer Analytics"
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
                    value={editingProduct.displayOrder || 1}
                    onChange={(e) => setEditingProduct({ ...editingProduct, displayOrder: Number(e.target.value) })}
                    className="w-full bg-surface-base border border-white/10 px-3.5 py-2.5 rounded-xl text-xs text-white outline-none focus:border-accent"
                  />
                </div>

                <div className="flex items-center gap-3 pt-6">
                  <label className="text-xs font-bold text-white flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingProduct.published !== false}
                      onChange={(e) => setEditingProduct({ ...editingProduct, published: e.target.checked })}
                      className="w-4 h-4 accent-accent rounded cursor-pointer"
                    />
                    Published Status
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-xs font-bold text-text-muted hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-accent text-surface-base text-xs font-extrabold hover:bg-accent-hover shadow-glow"
                >
                  {isSaving ? "Saving..." : "Save Product"}
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
              Are you sure you want to delete this product?
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
