import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Usuario } from "@/models/Usuario";
import { Pareja } from "@/models/Pareja";
import { memoryStore } from "@/lib/store";

const VALID_THEMES = ["rosa", "azul", "oro", "lavanda", "esmeralda", "vino"];

// PUT /api/pareja/tema — Configurar el color del dashboard de la pareja
export async function PUT(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth.errorResponse) return auth.errorResponse;

    const body = await req.json().catch(() => null);
    if (!body || !body.color) {
      return NextResponse.json(
        { success: false, error: "El campo color es obligatorio." },
        { status: 400 }
      );
    }

    const { color } = body;
    if (!VALID_THEMES.includes(color)) {
      return NextResponse.json(
        {
          success: false,
          error: `Color inválido. Opciones disponibles: ${VALID_THEMES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const db = await connectDB();
    if (db) {
      const user = await Usuario.findById(auth.user.id);
      if (user && user.parejaId) {
        const pareja = await Pareja.findById(user.parejaId);
        if (pareja) {
          // Si el usuario actual es novio, define el color del dashboard de su novia
          // Si el usuario actual es novia, define el color del dashboard de su novio
          if (user.rol === "novio") {
            pareja.colorDashboardNovia = color;
          } else {
            pareja.colorDashboardNovio = color;
          }
          await pareja.save();

          // También actualizar memoryStore si existe la pareja en memoria
          const memPareja = memoryStore.parejas.find(
            (p) => p.id === user.parejaId?.toString()
          );
          if (memPareja) {
            if (user.rol === "novio") {
              memPareja.colorDashboardNovia = color;
            } else {
              memPareja.colorDashboardNovio = color;
            }
          }

          return NextResponse.json({
            success: true,
            message: `Color asignado con amor para tu pareja.`,
            data: {
              colorDashboardNovio: pareja.colorDashboardNovio,
              colorDashboardNovia: pareja.colorDashboardNovia,
            },
          });
        }
      }
    }

    // Fallback en memoria
    const memUser = memoryStore.usuarios.find(
      (u) => u.id === auth.user.id || u.email === auth.user.email
    );
    if (memUser && memUser.parejaId) {
      const memPareja = memoryStore.parejas.find((p) => p.id === memUser.parejaId);
      if (memPareja) {
        if (memUser.rol === "novio") {
          memPareja.colorDashboardNovia = color;
        } else {
          memPareja.colorDashboardNovio = color;
        }
        return NextResponse.json({
          success: true,
          message: `Color asignado con amor para tu pareja.`,
          data: {
            colorDashboardNovio: memPareja.colorDashboardNovio,
            colorDashboardNovia: memPareja.colorDashboardNovia,
          },
        });
      }
    }

    return NextResponse.json(
      { success: false, error: "No se encontró el vínculo de pareja activo." },
      { status: 404 }
    );
  } catch (error: any) {
    console.error("[PUT /api/pareja/tema Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al actualizar tema" },
      { status: 500 }
    );
  }
}
