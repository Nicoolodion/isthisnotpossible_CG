"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkPermissions = void 0;
function checkPermissions(userRoles, requiredRole) {
    return userRoles.cache.has(requiredRole);
}
exports.checkPermissions = checkPermissions;
