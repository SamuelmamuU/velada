import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { Cita } from "@/models/Cita";
import { generateIcsContent } from "@/lib/calendar";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Identificador de cita inválido" },
        { status: 400 }
      );
    }

    await connectDB();

    const cita = await Cita.findById(id).lean();
    if (!cita) {
      return NextResponse.json(
        { success: false, error: "Cita no encontrada" },
        { status: 404 }
      );
    }

    const rawCita: any = cita;
    const formattedCita = {
      id: rawCita._id.toString(),
      nombre: rawCita.nombre,
      descripcion: rawCita.descripcion,
      horario: rawCita.horario.toISOString(),
      lugar: rawCita.lugar,
      tematica: rawCita.tematica,
      vestimentaRecomendada: rawCita.vestimentaRecomendada,
      estado: rawCita.estado,
    };

    const icsString = generateIcsContent(formattedCita);
    const filename = `nuestras-aventuras-${formattedCita.nombre
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")}.ics`;

    return new NextResponse(icsString, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error: any) {
    console.error("[GET .ics Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al generar archivo .ics" },
      { status: 500 }
    );
  }
}
