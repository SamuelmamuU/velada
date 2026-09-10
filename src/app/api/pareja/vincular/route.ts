import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Usuario } from "@/models/Usuario";
import { Pareja } from "@/models/Pareja";
import { Cita } from "@/models/Cita";
import { memoryStore } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth.errorResponse) return auth.errorResponse;

    const body = await req.json().catch(() => null);
    if (!body || !body.codigo) {
      return NextResponse.json(
        { success: false, error: "Por favor proporciona el código de vinculación." },
        { status: 400 }
      );
    }

    const inputCode = String(body.codigo).trim().toUpperCase();
    if (inputCode.length < 4) {
      return NextResponse.json(
        { success: false, error: "El código de vinculación no es válido." },
        { status: 400 }
      );
    }

    const db = await connectDB();

    if (db) {
      try {
        const currentUser = await Usuario.findById(auth.user.id);
        if (!currentUser) {
          return NextResponse.json(
            { success: false, error: "Usuario actual no encontrado." },
            { status: 404 }
          );
        }

        if (currentUser.codigoVinculacion === inputCode) {
          return NextResponse.json(
            {
              success: false,
              error:
                "No puedes vincularte con tu propio código. Pídele a tu pareja que te muestre su código QR o te envíe su código.",
            },
            { status: 400 }
          );
        }

        // Buscar por pareja o por usuario objetivo
        let targetPareja = await Pareja.findOne({ codigoVinculacion: inputCode });
        let targetUser = await Usuario.findOne({ codigoVinculacion: inputCode });

        if (!targetPareja && targetUser?.parejaId) {
          targetPareja = await Pareja.findById(targetUser.parejaId);
        }

        if (!targetUser && targetPareja) {
          const targetId =
            currentUser.rol === "novio" ? targetPareja.noviaId : targetPareja.novioId;
          if (targetId) {
            targetUser = await Usuario.findById(targetId);
          } else {
            // Si falta el otro miembro, buscar el miembro existente en la pareja
            const anyId = targetPareja.novioId || targetPareja.noviaId;
            if (anyId) {
              targetUser = await Usuario.findById(anyId);
            }
          }
        }

        if (!targetPareja && !targetUser) {
          return NextResponse.json(
            {
              success: false,
              error:
                "Código no encontrado. Verifica que hayas escrito el código correctamente o escanea de nuevo el QR.",
            },
            { status: 404 }
          );
        }

        if (targetUser && targetUser._id.equals(currentUser._id)) {
          return NextResponse.json(
            {
              success: false,
              error:
                "No puedes vincularte con tu propio código de invitación.",
            },
            { status: 400 }
          );
        }

        // Crear o actualizar la pareja conjunta
        let activePareja = targetPareja;
        if (!activePareja) {
          activePareja = await Pareja.create({
            codigoVinculacion: inputCode,
            novioId: currentUser.rol === "novio" ? currentUser._id : targetUser?._id,
            noviaId: currentUser.rol === "novia" ? currentUser._id : targetUser?._id,
            estado: "conectados",
            fechaVinculacion: new Date(),
          });
        } else {
          if (currentUser.rol === "novio") {
            activePareja.novioId = currentUser._id;
            if (targetUser && !activePareja.noviaId) activePareja.noviaId = targetUser._id;
          } else {
            activePareja.noviaId = currentUser._id;
            if (targetUser && !activePareja.novioId) activePareja.novioId = targetUser._id;
          }
          activePareja.estado = "conectados";
          activePareja.fechaVinculacion = new Date();
          await activePareja.save();
        }

        // Asociar parejaId a ambos usuarios
        currentUser.parejaId = activePareja._id;
        await currentUser.save();

        if (targetUser) {
          targetUser.parejaId = activePareja._id;
          await targetUser.save();
        }

        // Sincronizar todas las citas creadas por ambos hacia esta parejaId
        await Cita.updateMany(
          {
            $or: [
              { creadoPor: currentUser._id },
              ...(targetUser ? [{ creadoPor: targetUser._id }] : []),
            ],
          },
          { $set: { parejaId: activePareja._id } }
        );

        return NextResponse.json({
          success: true,
          message: `¡Cuentas vinculadas con éxito! Ahora compartes tu diario y buzón con ${targetUser?.nombre || "tu pareja"}.`,
          pareja: {
            id: activePareja._id.toString(),
            codigoVinculacion: activePareja.codigoVinculacion,
            estado: "conectados",
            parejaNombre: targetUser?.nombre,
            parejaEmail: targetUser?.email,
            parejaRol: targetUser?.rol,
            fechaVinculacion: activePareja.fechaVinculacion
              ? new Date(activePareja.fechaVinculacion).toISOString()
              : undefined,
          },
        });
      } catch (dbErr: any) {
        console.warn("[MongoDB pareja/vincular error, using memory fallback]:", dbErr);
      }
    }

    // Fallback en memoria
    const memCurrentUser = memoryStore.usuarios.find(
      (u) => u.id === auth.user.id || u.email === auth.user.email
    );
    if (!memCurrentUser) {
      return NextResponse.json(
        { success: false, error: "Usuario no encontrado en memoria." },
        { status: 404 }
      );
    }

    if (memCurrentUser.codigoVinculacion === inputCode) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No puedes vincularte con tu propio código de invitación.",
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(memoryStore.parejas)) {
      memoryStore.parejas = [];
    }

    let memTargetPareja = memoryStore.parejas.find(
      (p) => p.codigoVinculacion.toUpperCase() === inputCode
    );
    let memTargetUser = memoryStore.usuarios.find(
      (u) => u.codigoVinculacion?.toUpperCase() === inputCode
    );

    if (!memTargetPareja && !memTargetUser) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Código no encontrado. Verifica que hayas escrito el código correctamente.",
        },
        { status: 404 }
      );
    }

    if (memTargetUser && memTargetUser.id === memCurrentUser.id) {
      return NextResponse.json(
        { success: false, error: "No puedes vincularte contigo mismo." },
        { status: 400 }
      );
    }

    const sharedParejaId = memTargetPareja?.id || "pareja_" + Date.now();

    if (memTargetPareja) {
      memTargetPareja.estado = "conectados";
      memTargetPareja.fechaVinculacion = new Date().toISOString();
      if (memCurrentUser.rol === "novio") {
        memTargetPareja.novioId = memCurrentUser.id;
        if (memTargetUser) memTargetPareja.noviaId = memTargetUser.id;
      } else {
        memTargetPareja.noviaId = memCurrentUser.id;
        if (memTargetUser) memTargetPareja.novioId = memTargetUser.id;
      }
    } else {
      memoryStore.parejas.push({
        id: sharedParejaId,
        codigoVinculacion: inputCode,
        novioId: memCurrentUser.rol === "novio" ? memCurrentUser.id : memTargetUser?.id,
        noviaId: memCurrentUser.rol === "novia" ? memCurrentUser.id : memTargetUser?.id,
        estado: "conectados",
        fechaVinculacion: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    memCurrentUser.parejaId = sharedParejaId;
    memCurrentUser.estadoPareja = "conectados";
    memCurrentUser.nombrePareja = memTargetUser?.nombre || "Pareja";

    if (memTargetUser) {
      memTargetUser.parejaId = sharedParejaId;
      memTargetUser.estadoPareja = "conectados";
      memTargetUser.nombrePareja = memCurrentUser.nombre;
    }

    // Sincronizar citas en memoria
    for (const cita of memoryStore.citas) {
      const creadorId = typeof cita.creadoPor === "object" ? cita.creadoPor.id : cita.creadoPor;
      if (creadorId === memCurrentUser.id || (memTargetUser && creadorId === memTargetUser.id)) {
        cita.parejaId = sharedParejaId;
      }
    }

    return NextResponse.json({
      success: true,
      message: `¡Cuentas vinculadas con éxito! Ahora compartes tu buzón con ${memTargetUser?.nombre || "tu pareja"}.`,
      pareja: {
        id: sharedParejaId,
        codigoVinculacion: inputCode,
        estado: "conectados",
        parejaNombre: memTargetUser?.nombre,
        parejaEmail: memTargetUser?.email,
        parejaRol: memTargetUser?.rol,
        fechaVinculacion: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("[POST /api/pareja/vincular Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al vincular cuentas." },
      { status: 500 }
    );
  }
}
