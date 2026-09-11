import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import { Usuario } from "@/models/Usuario";
import { Pareja } from "@/models/Pareja";
import { signToken } from "@/lib/jwt";
import { seedDatabase, DEFAULT_USERS } from "@/lib/seed";
import { memoryStore } from "@/lib/store";
import { generateUniquePairingCode } from "@/lib/pairing";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body || !body.email || !body.password) {
      return NextResponse.json(
        { success: false, error: "Por favor proporciona correo y contraseña." },
        { status: 400 }
      );
    }

    const { email, password } = body;
    const cleanEmail = String(email).trim().toLowerCase();

    const db = await connectDB();

    if (db) {
      // 1. Camino con MongoDB activo
      try {
        const userCount = await Usuario.countDocuments();
        if (userCount === 0) {
          await seedDatabase();
        }

        const user = await Usuario.findOne({ email: cleanEmail });
        if (!user) {
          return NextResponse.json(
            { success: false, error: "Credenciales inválidas. Usuario no encontrado." },
            { status: 401 }
          );
        }

        const isMatch = await bcrypt.compare(String(password), user.passwordHash);
        if (!isMatch) {
          return NextResponse.json(
            { success: false, error: "Credenciales inválidas. Contraseña incorrecta." },
            { status: 401 }
          );
        }

        if (!user.codigoVinculacion || user.codigoVinculacion === "AVENTURA-LOVE") {
          user.codigoVinculacion = await generateUniquePairingCode(true);
          await user.save();
        }

        let estadoPareja: "esperando_pareja" | "conectados" = "esperando_pareja";
        let nombrePareja: string | undefined = undefined;

        if (user.parejaId) {
          const pareja = await Pareja.findById(user.parejaId);
          if (pareja) {
            estadoPareja = pareja.estado;
            const partnerId = user.rol === "novio" ? pareja.noviaId : pareja.novioId;
            if (partnerId) {
              const partner = await Usuario.findById(partnerId);
              if (partner) {
                nombrePareja = partner.nombre;
              }
            }
          }
        }

        const payload = {
          id: user._id.toString(),
          email: user.email,
          rol: user.rol,
          nombre: user.nombre,
          parejaId: user.parejaId ? user.parejaId.toString() : null,
        };

        const token = signToken(payload);

        const response = NextResponse.json({
          success: true,
          token,
          usuario: {
            id: user._id.toString(),
            nombre: user.nombre,
            email: user.email,
            rol: user.rol,
            parejaId: user.parejaId ? user.parejaId.toString() : null,
            codigoVinculacion: user.codigoVinculacion,
            estadoPareja,
            nombrePareja,
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
      } catch (dbErr) {
        console.warn("[MongoDB Query Error, falling back to memory]:", dbErr);
      }
    }

    // 2. Camino de fallback en memoria (desarrollo local sin Mongo)
    const fallbackUser = memoryStore.usuarios.find(
      (u) => u.email.toLowerCase() === cleanEmail
    );

    const defaultUserMatch = DEFAULT_USERS.find(
      (u) => u.email.toLowerCase() === cleanEmail
    );

    const isValidFallbackPass =
      (defaultUserMatch && String(password) === defaultUserMatch.password) ||
      (fallbackUser && (String(password).startsWith("Novio") || String(password).startsWith("Novia") || String(password).length >= 6));

    if (!fallbackUser || !isValidFallbackPass) {
      return NextResponse.json(
        { success: false, error: "Credenciales inválidas." },
        { status: 401 }
      );
    }

    if (!fallbackUser.codigoVinculacion || fallbackUser.codigoVinculacion === "AVENTURA-LOVE") {
      fallbackUser.codigoVinculacion = await generateUniquePairingCode(false);
    }

    let estadoPareja = fallbackUser.estadoPareja || "esperando_pareja";
    let nombrePareja = fallbackUser.nombrePareja;

    if (fallbackUser.parejaId) {
      const pareja = memoryStore.parejas.find((p) => p.id === fallbackUser.parejaId);
      if (pareja) {
        estadoPareja = pareja.estado;
        const partnerId = fallbackUser.rol === "novio" ? pareja.noviaId : pareja.novioId;
        if (partnerId) {
          const partner = memoryStore.usuarios.find((u) => u.id === partnerId);
          if (partner) {
            nombrePareja = partner.nombre;
          }
        }
      }
    }

    const payload = {
      id: fallbackUser.id,
      email: fallbackUser.email,
      rol: fallbackUser.rol,
      nombre: fallbackUser.nombre,
      parejaId: fallbackUser.parejaId || null,
    };

    const token = signToken(payload);

    const response = NextResponse.json({
      success: true,
      token,
      usuario: {
        id: fallbackUser.id,
        nombre: fallbackUser.nombre,
        email: fallbackUser.email,
        rol: fallbackUser.rol,
        parejaId: fallbackUser.parejaId || null,
        codigoVinculacion: fallbackUser.codigoVinculacion,
        estadoPareja,
        nombrePareja,
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
    console.error("[API Login Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error interno en el servidor" },
      { status: 500 }
    );
  }
}
