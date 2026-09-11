import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Usuario } from "@/models/Usuario";
import { Pareja } from "@/models/Pareja";
import { memoryStore } from "@/lib/store";
import { generateUniquePairingCode } from "@/lib/pairing";

export async function GET(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth.errorResponse) return auth.errorResponse;

    const db = await connectDB();

    if (db) {
      try {
        const user = await Usuario.findById(auth.user.id);
        if (user) {
          if (!user.codigoVinculacion || user.codigoVinculacion === "AVENTURA-LOVE") {
            user.codigoVinculacion = await generateUniquePairingCode(true);
            await user.save();
          }
          let estadoPareja: "esperando_pareja" | "conectados" = "esperando_pareja";
          let nombrePareja: string | undefined = undefined;

          if (user.parejaId) {
            const pareja = await Pareja.findById(user.parejaId);
            if (pareja) {
              estadoPareja = pareja.estado;
              const partnerId = user.rol === "novio" ? pareja.noviaId : pareja.novioId;
              if (partnerId) {
                const partner = await Usuario.findById(partnerId);
                if (partner) {
                  nombrePareja = partner.nombre;
                }
              }
            }
          }

          return NextResponse.json({
            success: true,
            usuario: {
              id: user._id.toString(),
              nombre: user.nombre,
              email: user.email,
              rol: user.rol,
              parejaId: user.parejaId ? user.parejaId.toString() : null,
              codigoVinculacion: user.codigoVinculacion,
              estadoPareja,
              nombrePareja,
              createdAt: user.createdAt,
            },
          });
        }
      } catch (e) {
        console.warn("[MongoDB me error, using token/memory user]:", e);
      }
    }

    // Fallback con memoria o datos decodificados del JWT
    const memUser = memoryStore.usuarios.find(
      (u) => u.id === auth.user.id || u.email === auth.user.email
    );

    if (memUser && (!memUser.codigoVinculacion || memUser.codigoVinculacion === "AVENTURA-LOVE")) {
      memUser.codigoVinculacion = await generateUniquePairingCode(false);
    }

    let estadoPareja = memUser?.estadoPareja || "esperando_pareja";
    let nombrePareja = memUser?.nombrePareja;

    if (memUser?.parejaId) {
      const pareja = memoryStore.parejas.find((p) => p.id === memUser.parejaId);
      if (pareja) {
        estadoPareja = pareja.estado;
        const partnerId = memUser.rol === "novio" ? pareja.noviaId : pareja.novioId;
        if (partnerId) {
          const partner = memoryStore.usuarios.find((u) => u.id === partnerId);
          if (partner) {
            nombrePareja = partner.nombre;
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      usuario: {
        id: memUser?.id || auth.user.id,
        nombre: memUser?.nombre || auth.user.nombre,
        email: memUser?.email || auth.user.email,
        rol: memUser?.rol || auth.user.rol,
        parejaId: memUser?.parejaId || null,
        codigoVinculacion: memUser?.codigoVinculacion,
        estadoPareja,
        nombrePareja,
      },
    });

  } catch (error: any) {
    console.error("[API Me Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al obtener perfil" },
      { status: 500 }
    );
  }
}
