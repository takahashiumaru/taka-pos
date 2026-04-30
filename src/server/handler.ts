import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { UserRole } from "@prisma/client";
import { getAuthUser, errorResponse, requireRole as requireRoleFn, type AuthUser } from "./auth";

interface HandlerContext {
  params: Record<string, string>;
}

type RouteHandler = (
  req: NextRequest,
  ctx: HandlerContext,
  user: AuthUser
) => Promise<NextResponse> | NextResponse;

type PublicHandler = (
  req: NextRequest,
  ctx: HandlerContext
) => Promise<NextResponse> | NextResponse;

/** Wraps a handler that requires authentication. Optionally restrict by role. */
export function authed(handler: RouteHandler, roles?: UserRole[]) {
  return async (
    req: NextRequest,
    ctx: { params: Promise<Record<string, string>> } | HandlerContext
  ) => {
    try {
      const params =
        "params" in ctx && ctx.params instanceof Promise
          ? await ctx.params
          : (ctx as HandlerContext).params ?? {};
      const user = getAuthUser(req);
      if (roles && roles.length > 0) requireRoleFn(user, ...roles);
      return await handler(req, { params }, user);
    } catch (err) {
      return errorResponse(err);
    }
  };
}

/** Wraps a public handler (no auth required). */
export function publicHandler(handler: PublicHandler) {
  return async (
    req: NextRequest,
    ctx: { params: Promise<Record<string, string>> } | HandlerContext
  ) => {
    try {
      const params =
        "params" in ctx && ctx.params instanceof Promise
          ? await ctx.params
          : (ctx as HandlerContext).params ?? {};
      return await handler(req, { params });
    } catch (err) {
      return errorResponse(err);
    }
  };
}
