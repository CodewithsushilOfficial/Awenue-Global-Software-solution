"use client";

import { useEffect, useState, useCallback } from "react";
import ImageUrlField from "@/components/admin/ImageUrlField";
import {
  collection,
  query,
  orderBy,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Loader2,
  CheckCircle2,
  Eye,
  EyeOff,
} from "lucide-react";

interface ProcessStep {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  deliverable: string;
  displayOrder: number;
  published: boolean;
  imageUrl?: string;
}

const DEFAULT_PROCESS_STEPS: Omit<ProcessStep, "id">[] = [
  {
    stepNumber: 1,
    title: "Discover",
    description: "We understand your goals, target audience, and business requirements.",
    deliverable: "Scope & Requirement Document",
    displayOrder: 1,
    published: true,
  },
  {
    stepNumber: 2,
    title: "Research",
    description: "In-depth competitor analysis, market positioning, and tech stack selection.",
    deliverable: "Technical Architecture Brief",
    displayOrder: 2,
    published: true,
  },
  {
    stepNumber: 3,
    title: "Strategy",
    description: "Defining product roadmap, user flows, and project milestones.",
    deliverable: "Project Milestone Roadmap",
    displayOrder: 3,
    published: true,
  },
  {
    stepNumber: 4,
    title: "UI/UX Design",
    description: "Crafting modern, responsive, high-converting wireframes and interactive prototypes.",
    deliverable: "Figma UI/UX Mockups",
    displayOrder: 4,
    published: true,
  },
  {
    stepNumber: 5,
    title: "Development",
    description: "Writing clean, scalable Next.js and backend code with performance engineering.",
    deliverable: "Staging Code Build",
    displayOrder: 5,
    published: true,
  },
  {
    stepNumber: 6,
    title: "QA & Testing",
    description: "End-to-end functionality, security, responsiveness, and speed optimization.",
    deliverable: "QA Test Report",
    displayOrder: 6,
    published: true,
  },
  {
    stepNumber: 7,
    title: "Deployment",
    description: "Seamless cloud launch with SSL, CDN, SEO schema, and uptime monitoring.",
    deliverable: "Production Deployment",
    displayOrder: 7,
    published: true,
  },
  {
    stepNumber: 8,
    title: "Support & Growth",
    description: "Ongoing updates, analytics review, scaling, and feature enhancements.",
    deliverable: "Maintenance & SLA Support",
    displayOrder: 8,
    published: true,
  },
];

export default function AdminProcessPage() {
  const [steps, setSteps] = useState<ProcessStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingStep, setEditingStep] = useState<ProcessStep | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [formState, setFormState] = useState<Omit<ProcessStep, "id">>({
    stepNumber: 1,
    title: "",
    description: "",
    deliverable: "",
    displayOrder: 1,
    published: true,
    imageUrl: "",
  });

  const fetchSteps = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "processSteps"), orderBy("displayOrder", "asc"));
      const snap = await getDocs(q);

      if (snap.empty) {
        // Seed default 8 process steps if collection is empty
        const seeded: ProcessStep[] = DEFAULT_PROCESS_STEPS.map((step, idx) => ({
          ...step,
          id: `step-${idx + 1}`,
        }));
        setSteps(seeded);
      } else {
        const list: ProcessStep[] = [];
        snap.forEach((docSnap) => {
          list.push({ ...docSnap.data(), id: docSnap.id } as ProcessStep);
        });
        setSteps(list);
      }
    } catch (err) {
      console.warn("Using default process steps fallback:", err);
      setSteps(
        DEFAULT_PROCESS_STEPS.map((s, idx) => ({ ...s, id: `step-${idx + 1}` }))
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) fetchSteps();
    });
    return () => {
      active = false;
    };
  }, [fetchSteps]);

  const openCreateModal = () => {
    setEditingStep(null);
    setFormState({
      stepNumber: steps.length + 1,
      title: "",
      description: "",
      deliverable: "",
      displayOrder: steps.length + 1,
      published: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (step: ProcessStep) => {
    setEditingStep(step);
    setFormState({
      stepNumber: step.stepNumber,
      title: step.title,
      description: step.description,
      deliverable: step.deliverable,
      displayOrder: step.displayOrder,
      published: step.published,
      imageUrl: step.imageUrl || "",
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const stepId = editingStep ? editingStep.id : `step-${Date.now()}`;
      const dataToSave = {
        ...formState,
        updatedAt: new Date().toISOString(),
      };

      // 1. Post to server-side Firebase Admin CMS route first
      const res = await fetch("/api/admin/cms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "set",
          collectionName: "processSteps",
          docId: stepId,
          data: dataToSave,
        }),
      });

      if (!res.ok) {
        const docRef = doc(db, "processSteps", stepId);
        await setDoc(docRef, dataToSave, { merge: true });
      }

      setSteps((prev) => {
        const exists = prev.some((s) => s.id === stepId);
        if (exists) {
          return prev.map((s) => (s.id === stepId ? { ...s, ...dataToSave } : s));
        }
        return [...prev, { id: stepId, ...dataToSave }].sort(
          (a, b) => a.displayOrder - b.displayOrder
        );
      });

      setIsModalOpen(false);
      setFeedback("Process step saved successfully!");
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      console.error("Error saving process step:", err);
      try {
        const stepId = editingStep ? editingStep.id : `step-${Date.now()}`;
        const docRef = doc(db, "processSteps", stepId);
        await setDoc(docRef, { ...formState, updatedAt: new Date().toISOString() }, { merge: true });
        setIsModalOpen(false);
        setFeedback("Process step saved!");
        setTimeout(() => setFeedback(null), 3000);
      } catch (fallbackErr) {
        console.error("Fallback save failed:", fallbackErr);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch("/api/admin/cms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          collectionName: "processSteps",
          docId: id,
        }),
      });
      setSteps((prev) => prev.filter((s) => s.id !== id));
      setFeedback("Process step removed.");
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      console.error("Error deleting process step:", err);
      try {
        await deleteDoc(doc(db, "processSteps", id));
        setSteps((prev) => prev.filter((s) => s.id !== id));
      } catch (fErr) {
        console.error("Fallback delete failed:", fErr);
      }
    }
  };

  const togglePublish = async (step: ProcessStep) => {
    try {
      await fetch("/api/admin/cms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          collectionName: "processSteps",
          docId: step.id,
          data: { published: !step.published },
        }),
      });
      setSteps((prev) =>
        prev.map((s) => (s.id === step.id ? { ...s, published: !s.published } : s))
      );
    } catch (err) {
      console.error("Error toggling publish:", err);
      try {
        const docRef = doc(db, "processSteps", step.id);
        await setDoc(docRef, { published: !step.published }, { merge: true });
        setSteps((prev) =>
          prev.map((s) => (s.id === step.id ? { ...s, published: !s.published } : s))
        );
      } catch (fErr) {
        console.error("Fallback publish toggle failed:", fErr);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mb-1">
            Our Process CMS Management
          </h1>
          <p className="text-text-muted text-xs sm:text-sm">
            Manage the 8 development process steps displayed on the AWENUE website.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="bg-accent text-surface-base font-extrabold px-5 py-2.5 rounded-xl hover:bg-accent-hover transition-colors shadow-glow flex items-center gap-2 text-xs self-start sm:self-auto cursor-pointer"
        >
          <Plus size={16} /> Add Process Step
        </button>
      </div>

      {feedback && (
        <div className="p-3.5 bg-accent/15 border border-accent/30 rounded-xl text-accent text-xs font-bold flex items-center gap-2">
          <CheckCircle2 size={16} /> {feedback}
        </div>
      )}

      {/* Grid of Steps */}
      {loading ? (
        <div className="py-16 text-center text-text-muted text-xs flex items-center justify-center gap-2">
          <Loader2 className="animate-spin" size={18} /> Loading process steps...
        </div>
      ) : steps.length === 0 ? (
        <div className="py-16 text-center text-text-muted text-xs">
          No process steps configured. Click &apos;Add Process Step&apos; above.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`bg-surface-raised border p-5 rounded-2xl flex flex-col justify-between space-y-4 shadow-xl transition-all ${
                step.published ? "border-border-dark" : "border-border-dark opacity-60 bg-surface-raised/40"
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="w-8 h-8 rounded-xl bg-accent/15 text-accent font-black text-xs flex items-center justify-center">
                    0{step.stepNumber}
                  </span>
                  <button
                    onClick={() => togglePublish(step)}
                    className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer ${
                      step.published ? "text-accent bg-accent/10" : "text-text-muted bg-surface-base"
                    }`}
                  >
                    {step.published ? <Eye size={14} /> : <EyeOff size={14} />}
                    <span className="text-[10px] uppercase">{step.published ? "Live" : "Draft"}</span>
                  </button>
                </div>

                <h3 className="text-base font-extrabold text-white">{step.title}</h3>
                <p className="text-xs text-text-muted leading-relaxed line-clamp-3">
                  {step.description}
                </p>

                {step.deliverable && (
                  <div className="pt-2 border-t border-white/5">
                    <span className="text-[10px] uppercase font-extrabold text-accent block">
                      Deliverable:
                    </span>
                    <span className="text-xs font-semibold text-white/90">{step.deliverable}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs">
                <span className="text-[10px] text-text-muted font-mono">Order: #{step.displayOrder}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(step)}
                    className="p-1.5 text-accent hover:bg-accent/10 rounded-lg transition-colors cursor-pointer"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(step.id)}
                    className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-surface-base/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-surface-raised border border-border-dark p-6 sm:p-8 rounded-3xl max-w-lg w-full space-y-6 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-5 top-5 p-2 text-text-muted hover:text-white rounded-full hover:bg-surface-base"
            >
              <X size={20} />
            </button>

            <div>
              <h2 className="text-xl font-black text-white">
                {editingStep ? "Edit Process Step" : "Add Process Step"}
              </h2>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-extrabold text-text-muted uppercase tracking-wider block mb-1">
                    Step Number
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={20}
                    value={formState.stepNumber}
                    onChange={(e) =>
                      setFormState({ ...formState, stepNumber: Number(e.target.value) })
                    }
                    className="w-full bg-surface-base border border-white/10 px-3.5 py-2.5 rounded-xl text-white outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-extrabold text-text-muted uppercase tracking-wider block mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formState.displayOrder}
                    onChange={(e) =>
                      setFormState({ ...formState, displayOrder: Number(e.target.value) })
                    }
                    className="w-full bg-surface-base border border-white/10 px-3.5 py-2.5 rounded-xl text-white outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-extrabold text-text-muted uppercase tracking-wider block mb-1">
                  Step Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Discovery & Strategy"
                  value={formState.title}
                  onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                  className="w-full bg-surface-base border border-white/10 px-3.5 py-2.5 rounded-xl text-white outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="text-[11px] font-extrabold text-text-muted uppercase tracking-wider block mb-1">
                  Description
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe what happens during this step..."
                  value={formState.description}
                  onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                  className="w-full bg-surface-base border border-white/10 p-3 rounded-xl text-white outline-none focus:border-accent resize-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-extrabold text-text-muted uppercase tracking-wider block mb-1">
                  Key Deliverable
                </label>
                <input
                  type="text"
                  placeholder="e.g. Product Architecture Brief"
                  value={formState.deliverable}
                  onChange={(e) => setFormState({ ...formState, deliverable: e.target.value })}
                  className="w-full bg-surface-base border border-white/10 px-3.5 py-2.5 rounded-xl text-white outline-none focus:border-accent"
                />
              </div>

              {/* Step Image URL */}
              <ImageUrlField
                value={formState.imageUrl || ""}
                onChange={(url) => setFormState({ ...formState, imageUrl: url })}
                label="Step Illustration / Image URL (Optional)"
                placeholder="https://example.com/step-illustration.jpg"
              />

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="publishedStep"
                  checked={formState.published}
                  onChange={(e) => setFormState({ ...formState, published: e.target.checked })}
                  className="w-4 h-4 accent-accent rounded cursor-pointer"
                />
                <label htmlFor="publishedStep" className="text-xs font-bold text-white cursor-pointer">
                  Publish to website immediately
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-white/10 font-bold text-text-muted hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-accent text-surface-base font-extrabold hover:bg-accent-hover shadow-glow cursor-pointer disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Step"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
