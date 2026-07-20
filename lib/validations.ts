import { z } from "zod";

// Project Inquiry Validation Schema
export const projectInquirySchema = z.object({
  fullName: z.string().min(2, { message: "Full name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  phone: z.string().min(8, { message: "Please enter a valid phone or WhatsApp number." }),
  companyName: z.string().optional(),
  projectType: z.enum([
    "Website",
    "Web Application",
    "SaaS Product",
    "Mobile App",
    "AI & Automation",
    "Digital Marketing",
    "Graphic Design & Branding",
    "Custom Software",
    "Other",
  ]),
  budget: z.string().min(2, { message: "Please enter your estimated budget (e.g. ₹50,000)." }),
  message: z.string().min(10, { message: "Please provide a brief description of your project (min 10 characters)." }),
  honeypot: z.string().optional(),
});

export type ProjectInquiryFormValues = z.infer<typeof projectInquirySchema>;

// Free Consultation Validation Schema
export const consultationRequestSchema = z.object({
  fullName: z.string().min(2, { message: "Full name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  phone: z.string().optional(),
  companyName: z.string().optional(),
  consultationType: z.enum([
    "I Need a Consultation",
    "I Have a Business Idea",
    "I Need Technology Guidance",
    "I Have a General Query",
    "Partnership / Collaboration",
    "Other",
  ]),
  message: z.string().min(10, { message: "Please enter your message or query (min 10 characters)." }),
  honeypot: z.string().optional(),
});

export type ConsultationRequestFormValues = z.infer<typeof consultationRequestSchema>;

// Admin Login Schema
export const adminLoginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid admin email." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

export type AdminLoginFormValues = z.infer<typeof adminLoginSchema>;

// Service Schema for CMS
export const serviceSchema = z.object({
  title: z.string().min(2, "Title is required"),
  slug: z.string().min(2, "Slug is required"),
  shortDescription: z.string().min(10, "Short description is required"),
  detailedDescription: z.string().min(20, "Detailed description is required"),
  iconIdentifier: z.string().default("Globe"),
  features: z.array(z.string()).default([]),
  ctaLabel: z.string().default("Explore Service"),
  ctaLink: z.string().default("#contact"),
  displayOrder: z.number().default(0),
  published: z.boolean().default(true),
});

export type ServiceFormValues = z.infer<typeof serviceSchema>;

// Product Schema for CMS
export const productSchema = z.object({
  name: z.string().min(2, "Product name is required"),
  slug: z.string().min(2, "Slug is required"),
  shortDescription: z.string().min(10, "Short description is required"),
  detailedDescription: z.string().min(20, "Detailed description is required"),
  features: z.array(z.string()).default([]),
  productStatus: z.enum(["live", "coming_soon"]).default("live"),
  externalUrl: z.string().url("Must be a valid URL (e.g. https://crm.awenue.io)").or(z.literal("")).optional(),
  ctaLabel: z.string().default("Explore Product"),
  displayOrder: z.number().default(0),
  published: z.boolean().default(true),
});

export type ProductFormValues = z.infer<typeof productSchema>;

// Portfolio Schema for CMS
export const portfolioSchema = z.object({
  name: z.string().min(2, "Project name is required"),
  slug: z.string().min(2, "Slug is required"),
  category: z.string().min(2, "Category is required"),
  shortDescription: z.string().min(10, "Short description is required"),
  techTags: z.array(z.string()).default([]),
  projectUrl: z.string().url().or(z.literal("")).optional(),
  projectType: z.enum(["AWENUE Product", "Personal Project", "Client Project"]).default("Client Project"),
  imageUrl: z.string().optional(),
  displayOrder: z.number().default(0),
  published: z.boolean().default(true),
});

export type PortfolioFormValues = z.infer<typeof portfolioSchema>;

// Legacy compatibility newsletter schema
export const newsletterSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
});

export type NewsletterFormValues = z.infer<typeof newsletterSchema>;
