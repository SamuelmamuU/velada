import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireAuth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Cita } from "@/models/Cita";
import { RecuerdoSchema } from "@/lib/validations/cita";
import { memoryStore } from "@/lib/store";

interface RouteParams {
  params: {
    id: string;
  };
}

// POST /api/citas/:id/recuerdo — Guardar foto y nota de recuerdo (Novio o Novia)
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

    const parseResult = RecuerdoSchema.safeParse(body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors.map((e) => e.message).join(", ");
      return NextResponse.json(
        { success: false, error: errorMsg },
        { status: 400 }
      );
    }

    const { fotoUrl, pieDeFoto } = parseResult.data;
    const fechaSubida = new Date();
    const recuerdoObj = {
      fotoUrl,
      pieDeFoto: pieDeFoto || "",
      fechaSubida: fechaSubida.toISOString(),
    };

    const db = await connectDB();

    if (db && mongoose.Types.ObjectId.isValid(id)) {
      try {
        const citaActualizada: any = await Cita.findByIdAndUpdate(
          id,
          {
            $set: {
              recuerdo: {
                fotoUrl,
                pieDeFoto: pieDeFoto || "",
                fechaSubida,
              },
            },
          },
          { new: true, runValidators: true }
        )
          .populate("creadoPor", "nombre email rol")
          .lean();

        if (citaActualizada) {
          return NextResponse.json({
            success: true,
            message: "Recuerdo guardado con éxito",
            cita: {
              id: citaActualizada._id.toString(),
              nombre: citaActualizada.nombre,
              descripcion: citaActualizada.descripcion,
              horario: citaActualizada.horario.toISOString(),
              lugar: citaActualizada.lugar,
              tematica: citaActualizada.tematica,
              vestimentaRecomendada: citaActualizada.vestimentaRecomendada,
              estado: citaActualizada.estado,
              asistencia: citaActualizada.asistencia,
              importancia: citaActualizada.importancia,
              ambiente: citaActualizada.ambiente,
              esFlexible: citaActualizada.esFlexible,
              propuestaCambio: citaActualizada.propuestaCambio,
              recuerdo: {
                fotoUrl: citaActualizada.recuerdo.fotoUrl,
                pieDeFoto: citaActualizada.recuerdo.pieDeFoto,
                fechaSubida: citaActualizada.recuerdo.fechaSubida?.toISOString(),
              },
              creadoPor: citaActualizada.creadoPor,
              createdAt: citaActualizada.createdAt?.toISOString(),
              updatedAt: citaActualizada.updatedAt?.toISOString(),
            },
          });
        }
      } catch (dbErr) {
        console.warn("[MongoDB POST /recuerdo error, checking memory]:", dbErr);
      }
    }

    // Fallback en memoria
    const memIndex = memoryStore.citas.findIndex((c) => c.id === id);
    if (memIndex === -1) {
      return NextResponse.json(
        { success: false, error: "Cita no encontrada para agregar recuerdo" },
        { status: 404 }
      );
    }

    const current = memoryStore.citas[memIndex];
    const updatedMemCita = {
      ...current,
      recuerdo: recuerdoObj,
      updatedAt: new Date().toISOString(),
    };

    memoryStore.citas[memIndex] = updatedMemCita;

    return NextResponse.json({
      success: true,
      message: "Recuerdo guardado con éxito",
      cita: updatedMemCita,
    });
  } catch (error: any) {
    console.error(`[POST /api/citas/${params.id}/recuerdo Error]:`, error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al guardar el recuerdo" },
      { status: 500 }
    );
  }
}
