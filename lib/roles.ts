export function isAdminRole(role: string | null | undefined) {
  return typeof role === "string" && role.toUpperCase() === "ADMIN";
}
