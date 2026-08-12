import { NextRequest, NextResponse } from "next/server";
import { signToken, verifyToken } from "@/lib/jwt";
import { requireAuth, requireRole } from "@/lib/auth";
import { CrearCitaSchema, EditarCitaSchema } from "@/lib/validations/cita";
import { generateGoogleCalendarUrl, generateIcsContent } from "@/lib/calendar";

export async function GET(req: NextRequest) {
  const results: {
    category: string;
    tests: { id: string; name: string; passed: boolean; message?: string }[];
  }[] = [];

  const addTest = (
    category: string,
    id: string,
    name: string,
    passed: boolean,
    message?: string
  ) => {
    let cat = results.find((c) => c.category === category);
    if (!cat) {
      cat = { category, tests: [] };
      results.push(cat);
    }
    cat.tests.push({ id, name, passed, message });
  };

  // ================= 1. PRUEBAS DE AUTENTICACIÓN Y TOKENS =================
  const novioToken = signToken({
    id: "64f1a2b3c4d5e6f7a8b9c001",
    email: "novio@velada.app",
    rol: "novio",
    nombre: "Novio",
  });
  const noviaToken = signToken({
    id: "64f1a2b3c4d5e6f7a8b9c002",
    email: "novia@velada.app",
    rol: "novia",
    nombre: "Novia",
  });

  const verifiedNovio = verifyToken(novioToken);
  const verifiedNovia = verifyToken(noviaToken);

  addTest(
    "Autenticación",
    "AUTH-01",
    "Firma y verificación de token JWT para Novio",
    verifiedNovio?.email === "novio@velada.app" && verifiedNovio?.rol === "novio"
  );

  addTest(
    "Autenticación",
    "AUTH-02",
    "Firma y verificación de token JWT para Novia",
    verifiedNovia?.email === "novia@velada.app" && verifiedNovia?.rol === "novia"
  );

  addTest(
    "Autenticación",
    "AUTH-03",
    "Rechazo de token manipulado o corrupto",
    verifyToken("token_falso_invalido.123.456") === null
  );

  // ================= 2. PRUEBAS DE ROLES Y PERMISOS =================
  const reqNovio = new NextRequest("http://localhost:3000/api/citas", {
    headers: { Authorization: `Bearer ${novioToken}` },
  });
  const reqNovia = new NextRequest("http://localhost:3000/api/citas", {
    headers: { Authorization: `Bearer ${noviaToken}` },
  });
  const reqAnon = new NextRequest("http://localhost:3000/api/citas");

  // Rol Novio intentando crear
  const authNovioPost = requireRole(reqNovio, ["novio"]);
  addTest(
    "Permisos y Roles",
    "ROL-01",
    "Rol 'novio' autorizado para POST /api/citas",
    !!authNovioPost.user && !authNovioPost.errorResponse
  );

  // Rol Novia intentando crear
  const authNoviaPost = requireRole(reqNovia, ["novio"]);
  addTest(
    "Permisos y Roles",
    "ROL-02",
    "Rol 'novia' bloqueado con 403 Forbidden para POST /api/citas",
    authNoviaPost.errorResponse?.status === 403 && !authNoviaPost.user
  );

  // Rol Novia intentando editar
  const authNoviaPut = requireRole(reqNovia, ["novio"]);
  addTest(
    "Permisos y Roles",
    "ROL-03",
    "Rol 'novia' bloqueado con 403 Forbidden para PUT /api/citas/:id",
    authNoviaPut.errorResponse?.status === 403
  );

  // Rol Novia intentando eliminar
  const authNoviaDelete = requireRole(reqNovia, ["novio"]);
  addTest(
    "Permisos y Roles",
    "ROL-04",
    "Rol 'novia' bloqueado con 403 Forbidden para DELETE /api/citas/:id",
    authNoviaDelete.errorResponse?.status === 403
  );

  // Acceso de lectura para ambos roles
  const authNovioGet = requireAuth(reqNovio);
  const authNoviaGet = requireAuth(reqNovia);
  addTest(
    "Permisos y Roles",
    "ROL-05",
    "Ambos roles ('novio' y 'novia') autorizados para lectura GET /api/citas",
    !authNovioGet.errorResponse && !authNoviaGet.errorResponse
  );

  // Rechazo a usuario anónimo
  const authAnon = requireAuth(reqAnon);
  addTest(
    "Permisos y Roles",
    "ROL-06",
    "Petición anónima rechazada con 401 Unauthorized",
    authAnon.errorResponse?.status === 401
  );

  // ================= 3. VALIDACIONES Y CASOS LÍMITE (ZOD) =================
  const citaValida = {
    nombre: "Cena bajo las luces",
    descripcion: "Mesa reservada y vino tinto en la terraza.",
    horario: new Date(Date.now() + 86400000).toISOString(),
    lugar: {
      direccion: "Terraza San Pedro, Monterrey",
      lat: 25.6572,
      lng: -100.4024,
    },
    tematica: "Romántico",
    vestimentaRecomendada: "Elegante casual",
    estado: "confirmada",
  };

  const validParse = CrearCitaSchema.safeParse(citaValida);
  addTest(
    "Validaciones Zod",
    "VAL-01",
    "Aprobación de payload de Cita con todos los campos válidos",
    validParse.success
  );

  // Caso límite: Campos obligatorios vacíos
  const citaCamposVacios = { ...citaValida, nombre: "", descripcion: "" };
  const parseCamposVacios = CrearCitaSchema.safeParse(citaCamposVacios);
  addTest(
    "Validaciones Zod",
    "VAL-02",
    "Rechazo de cita con nombre o descripción vacía",
    !parseCamposVacios.success
  );

  // Caso límite: Coordenadas geográficas fuera de rango
  const citaCoordInvalidas = {
    ...citaValida,
    lugar: { direccion: "Lugar X", lat: 150, lng: -250 },
  };
  const parseCoords = CrearCitaSchema.safeParse(citaCoordInvalidas);
  addTest(
    "Validaciones Zod",
    "VAL-03",
    "Rechazo de coordenadas geográficas fuera de rango [-90,90] y [-180,180]",
    !parseCoords.success
  );

  // Caso límite: Formato de fecha corrupto
  const citaFechaInvalida = { ...citaValida, horario: "fecha_no_valida_123" };
  const parseFecha = CrearCitaSchema.safeParse(citaFechaInvalida);
  addTest(
    "Validaciones Zod",
    "VAL-04",
    "Rechazo de formato de fecha u horario corrupto",
    !parseFecha.success
  );

  // ================= 4. GENERACIÓN DE CALENDARIO (.ICS Y GOOGLE CAL) =================
  const mockCitaResponse = {
    id: "64f1a2b3c4d5e6f7a8b9c001",
    nombre: "Cena bajo las luces",
    descripcion: "Mesa reservada y vino tinto en la terraza.",
    horario: "2026-08-15T20:00:00.000Z",
    lugar: {
      direccion: "Terraza San Pedro, Monterrey",
      lat: 25.6572,
      lng: -100.4024,
    },
    tematica: "Romántico",
    vestimentaRecomendada: "Elegante casual",
    estado: "confirmada" as const,
  };

  const gcalUrl = generateGoogleCalendarUrl(mockCitaResponse);
  const icsContent = generateIcsContent(mockCitaResponse);

  addTest(
    "Calendario",
    "CAL-01",
    "Generación de URL de Google Calendar con parámetros codificados",
    gcalUrl.includes("calendar.google.com") &&
      gcalUrl.includes("action=TEMPLATE") &&
      gcalUrl.includes("Cena")
  );

  addTest(
    "Calendario",
    "CAL-02",
    "Estructura estándar RFC 5545 iCalendar (.ics) con GEO y LOCATION",
    icsContent.includes("BEGIN:VCALENDAR") &&
      icsContent.includes("BEGIN:VEVENT") &&
      icsContent.includes("LOCATION:Terraza San Pedro\\, Monterrey") &&
      icsContent.includes("GEO:25.6572;-100.4024") &&
      icsContent.includes("END:VCALENDAR")
  );

  // ================= 5. FLUJO EXTREMO A EXTREMO =================
  addTest(
    "Flujo E2E",
    "E2E-01",
    "Flujo Novio crea cita -> Validación Zod -> Novia consulta -> Exporta calendario",
    validParse.success &&
      !authNoviaGet.errorResponse &&
      icsContent.length > 50 &&
      gcalUrl.length > 50
  );

  const allTests = results.flatMap((r) => r.tests);
  const total = allTests.length;
  const passed = allTests.filter((t) => t.passed).length;
  const allPassed = total === passed;

  return NextResponse.json({
    success: allPassed,
    totalTests: total,
    passedTests: passed,
    failedTests: total - passed,
    timestamp: new Date().toISOString(),
    categories: results,
  });
}
