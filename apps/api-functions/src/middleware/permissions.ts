/**
 * @file permissions middleware
 * @description Middleware helpers to enforce permission checks.
 */
import { Context } from "@azure/functions";
import { unauthorized } from "../utils/response";
import { ServiceContainer } from "../infrastructure/container/ServiceContainer";
import { IAuthorizationService } from "../domain/interfaces/IAuthorizationService";
import { Permission } from "../domain/enums/Permission";
import { getCallerAdId } from "../utils/authHelpers";

/**
 * @description Requires a specific permission.
 * @param permission Permission to enforce.
 */
export function requirePermission(permission: Permission) {
  return async (ctx: Context): Promise<void> => {
    const callerId = getCallerAdId(ctx.bindings.user);
    if (!callerId) {
      throw unauthorized(ctx, "Cannot determine caller identity");
    }

    const serviceContainer = ServiceContainer.getInstance();
    serviceContainer.initialize();
    const authz = serviceContainer.resolve<IAuthorizationService>("AuthorizationService");
    await authz.authorizePermission(callerId, permission);
  };
}

/**
 * @description Requires at least one permission from the provided list.
 * @param permissions Permissions to enforce.
 */
export function requireAnyPermission(permissions: Permission[]) {
  return async (ctx: Context): Promise<void> => {
    const callerId = getCallerAdId(ctx.bindings.user);
    if (!callerId) {
      throw unauthorized(ctx, "Cannot determine caller identity");
    }

    const serviceContainer = ServiceContainer.getInstance();
    serviceContainer.initialize();
    const authz = serviceContainer.resolve<IAuthorizationService>("AuthorizationService");
    await authz.authorizeAnyPermission(callerId, permissions);
  };
}

