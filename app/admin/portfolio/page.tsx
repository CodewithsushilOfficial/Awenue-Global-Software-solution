"use client";

import { useEffect, useState, useCallback } from "react";
import ImageUrlField from "@/components/admin/ImageUrlField";
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

interface PortfolioProject {
  id: string;
  name: string;
  slug: string;
  category: string;
  shortDescription: string;
  techTags: string[];
  projectUrl?: string;
  projectType: "AWENUE Product" | "Personal Project" | "Client Project";
  imageUrl?: string;
  imageAlt?: string;
  displayOrder: number;
  published: boolean;
}

export default function AdminPortfolioPage() {
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProject, setEditingProject] = useState<Partial<PortfolioProject> | null>(null);
  const [techTagsText, setTechTagsText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      const q = query(collection(db, "portfolioProjects"), orderBy("displayOrder", "asc"));
      const snap = await getDocs(q);
      const list: PortfolioProject[] = [];
      snap.forEach((docSnap) => {
        list.push({ ...docSnap.data(), id: docSnap.id } as PortfolioProject);
      });

      if (list.length === 0) {
        // Auto-seed default portfolio projects to Firestore so admin can manage them immediately
        const initialProjects: Omit<PortfolioProject, "id">[] = [
          {
            name: "Enterprise Analytics Portal",
            slug: "enterprise-analytics",
            category: "Web Application",
            shortDescription: "Real-time decision intelligence dashboard with custom telemetry and predictive workflow triggers.",
            techTags: ["Next.js", "TypeScript", "Tailwind CSS", "Recharts"],
            projectUrl: "https://awenue.io",
            projectType: "Client Project",
            imageUrl: "/images/hero/scene-01-business.jpg",
            displayOrder: 1,
            published: true,
          },
          {
            name: "Cross-Platform Logistics Suite",
            slug: "logistics-mobile-app",
            category: "Mobile Application",
            shortDescription: "Universal iOS & Android dispatch manager connecting drivers, hub controllers, and live fleet GPS.",
            techTags: ["React Native", "Node.js", "PostgreSQL"],
            projectUrl: "https://awenue.io",
            projectType: "Client Project",
            imageUrl: "/images/hero/scene-03-mobile.jpg",
            displayOrder: 2,
            published: true,
          },
          {
            name: "Automated Lead Routing Engine",
            slug: "ai-lead-automation",
            category: "AI & Automation",
            shortDescription: "Custom AI pipeline extracting inquiry metadata and orchestrating real-time CRM follow-ups.",
            techTags: ["Python", "FastAPI", "OpenAI API", "Webhooks"],
            projectUrl: "https://awenue.io",
            projectType: "AWENUE Product",
            imageUrl: "/images/hero/scene-04-ai.jpg",
            displayOrder: 3,
            published: true,
          },
        ];

        for (const item of initialProjects) {
          const docId = `proj-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
          await fetch("/api/admin/cms", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "set", collectionName: "portfolioProjects", docId, data: item }),
          });
          list.push({ ...item, id: docId });
        }
      }

      setProjects(list);
    } catch (err) {
      console.error("Error fetching portfolio projects:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) fetchProjects();
    });
    return () => {
      active = false;
    };
  }, [fetchProjects]);

  const openNewProject = () => {
    const minOrder = projects.length > 0 ? Math.min(...projects.map((p) => p.displayOrder || 1)) : 1;
    setEditingProject({
      name: "",
      slug: "",
      category: "Web Application",
      shortDescription: "",
      techTags: [],
      projectUrl: "",
      projectType: "Client Project",
      imageUrl: "",
      displayOrder: minOrder <= 1 ? minOrder - 1 : 1,
      published: true,
    });
    setTechTagsText("");
  };

  const moveProject = async (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= projects.length) return;

    const current = { ...projects[index] };
    const target = { ...projects[targetIdx] };

    const tempOrder = current.displayOrder;
    current.displayOrder = target.displayOrder;
    target.displayOrder = tempOrder;

    const updated = [...projects];
    updated[index] = target;
    updated[targetIdx] = current;
    updated.sort((a, b) => a.displayOrder - b.displayOrder);
    setProjects(updated);

    try {
      await fetch("/api/admin/cms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update", collectionName: "portfolioProjects", docId: current.id, data: { displayOrder: current.displayOrder } }),
      });
      await fetch("/api/admin/cms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update", collectionName: "portfolioProjects", docId: target.id, data: { displayOrder: target.displayOrder } }),
      });
      setFeedback("Display order updated.");
      setTimeout(() => setFeedback(null), 2500);
    } catch (err) {
      console.error("Error updating display order:", err);
    }
  };

  const openEditProject = (project: PortfolioProject) => {
    setEditingProject(project);
    setTechTagsText((project.techTags || []).join(", "));
  };

  const handleSave = async () => {
    if (!editingProject || !editingProject.name || !editingProject.shortDescription) return;

    setIsSaving(true);
    const parsedTags = techTagsText
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const payload = {
      name: editingProject.name,
      slug: editingProject.slug || editingProject.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      category: editingProject.category || "Web Application",
      shortDescription: editingProject.shortDescription,
      techTags: parsedTags,
      projectUrl: editingProject.projectUrl || "",
      projectType: editingProject.projectType || "Client Project",
      imageUrl: editingProject.imageUrl || null,
      imageAlt: editingProject.imageAlt || "",
      displayOrder: Number(editingProject.displayOrder) || 1,
      published: editingProject.published !== false,
      updatedAt: new Date().toISOString(),
    };

    try {
      const isEdit = Boolean(editingProject.id);
      const action = isEdit ? "update" : "add";
      const docId = editingProject.id || `portfolio-${Date.now()}`;

      const res = await fetch("/api/admin/cms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          collectionName: "portfolioProjects",
          docId,
          data: payload,
        }),
      });

      if (!res.ok) {
        if (isEdit && editingProject.id) {
          await updateDoc(doc(db, "portfolioProjects", editingProject.id), payload);
        } else {
          await addDoc(collection(db, "portfolioProjects"), { ...payload, createdAt: new Date().toISOString() });
        }
        fetch("/api/revalidate", { method: "POST" }).catch(() => {});
      }

      setFeedback(isEdit ? "Portfolio project updated." : "New portfolio project created.");
      setEditingProject(null);
      fetchProjects();
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      console.error("Error saving portfolio project:", err);
      try {
        if (editingProject.id) {
          await updateDoc(doc(db, "portfolioProjects", editingProject.id), payload);
        } else {
          await addDoc(collection(db, "portfolioProjects"), { ...payload, createdAt: new Date().toISOString() });
        }
        setEditingProject(null);
        fetchProjects();
        fetch("/api/revalidate", { method: "POST" }).catch(() => {});
      } catch (fErr) {
        console.error("Fallback portfolio save failed:", fErr);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const togglePublish = async (project: PortfolioProject) => {
    try {
      await fetch("/api/admin/cms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          collectionName: "portfolioProjects",
          docId: project.id,
          data: { published: !project.published },
        }),
      });

      setProjects((prev) =>
        prev.map((item) => (item.id === project.id ? { ...item, published: !item.published } : item))
      );
      setFeedback(`Project ${project.published ? "unpublished" : "published"}.`);
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      console.error("Error toggling publish:", err);
      try {
        const docRef = doc(db, "portfolioProjects", project.id);
        await updateDoc(docRef, { published: !project.published });
        setProjects((prev) =>
          prev.map((item) => (item.id === project.id ? { ...item, published: !item.published } : item))
        );
        fetch("/api/revalidate", { method: "POST" }).catch(() => {});
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
          collectionName: "portfolioProjects",
          docId: id,
        }),
      });

      setProjects((prev) => prev.filter((item) => item.id !== id));
      setDeleteConfirmId(null);
      setFeedback("Portfolio project deleted.");
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      console.error("Error deleting portfolio project:", err);
      try {
        await deleteDoc(doc(db, "portfolioProjects", id));
        setProjects((prev) => prev.filter((item) => item.id !== id));
        setDeleteConfirmId(null);
      } catch (fErr) {
        console.error("Fallback delete portfolio failed:", fErr);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mb-1">
            Portfolio Management
          </h1>
          <p className="text-text-muted text-xs sm:text-sm">
            Manage public portfolio projects, categories, and project types.
          </p>
        </div>

        <button
          onClick={openNewProject}
          className="inline-flex items-center gap-2 bg-accent text-surface-base text-xs font-extrabold px-5 py-2.5 rounded-xl hover:bg-accent-hover transition-colors shadow-glow cursor-pointer self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Add Portfolio Project</span>
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
            <Loader2 className="animate-spin" size={18} /> Loading portfolio projects...
          </div>
        ) : projects.length === 0 ? (
          <div className="py-16 text-center text-text-muted text-xs space-y-3">
            <p>No portfolio projects found.</p>
            <button onClick={openNewProject} className="text-accent font-bold underline cursor-pointer">
              Create your first portfolio item
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-text-muted">
              <thead className="text-[10px] uppercase font-extrabold text-text-muted bg-surface-base/60 border-b border-border-dark">
                <tr>
                  <th className="py-3 px-4">Order</th>
                  <th className="py-3 px-4">Project Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {projects.map((proj, index) => (
                  <tr key={proj.id} className="hover:bg-surface-base/50 transition-colors">
                    <td className="py-3.5 px-4 font-extrabold text-white">
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 text-center">{proj.displayOrder}</span>
                        <div className="flex flex-col">
                          <button
                            disabled={index === 0}
                            onClick={() => moveProject(index, "up")}
                            className="p-0.5 text-text-muted hover:text-accent disabled:opacity-20 cursor-pointer"
                            title="Move Up"
                          >
                            <ArrowUp size={12} />
                          </button>
                          <button
                            disabled={index === projects.length - 1}
                            onClick={() => moveProject(index, "down")}
                            className="p-0.5 text-text-muted hover:text-accent disabled:opacity-20 cursor-pointer"
                            title="Move Down"
                          >
                            <ArrowDown size={12} />
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white">{proj.name}</td>
                    <td className="py-3.5 px-4">{proj.category}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
                        proj.projectType === "AWENUE Product"
                          ? "bg-accent/15 text-accent border-accent/30"
                          : proj.projectType === "Client Project"
                          ? "bg-blue-500/15 text-blue-400 border-blue-400/30"
                          : "bg-purple-500/15 text-purple-400 border-purple-400/30"
                      }`}>
                        {proj.projectType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => togglePublish(proj)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border cursor-pointer ${
                          proj.published
                            ? "bg-accent/15 text-accent border-accent/30"
                            : "bg-gray-500/15 text-gray-400 border-gray-400/30"
                        }`}
                      >
                        {proj.published ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                        <span>{proj.published ? "Published" : "Draft"}</span>
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => openEditProject(proj)}
                        className="p-1.5 text-accent hover:bg-accent/10 rounded-lg transition-colors cursor-pointer"
                        title="Edit Project"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(proj.id)}
                        className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                        title="Delete Project"
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
      {editingProject && (
        <div className="fixed inset-0 z-50 bg-surface-base/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-surface-raised border border-border-dark p-6 sm:p-8 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-5 shadow-2xl relative">
            <button
              onClick={() => setEditingProject(null)}
              className="absolute right-5 top-5 p-2 text-text-muted hover:text-white rounded-full hover:bg-surface-base"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl sm:text-2xl font-black text-white">
              {editingProject.id ? "Edit Portfolio Project" : "Create Portfolio Project"}
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-extrabold text-text-muted uppercase tracking-wider block mb-1">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingProject.name || ""}
                    onChange={(e) => setEditingProject({ ...editingProject, name: e.target.value })}
                    placeholder="e.g. Enterprise Analytics Portal"
                    className="w-full bg-surface-base border border-white/10 px-3.5 py-2.5 rounded-xl text-xs text-white outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-extrabold text-text-muted uppercase tracking-wider block mb-1">
                    Category *
                  </label>
                  <input
                    type="text"
                    value={editingProject.category || ""}
                    onChange={(e) => setEditingProject({ ...editingProject, category: e.target.value })}
                    placeholder="Web Application"
                    className="w-full bg-surface-base border border-white/10 px-3.5 py-2.5 rounded-xl text-xs text-white outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-extrabold text-text-muted uppercase tracking-wider block mb-1">
                  Project Type *
                </label>
                <select
                  value={editingProject.projectType || "Client Project"}
                  onChange={(e) => setEditingProject({ ...editingProject, projectType: e.target.value as PortfolioProject["projectType"] })}
                  className="w-full bg-surface-base border border-white/10 px-3 py-2.5 rounded-xl text-xs text-white outline-none focus:border-accent cursor-pointer"
                >
                  <option value="Client Project">Client Project</option>
                  <option value="AWENUE Product">AWENUE Product</option>
                  <option value="Personal Project">Personal Project</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-extrabold text-text-muted uppercase tracking-wider block mb-1">
                  Short Description *
                </label>
                <textarea
                  rows={2}
                  value={editingProject.shortDescription || ""}
                  onChange={(e) => setEditingProject({ ...editingProject, shortDescription: e.target.value })}
                  placeholder="Summary of what was built and business outcome..."
                  className="w-full bg-surface-base border border-white/10 p-3 rounded-xl text-xs text-white outline-none focus:border-accent resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-extrabold text-text-muted uppercase tracking-wider block mb-1">
                    Tech Stack Tags (Comma-separated)
                  </label>
                  <input
                    type="text"
                    value={techTagsText}
                    onChange={(e) => setTechTagsText(e.target.value)}
                    placeholder="Next.js, TypeScript, Tailwind CSS"
                    className="w-full bg-surface-base border border-white/10 px-3.5 py-2.5 rounded-xl text-xs text-white outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-extrabold text-text-muted uppercase tracking-wider block mb-1">
                    Live Project URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={editingProject.projectUrl || ""}
                    onChange={(e) => setEditingProject({ ...editingProject, projectUrl: e.target.value })}
                    placeholder="https://example.com"
                    className="w-full bg-surface-base border border-white/10 px-3.5 py-2.5 rounded-xl text-xs text-white outline-none focus:border-accent"
                  />
                </div>
              </div>

              {/* Image URL Field */}
              <ImageUrlField
                value={editingProject.imageUrl || ""}
                onChange={(url) => setEditingProject({ ...editingProject, imageUrl: url })}
                altValue={editingProject.imageAlt || ""}
                onAltChange={(alt) => setEditingProject({ ...editingProject, imageAlt: alt })}
                showAlt
                label="Project Image URL"
                placeholder="https://example.com/project-screenshot.jpg"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-extrabold text-text-muted uppercase tracking-wider block mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={editingProject.displayOrder || 1}
                    onChange={(e) => setEditingProject({ ...editingProject, displayOrder: Number(e.target.value) })}
                    className="w-full bg-surface-base border border-white/10 px-3.5 py-2.5 rounded-xl text-xs text-white outline-none focus:border-accent"
                  />
                </div>

                <div className="flex items-center gap-3 pt-6">
                  <label className="text-xs font-bold text-white flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingProject.published !== false}
                      onChange={(e) => setEditingProject({ ...editingProject, published: e.target.checked })}
                      className="w-4 h-4 accent-accent rounded cursor-pointer"
                    />
                    Published Status
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  onClick={() => setEditingProject(null)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-xs font-bold text-text-muted hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-accent text-surface-base text-xs font-extrabold hover:bg-accent-hover shadow-glow"
                >
                  {isSaving ? "Saving..." : "Save Project"}
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
              Are you sure you want to delete this portfolio project?
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
