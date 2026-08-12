import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireAuth, requireRole } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Cita } from "@/models/Cita";
import { PropuestaCambioSchema } from "@/lib/validations/cita";
import { memoryStore } from "@/lib/store";

interface RouteParams {
  params: {
    id: string;
  };
}

// POST /api/citas/:id/propuesta — Proponer nuevo día y hora (Novia)
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const auth = requireAuth(req);
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = params;
    const body = await req.json().catch(() => null);

    const parseResult = PropuestaCambioSchema.safeParse(body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors.map((e) => e.message).join(", ");
      return NextResponse.json(
        { success: false, error: errorMsg },
        { status: 400 }
      );
    }

    const { nuevoHorario, motivo } = parseResult.data;
    const proposedDate = new Date(nuevoHorario);

    const db = await connectDB();

    if (db && mongoose.Types.ObjectId.isValid(id)) {
      try {
        const cita = await Cita.findById(id);
        if (!cita) {
          return NextResponse.json(
            { success: false, error: "Cita no encontrada" },
            { status: 404 }
          );
        }

        if (cita.esFlexible === false) {
          return NextResponse.json(
            { success: false, error: "Esta cita tiene horario reservado fijo y no acepta reprogramación." },
            { status: 400 }
          );
        }

        cita.propuestaCambio = {
          nuevoHorario: proposedDate,
          motivo: motivo || "",
          fechaSolicitud: new Date(),
          estado: "pendiente",
        };

        await cita.save();

        return NextResponse.json({
          success: true,
          message: "Propuesta de cambio enviada a tu novio 💌",
          propuesta: {
            nuevoHorario: proposedDate.toISOString(),
            motivo: motivo || "",
            fechaSolicitud: new Date().toISOString(),
            estado: "pendiente",
          },
        });
      } catch (dbErr) {
        console.warn("[MongoDB propuesta error, using memory]:", dbErr);
      }
    }

    // Fallback en memoria
    const memCita = memoryStore.citas.find((c) => c.id === id);
    if (!memCita) {
      return NextResponse.json(
        { success: false, error: "Cita no encontrada" },
        { status: 404 }
      );
    }

    memCita.propuestaCambio = {
      nuevoHorario: proposedDate.toISOString(),
      motivo: motivo || "",
      fechaSolicitud: new Date().toISOString(),
      estado: "pendiente",
    };

    return NextResponse.json({
      success: true,
      message: "Propuesta de cambio enviada a tu novio 💌",
      propuesta: memCita.propuestaCambio,
    });
  } catch (error: any) {
    console.error("[POST /api/citas/:id/propuesta Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al enviar la propuesta" },
      { status: 500 }
    );
  }
}

// PUT /api/citas/:id/propuesta — Responder a propuesta de cambio (Aceptar / Rechazar - Novio)
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const auth = requireRole(req, ["novio"]);
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = params;
    const body = await req.json().catch(() => null);

    if (!body || !["aceptar", "rechazar"].includes(body.accion)) {
      return NextResponse.json(
        { success: false, error: "Acción inválida. Debe ser 'aceptar' o 'rechazar'." },
        { status: 400 }
      );
    }

    const { accion } = body;
    const db = await connectDB();

    if (db && mongoose.Types.ObjectId.isValid(id)) {
      try {
        const cita = await Cita.findById(id);
        if (!cita || !cita.propuestaCambio) {
          return NextResponse.json(
            { success: false, error: "No hay propuesta pendiente para esta cita." },
            { status: 404 }
          );
        }

        if (accion === "aceptar") {
          cita.horario = cita.propuestaCambio.nuevoHorario;
          cita.propuestaCambio.estado = "aceptada";
        } else {
          cita.propuestaCambio.estado = "rechazada";
        }

        await cita.save();

        return NextResponse.json({
          success: true,
          message:
            accion === "aceptar"
              ? "Horario actualizado con la sugerencia de tu novia ✨"
              : "Propuesta declinada; se mantiene el horario original.",
          cita: {
            id: cita._id.toString(),
            horario: cita.horario.toISOString(),
            propuestaCambio: {
              nuevoHorario: cita.propuestaCambio.nuevoHorario.toISOString(),
              motivo: cita.propuestaCambio.motivo,
              estado: cita.propuestaCambio.estado,
            },
          },
        });
      } catch (dbErr) {
        console.warn("[MongoDB propuesta PUT error, using memory]:", dbErr);
      }
    }

    // Fallback en memoria
    const memCita = memoryStore.citas.find((c) => c.id === id);
    if (!memCita || !memCita.propuestaCambio) {
      return NextResponse.json(
        { success: false, error: "No hay propuesta pendiente para esta cita." },
        { status: 404 }
      );
    }

    if (accion === "aceptar") {
      memCita.horario = memCita.propuestaCambio.nuevoHorario;
      memCita.propuestaCambio.estado = "aceptada";
    } else {
      memCita.propuestaCambio.estado = "rechazada";
    }

    return NextResponse.json({
      success: true,
      message:
        accion === "aceptar"
          ? "Horario actualizado con la sugerencia de tu novia ✨"
          : "Propuesta declinada; se mantiene el horario original.",
      cita: memCita,
    });
  } catch (error: any) {
    console.error("[PUT /api/citas/:id/propuesta Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al responder a la propuesta" },
      { status: 500 }
    );
  }
}
