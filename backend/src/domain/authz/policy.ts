/**
 * Identifies a permission using a resource:action format.
 *
 * Examples: "users:read", "users:update".
 */
export type Permission = `${string}:${string}`;

/** Represents a specific permission or a wildcard grant. */
export type Grant = Permission | '*';

/** Identifies the user and roles used for authorization decisions. */
export interface Principal {
  readonly userId: string;
  readonly roles: readonly string[];
}

/** Maps each role to the permissions it is granted. */
export type RolePermissions = Readonly<Record<string, readonly Grant[]>>;

/**
 * Default permissions assigned to application roles.
 *
 * Users can read and update their own data, support staff can read
 * user data, and administrators receive all permissions.
 */
export const DEFAULT_ROLE_PERMISSIONS: RolePermissions = {
  user: ['users:read:self', 'users:update:self'],
  support: ['users:read'],
  admin: ['*'],
};

/**
 * Determines whether a principal has the requested permission
 * through any of their assigned roles.
 *
 * A role grants access when its permissions contain the requested
 * permission or the wildcard grant.
 */
export function can(
  principal: Principal,
  permission: Permission,
  rolePermissions: RolePermissions,
): boolean {
  return principal.roles.some((role) => {
    const grants = rolePermissions[role];
    return grants !== undefined && (grants.includes('*') || grants.includes(permission));
  });
}