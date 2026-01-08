/**
 * @fileoverview ErrorContextExtractor - Extracts error context from Azure Functions context
 * @summary Utility for extracting contextual information for error logging
 * @description Extracts endpoint, function name, user ID, and other context from Azure Functions context
 */

import { Context } from "@azure/functions";
import { getCallerAdId } from "../authHelpers";
import type { JwtPayload } from "jsonwebtoken";
import { ensureBindings } from "../../domain/types/ContextBindings";
import { ErrorContext } from "../../domain/types";

/**
 * Extracts error context information from Azure Functions context
 * @description Provides a single responsibility for extracting all contextual information needed for error logging
 */
export class ErrorContextExtractor {
  /**
   * Extracts all error context from the Azure Functions context
   * @param ctx - Azure Functions execution context
   * @returns Error context with endpoint, function name, user ID, and other metadata
   */
  static extract(ctx: Context): ErrorContext {
    return {
      endpoint: this.extractEndpoint(ctx),
      functionName: this.extractFunctionName(ctx),
      userId: this.extractUserId(ctx),
      method: ctx.req?.method || undefined,
      url: ctx.req?.url,
      invocationId: ctx.invocationId
    };
  }

  /**
   * Extracts the endpoint path from the request URL
   * @param ctx - Azure Functions execution context
   * @returns Endpoint path or undefined if not available
   */
  private static extractEndpoint(ctx: Context): string | undefined {
    if (!ctx.req?.url) {
      return undefined;
    }

    try {
      return new URL(ctx.req.url).pathname;
    } catch {
      return ctx.req.url;
    }
  }

  /**
   * Extracts the function name from execution context or URL
   * @param ctx - Azure Functions execution context
   * @returns Function name or "Unknown" if not determinable
   */
  private static extractFunctionName(ctx: Context): string {
    const execContext = (ctx as Context & { executionContext?: { functionName?: string } }).executionContext;
    if (execContext?.functionName) {
      return execContext.functionName;
    }

    const endpoint = this.extractEndpoint(ctx);
    if (endpoint) {
      const routeMatch = endpoint.match(/\/api\/([^/?]+)/);
      if (routeMatch) {
        return this.formatFunctionName(routeMatch[1]);
      }
    }

    return "Unknown";
  }

  /**
   * Formats a route name into a function name (e.g., "talk-session-start" -> "TalkSessionStart")
   * @param routeName - Route name from URL
   * @returns Formatted function name
   */
  private static formatFunctionName(routeName: string): string {
    return routeName
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  }

  /**
   * Extracts the user ID from context bindings
   * @param ctx - Azure Functions execution context
   * @returns User ID or undefined if not available
   */
  private static extractUserId(ctx: Context): string | undefined {
    try {
      const extendedCtx = ensureBindings(ctx);
      const callerId = extendedCtx.bindings.callerId;
      if (callerId) {
        return callerId as string;
      }

      const userClaims = extendedCtx.bindings.user as JwtPayload | undefined;
      if (userClaims) {
        return getCallerAdId(userClaims);
      }
    } catch {
      // If ensureBindings fails, bindings may not be available yet
      return undefined;
    }

    return undefined;
  }
}

