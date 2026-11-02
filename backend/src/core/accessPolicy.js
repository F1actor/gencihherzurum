const SYSTEM_ADMIN_ROLES = new Set([
  'SUPER_ADMIN',
  'IL_BASKANI',
  'IL_TESKILAT_BASKANI'
]);

function hasSystemAdminAccess(role) {
  return SYSTEM_ADMIN_ROLES.has(role);
}

module.exports = { hasSystemAdminAccess };
