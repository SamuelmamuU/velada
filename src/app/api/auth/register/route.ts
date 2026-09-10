import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { connectDB } from "@/lib/mongodb";
import { Usuario } from "@/models/Usuario";
import { Pareja } from "@/models/Pareja";
import { signToken } from "@/lib/jwt";
import { memoryStore } from "@/lib/store";
import { RolUsuario } from "@/types";

function generatePairingCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let randomStr = "";
  for (let i = 0; i < 4; i++) {
    randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `AVENTURA-${randomStr}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        { success: false, error: "El cuerpo de la petición es obligatorio." },
        { status: 400 }
      );
    }

    const { nombre, email, password, rol } = body;

    if (!nombre || typeof nombre !== "string" || nombre.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: "El nombre debe tener al menos 2 caracteres." },
        { status: 400 }
      );
    }

    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, error: "Por favor proporciona un correo electrónico válido." },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { success: false, error: "La contraseña debe tener al menos 6 caracteres." },
        { status: 400 }
      );
    }

    if (rol !== "novio" && rol !== "novia") {
      return NextResponse.json(
        { success: false, error: "El rol debe ser 'novio' o 'novia'." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanNombre = nombre.trim();
    const userRole: RolUsuario = rol;
    const passwordHash = await bcrypt.hash(password, 10);

    const db = await connectDB();

    if (db) {
      try {
        const existing = await Usuario.findOne({ email: cleanEmail });
        if (existing) {
          return NextResponse.json(
            { success: false, error: "Ya existe una cuenta con este correo electrónico." },
            { status: 400 }
          );
        }

        // Generar código de vinculación único
        let codigo = generatePairingCode();
        let codeExists = await Pareja.findOne({ codigoVinculacion: codigo });
        while (codeExists) {
          codigo = generatePairingCode();
          codeExists = await Pareja.findOne({ codigoVinculacion: codigo });
        }

        // Crear usuario
        const nuevoUsuario = await Usuario.create({
          nombre: cleanNombre,
          email: cleanEmail,
          passwordHash,
          rol: userRole,
          codigoVinculacion: codigo,
        });

        // Crear pareja inicial en espera
        const nuevaPareja = await Pareja.create({
          codigoVinculacion: codigo,
          novioId: userRole === "novio" ? nuevoUsuario._id : null,
          noviaId: userRole === "novia" ? nuevoUsuario._id : null,
          estado: "esperando_pareja",
        });

        // Enlazar parejaId en usuario
        nuevoUsuario.parejaId = nuevaPareja._id;
        await nuevoUsuario.save();

        const payload = {
          id: nuevoUsuario._id.toString(),
          email: nuevoUsuario.email,
          rol: nuevoUsuario.rol,
          nombre: nuevoUsuario.nombre,
          parejaId: nuevaPareja._id.toString(),
        };

        const token = signToken(payload);

        const response = NextResponse.json({
          success: true,
          message: "Cuenta creada con éxito.",
          token,
          usuario: {
            id: nuevoUsuario._id.toString(),
            nombre: nuevoUsuario.nombre,
            email: nuevoUsuario.email,
            rol: nuevoUsuario.rol,
            parejaId: nuevaPareja._id.toString(),
            codigoVinculacion: codigo,
            estadoPareja: "esperando_pareja",
          },
        });

        response.cookies.set({
          name: "velada_token",
          value: token,
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 30 * 24 * 60 * 60,
          path: "/",
        });

        return response;
      } catch (dbErr: any) {
        console.warn("[MongoDB register error, using memory fallback]:", dbErr);
      }
    }

    // Fallback en memoria
    const memExisting = memoryStore.usuarios.find(
      (u) => u.email.toLowerCase() === cleanEmail
    );
    if (memExisting) {
      return NextResponse.json(
        { success: false, error: "Ya existe una cuenta con este correo electrónico." },
        { status: 400 }
      );
    }

    if (!Array.isArray(memoryStore.parejas)) {
      memoryStore.parejas = [];
    }

    let codigoMem = generatePairingCode();
    while (memoryStore.parejas.some((p) => p.codigoVinculacion === codigoMem)) {
      codigoMem = generatePairingCode();
    }


    const userId = "mem_u_" + crypto.randomBytes(6).toString("hex");
    const parejaId = "mem_p_" + crypto.randomBytes(6).toString("hex");

    const memUser = {
      id: userId,
      nombre: cleanNombre,
      email: cleanEmail,
      rol: userRole,
      parejaId: parejaId,
      codigoVinculacion: codigoMem,
      estadoPareja: "esperando_pareja" as const,
      passwordHash,
      createdAt: new Date().toISOString(),
    };

    memoryStore.usuarios.push(memUser);

    memoryStore.parejas.push({
      id: parejaId,
      codigoVinculacion: codigoMem,
      novioId: userRole === "novio" ? userId : null,
      noviaId: userRole === "novia" ? userId : null,
      estado: "esperando_pareja",
      fechaVinculacion: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const payload = {
      id: userId,
      email: cleanEmail,
      rol: userRole,
      nombre: cleanNombre,
      parejaId: parejaId,
    };

    const token = signToken(payload);

    const response = NextResponse.json({
      success: true,
      message: "Cuenta creada con éxito.",
      token,
      usuario: {
        id: userId,
        nombre: cleanNombre,
        email: cleanEmail,
        rol: userRole,
        parejaId: parejaId,
        codigoVinculacion: codigoMem,
        estadoPareja: "esperando_pareja",
      },
    });

    response.cookies.set({
      name: "velada_token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("[API Register Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al registrar la cuenta." },
      { status: 500 }
    );
  }
}
