export const normalizeRole = (role) =>
  (role || "")
    .toString()
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const normalizeIdentifier = (value) =>
  (value || "")
    .toString()
    .trim()
    .toLowerCase();

const RESTRICTED_ADMIN_VIEW_EMAILS = new Set([
  "admin.amd@sistemamedico.local",
]);

const RESTRICTED_ADMIN_VIEW_USERNAMES = new Set([
  "admin_amdi",
]);

export const isAdminRole = (role) => {
  const normalized = normalizeRole(role);
  return normalized === "ADMIN" || normalized === "SUPER_ADMIN";
};

export const isFinanceRole = (role) => normalizeRole(role) === "FINANZAS";

export const isReceptionRole = (role) => normalizeRole(role) === "RECEPCION";

export const isReadOnlyRole = (role) => normalizeRole(role) === "RECEPCION";

export const canViewGlobalData = (role) =>
  isAdminRole(role) || isFinanceRole(role) || isReceptionRole(role);

export const hasRestrictedAdminViews = (user) => {
  const email = normalizeIdentifier(user?.email);
  const username = normalizeIdentifier(user?.username);

  return (
    RESTRICTED_ADMIN_VIEW_EMAILS.has(email) ||
    RESTRICTED_ADMIN_VIEW_USERNAMES.has(username)
  );
};

export const hasFinanceConsoleAccess = (user) =>
  isFinanceRole(user?.role) || hasRestrictedAdminViews(user);

export const canAccessAdminTools = (user) =>
  isAdminRole(user?.role) && !hasRestrictedAdminViews(user);
