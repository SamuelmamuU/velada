import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireAuth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Cita } from "@/models/Cita";
import { ResponderCitaSchema } from "@/lib/validations/cita";
import { memoryStore } from "@/lib/store";

interface RouteParams {
  params: {
    id: string;
  };
}

// POST /api/citas/:id/responder — Aceptar o rechazar una carta/cita (Novia o Novio)
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const auth = requireAuth(req);
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = params;
    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        { success: false, error: "El cuerpo de la petición es obligatorio" },
        { status: 400 }
      );
    }

    const parseResult = ResponderCitaSchema.safeParse(body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors.map((e) => e.message).join(", ");
      return NextResponse.json(
        { success: false, error: errorMsg },
        { status: 400 }
      );
    }

    const { respuesta } = parseResult.data;
    const db = await connectDB();

    if (db && mongoose.Types.ObjectId.isValid(id)) {
      try {
        const citaActualizada: any = await Cita.findByIdAndUpdate(
          id,
          { $set: { estado: respuesta } },
          { new: true, runValidators: true }
        )
          .populate("creadoPor", "nombre email rol")
          .lean();

        if (citaActualizada) {
          return NextResponse.json({
            success: true,
            message:
              respuesta === "aceptada"
                ? "¡Invitación aceptada con amor! 💖"
                : respuesta === "rechazada"
                ? "Respuesta guardada con cariño 🤍"
                : "Estado actualizado a pendiente",
            cita: {
              id: citaActualizada._id.toString(),
              nombre: citaActualizada.nombre,
              descripcion: citaActualizada.descripcion,
              horario: citaActualizada.horario.toISOString(),
              lugar: citaActualizada.lugar,
              tematica: citaActualizada.tematica,
              vestimentaRecomendada: citaActualizada.vestimentaRecomendada,
              estado: citaActualizada.estado,
              asistencia: citaActualizada.asistencia || {
                cantidadPersonas: 2,
                tipoAcompanantes: "solo_pareja",
                hayFamilia: false,
              },
              importancia: citaActualizada.importancia || "alta",
              ambiente: citaActualizada.ambiente || "interior",
              esFlexible: citaActualizada.esFlexible ?? true,
              propuestaCambio: citaActualizada.propuestaCambio
                ? {
                    nuevoHorario: citaActualizada.propuestaCambio.nuevoHorario?.toISOString(),
                    motivo: citaActualizada.propuestaCambio.motivo,
                    fechaSolicitud: citaActualizada.propuestaCambio.fechaSolicitud?.toISOString(),
                    estado: citaActualizada.propuestaCambio.estado,
                  }
                : undefined,
              creadoPor:
                citaActualizada.creadoPor &&
                typeof citaActualizada.creadoPor === "object" &&
                citaActualizada.creadoPor.nombre
                  ? {
                      id: citaActualizada.creadoPor._id?.toString() || "",
                      nombre: citaActualizada.creadoPor.nombre,
                    }
                  : citaActualizada.creadoPor?.toString(),
              createdAt: citaActualizada.createdAt?.toISOString(),
              updatedAt: citaActualizada.updatedAt?.toISOString(),
            },
          });
        }
      } catch (dbErr) {
        console.warn("[MongoDB POST /responder error, checking memory]:", dbErr);
      }
    }

    // Fallback en memoria
    const memIndex = memoryStore.citas.findIndex((c) => c.id === id);
    if (memIndex === -1) {
      return NextResponse.json(
        { success: false, error: "Cita no encontrada para responder" },
        { status: 404 }
      );
    }

    const current = memoryStore.citas[memIndex];
    const updatedMemCita = {
      ...current,
      estado: respuesta as any,
      updatedAt: new Date().toISOString(),
    };

    memoryStore.citas[memIndex] = updatedMemCita;

    return NextResponse.json({
      success: true,
      message:
        respuesta === "aceptada"
          ? "¡Invitación aceptada con amor! 💖"
          : respuesta === "rechazada"
          ? "Respuesta guardada con cariño 🤍"
          : "Estado actualizado a pendiente",
      cita: updatedMemCita,
    });
  } catch (error: any) {
    console.error(`[POST /api/citas/${params.id}/responder Error]:`, error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al responder a la invitación" },
      { status: 500 }
    );
  }
}
