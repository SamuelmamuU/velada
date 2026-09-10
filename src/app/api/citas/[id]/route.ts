import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireAuth, requireRole } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Cita } from "@/models/Cita";
import { EditarCitaSchema } from "@/lib/validations/cita";
import { memoryStore } from "@/lib/store";

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/citas/:id — Ver detalle de una cita (Novio y Novia)
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const auth = requireAuth(req);
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = params;
    const db = await connectDB();

    if (db && mongoose.Types.ObjectId.isValid(id)) {
      try {
        const cita = await Cita.findById(id)
          .populate("creadoPor", "nombre email rol")
          .lean();

        if (cita) {
          const rawCita: any = cita;
          return NextResponse.json({
            success: true,
            cita: {
              id: rawCita._id.toString(),
              nombre: rawCita.nombre,
              descripcion: rawCita.descripcion,
              horario: rawCita.horario.toISOString(),
              lugar: rawCita.lugar,
              tematica: rawCita.tematica,
              vestimentaRecomendada: rawCita.vestimentaRecomendada,
              estado: rawCita.estado,
              asistencia: rawCita.asistencia || {
                cantidadPersonas: 2,
                tipoAcompanantes: "solo_pareja",
                hayFamilia: false,
              },
              importancia: rawCita.importancia || "alta",
              ambiente: rawCita.ambiente || "interior",
              esFlexible: rawCita.esFlexible ?? true,
              propuestaCambio: rawCita.propuestaCambio
                ? {
                    nuevoHorario: rawCita.propuestaCambio.nuevoHorario?.toISOString(),
                    motivo: rawCita.propuestaCambio.motivo,
                    fechaSolicitud: rawCita.propuestaCambio.fechaSolicitud?.toISOString(),
                    estado: rawCita.propuestaCambio.estado,
                  }
                : undefined,
              recuerdo: rawCita.recuerdo,
              parejaId: rawCita.parejaId ? rawCita.parejaId.toString() : null,
              creadoPor:
                rawCita.creadoPor &&
                typeof rawCita.creadoPor === "object" &&
                rawCita.creadoPor.nombre
                  ? {
                      id: rawCita.creadoPor._id?.toString() || "",
                      nombre: rawCita.creadoPor.nombre,
                    }
                  : rawCita.creadoPor?.toString(),
              createdAt: rawCita.createdAt?.toISOString(),
              updatedAt: rawCita.updatedAt?.toISOString(),
            },
          });
        }
      } catch (dbErr) {
        console.warn("[MongoDB GET /:id error, checking memory]:", dbErr);
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

    return NextResponse.json({
      success: true,
      cita: memCita,
    });
  } catch (error: any) {
    console.error(`[GET /api/citas/${params.id} Error]:`, error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al obtener la cita" },
      { status: 500 }
    );
  }
}

// PUT /api/citas/:id — Editar cita (Exclusivo para Novio)
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const auth = requireRole(req, ["novio"]);
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = params;

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, error: "El cuerpo de la petición es obligatorio" },
        { status: 400 }
      );
    }

    const parseResult = EditarCitaSchema.safeParse(body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors.map((e) => e.message).join(", ");
      return NextResponse.json(
        { success: false, error: errorMsg, details: parseResult.error.errors },
        { status: 400 }
      );
    }

    const updateData: Record<string, any> = { ...parseResult.data };
    if (updateData.horario) {
      updateData.horario = new Date(updateData.horario);
    }

    const db = await connectDB();

    if (db && mongoose.Types.ObjectId.isValid(id)) {
      try {
        const citaActualizada: any = await Cita.findByIdAndUpdate(
          id,
          { $set: updateData },
          { new: true, runValidators: true }
        )
          .populate("creadoPor", "nombre email rol")
          .lean();

        if (citaActualizada) {
          return NextResponse.json({
            success: true,
            message: "Cita actualizada correctamente",
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
        console.warn("[MongoDB PUT /:id error, checking memory]:", dbErr);
      }
    }

    // Fallback en memoria
    const memIndex = memoryStore.citas.findIndex((c) => c.id === id);
    if (memIndex === -1) {
      return NextResponse.json(
        { success: false, error: "Cita no encontrada para actualizar" },
        { status: 404 }
      );
    }

    const current = memoryStore.citas[memIndex];
    const updatedMemCita = {
      ...current,
      ...parseResult.data,
      horario: parseResult.data.horario || current.horario,
      lugar: parseResult.data.lugar || current.lugar,
      asistencia: parseResult.data.asistencia || current.asistencia || {
        cantidadPersonas: 2,
        tipoAcompanantes: "solo_pareja" as const,
        hayFamilia: false,
      },
      importancia: parseResult.data.importancia || current.importancia || "alta",
      ambiente: parseResult.data.ambiente || current.ambiente || "interior",
      esFlexible: parseResult.data.esFlexible ?? current.esFlexible ?? true,
      updatedAt: new Date().toISOString(),
    };

    memoryStore.citas[memIndex] = updatedMemCita;

    return NextResponse.json({
      success: true,
      message: "Cita actualizada correctamente",
      cita: updatedMemCita,
    });
  } catch (error: any) {
    console.error(`[PUT /api/citas/${params.id} Error]:`, error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al actualizar la cita" },
      { status: 500 }
    );
  }
}

// DELETE /api/citas/:id — Eliminar cita (Exclusivo para Novio)
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const auth = requireRole(req, ["novio"]);
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = params;
    const db = await connectDB();

    if (db && mongoose.Types.ObjectId.isValid(id)) {
      try {
        const citaEliminada = await Cita.findByIdAndDelete(id);
        if (citaEliminada) {
          return NextResponse.json({
            success: true,
            message: "Cita eliminada correctamente",
            id,
          });
        }
      } catch (dbErr) {
        console.warn("[MongoDB DELETE /:id error, checking memory]:", dbErr);
      }
    }

    // Fallback en memoria
    const memIndex = memoryStore.citas.findIndex((c) => c.id === id);
    if (memIndex === -1) {
      return NextResponse.json(
        { success: false, error: "Cita no encontrada para eliminar" },
        { status: 404 }
      );
    }

    memoryStore.citas.splice(memIndex, 1);

    return NextResponse.json({
      success: true,
      message: "Cita eliminada correctamente",
      id,
    });
  } catch (error: any) {
    console.error(`[DELETE /api/citas/${params.id} Error]:`, error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al eliminar la cita" },
      { status: 500 }
    );
  }
}
