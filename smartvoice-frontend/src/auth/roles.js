// src/auth/roles.js

export const ROLES = {
  CUSTOMER: "CUSTOMER",
  STAFF: "STAFF",
  MANAGER: "MANAGER",
  ADMIN: "ADMIN",
};

export function isCustomer(role) {
  return String(role || "").toUpperCase() === ROLES.CUSTOMER;
}

export function isAdmin(role) {
  return String(role || "").toUpperCase() === ROLES.ADMIN;
}

export function canViewAllFeedback(role) {
  return ["STAFF", "MANAGER", "ADMIN"].includes(String(role || "").toUpperCase());
}

export function canViewReports(role) {
  return ["MANAGER", "ADMIN"].includes(String(role || "").toUpperCase());
}
