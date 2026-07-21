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
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import TechLogo, { OFFICIAL_TECH_LOGOS } from "@/lib/techLogos";
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
  Star,
  Search,
  RotateCcw,
} from "lucide-react";

export interface TechnologyItem {
  id: string;
  name: string;
  slug: string;
  category: "Frontend" | "Backend" | "Cloud & DevOps" | "Database" | "AI & Mobile";
  logo?: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
  featured: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

const CATEGORIES = ["Frontend", "Backend", "Cloud & DevOps", "Database", "AI & Mobile"] as const;

const INITIAL_DEFAULT_TECHNOLOGIES: Omit<TechnologyItem, "id">[] = [
  { name: "React", slug: "react", category: "Frontend", displayOrder: 1, isActive: true, featured: true, description: "UI Library for Modern Web" },
  { name: "Next.js", slug: "nextjs", category: "Frontend", displayOrder: 2, isActive: true, featured: true, description: "React Framework for Production" },
  { name: "TypeScript", slug: "typescript", category: "Frontend", displayOrder: 3, isActive: true, featured: true, description: "Strongly Typed JavaScript" },
  { name: "Tailwind CSS", slug: "tailwindcss", category: "Frontend", displayOrder: 4, isActive: true, featured: true, description: "Utility-First CSS Framework" },
  { name: "JavaScript", slug: "javascript", category: "Frontend", displayOrder: 5, isActive: true, featured: false, description: "Core Web Language" },
  { name: "Node.js", slug: "nodejs", category: "Backend", displayOrder: 6, isActive: true, featured: true, description: "Async Event-Driven Runtime" },
  { name: "Express.js", slug: "express", category: "Backend", displayOrder: 7, isActive: true, featured: false, description: "Fast Minimalist Web Framework" },
  { name: "Python", slug: "python", category: "Backend", displayOrder: 8, isActive: true, featured: true, description: "High-level Programming Language" },
  { name: "Firebase", slug: "firebase", category: "Backend", displayOrder: 9, isActive: true, featured: true, description: "Google Cloud App Platform" },
  { name: "Socket.IO", slug: "socketio", category: "Backend", displayOrder: 10, isActive: true, featured: false, description: "Real-time Event Communication" },
  { name: "MongoDB", slug: "mongodb", category: "Database", displayOrder: 11, isActive: true, featured: true, description: "Document NoSQL Database" },
  { name: "PostgreSQL", slug: "postgresql", category: "Database", displayOrder: 12, isActive: true, featured: true, description: "Advanced Relational Database" },
  { name: "Prisma", slug: "prisma", category: "Database", displayOrder: 13, isActive: true, featured: true, description: "Next-gen Node & TS ORM" },
  { name: "Redis", slug: "redis", category: "Database", displayOrder: 14, isActive: true, featured: false, description: "In-Memory Data Structure Store" },
  { name: "Docker", slug: "docker", category: "Cloud & DevOps", displayOrder: 15, isActive: true, featured: true, description: "Container Isolation Platform" },
  { name: "Kubernetes", slug: "kubernetes", category: "Cloud & DevOps", displayOrder: 16, isActive: true, featured: true, description: "Automated Container Orchestration" },
  { name: "AWS", slug: "aws", category: "Cloud & DevOps", displayOrder: 17, isActive: true, featured: true, description: "Amazon Web Services Cloud" },
  { name: "Microsoft Azure", slug: "azure", category: "Cloud & DevOps", displayOrder: 18, isActive: true, featured: true, description: "Enterprise Cloud Ecosystem" },
  { name: "Google Cloud", slug: "gcp", category: "Cloud & DevOps", displayOrder: 19, isActive: true, featured: true, description: "Google Infrastructure & AI" },
  { name: "Vercel", slug: "vercel", category: "Cloud & DevOps", displayOrder: 20, isActive: true, featured: true, description: "Frontend Cloud Platform" },
  { name: "Nginx", slug: "nginx", category: "Cloud & DevOps", displayOrder: 21, isActive: true, featured: false, description: "High-Performance Reverse Proxy" },
  { name: "GitHub", slug: "github", category: "Cloud & DevOps", displayOrder: 22, isActive: true, featured: true, description: "Version Control & CI/CD" },
  { name: "Flutter", slug: "flutter", category: "AI & Mobile", displayOrder: 23, isActive: true, featured: true, description: "Cross-Platform Mobile SDK" },
  { name: "React Native", slug: "reactnative", category: "AI & Mobile", displayOrder: 24, isActive: true, featured: true, description: "Native iOS & Android Apps" },
  { name: "OpenAI", slug: "openai", category: "AI & Mobile", displayOrder: 25, isActive: true, featured: true, description: "Generative AI & LLM Models" },
];

export default function AdminTechnologiesPage() {
  const [techList, setTechList] = useState<TechnologyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTech, setEditingTech] = useState<Partial<TechnologyItem> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("All");

  const fetchTechStack = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "technologies"), orderBy("displayOrder", "asc"));
      const snap = await getDocs(q);
      const list: TechnologyItem[] = [];

      snap.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as TechnologyItem);
      });

      if (list.length === 0) {
        // Auto-seed default technologies into Firestore
        const seededList: TechnologyItem[] = [];
        for (const item of INITIAL_DEFAULT_TECHNOLOGIES) {
          const docRef = await addDoc(collection(db, "technologies"), {
            ...item,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          seededList.push({ id: docRef.id, ...item });
        }
        setTechList(seededList);
        setFeedback("Auto-seeded initial 25 technology items to Firestore!");
      } else {
        setTechList(list);
      }
    } catch (err) {
      console.error("Failed to fetch technology stack:", err);
      setFeedback("Failed to load technologies from Firestore.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTechStack();
  }, [fetchTechStack]);

  const handleOpenAdd = () => {
    const nextOrder = techList.length > 0 ? Math.max(...techList.map((t) => t.displayOrder || 0)) + 1 : 1;
    setEditingTech({
      name: "",
      slug: "",
      category: "Frontend",
      logo: "",
      description: "",
      displayOrder: nextOrder,
      isActive: true,
      featured: false,
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTech || !editingTech.name?.trim()) return;

    setIsSaving(true);
    try {
      const slug = editingTech.slug?.trim() || editingTech.name.toLowerCase().replace(/[^a-z0-9]/g, "");
      const payload = {
        name: editingTech.name.trim(),
        slug,
        category: editingTech.category || "Frontend",
        logo: editingTech.logo?.trim() || "",
        description: editingTech.description?.trim() || "",
        displayOrder: Number(editingTech.displayOrder) || 1,
        isActive: editingTech.isActive ?? true,
        featured: editingTech.featured ?? false,
        updatedAt: serverTimestamp(),
      };

      if (editingTech.id) {
        // Update existing
        await updateDoc(doc(db, "technologies", editingTech.id), payload);
        setFeedback(`Updated "${payload.name}" successfully!`);
      } else {
        // Create new
        await addDoc(collection(db, "technologies"), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        setFeedback(`Added "${payload.name}" to technology stack!`);
      }

      setEditingTech(null);
      fetchTechStack();
    } catch (err) {
      console.error("Failed to save technology item:", err);
      setFeedback("Error saving technology item.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "technologies", id));
      setFeedback("Deleted technology item.");
      setDeleteConfirmId(null);
      fetchTechStack();
    } catch (err) {
      console.error("Failed to delete technology:", err);
      setFeedback("Failed to delete item.");
    }
  };

  const handleToggleActive = async (item: TechnologyItem) => {
    try {
      await updateDoc(doc(db, "technologies", item.id), {
        isActive: !item.isActive,
        updatedAt: serverTimestamp(),
      });
      fetchTechStack();
    } catch (err) {
      console.error("Failed to toggle active status:", err);
    }
  };

  const handleToggleFeatured = async (item: TechnologyItem) => {
    try {
      await updateDoc(doc(db, "technologies", item.id), {
        featured: !item.featured,
        updatedAt: serverTimestamp(),
      });
      fetchTechStack();
    } catch (err) {
      console.error("Failed to toggle featured status:", err);
    }
  };

  const handleMoveOrder = async (item: TechnologyItem, direction: "up" | "down") => {
    const sorted = [...techList].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    const currentIndex = sorted.findIndex((t) => t.id === item.id);
    if (currentIndex === -1) return;

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;

    const currentTarget = sorted[targetIndex];

    try {
      await Promise.all([
        updateDoc(doc(db, "technologies", item.id), { displayOrder: currentTarget.displayOrder, updatedAt: serverTimestamp() }),
        updateDoc(doc(db, "technologies", currentTarget.id), { displayOrder: item.displayOrder, updatedAt: serverTimestamp() }),
      ]);
      fetchTechStack();
    } catch (err) {
      console.error("Failed to swap display order:", err);
    }
  };

  // Filtered technology list
  const filteredTech = techList.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = filterCategory === "All" || item.category === filterCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-raised/40 p-6 rounded-3xl border border-border-dark">
        <div>
          <div className="flex items-center gap-2 text-accent text-xs font-black tracking-widest uppercase mb-1">
            <span>WEBSITE CMS</span>
            <span>•</span>
            <span>TECHNOLOGY SHOWCASE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Trusted Technology Stack</h1>
          <p className="text-xs text-text-muted mt-1">
            Manage the technologies, framework logos, categories, and display order shown on the home page landing section.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchTechStack}
            className="p-3 rounded-2xl bg-surface-raised border border-white/10 text-text-muted hover:text-white hover:border-white/20 transition-all cursor-pointer"
            title="Refresh Data"
          >
            <RotateCcw size={16} />
          </button>
          <button
            onClick={handleOpenAdd}
            className="px-5 py-3 rounded-2xl bg-accent text-surface-base font-extrabold text-xs hover:bg-accent-hover transition-all flex items-center gap-2 shadow-glow cursor-pointer"
          >
            <Plus size={16} />
            <span>Add Technology</span>
          </button>
        </div>
      </div>

      {/* Feedback Toast Banner */}
      {feedback && (
        <div className="p-4 rounded-2xl bg-accent/10 border border-accent/30 text-accent text-xs font-bold flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-accent hover:opacity-75">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 scrollbar-none">
          {["All", ...CATEGORIES].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all shrink-0 cursor-pointer ${
                filterCategory === cat
                  ? "bg-accent text-surface-base shadow-sm"
                  : "bg-surface-raised text-text-muted hover:text-white border border-border-dark"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search technologies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-surface-raised border border-border-dark text-xs text-white placeholder-text-muted/60 focus:outline-none focus:border-accent transition-colors"
          />
        </div>
      </div>

      {/* Technologies Table / List */}
      {loading ? (
        <div className="min-h-[400px] flex items-center justify-center text-text-muted text-xs font-bold gap-3 bg-surface-raised/20 rounded-3xl border border-border-dark">
          <Loader2 size={24} className="animate-spin text-accent" />
          <span>Loading Technology Stack...</span>
        </div>
      ) : filteredTech.length === 0 ? (
        <div className="min-h-[300px] flex flex-col items-center justify-center text-center p-8 bg-surface-raised/20 rounded-3xl border border-border-dark">
          <p className="text-sm font-bold text-white mb-2">No technologies found</p>
          <p className="text-xs text-text-muted mb-4">Try clearing your search filters or add a new technology.</p>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-accent text-surface-base font-bold text-xs hover:bg-accent-hover transition-colors"
          >
            Add New Technology
          </button>
        </div>
      ) : (
        <div className="bg-surface-raised/40 border border-border-dark rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-text-secondary">
              <thead className="bg-surface-raised border-b border-border-dark text-[11px] font-black uppercase text-text-muted tracking-wider">
                <tr>
                  <th className="py-4 px-5 w-16 text-center">Order</th>
                  <th className="py-4 px-5">Technology</th>
                  <th className="py-4 px-5">Category</th>
                  <th className="py-4 px-5">Description</th>
                  <th className="py-4 px-5 text-center">Status</th>
                  <th className="py-4 px-5 text-center">Featured</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-dark/60">
                {filteredTech.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-surface-base/40 transition-colors group">
                    {/* Order Controls */}
                    <td className="py-4 px-5 text-center">
                      <div className="flex flex-col items-center justify-center gap-1">
                        <button
                          onClick={() => handleMoveOrder(item, "up")}
                          disabled={idx === 0}
                          className="p-1 text-text-muted hover:text-white disabled:opacity-20 cursor-pointer"
                          title="Move Up"
                        >
                          <ArrowUp size={13} />
                        </button>
                        <span className="font-extrabold text-white text-[11px] bg-white/5 px-2 py-0.5 rounded">
                          {item.displayOrder}
                        </span>
                        <button
                          onClick={() => handleMoveOrder(item, "down")}
                          disabled={idx === filteredTech.length - 1}
                          className="p-1 text-text-muted hover:text-white disabled:opacity-20 cursor-pointer"
                          title="Move Down"
                        >
                          <ArrowDown size={13} />
                        </button>
                      </div>
                    </td>

                    {/* Logo & Name */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-surface-base border border-white/10 flex items-center justify-center p-2 shrink-0 group-hover:border-accent/40 transition-colors">
                          <TechLogo slug={item.slug} name={item.name} customLogo={item.logo} className="w-6 h-6" />
                        </div>
                        <div>
                          <span className="font-extrabold text-white text-sm block">{item.name}</span>
                          <span className="text-[10px] text-text-muted font-mono">{item.slug}</span>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-4 px-5">
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 font-bold text-accent text-[11px]">
                        {item.category}
                      </span>
                    </td>

                    {/* Description */}
                    <td className="py-4 px-5 text-text-muted text-xs max-w-xs truncate">
                      {item.description || <span className="opacity-40">—</span>}
                    </td>

                    {/* Active Toggle */}
                    <td className="py-4 px-5 text-center">
                      <button
                        onClick={() => handleToggleActive(item)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer ${
                          item.isActive
                            ? "bg-accent/10 border border-accent/30 text-accent"
                            : "bg-white/5 border border-white/10 text-text-muted"
                        }`}
                      >
                        {item.isActive ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                        <span>{item.isActive ? "Active" : "Disabled"}</span>
                      </button>
                    </td>

                    {/* Featured Toggle */}
                    <td className="py-4 px-5 text-center">
                      <button
                        onClick={() => handleToggleFeatured(item)}
                        className={`p-2 rounded-xl transition-all cursor-pointer ${
                          item.featured
                            ? "bg-amber-500/10 border border-amber-500/30 text-amber-400"
                            : "bg-white/5 border border-white/10 text-text-muted hover:text-white"
                        }`}
                        title={item.featured ? "Featured on Hero Marquee" : "Normal display"}
                      >
                        <Star size={14} className={item.featured ? "fill-amber-400" : ""} />
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingTech(item)}
                          className="p-2 rounded-xl bg-surface-base border border-white/10 text-text-muted hover:text-white hover:border-white/20 transition-all cursor-pointer"
                          title="Edit Technology"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(item.id)}
                          className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-all cursor-pointer"
                          title="Delete Technology"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {editingTech && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface-raised border border-border-dark rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl relative">
            <button
              onClick={() => setEditingTech(null)}
              className="absolute top-6 right-6 p-2 text-text-muted hover:text-white rounded-xl bg-white/5 transition-colors"
            >
              <X size={18} />
            </button>

            <h2 className="text-xl font-black text-white mb-1">
              {editingTech.id ? "Edit Technology" : "Add New Technology"}
            </h2>
            <p className="text-xs text-text-muted mb-6">
              Configure technology brand details, category, and display preferences.
            </p>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <label className="block text-xs font-bold text-text-muted mb-1.5">Technology Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Next.js"
                    value={editingTech.name || ""}
                    onChange={(e) => setEditingTech({ ...editingTech, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-base border border-border-dark text-xs text-white focus:outline-none focus:border-accent"
                  />
                </div>

                {/* Slug */}
                <div>
                  <label className="block text-xs font-bold text-text-muted mb-1.5">Slug / Key</label>
                  <input
                    type="text"
                    placeholder="e.g. nextjs"
                    value={editingTech.slug || ""}
                    onChange={(e) => setEditingTech({ ...editingTech, slug: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-base border border-border-dark text-xs text-white focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-text-muted mb-1.5">Category *</label>
                <select
                  value={editingTech.category || "Frontend"}
                  onChange={(e) =>
                    setEditingTech({
                      ...editingTech,
                      category: e.target.value as TechnologyItem["category"],
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-base border border-border-dark text-xs text-white focus:outline-none focus:border-accent"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Logo SVG or URL */}
              <div>
                <label className="block text-xs font-bold text-text-muted mb-1.5">
                  Custom Logo (SVG Code or Image URL)
                </label>
                <textarea
                  rows={2}
                  placeholder="Leave empty to use official vector logo, or paste custom <svg> / Image URL..."
                  value={editingTech.logo || ""}
                  onChange={(e) => setEditingTech({ ...editingTech, logo: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl bg-surface-base border border-border-dark text-xs text-white focus:outline-none focus:border-accent font-mono"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-text-muted mb-1.5">Short Description</label>
                <input
                  type="text"
                  placeholder="e.g. High-performance React Framework"
                  value={editingTech.description || ""}
                  onChange={(e) => setEditingTech({ ...editingTech, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-base border border-border-dark text-xs text-white focus:outline-none focus:border-accent"
                />
              </div>

              {/* Order & Switches */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-text-muted mb-1.5">Display Order</label>
                  <input
                    type="number"
                    value={editingTech.displayOrder ?? 1}
                    onChange={(e) => setEditingTech({ ...editingTech, displayOrder: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-base border border-border-dark text-xs text-white focus:outline-none focus:border-accent"
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={editingTech.isActive ?? true}
                    onChange={(e) => setEditingTech({ ...editingTech, isActive: e.target.checked })}
                    className="w-4 h-4 rounded accent-accent cursor-pointer"
                  />
                  <label htmlFor="isActive" className="text-xs font-bold text-white cursor-pointer">
                    Active
                  </label>
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={editingTech.featured ?? false}
                    onChange={(e) => setEditingTech({ ...editingTech, featured: e.target.checked })}
                    className="w-4 h-4 rounded accent-accent cursor-pointer"
                  />
                  <label htmlFor="featured" className="text-xs font-bold text-amber-400 cursor-pointer">
                    Featured
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-6 border-t border-border-dark">
                <button
                  type="button"
                  onClick={() => setEditingTech(null)}
                  className="px-5 py-2.5 rounded-xl bg-surface-base border border-white/10 text-xs font-bold text-text-muted hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-accent text-surface-base text-xs font-extrabold hover:bg-accent-hover transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSaving && <Loader2 size={14} className="animate-spin" />}
                  <span>{editingTech.id ? "Save Changes" : "Add Technology"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-surface-raised border border-rose-500/30 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Delete Technology?</h3>
              <p className="text-xs text-text-muted mt-1">This action will remove the technology from your live website stack.</p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl bg-surface-base border border-white/10 text-xs font-bold text-text-muted hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 rounded-xl bg-rose-500 text-white text-xs font-extrabold hover:bg-rose-600 transition-colors"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
