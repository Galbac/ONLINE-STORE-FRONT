import type { AdminMeResponse, AdminRoleResponse } from "@/entities/admin-auth";
import type { AdminNavigationItem } from "../config/navigation";

export const getEffectiveAdminPermissions = (
  currentUser: AdminMeResponse,
  roles: AdminRoleResponse[],
): string[] => {
  const rolePermissions =
    roles.find((role) => role.code === currentUser.role)?.permissions ?? [];

  return Array.from(new Set([...currentUser.permissions, ...rolePermissions]));
};

export const canAccessAdminItem = (
  item: AdminNavigationItem,
  currentUser: AdminMeResponse,
  permissions: string[],
): boolean => {
  if (currentUser.role === "admin") {
    return true;
  }

  if (permissions.includes("*")) {
    return true;
  }

  return item.requiredPermissions.some((permission) => permissions.includes(permission));
};

export const getAdminRoleLabel = (
  currentUser: AdminMeResponse,
  roles: AdminRoleResponse[],
): string => {
  return roles.find((role) => role.code === currentUser.role)?.name ?? currentUser.role;
};
