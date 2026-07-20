/**
 * AWENUE Admin RBAC — Role-Based Access Control
 * All permission checks MUST happen server-side only.
 * Never trust frontend role values.
 */

export type AdminRole = "super_admin" | "admin" | "content_admin" | "support_admin";

export type AdminStatus = "pending" | "active" | "suspended" | "revoked";

export type Permission =
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

export const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  super_admin: [
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
  ],
  admin: [
    "manage_website",
    "manage_services",
    "manage_products",
    "manage_leads",
    "manage_queries",
    "respond_customers",
    "manage_inquiries",
    "manage_consultations",
    "manage_content",
    "manage_portfolio",
    "manage_process",
  ],
  content_admin: [
    "manage_content",
    "manage_website",
    "manage_services",
    "manage_products",
    "manage_portfolio",
    "manage_process",
  ],
  support_admin: [
    "manage_inquiries",
    "manage_consultations",
    "manage_queries",
    "respond_customers",
    "send_customer_emails",
  ],
};

/** Roles that an inviter is allowed to assign, per their own role */
export const ASSIGNABLE_ROLES: Record<AdminRole, AdminRole[]> = {
  super_admin: ["admin", "content_admin", "support_admin"],
  admin: [],
  content_admin: [],
  support_admin: [],
};

/** Human-readable role labels */
export const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  content_admin: "Content Admin",
  support_admin: "Support Admin",
};

/** Check if a role has a specific permission */
export function hasPermission(role: AdminRole, permission: Permission): boolean {
  const perms = ROLE_PERMISSIONS[role];
  if (!perms) return false;
  return perms.includes(permission);
}

/** Check if a role is a valid AdminRole */
export function isValidRole(role: string): role is AdminRole {
  return Object.keys(ROLE_PERMISSIONS).includes(role);
}

/** Check if inviter can assign the target role */
export function canAssignRole(inviterRole: AdminRole, targetRole: AdminRole): boolean {
  return ASSIGNABLE_ROLES[inviterRole]?.includes(targetRole) ?? false;
}

/** Roles that are protected from suspension/revocation by non-super-admins */
export const PROTECTED_ROLES: AdminRole[] = ["super_admin"];
