import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Usuario } from "@/models/Usuario";
import { Pareja } from "@/models/Pareja";
import { memoryStore } from "@/lib/store";

const VALID_THEMES = ["rosa", "azul", "oro", "lavanda", "esmeralda", "vino"];
const VALID_MODELOS_BUZON = ["clasico", "vintage", "moderno"];

// PUT /api/pareja/tema — Configurar el color y/or modelo de buzón de la pareja
export async function PUT(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth.errorResponse) return auth.errorResponse;

    const body = await req.json().catch(() => null);
    if (!body || (!body.color && !body.modeloBuzon)) {
      return NextResponse.json(
        { success: false, error: "Debes enviar al menos un campo a personalizar (color o modeloBuzon)." },
        { status: 400 }
      );
    }

    const { color, modeloBuzon } = body;

    if (color && !VALID_THEMES.includes(color)) {
      return NextResponse.json(
        {
          success: false,
          error: `Color inválido. Opciones disponibles: ${VALID_THEMES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    if (modeloBuzon && !VALID_MODELOS_BUZON.includes(modeloBuzon)) {
      return NextResponse.json(
        {
          success: false,
          error: `Modelo de buzón inválido. Opciones: ${VALID_MODELOS_BUZON.join(", ")}`,
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
          if (color) {
            pareja.colorDashboardNovia = color;
            pareja.colorDashboardNovio = color;
          }
          if (modeloBuzon) {
            pareja.modeloBuzon = modeloBuzon;
          }
          await pareja.save();

          // También actualizar memoryStore si existe la pareja en memoria
          const memPareja = memoryStore.parejas.find(
            (p) => p.id === user.parejaId?.toString()
          );
          if (memPareja) {
            if (color) {
              memPareja.colorDashboardNovia = color;
              memPareja.colorDashboardNovio = color;
            }
            if (modeloBuzon) {
              memPareja.modeloBuzon = modeloBuzon;
            }
          }

          return NextResponse.json({
            success: true,
            message: `Personalización asignada con éxito para la pareja.`,
            data: {
              colorDashboardNovio: pareja.colorDashboardNovio,
              colorDashboardNovia: pareja.colorDashboardNovia,
              modeloBuzon: pareja.modeloBuzon,
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
        if (color) {
          memPareja.colorDashboardNovia = color;
          memPareja.colorDashboardNovio = color;
        }
        if (modeloBuzon) {
          memPareja.modeloBuzon = modeloBuzon;
        }
        return NextResponse.json({
          success: true,
          message: `Personalización asignada con éxito para la pareja.`,
          data: {
            colorDashboardNovio: memPareja.colorDashboardNovio,
            colorDashboardNovia: memPareja.colorDashboardNovia,
            modeloBuzon: memPareja.modeloBuzon,
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
