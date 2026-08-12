import { NextRequest, NextResponse } from "next/server";
import { signToken, verifyToken } from "@/lib/jwt";
import { requireRole } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const tests: { name: string; passed: boolean; details?: any }[] = [];

  // 1. Prueba de JWT Sign / Verify
  const novioPayload = {
    id: "64f1a2b3c4d5e6f7a8b9c001",
    email: "novio@velada.app",
    rol: "novio" as const,
    nombre: "Novio",
  };
  const tokenNovio = signToken(novioPayload);
  const verifiedNovio = verifyToken(tokenNovio);

  tests.push({
    name: "JWT Sign y Verify para Novio",
    passed:
      verifiedNovio?.email === "novio@velada.app" &&
      verifiedNovio?.rol === "novio",
  });

  const noviaPayload = {
    id: "64f1a2b3c4d5e6f7a8b9c002",
    email: "novia@velada.app",
    rol: "novia" as const,
    nombre: "Novia",
  };
  const tokenNovia = signToken(noviaPayload);
  const verifiedNovia = verifyToken(tokenNovia);

  tests.push({
    name: "JWT Sign y Verify para Novia",
    passed:
      verifiedNovia?.email === "novia@velada.app" &&
      verifiedNovia?.rol === "novia",
  });

  // 2. Prueba de Token Inválido
  const invalidVerification = verifyToken("token_invalido_123");
  tests.push({
    name: "Rechazo de Token Inválido",
    passed: invalidVerification === null,
  });

  // 3. Prueba de Autorización por Rol (requireRole)
  const mockNovioReq = new NextRequest("http://localhost:3000/api/test", {
    headers: { Authorization: `Bearer ${tokenNovio}` },
  });
  const mockNoviaReq = new NextRequest("http://localhost:3000/api/test", {
    headers: { Authorization: `Bearer ${tokenNovia}` },
  });
  const mockUnauthReq = new NextRequest("http://localhost:3000/api/test");

  // Novio intentando acceder a ruta protegida de novio
  const authNovioParaCrear = requireRole(mockNovioReq, ["novio"]);
  tests.push({
    name: "Permiso de creación: Rol Novio permitido",
    passed: !!authNovioParaCrear.user && !authNovioParaCrear.errorResponse,
  });

  // Novia intentando acceder a ruta protegida de novio
  const authNoviaParaCrear = requireRole(mockNoviaReq, ["novio"]);
  tests.push({
    name: "Restricción de creación: Rol Novia bloqueado (403)",
    passed:
      authNoviaParaCrear.errorResponse?.status === 403 &&
      !authNoviaParaCrear.user,
  });

  // Usuario no autenticado
  const authUnauth = requireRole(mockUnauthReq, ["novio"]);
  tests.push({
    name: "Protección de rutas privadas ante usuarios no autenticados (401)",
    passed:
      authUnauth.errorResponse?.status === 401 && !authUnauth.user,
  });

  const allPassed = tests.every((t) => t.passed);

  return NextResponse.json({
    success: allPassed,
    totalTests: tests.length,
    passedCount: tests.filter((t) => t.passed).length,
    tests,
  });
}
