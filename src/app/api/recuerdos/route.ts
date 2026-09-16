import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireAuth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Usuario } from "@/models/Usuario";
import { Recuerdo } from "@/models/Recuerdo";
import { memoryStore } from "@/lib/store";
import { IRecuerdoIndependiente } from "@/types";

// GET /api/recuerdos — Listar todas las polaroids independientes de la pareja
export async function GET(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth.errorResponse) return auth.errorResponse;

    const db = await connectDB();
    if (db) {
      try {
        const user = await Usuario.findById(auth.user.id);
        const query: any = {};
        if (user?.parejaId) {
          query.$or = [
            { parejaId: user.parejaId },
            { creadoPor: new mongoose.Types.ObjectId(auth.user.id) },
          ];
        } else {
          query.creadoPor = new mongoose.Types.ObjectId(auth.user.id);
        }

        const recuerdosDB = await Recuerdo.find(query)
          .sort({ fecha: -1, createdAt: -1 })
          .populate("creadoPor", "nombre email rol")
          .lean();

        const formattedRecuerdos: IRecuerdoIndependiente[] = recuerdosDB.map((r: any) => ({
          id: r._id.toString(),
          fotoUrl: r.fotoUrl,
          pieDeFoto: r.pieDeFoto || "",
          fecha: r.fecha ? new Date(r.fecha).toISOString() : new Date().toISOString(),
          creadoPor:
            r.creadoPor && typeof r.creadoPor === "object" && r.creadoPor.nombre
              ? {
                  id: r.creadoPor._id?.toString() || "",
                  nombre: r.creadoPor.nombre,
                }
              : r.creadoPor?.toString(),
          parejaId: r.parejaId ? r.parejaId.toString() : null,
          citaId: r.citaId ? r.citaId.toString() : null,
          createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : undefined,
        }));

        return NextResponse.json({
          success: true,
          recuerdos: formattedRecuerdos,
        });
      } catch (dbErr) {
        console.warn("[MongoDB GET /api/recuerdos error, using memory fallback]:", dbErr);
      }
    }

    // Fallback en memoria
    const memUser = memoryStore.usuarios.find(
      (u) => u.id === auth.user.id || u.email === auth.user.email
    );
    let recuerdosMem = memoryStore.recuerdos || [];
    if (memUser?.parejaId) {
      recuerdosMem = recuerdosMem.filter(
        (r) =>
          r.parejaId === memUser.parejaId ||
          (typeof r.creadoPor === "object" ? r.creadoPor.id === memUser.id : r.creadoPor === memUser.id)
      );
    } else if (memUser) {
      recuerdosMem = recuerdosMem.filter(
        (r) =>
          typeof r.creadoPor === "object" ? r.creadoPor.id === memUser.id : r.creadoPor === memUser.id
      );
    }

    return NextResponse.json({
      success: true,
      recuerdos: [...recuerdosMem].sort(
        (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      ),
    });
  } catch (error: any) {
    console.error("[GET /api/recuerdos Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al listar recuerdos" },
      { status: 500 }
    );
  }
}

// POST /api/recuerdos — Subir una nueva fotografía Polaroid independiente
export async function POST(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth.errorResponse) return auth.errorResponse;

    const body = await req.json().catch(() => null);
    if (!body || !body.fotoUrl) {
      return NextResponse.json(
        { success: false, error: "La foto polaroid es obligatoria." },
        { status: 400 }
      );
    }

    const { fotoUrl, pieDeFoto, fecha, citaId } = body;
    const parsedFecha = fecha ? new Date(fecha) : new Date();

    const db = await connectDB();
    if (db) {
      try {
        const user = await Usuario.findById(auth.user.id);
        const nuevoRecuerdo = await Recuerdo.create({
          fotoUrl,
          pieDeFoto: pieDeFoto ? String(pieDeFoto).trim() : "",
          fecha: parsedFecha,
          creadoPor: new mongoose.Types.ObjectId(auth.user.id),
          parejaId: user?.parejaId || null,
          citaId: citaId && mongoose.Types.ObjectId.isValid(citaId)
            ? new mongoose.Types.ObjectId(citaId)
            : null,
        });

        const formattedRecuerdo: IRecuerdoIndependiente = {
          id: nuevoRecuerdo._id.toString(),
          fotoUrl: nuevoRecuerdo.fotoUrl,
          pieDeFoto: nuevoRecuerdo.pieDeFoto || "",
          fecha: nuevoRecuerdo.fecha.toISOString(),
          creadoPor: {
            id: auth.user.id,
            nombre: auth.user.nombre,
          },
          parejaId: user?.parejaId ? user.parejaId.toString() : null,
          citaId: citaId || null,
          createdAt: nuevoRecuerdo.createdAt?.toISOString(),
        };

        return NextResponse.json({
          success: true,
          message: "Recuerdo Polaroid agregado al diario.",
          recuerdo: formattedRecuerdo,
        });
      } catch (dbErr) {
        console.warn("[MongoDB POST /api/recuerdos error, using memory fallback]:", dbErr);
      }
    }

    // Fallback en memoria
    const memUser = memoryStore.usuarios.find(
      (u) => u.id === auth.user.id || u.email === auth.user.email
    );

    const memoryRecuerdo: IRecuerdoIndependiente = {
      id: "recuerdo_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
      fotoUrl,
      pieDeFoto: pieDeFoto ? String(pieDeFoto).trim() : "",
      fecha: parsedFecha.toISOString(),
      creadoPor: {
        id: auth.user.id,
        nombre: auth.user.nombre,
      },
      parejaId: memUser?.parejaId || null,
      citaId: citaId || null,
      createdAt: new Date().toISOString(),
    };

    if (!memoryStore.recuerdos) {
      memoryStore.recuerdos = [];
    }
    memoryStore.recuerdos.unshift(memoryRecuerdo);

    return NextResponse.json({
      success: true,
      message: "Recuerdo Polaroid agregado al diario.",
      recuerdo: memoryRecuerdo,
    });
  } catch (error: any) {
    console.error("[POST /api/recuerdos Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al guardar el recuerdo" },
      { status: 500 }
    );
  }
}
