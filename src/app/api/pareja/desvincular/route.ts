import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Usuario } from "@/models/Usuario";
import { Pareja } from "@/models/Pareja";
import { memoryStore } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth.errorResponse) return auth.errorResponse;

    const db = await connectDB();

    if (db) {
      try {
        const user = await Usuario.findById(auth.user.id);
        if (user && user.parejaId) {
          const pareja = await Pareja.findById(user.parejaId);
          if (pareja) {
            pareja.estado = "esperando_pareja";
            if (user.rol === "novio") {
              pareja.novioId = null;
            } else {
              pareja.noviaId = null;
            }
            await pareja.save();
          }

          user.parejaId = null;
          await user.save();

          return NextResponse.json({
            success: true,
            message: "Has desvinculado tu cuenta de pareja con éxito.",
          });
        }
      } catch (dbErr) {
        console.warn("[MongoDB desvincular error, using memory fallback]:", dbErr);
      }
    }

    // Fallback en memoria
    const memUser = memoryStore.usuarios.find(
      (u) => u.id === auth.user.id || u.email === auth.user.email
    );
    if (memUser) {
      if (memUser.parejaId) {
        const pareja = memoryStore.parejas.find((p) => p.id === memUser.parejaId);
        if (pareja) {
          pareja.estado = "esperando_pareja";
          if (memUser.rol === "novio") pareja.novioId = null;
          else pareja.noviaId = null;
        }
      }
      memUser.parejaId = null;
      memUser.estadoPareja = "esperando_pareja";
      memUser.nombrePareja = undefined;
    }

    return NextResponse.json({
      success: true,
      message: "Has desvinculado tu cuenta de pareja con éxito.",
    });
  } catch (error: any) {
    console.error("[POST /api/pareja/desvincular Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al desvincular la cuenta." },
      { status: 500 }
    );
  }
}
