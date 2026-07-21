const VALID_ROLES = new Set(['admin', 'employee', 'customer']);

export function isValidRole(role) {
  return VALID_ROLES.has(role);
}
