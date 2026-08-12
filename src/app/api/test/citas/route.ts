import { NextRequest, NextResponse } from "next/server";
import { signToken } from "@/lib/jwt";
import { requireRole, requireAuth } from "@/lib/auth";
import { CrearCitaSchema, EditarCitaSchema } from "@/lib/validations/cita";

export async function GET(req: NextRequest) {
  const tests: { name: string; passed: boolean; details?: any }[] = [];

  const tokenNovio = signToken({
    id: "64f1a2b3c4d5e6f7a8b9c001",
    email: "novio@velada.app",
    rol: "novio",
    nombre: "Novio",
  });

  const tokenNovia = signToken({
    id: "64f1a2b3c4d5e6f7a8b9c002",
    email: "novia@velada.app",
    rol: "novia",
    nombre: "Novia",
  });

  // 1. Validación de esquema Zod para crear cita válida
  const citaValida = {
    nombre: "Cena bajo las estrellas",
    descripcion: "Una cena romántica en la montaña con vista a la ciudad.",
    horario: new Date(Date.now() + 86400000).toISOString(),
    lugar: {
      direccion: "Mirador Chipinque, San Pedro Garza García",
      lat: 25.6175,
      lng: -100.3582,
    },
    tematica: "Romántico",
    vestimentaRecomendada: "Abrigo y zapatos cómodos",
    estado: "confirmada",
  };

  const zodValidResult = CrearCitaSchema.safeParse(citaValida);
  tests.push({
    name: "Validación de esquema Zod para Cita Válida",
    passed: zodValidResult.success,
  });

  // 2. Validación de esquema Zod para datos incompletos / inválidos
  const citaInvalida = {
    nombre: "",
    descripcion: "",
    horario: "fecha_no_valida",
    lugar: { direccion: "", lat: 999, lng: -500 },
  };
  const zodInvalidResult = CrearCitaSchema.safeParse(citaInvalida);
  tests.push({
    name: "Detección de errores en campos requeridos y coordenadas inválidas",
    passed: !zodInvalidResult.success,
  });

  // 3. Verificación de permisos de creación: Novio permitido, Novia bloqueada (403)
  const reqNovioCrear = new NextRequest("http://localhost:3000/api/citas", {
    headers: { Authorization: `Bearer ${tokenNovio}` },
  });
  const reqNoviaCrear = new NextRequest("http://localhost:3000/api/citas", {
    headers: { Authorization: `Bearer ${tokenNovia}` },
  });

  const authNovioCrear = requireRole(reqNovioCrear, ["novio"]);
  const authNoviaCrear = requireRole(reqNoviaCrear, ["novio"]);

  tests.push({
    name: "Permiso POST /api/citas: Novio autorizado",
    passed: !!authNovioCrear.user && !authNovioCrear.errorResponse,
  });

  tests.push({
    name: "Restricción POST /api/citas: Novia bloqueada con 403 Forbidden",
    passed:
      authNoviaCrear.errorResponse?.status === 403 && !authNoviaCrear.user,
  });

  // 4. Verificación de permisos de edición / eliminación: Novio permitido, Novia bloqueada
  const reqNoviaEditar = new NextRequest("http://localhost:3000/api/citas/123", {
    headers: { Authorization: `Bearer ${tokenNovia}` },
  });
  const authNoviaEditar = requireRole(reqNoviaEditar, ["novio"]);

  tests.push({
    name: "Restricción PUT y DELETE /api/citas/:id: Novia bloqueada con 403",
    passed:
      authNoviaEditar.errorResponse?.status === 403 && !authNoviaEditar.user,
  });

  // 5. Verificación de lectura: Ambos roles tienen acceso a lectura
  const reqNovioLeer = new NextRequest("http://localhost:3000/api/citas", {
    headers: { Authorization: `Bearer ${tokenNovio}` },
  });
  const reqNoviaLeer = new NextRequest("http://localhost:3000/api/citas", {
    headers: { Authorization: `Bearer ${tokenNovia}` },
  });

  const authNovioLeer = requireAuth(reqNovioLeer);
  const authNoviaLeer = requireAuth(reqNoviaLeer);

  tests.push({
    name: "Permiso GET /api/citas y GET /api/citas/:id: Novio y Novia autorizados",
    passed:
      !authNovioLeer.errorResponse &&
      !authNoviaLeer.errorResponse &&
      authNovioLeer.user?.rol === "novio" &&
      authNoviaLeer.user?.rol === "novia",
  });

  const allPassed = tests.every((t) => t.passed);

  return NextResponse.json({
    success: allPassed,
    totalTests: tests.length,
    passedCount: tests.filter((t) => t.passed).length,
    tests,
  });
}
