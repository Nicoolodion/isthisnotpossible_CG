export function checkPermissions(userRoles: any, requiredRole: string): boolean {
    return userRoles.cache.has(requiredRole);
}
