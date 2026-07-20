"use client";

import React, { createContext, useContext, useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  projectInquirySchema,
  consultationRequestSchema,
  type ProjectInquiryFormValues,
  type ConsultationRequestFormValues,
} from "@/lib/validations";
import { X, Loader2, CheckCircle2, ArrowRight } from "lucide-react";

type ModalMode = "project" | "consultation";

interface ModalContextType {
  openModal: (mode?: ModalMode, defaultCategory?: string) => void;
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<ModalMode>("project");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Project Inquiry Form
  const projectForm = useForm<ProjectInquiryFormValues>({
    resolver: zodResolver(projectInquirySchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      companyName: "",
      projectType: "Custom Software",
      budget: "₹50,000",
      message: "",
      honeypot: "",
    },
  });

  // Free Consultation Form
  const consultationForm = useForm<ConsultationRequestFormValues>({
    resolver: zodResolver(consultationRequestSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      companyName: "",
      consultationType: "I Need a Consultation",
      message: "",
      honeypot: "",
    },
  });

  const openModal = (modalMode: ModalMode = "project", defaultCategory?: string) => {
    setMode(modalMode);
    setIsSuccess(false);
    setErrorMessage(null);
    setIsOpen(true);

    if (modalMode === "project") {
      projectForm.reset({
        fullName: "",
        email: "",
        phone: "",
        companyName: "",
        projectType: (defaultCategory as ProjectInquiryFormValues["projectType"]) || "Custom Software",
        budget: "₹50,000",
        message: "",
        honeypot: "",
      });
    } else {
      consultationForm.reset({
        fullName: "",
        email: "",
        phone: "",
        companyName: "",
        consultationType: (defaultCategory as ConsultationRequestFormValues["consultationType"]) || "I Need a Consultation",
        message: "",
        honeypot: "",
      });
    }
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  // Sync dialog state with isOpen React state
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) dialog.showModal();
      document.body.style.overflow = "hidden";
    } else {
      if (dialog.open) dialog.close();
      document.body.style.overflow = "unset";
    }

    const handleClose = () => {
      setIsOpen(false);
      document.body.style.overflow = "unset";
    };

    dialog.addEventListener("close", handleClose);
    return () => {
      dialog.removeEventListener("close", handleClose);
    };
  }, [isOpen]);

  const onProjectSubmit = async (values: ProjectInquiryFormValues) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit project inquiry.");
      }

      setIsSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred. Please try again.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onConsultationSubmit = async (values: ConsultationRequestFormValues) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/consultations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit consultation request.");
      }

      setIsSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred. Please try again.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalContext.Provider value={{ openModal, closeModal }}>
      {children}

      <dialog
        ref={dialogRef}
        className="fixed inset-0 m-auto bg-surface-raised border border-border-dark p-6 sm:p-8 rounded-2xl shadow-glow max-w-lg w-[92vw] text-text-secondary outline-none backdrop:backdrop-blur-md transition-all duration-300 opacity-0 open:opacity-100 max-h-[90vh] overflow-y-auto"
        aria-labelledby="modal-title"
      >
        <div className="relative">
          {/* Close button */}
          <button
            onClick={closeModal}
            className="absolute -right-2 -top-2 p-2 text-text-muted hover:text-text-secondary rounded-full hover:bg-surface-base/60 transition-colors cursor-pointer"
            aria-label="Close modal dialog"
          >
            <X size={20} />
          </button>

          {/* Modal Tab Toggle */}
          {!isSuccess && (
            <div className="flex items-center gap-1 bg-surface-base p-1 rounded-xl border border-white/10 mb-6">
              <button
                type="button"
                onClick={() => setMode("project")}
                className={`flex-1 py-2 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                  mode === "project"
                    ? "bg-accent text-surface-base shadow-sm"
                    : "text-text-muted hover:text-white"
                }`}
              >
                Start Your Project
              </button>
              <button
                type="button"
                onClick={() => setMode("consultation")}
                className={`flex-1 py-2 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                  mode === "consultation"
                    ? "bg-accent text-surface-base shadow-sm"
                    : "text-text-muted hover:text-white"
                }`}
              >
                Free Consultation
              </button>
            </div>
          )}

          {/* Success Screen */}
          {isSuccess ? (
            <div className="py-8 text-center" aria-live="polite">
              <div className="w-16 h-16 bg-accent/20 text-accent rounded-full flex items-center justify-center mx-auto mb-5 shadow-glow">
                <CheckCircle2 size={36} />
              </div>
              <h2 id="modal-title" className="text-2xl font-black mb-3 text-white">
                {mode === "project" ? "Project Inquiry Received!" : "Consultation Request Received!"}
              </h2>
              <p className="text-text-muted text-sm max-w-sm mx-auto leading-relaxed mb-6">
                {mode === "project"
                  ? "Thank you for sharing your project with us! Our team will review your requirements and connect with you shortly."
                  : "Thanks for reaching out! We've received your request and our team will connect with you soon to understand how we can help."}
              </p>
              <button
                onClick={closeModal}
                className="bg-accent text-surface-base font-extrabold px-8 py-3 rounded-xl hover:bg-accent-hover transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          ) : mode === "project" ? (
            /* PROJECT INQUIRY FORM */
            <div>
              <h2 id="modal-title" className="text-xl sm:text-2xl font-black mb-1 text-white">
                Start Your Project
              </h2>
              <p className="text-text-muted text-xs sm:text-sm mb-5 leading-relaxed">
                Tell us about your idea, requirements, and budget to get started.
              </p>

              {errorMessage && (
                <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={projectForm.handleSubmit(onProjectSubmit)} className="space-y-4">
                {/* Honeypot anti-spam field */}
                <input
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  className="hidden"
                  {...projectForm.register("honeypot")}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="p-fullName" className="text-[11px] text-text-muted font-extrabold uppercase tracking-wider mb-1 block">
                      Full Name *
                    </label>
                    <input
                      id="p-fullName"
                      type="text"
                      placeholder="Jane Doe"
                      {...projectForm.register("fullName")}
                      className="w-full bg-surface-base border border-border-dark px-3.5 py-2.5 rounded-lg text-text-secondary outline-none text-sm focus:border-accent"
                    />
                    {projectForm.formState.errors.fullName && (
                      <p className="text-xs text-rose-400 mt-1">{projectForm.formState.errors.fullName.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="p-email" className="text-[11px] text-text-muted font-extrabold uppercase tracking-wider mb-1 block">
                      Email Address *
                    </label>
                    <input
                      id="p-email"
                      type="email"
                      suppressHydrationWarning
                      placeholder="jane@company.com"
                      {...projectForm.register("email")}
                      className="w-full bg-surface-base border border-border-dark px-3.5 py-2.5 rounded-lg text-text-secondary outline-none text-sm focus:border-accent"
                    />
                    {projectForm.formState.errors.email && (
                      <p className="text-xs text-rose-400 mt-1">{projectForm.formState.errors.email.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="p-phone" className="text-[11px] text-text-muted font-extrabold uppercase tracking-wider mb-1 block">
                      Phone / WhatsApp *
                    </label>
                    <input
                      id="p-phone"
                      type="tel"
                      placeholder="+91 98765 43210"
                      {...projectForm.register("phone")}
                      className="w-full bg-surface-base border border-border-dark px-3.5 py-2.5 rounded-lg text-text-secondary outline-none text-sm focus:border-accent"
                    />
                    {projectForm.formState.errors.phone && (
                      <p className="text-xs text-rose-400 mt-1">{projectForm.formState.errors.phone.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="p-company" className="text-[11px] text-text-muted font-extrabold uppercase tracking-wider mb-1 block">
                      Company / Business
                    </label>
                    <input
                      id="p-company"
                      type="text"
                      placeholder="Acme Corp"
                      {...projectForm.register("companyName")}
                      className="w-full bg-surface-base border border-border-dark px-3.5 py-2.5 rounded-lg text-text-secondary outline-none text-sm focus:border-accent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="p-type" className="text-[11px] text-text-muted font-extrabold uppercase tracking-wider mb-1 block">
                      Project Type *
                    </label>
                    <select
                      id="p-type"
                      {...projectForm.register("projectType")}
                      className="w-full bg-surface-base border border-border-dark px-3 py-2.5 rounded-lg text-text-secondary outline-none text-xs sm:text-sm focus:border-accent cursor-pointer"
                    >
                      <option value="Website">Website</option>
                      <option value="Web Application">Web Application</option>
                      <option value="SaaS Product">SaaS Product</option>
                      <option value="Mobile App">Mobile App</option>
                      <option value="AI & Automation">AI & Automation</option>
                      <option value="Digital Marketing">Digital Marketing</option>
                      <option value="Graphic Design & Branding">Graphic Design & Branding</option>
                      <option value="Custom Software">Custom Software</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="p-budget" className="text-[11px] text-text-muted font-extrabold uppercase tracking-wider mb-1 block">
                      Estimated Budget *
                    </label>
                    <input
                      id="p-budget"
                      type="text"
                      placeholder="e.g. ₹50,000"
                      {...projectForm.register("budget")}
                      className="w-full bg-surface-base border border-border-dark px-3.5 py-2.5 rounded-lg text-text-secondary outline-none text-sm focus:border-accent"
                    />
                    {projectForm.formState.errors.budget && (
                      <p className="text-xs text-rose-400 mt-1">{projectForm.formState.errors.budget.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="p-message" className="text-[11px] text-text-muted font-extrabold uppercase tracking-wider mb-1 block">
                    Project Requirements *
                  </label>
                  <textarea
                    id="p-message"
                    rows={3}
                    placeholder="Tell us about your idea, requirements, key features, or what you're looking to build..."
                    {...projectForm.register("message")}
                    className="w-full bg-surface-base border border-border-dark px-3.5 py-2.5 rounded-lg text-text-secondary outline-none text-sm resize-none focus:border-accent"
                  />
                  {projectForm.formState.errors.message && (
                    <p className="text-xs text-rose-400 mt-1">{projectForm.formState.errors.message.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-accent text-surface-base font-extrabold py-3.5 rounded-xl hover:bg-accent-hover transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-glow disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Submitting Project Details...
                    </>
                  ) : (
                    <>
                      <span>Submit Project Request</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            /* FREE CONSULTATION FORM */
            <div>
              <h2 id="modal-title" className="text-xl sm:text-2xl font-black mb-1 text-white">
                Get Free Consultation
              </h2>
              <p className="text-text-muted text-xs sm:text-sm mb-5 leading-relaxed">
                Speak with our technical architects to clarify your requirements or technology strategy.
              </p>

              {errorMessage && (
                <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={consultationForm.handleSubmit(onConsultationSubmit)} className="space-y-4">
                <input
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  className="hidden"
                  {...consultationForm.register("honeypot")}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="c-fullName" className="text-[11px] text-text-muted font-extrabold uppercase tracking-wider mb-1 block">
                      Full Name *
                    </label>
                    <input
                      id="c-fullName"
                      type="text"
                      placeholder="Jane Doe"
                      {...consultationForm.register("fullName")}
                      className="w-full bg-surface-base border border-border-dark px-3.5 py-2.5 rounded-lg text-text-secondary outline-none text-sm focus:border-accent"
                    />
                    {consultationForm.formState.errors.fullName && (
                      <p className="text-xs text-rose-400 mt-1">{consultationForm.formState.errors.fullName.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="c-email" className="text-[11px] text-text-muted font-extrabold uppercase tracking-wider mb-1 block">
                      Email Address *
                    </label>
                    <input
                      id="c-email"
                      type="email"
                      suppressHydrationWarning
                      placeholder="jane@company.com"
                      {...consultationForm.register("email")}
                      className="w-full bg-surface-base border border-border-dark px-3.5 py-2.5 rounded-lg text-text-secondary outline-none text-sm focus:border-accent"
                    />
                    {consultationForm.formState.errors.email && (
                      <p className="text-xs text-rose-400 mt-1">{consultationForm.formState.errors.email.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="c-phone" className="text-[11px] text-text-muted font-extrabold uppercase tracking-wider mb-1 block">
                      Phone / WhatsApp (Optional)
                    </label>
                    <input
                      id="c-phone"
                      type="tel"
                      placeholder="+91 98765 43210"
                      {...consultationForm.register("phone")}
                      className="w-full bg-surface-base border border-border-dark px-3.5 py-2.5 rounded-lg text-text-secondary outline-none text-sm focus:border-accent"
                    />
                  </div>

                  <div>
                    <label htmlFor="c-company" className="text-[11px] text-text-muted font-extrabold uppercase tracking-wider mb-1 block">
                      Company (Optional)
                    </label>
                    <input
                      id="c-company"
                      type="text"
                      placeholder="Acme Corp"
                      {...consultationForm.register("companyName")}
                      className="w-full bg-surface-base border border-border-dark px-3.5 py-2.5 rounded-lg text-text-secondary outline-none text-sm focus:border-accent"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="c-type" className="text-[11px] text-text-muted font-extrabold uppercase tracking-wider mb-1 block">
                    How Can We Help You? *
                  </label>
                  <select
                    id="c-type"
                    {...consultationForm.register("consultationType")}
                    className="w-full bg-surface-base border border-border-dark px-3 py-2.5 rounded-lg text-text-secondary outline-none text-sm focus:border-accent cursor-pointer"
                  >
                    <option value="I Need a Consultation">I Need a Consultation</option>
                    <option value="I Have a Business Idea">I Have a Business Idea</option>
                    <option value="I Need Technology Guidance">I Need Technology Guidance</option>
                    <option value="I Have a General Query">I Have a General Query</option>
                    <option value="Partnership / Collaboration">Partnership / Collaboration</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="c-message" className="text-[11px] text-text-muted font-extrabold uppercase tracking-wider mb-1 block">
                    Your Message / Query *
                  </label>
                  <textarea
                    id="c-message"
                    rows={3}
                    placeholder="Tell us about your idea, challenge, or question. How can we help you?"
                    {...consultationForm.register("message")}
                    className="w-full bg-surface-base border border-border-dark px-3.5 py-2.5 rounded-lg text-text-secondary outline-none text-sm resize-none focus:border-accent"
                  />
                  {consultationForm.formState.errors.message && (
                    <p className="text-xs text-rose-400 mt-1">{consultationForm.formState.errors.message.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-accent text-surface-base font-extrabold py-3.5 rounded-xl hover:bg-accent-hover transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-glow disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Sending Request...
                    </>
                  ) : (
                    <>
                      <span>Request Free Consultation</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </dialog>
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
}
