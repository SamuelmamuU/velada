import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Cita } from "@/models/Cita";
import { seedDatabase } from "@/lib/seed";
import { CrearCitaSchema } from "@/lib/validations/cita";
import { memoryStore } from "@/lib/store";
import mongoose from "mongoose";

// GET /api/citas — Listar todas las citas (Novio y Novia)
export async function GET(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth.errorResponse) return auth.errorResponse;

    const db = await connectDB();

    if (db) {
      try {
        const count = await Cita.countDocuments();
        if (count === 0) {
          await seedDatabase();
        }

        const citas = await Cita.find()
          .populate("creadoPor", "nombre email rol")
          .sort({ horario: 1 })
          .lean();

        const formattedCitas = citas.map((cita: any) => ({
          id: cita._id.toString(),
          nombre: cita.nombre,
          descripcion: cita.descripcion,
          horario: cita.horario.toISOString(),
          lugar: cita.lugar,
          tematica: cita.tematica,
          vestimentaRecomendada: cita.vestimentaRecomendada,
          estado: cita.estado,
          creadoPor:
            cita.creadoPor && typeof cita.creadoPor === "object" && cita.creadoPor.nombre
              ? {
                  id: cita.creadoPor._id?.toString() || "",
                  nombre: cita.creadoPor.nombre,
                }
              : cita.creadoPor?.toString(),
          createdAt: cita.createdAt?.toISOString(),
          updatedAt: cita.updatedAt?.toISOString(),
        }));

        return NextResponse.json({
          success: true,
          total: formattedCitas.length,
          citas: formattedCitas,
        });
      } catch (dbErr) {
        console.warn("[MongoDB citas GET error, using memory]:", dbErr);
      }
    }

    // Fallback en memoria
    return NextResponse.json({
      success: true,
      total: memoryStore.citas.length,
      citas: [...memoryStore.citas].sort(
        (a, b) => new Date(a.horario).getTime() - new Date(b.horario).getTime()
      ),
    });
  } catch (error: any) {
    console.error("[GET /api/citas Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al listar las citas" },
      { status: 500 }
    );
  }
}

// POST /api/citas — Crear nueva cita (Exclusivo para Rol Novio)
export async function POST(req: NextRequest) {
  try {
    const auth = requireRole(req, ["novio"]);
    if (auth.errorResponse) return auth.errorResponse;

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, error: "El cuerpo de la petición es obligatorio" },
        { status: 400 }
      );
    }

    const parseResult = CrearCitaSchema.safeParse(body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors.map((e) => e.message).join(", ");
      return NextResponse.json(
        { success: false, error: errorMsg, details: parseResult.error.errors },
        { status: 400 }
      );
    }

    const validatedData = parseResult.data;
    const db = await connectDB();

    if (db) {
      try {
        const nuevaCita = await Cita.create({
          nombre: validatedData.nombre,
          descripcion: validatedData.descripcion,
          horario: new Date(validatedData.horario),
          lugar: validatedData.lugar,
          tematica: validatedData.tematica,
          vestimentaRecomendada: validatedData.vestimentaRecomendada,
          estado: validatedData.estado || "confirmada",
          creadoPor: new mongoose.Types.ObjectId(auth.user.id),
        });

        return NextResponse.json(
          {
            success: true,
            message: "Cita creada con éxito",
            cita: {
              id: nuevaCita._id.toString(),
              nombre: nuevaCita.nombre,
              descripcion: nuevaCita.descripcion,
              horario: nuevaCita.horario.toISOString(),
              lugar: nuevaCita.lugar,
              tematica: nuevaCita.tematica,
              vestimentaRecomendada: nuevaCita.vestimentaRecomendada,
              estado: nuevaCita.estado,
              creadoPor: {
                id: auth.user.id,
                nombre: auth.user.nombre,
              },
              createdAt: nuevaCita.createdAt?.toISOString(),
              updatedAt: nuevaCita.updatedAt?.toISOString(),
            },
          },
          { status: 201 }
        );
      } catch (dbErr) {
        console.warn("[MongoDB POST error, using memory]:", dbErr);
      }
    }

    // Fallback en memoria
    const nuevaCitaMem = {
      id: "64f1a2b3c4d5e6f7a8b9c" + (Math.floor(Math.random() * 900) + 100),
      nombre: validatedData.nombre,
      descripcion: validatedData.descripcion,
      horario: new Date(validatedData.horario).toISOString(),
      lugar: validatedData.lugar,
      tematica: validatedData.tematica,
      vestimentaRecomendada: validatedData.vestimentaRecomendada,
      estado: validatedData.estado || "confirmada",
      creadoPor: {
        id: auth.user.id,
        nombre: auth.user.nombre,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    memoryStore.citas.push(nuevaCitaMem);

    return NextResponse.json(
      {
        success: true,
        message: "Cita creada con éxito",
        cita: nuevaCitaMem,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[POST /api/citas Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al crear la cita" },
      { status: 500 }
    );
  }
}
