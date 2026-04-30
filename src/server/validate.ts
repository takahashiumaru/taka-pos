import type { ZodTypeAny, z } from "zod";
import type { NextRequest } from "next/server";
import { HttpError } from "./http";

export function parseBody<S extends ZodTypeAny>(schema: S, body: unknown): z.output<S> {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new HttpError(400, "Validation failed", result.error.flatten());
  }
  return result.data;
}

export async function parseJsonBody<S extends ZodTypeAny>(
  schema: S,
  req: NextRequest
): Promise<z.output<S>> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new HttpError(400, "Invalid JSON body");
  }
  return parseBody(schema, body);
}

export function parseSearchParams<S extends ZodTypeAny>(
  schema: S,
  req: NextRequest
): z.output<S> {
  const obj: Record<string, string> = {};
  req.nextUrl.searchParams.forEach((value, key) => {
    obj[key] = value;
  });
  const result = schema.safeParse(obj);
  if (!result.success) {
    throw new HttpError(400, "Invalid query parameters", result.error.flatten());
  }
  return result.data;
}
