import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Usuario } from "@/models/Usuario";
import { Pareja } from "@/models/Pareja";
import { memoryStore } from "@/lib/store";

export async function GET(req: NextRequest) {
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
            const partnerId = user.rol === "novio" ? pareja.noviaId : pareja.novioId;
            let partner = null;
            if (partnerId) {
              partner = await Usuario.findById(partnerId);
            }

            return NextResponse.json({
              success: true,
              data: {
                id: pareja._id.toString(),
                codigoVinculacion: pareja.codigoVinculacion,
                estado: pareja.estado,
                parejaNombre: partner?.nombre,
                parejaEmail: partner?.email,
                parejaRol: partner?.rol,
                fechaVinculacion: pareja.fechaVinculacion
                  ? new Date(pareja.fechaVinculacion).toISOString()
                  : undefined,
              },
            });
          }
        }
      } catch (dbErr) {
        console.warn("[MongoDB pareja/estado error, using memory fallback]:", dbErr);
      }
    }

    // Fallback en memoria
    const memUser = memoryStore.usuarios.find(
      (u) => u.id === auth.user.id || u.email === auth.user.email
    );

    if (memUser && memUser.parejaId) {
      const pareja = memoryStore.parejas.find((p) => p.id === memUser.parejaId);
      if (pareja) {
        const partnerId = memUser.rol === "novio" ? pareja.noviaId : pareja.novioId;
        const partner = partnerId ? memoryStore.usuarios.find((u) => u.id === partnerId) : null;

        return NextResponse.json({
          success: true,
          data: {
            id: pareja.id,
            codigoVinculacion: pareja.codigoVinculacion,
            estado: pareja.estado,
            parejaNombre: partner?.nombre || memUser.nombrePareja,
            parejaEmail: partner?.email,
            parejaRol: partner?.rol,
            fechaVinculacion: pareja.fechaVinculacion
              ? new Date(pareja.fechaVinculacion).toISOString()
              : undefined,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: "",
        codigoVinculacion: memUser?.codigoVinculacion || "AVENTURA-LOVE",
        estado: "esperando_pareja",
        parejaNombre: undefined,
        fechaVinculacion: undefined,
      },
    });
  } catch (error: any) {
    console.error("[GET /api/pareja/estado Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al obtener estado de pareja." },
      { status: 500 }
    );
  }
}
