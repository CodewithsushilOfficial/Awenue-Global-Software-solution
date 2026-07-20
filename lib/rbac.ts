/**
 * AWENUE Admin RBAC — Role-Based Access Control & Granular Permissions
 * All permission checks MUST happen server-side.
 */

export type AdminRole = "super_admin" | "admin" | "content_admin" | "support_admin";

export type AdminStatus = "pending" | "active" | "suspended" | "revoked";

export type Permission =
  | "dashboard.view"
  | "content.view"
  | "content.edit"
  | "content.publish"
  | "services.view"
  | "services.create"
  | "services.edit"
  | "services.delete"
  | "products.view"
  | "products.create"
  | "products.edit"
  | "products.delete"
  | "portfolio.view"
  | "portfolio.create"
  | "portfolio.edit"
  | "portfolio.delete"
  | "process.view"
  | "process.edit"
  | "inquiries.view"
  | "inquiries.update_status"
  | "inquiries.add_notes"
  | "inquiries.delete"
  | "users.view"
  | "users.manage"
  | "admins.view"
  | "admins.create"
  | "admins.edit_permissions"
  | "admins.suspend"
  | "admins.revoke"
  | "settings.view"
  | "settings.edit"
  // Legacy aliases for backward compatibility
  | "manage_website"
  | "manage_services"
  | "manage_products"
  | "manage_portfolio"
  | "manage_process"
  | "manage_users"
  | "manage_leads"
  | "manage_queries"
  | "send_customer_emails"
  | "manage_admins"
  | "invite_admins"
  | "change_admin_roles"
  | "suspend_admins"
  | "revoke_admins"
  | "manage_settings"
  | "manage_content"
  | "respond_customers"
  | "manage_inquiries"
  | "manage_consultations";

export const ALL_GRANULAR_PERMISSIONS: { id: Permission; label: string; group: string }[] = [
  { id: "dashboard.view", label: "View Admin Dashboard Overview", group: "Dashboard" },
  
  { id: "content.view", label: "View Website Content", group: "Website Content" },
  { id: "content.edit", label: "Edit Website Copy & Sections", group: "Website Content" },
  
  { id: "services.view", label: "View Services List", group: "Services" },
  { id: "services.create", label: "Add New Services", group: "Services" },
  { id: "services.edit", label: "Edit Existing Services", group: "Services" },
  { id: "services.delete", label: "Delete Services", group: "Services" },

  { id: "products.view", label: "View Products List", group: "Products & SaaS" },
  { id: "products.create", label: "Add New Products", group: "Products & SaaS" },
  { id: "products.edit", label: "Edit Products", group: "Products & SaaS" },
  { id: "products.delete", label: "Delete Products", group: "Products & SaaS" },

  { id: "portfolio.view", label: "View Portfolio Projects", group: "Portfolio" },
  { id: "portfolio.create", label: "Add Portfolio Projects", group: "Portfolio" },
  { id: "portfolio.edit", label: "Edit Portfolio Projects", group: "Portfolio" },
  { id: "portfolio.delete", label: "Delete Portfolio Projects", group: "Portfolio" },

  { id: "process.view", label: "View Process Steps", group: "How We Work" },
  { id: "process.edit", label: "Edit Process Workflow", group: "How We Work" },

  { id: "inquiries.view", label: "View Customer Inquiries & Leads", group: "Leads & Inquiries" },
  { id: "inquiries.update_status", label: "Update Lead Status (Pending/In Process/Completed)", group: "Leads & Inquiries" },
  { id: "inquiries.add_notes", label: "Add Internal Admin Notes", group: "Leads & Inquiries" },
  { id: "inquiries.delete", label: "Delete Inquiries", group: "Leads & Inquiries" },

  { id: "users.view", label: "View Registered Client Accounts", group: "User Management" },
  { id: "users.manage", label: "Suspend/Reactivate Client Accounts", group: "User Management" },

  { id: "admins.view", label: "View Admin Team Members", group: "Admin Team" },
  { id: "admins.create", label: "Pre-Authorize New Admins", group: "Admin Team" },
  { id: "admins.edit_permissions", label: "Edit Admin Permissions", group: "Admin Team" },
  { id: "admins.suspend", label: "Suspend/Revoke Admins", group: "Admin Team" },

  { id: "settings.view", label: "View System Settings", group: "Settings" },
  { id: "settings.edit", label: "Modify System Settings", group: "Settings" },
];

export const DEFAULT_ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  super_admin: ALL_GRANULAR_PERMISSIONS.map((p) => p.id).concat([
    "manage_website",
    "manage_services",
    "manage_products",
    "manage_portfolio",
    "manage_process",
    "manage_users",
    "manage_leads",
    "manage_queries",
    "send_customer_emails",
    "manage_admins",
    "invite_admins",
    "change_admin_roles",
    "suspend_admins",
    "revoke_admins",
    "manage_settings",
    "manage_content",
    "respond_customers",
    "manage_inquiries",
    "manage_consultations",
  ]),
  admin: [
    "dashboard.view",
    "content.view",
    "content.edit",
    "services.view",
    "services.create",
    "services.edit",
    "products.view",
    "products.create",
    "products.edit",
    "portfolio.view",
    "portfolio.create",
    "portfolio.edit",
    "process.view",
    "process.edit",
    "inquiries.view",
    "inquiries.update_status",
    "inquiries.add_notes",
    "settings.view",
    "manage_website",
    "manage_services",
    "manage_products",
    "manage_portfolio",
    "manage_process",
    "manage_leads",
    "manage_queries",
    "manage_inquiries",
    "manage_consultations",
    "manage_content",
  ],
  content_admin: [
    "dashboard.view",
    "content.view",
    "content.edit",
    "services.view",
    "services.edit",
    "products.view",
    "products.edit",
    "portfolio.view",
    "portfolio.edit",
    "process.view",
    "process.edit",
    "manage_content",
    "manage_website",
    "manage_services",
    "manage_products",
    "manage_portfolio",
    "manage_process",
  ],
  support_admin: [
    "dashboard.view",
    "inquiries.view",
    "inquiries.update_status",
    "inquiries.add_notes",
    "manage_inquiries",
    "manage_consultations",
    "manage_queries",
    "respond_customers",
    "send_customer_emails",
  ],
};

export const ASSIGNABLE_ROLES: Record<AdminRole, AdminRole[]> = {
  super_admin: ["admin", "content_admin", "support_admin"],
  admin: [],
  content_admin: [],
  support_admin: [],
};

export const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  content_admin: "Content Admin",
  support_admin: "Support Admin",
};

export function hasPermission(
  role: AdminRole,
  permission: Permission,
  customPermissions?: string[]
): boolean {
  if (role === "super_admin") return true;

  if (Array.isArray(customPermissions) && customPermissions.length > 0) {
    if (customPermissions.includes(permission)) return true;

    // Check alias maps
    if (permission.startsWith("services.") && (customPermissions.includes("services.view") || customPermissions.includes("manage_services"))) return true;
    if (permission.startsWith("products.") && (customPermissions.includes("products.view") || customPermissions.includes("manage_products"))) return true;
    if (permission.startsWith("portfolio.") && (customPermissions.includes("portfolio.view") || customPermissions.includes("manage_portfolio"))) return true;
    if (permission.startsWith("process.") && (customPermissions.includes("process.view") || customPermissions.includes("manage_process"))) return true;
    if (permission.startsWith("inquiries.") && (customPermissions.includes("inquiries.view") || customPermissions.includes("manage_inquiries"))) return true;
    if (permission.startsWith("users.") && (customPermissions.includes("users.view") || customPermissions.includes("manage_users"))) return true;
    if (permission.startsWith("admins.") && (customPermissions.includes("admins.view") || customPermissions.includes("manage_admins") || customPermissions.includes("invite_admins"))) return true;
    if (permission.startsWith("settings.") && (customPermissions.includes("settings.view") || customPermissions.includes("manage_settings"))) return true;
    if (permission.startsWith("content.") && (customPermissions.includes("content.view") || customPermissions.includes("manage_content"))) return true;

    if (permission === "invite_admins" && customPermissions.includes("admins.create")) return true;
    if (permission === "manage_admins" && customPermissions.includes("admins.view")) return true;
  }

  const defaultPerms = DEFAULT_ROLE_PERMISSIONS[role];
  if (!defaultPerms) return false;

  if (defaultPerms.includes(permission)) return true;

  // Fallback alias checks for default permissions
  if (permission === "invite_admins" && (defaultPerms.includes("manage_admins") || defaultPerms.includes("admins.create"))) return true;
  if (permission === "manage_admins" && (defaultPerms.includes("admins.view") || defaultPerms.includes("admins.create"))) return true;

  return false;
}

export function isValidRole(role: string): role is AdminRole {
  return Object.keys(ROLE_LABELS).includes(role);
}

export function canAssignRole(inviterRole: AdminRole, targetRole: AdminRole): boolean {
  return ASSIGNABLE_ROLES[inviterRole]?.includes(targetRole) ?? false;
}

export const PROTECTED_ROLES: AdminRole[] = ["super_admin"];
