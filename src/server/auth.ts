import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import type { UserRole } from "@prisma/client";
import { HttpError } from "./http";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  role: UserRole;
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 8) {
    throw new Error("JWT_SECRET environment variable is required (min 8 chars)");
  }
  return secret;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  } as jwt.SignOptions);
}

/** Extract user from bearer token. Throws HttpError on failure. */
export function getAuthUser(req: NextRequest): AuthUser {
  const header = req.headers.get("authorization") ?? "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    throw new HttpError(401, "Missing or invalid Authorization header");
  }
  try {
    const payload = jwt.verify(token, getJwtSecret()) as JwtPayload;
    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      role: payload.role,
    };
  } catch {
    throw new HttpError(401, "Invalid or expired token");
  }
}

/** Returns authed user, or throws HttpError 403 if role doesn't match. */
export function requireRole(user: AuthUser, ...roles: UserRole[]): void {
  if (!roles.includes(user.role)) {
    throw new HttpError(403, "Forbidden: insufficient role");
  }
}

/** Uniform error → NextResponse. */
export function errorResponse(err: unknown): NextResponse {
  if (err instanceof HttpError) {
    return NextResponse.json(
      { error: err.message, issues: err.issues },
      { status: err.status }
    );
  }
  console.error("[API]", err);
  const message = err instanceof Error ? err.message : "Internal Server Error";
  return NextResponse.json({ error: message }, { status: 500 });
}
