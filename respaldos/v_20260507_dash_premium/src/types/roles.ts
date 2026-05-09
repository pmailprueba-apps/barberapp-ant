export type Role = "superadmin" | "admin" | "barbero" | "cliente" | "usuario";

export const ROLES: Record<Role, string> = {
  superadmin: "Super Admin",
  admin: "Admin",
  barbero: "Barbero",
  cliente: "Cliente",
  usuario: "Usuario",
};

export const ROLE_COLORS: Record<Role, string> = {
  superadmin: "purple",
  admin: "gold",
  barbero: "blue",
  cliente: "teal",
  usuario: "green",
};

export interface UserCustomClaims {
  role: Role;
  barberia_id?: string;
  barbero_id?: string;
}

export function hasRole(userClaims: UserCustomClaims | null, ...roles: Role[]): boolean {
  if (!userClaims) return false;
  return roles.includes(userClaims.role);
}
