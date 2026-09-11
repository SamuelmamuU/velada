import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Usuario } from "@/models/Usuario";
import { Pareja } from "@/models/Pareja";
import { memoryStore } from "@/lib/store";
import { generateUniquePairingCode } from "@/lib/pairing";
import QRCode from "qrcode";

export async function GET(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth.errorResponse) return auth.errorResponse;

    let codigo = "";
    let estado: "esperando_pareja" | "conectados" = "esperando_pareja";
    let partnerName: string | undefined = undefined;
    let parejaId: string | null = null;

    const db = await connectDB();

    if (db) {
      try {
        const user = await Usuario.findById(auth.user.id);
        if (user) {
          if (!user.codigoVinculacion || user.codigoVinculacion === "AVENTURA-LOVE") {
            user.codigoVinculacion = await generateUniquePairingCode(true);
            await user.save();
          }
          codigo = user.codigoVinculacion;
          parejaId = user.parejaId ? user.parejaId.toString() : null;

          if (user.parejaId) {
            const pareja = await Pareja.findById(user.parejaId);
            if (pareja) {
              estado = pareja.estado;
              const partnerId = user.rol === "novio" ? pareja.noviaId : pareja.novioId;
              if (partnerId) {
                const partner = await Usuario.findById(partnerId);
                if (partner) partnerName = partner.nombre;
              }
            }
          }
        }
      } catch (dbErr) {
        console.warn("[MongoDB pareja/codigo error, using memory]:", dbErr);
      }
    }

    if (!codigo) {
      // Fallback en memoria
      const memUser = memoryStore.usuarios.find(
        (u) => u.id === auth.user.id || u.email === auth.user.email
      );
      if (memUser) {
        if (!memUser.codigoVinculacion || memUser.codigoVinculacion === "AVENTURA-LOVE") {
          memUser.codigoVinculacion = await generateUniquePairingCode(false);
        }
        codigo = memUser.codigoVinculacion;
        parejaId = memUser.parejaId || null;
        if (memUser.parejaId) {
          const pareja = memoryStore.parejas.find((p) => p.id === memUser.parejaId);
          if (pareja) {
            estado = pareja.estado;
            const partnerId = memUser.rol === "novio" ? pareja.noviaId : pareja.novioId;
            if (partnerId) {
              const partner = memoryStore.usuarios.find((u) => u.id === partnerId);
              if (partner) partnerName = partner.nombre;
            }
          }
        }
      } else {
        codigo = await generateUniquePairingCode(false);
      }
    }

    // Generar código QR en formato Data URL (PNG) con paleta elegante acorde a la estética postal
    const qrDataUrl = await QRCode.toDataURL(codigo, {
      width: 320,
      margin: 2,
      color: {
        dark: "#1e3a5f", // Azul tinta nocturno elegante
        light: "#ffffff", // Blanco puro para alto contraste de lectura
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        codigo,
        qrDataUrl,
        estado,
        parejaId,
        nombrePareja: partnerName,
      },
    });
  } catch (error: any) {
    console.error("[GET /api/pareja/codigo Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al obtener código de vinculación" },
      { status: 500 }
    );
  }
}
