"use client";

import { useState } from "react";
import { X, Send, Mail, Loader2, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";

interface EmailReplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientEmail: string;
  customerName: string;
  leadId?: string;
  leadType?: "projectInquiry" | "consultation" | "generalQuery";
  defaultSubject?: string;
  onSuccess?: () => void;
}

export default function EmailReplyModal({
  isOpen,
  onClose,
  recipientEmail,
  customerName,
  leadId,
  leadType = "projectInquiry",
  defaultSubject,
  onSuccess,
}: EmailReplyModalProps) {
  // Template generators
  const getInitialResponseTemplate = (name: string) =>
    `Hi ${name || "there"},\n\nThank you for contacting AWENUE.\n\nWe've reviewed your request and would be happy to discuss your requirements in more detail.\n\nPlease let us know a convenient time to connect.\n\nBest regards,\nAWENUE Team\nAvenue Global Software Solutions`;

  const getProjectDiscussionTemplate = (name: string) =>
    `Hi ${name || "there"},\n\nThank you for sharing your project requirements with us.\n\nWe've reviewed the information and would like to discuss your project scope, timeline, and next steps.\n\nPlease let us know your availability for a requirements call.\n\nBest regards,\nAWENUE Team\nAvenue Global Software Solutions`;

  const getConsultationFollowUpTemplate = (name: string) =>
    `Hi ${name || "there"},\n\nThank you for your interest in a consultation with AWENUE.\n\nWe'd be happy to understand your requirements and explore how we can help your business grow.\n\nPlease let us know a suitable time to connect.\n\nBest regards,\nAWENUE Team\nAvenue Global Software Solutions`;

  const getInitialSubject = () =>
    defaultSubject ||
    (leadType === "projectInquiry"
      ? `Regarding Your Project Inquiry — AWENUE`
      : leadType === "consultation"
      ? `Free Consultation Follow-Up — AWENUE`
      : `Response to Your Query — AWENUE`);

  const getInitialMsg = () =>
    leadType === "projectInquiry"
      ? getProjectDiscussionTemplate(customerName)
      : leadType === "consultation"
      ? getConsultationFollowUpTemplate(customerName)
      : getInitialResponseTemplate(customerName);

  const [subject, setSubject] = useState(getInitialSubject);
  const [message, setMessage] = useState(getInitialMsg);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [prevOpen, setPrevOpen] = useState(isOpen);
  if (isOpen !== prevOpen) {
    setPrevOpen(isOpen);
    if (isOpen) {
      setSubject(getInitialSubject());
      setMessage(getInitialMsg());
      setFeedback(null);
    }
  }

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      setFeedback({ type: "error", text: "Please enter both subject and message text." });
      return;
    }

    setSending(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/admin/reply-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId,
          leadType,
          recipientEmail,
          customerName,
          subject: subject.trim(),
          message: message.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Email delivery failed.");
      }

      setFeedback({ type: "success", text: `Email sent successfully to ${recipientEmail}` });
      if (onSuccess) onSuccess();

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: unknown) {
      const errText = err instanceof Error ? err.message : "Failed to send email reply.";
      setFeedback({ type: "error", text: errText });
    } finally {
      setSending(false);
    }
  };

  const applyTemplate = (type: "initial" | "project" | "consultation") => {
    if (type === "initial") setMessage(getInitialResponseTemplate(customerName));
    if (type === "project") setMessage(getProjectDiscussionTemplate(customerName));
    if (type === "consultation") setMessage(getConsultationFollowUpTemplate(customerName));
  };

  return (
    <div className="fixed inset-0 z-50 bg-surface-base/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-surface-raised border border-border-dark p-6 sm:p-8 rounded-3xl max-w-2xl w-full space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-2 text-text-muted hover:text-white rounded-full hover:bg-surface-base"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/15 text-accent flex items-center justify-center">
            <Mail size={20} />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">Reply to Customer via Email</h2>
            <p className="text-text-muted text-xs">
              Send a direct response to <strong className="text-white">{customerName}</strong>
            </p>
          </div>
        </div>

        {feedback && (
          <div
            className={`p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
              feedback.type === "success"
                ? "bg-accent/15 text-accent border border-accent/30"
                : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
            }`}
          >
            {feedback.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Templates Quick Selector */}
        <div className="space-y-2">
          <label className="text-[11px] font-extrabold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles size={13} className="text-accent" /> Email Templates
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => applyTemplate("initial")}
              className="px-3 py-1.5 rounded-xl bg-surface-base border border-white/10 hover:border-accent/40 text-[11px] font-bold text-text-muted hover:text-white transition-colors cursor-pointer"
            >
              Initial Response
            </button>
            <button
              type="button"
              onClick={() => applyTemplate("project")}
              className="px-3 py-1.5 rounded-xl bg-surface-base border border-white/10 hover:border-accent/40 text-[11px] font-bold text-text-muted hover:text-white transition-colors cursor-pointer"
            >
              Project Discussion
            </button>
            <button
              type="button"
              onClick={() => applyTemplate("consultation")}
              className="px-3 py-1.5 rounded-xl bg-surface-base border border-white/10 hover:border-accent/40 text-[11px] font-bold text-text-muted hover:text-white transition-colors cursor-pointer"
            >
              Consultation Follow-Up
            </button>
          </div>
        </div>

        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label className="text-[11px] font-extrabold text-text-muted uppercase tracking-wider block mb-1">
              To (Recipient Email)
            </label>
            <input
              type="text"
              readOnly
              value={recipientEmail}
              className="w-full bg-surface-base/60 border border-border-dark px-3.5 py-2.5 rounded-xl text-xs text-accent font-bold cursor-not-allowed"
            />
          </div>

          <div>
            <label className="text-[11px] font-extrabold text-text-muted uppercase tracking-wider block mb-1">
              Subject Line
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Re: Your AWENUE Project Inquiry"
              className="w-full bg-surface-base border border-white/10 px-3.5 py-2.5 rounded-xl text-xs text-white outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="text-[11px] font-extrabold text-text-muted uppercase tracking-wider block mb-1">
              Email Message
            </label>
            <textarea
              required
              rows={8}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your response to the customer..."
              className="w-full bg-surface-base border border-white/10 p-3.5 rounded-xl text-xs text-white outline-none focus:border-accent resize-none leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-white/10 text-xs font-bold text-text-muted hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending}
              className="px-6 py-2.5 rounded-xl bg-accent text-surface-base text-xs font-extrabold hover:bg-accent-hover shadow-glow flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {sending ? (
                <>
                  <Loader2 className="animate-spin" size={15} /> Sending Email...
                </>
              ) : (
                <>
                  <Send size={15} /> Send Email
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
