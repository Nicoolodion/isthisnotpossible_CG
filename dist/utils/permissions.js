"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkPermissions = checkPermissions;
function checkPermissions(userRoles, requiredRole) {
    return userRoles.cache.has(requiredRole);
}
