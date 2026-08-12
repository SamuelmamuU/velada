import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { JWTPayload, RolUsuario } from "@/types";

export interface AuthResult {
  user: JWTPayload | null;
  error?: string;
  status?: number;
}

/**
 * Extrae y valida el token JWT desde el header Authorization (Bearer)
 * o desde la cookie "velada_token".
 */
export function getAuthUser(req: NextRequest | Request): JWTPayload | null {
  try {
    let token: string | undefined;

    // 1. Intentar desde Header Authorization
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    }

    // 2. Si no hay header, intentar desde cookies (NextRequest o Cookie header)
    if (!token && "cookies" in req && typeof req.cookies.get === "function") {
      const cookieVal = req.cookies.get("velada_token");
      token = cookieVal?.value;
    } else if (!token) {
      const cookieHeader = req.headers.get("cookie");
      if (cookieHeader) {
        const match = cookieHeader.match(/velada_token=([^;]+)/);
        if (match) {
          token = match[1];
        }
      }
    }

    if (!token) return null;

    return verifyToken(token);
  } catch {
    return null;
  }
}

/**
 * Verifica que el usuario esté autenticado.
 * Retorna el usuario o una respuesta de error 401.
 */
export function requireAuth(req: NextRequest | Request): {
  user: JWTPayload;
  errorResponse?: never;
} | {
  user?: never;
  errorResponse: NextResponse;
} {
  const user = getAuthUser(req);
  if (!user) {
    return {
      errorResponse: NextResponse.json(
        { success: false, error: "No autorizado. Token inválido o no proporcionado." },
        { status: 401 }
      ),
    };
  }
  return { user };
}

/**
 * Verifica que el usuario autenticado tenga un rol específico (ej. "novio").
 * Retorna el usuario o una respuesta de error 403 Forbidden.
 */
export function requireRole(
  req: NextRequest | Request,
  allowedRoles: RolUsuario[]
): {
  user: JWTPayload;
  errorResponse?: never;
} | {
  user?: never;
  errorResponse: NextResponse;
} {
  const auth = requireAuth(req);
  if (auth.errorResponse) return auth;

  if (!allowedRoles.includes(auth.user.rol)) {
    return {
      errorResponse: NextResponse.json(
        {
          success: false,
          error: `Acceso denegado. Esta acción requiere rol: ${allowedRoles.join(" o ")}.`,
        },
        { status: 403 }
      ),
    };
  }

  return { user: auth.user };
}
