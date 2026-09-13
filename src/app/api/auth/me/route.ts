import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { requireAuth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Usuario } from "@/models/Usuario";
import { Pareja } from "@/models/Pareja";
import { memoryStore } from "@/lib/store";
import { generateUniquePairingCode } from "@/lib/pairing";

export async function GET(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth.errorResponse) return auth.errorResponse;

    const db = await connectDB();

    if (db) {
      try {
        const user = await Usuario.findById(auth.user.id);
        if (user) {
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

          return NextResponse.json({
            success: true,
            usuario: {
              id: user._id.toString(),
              nombre: user.nombre,
              email: user.email,
              rol: user.rol,
              parejaId: user.parejaId ? user.parejaId.toString() : null,
              codigoVinculacion: user.codigoVinculacion,
              estadoPareja,
              nombrePareja,
              avatarUrl: user.avatarUrl || undefined,
              createdAt: user.createdAt,
            },
          });
        }
      } catch (e) {
        console.warn("[MongoDB me error, using token/memory user]:", e);
      }
    }

    // Fallback con memoria o datos decodificados del JWT
    const memUser = memoryStore.usuarios.find(
      (u) => u.id === auth.user.id || u.email === auth.user.email
    );

    if (memUser && (!memUser.codigoVinculacion || memUser.codigoVinculacion === "AVENTURA-LOVE")) {
      memUser.codigoVinculacion = await generateUniquePairingCode(false);
    }

    let estadoPareja = memUser?.estadoPareja || "esperando_pareja";
    let nombrePareja = memUser?.nombrePareja;

    if (memUser?.parejaId) {
      const pareja = memoryStore.parejas.find((p) => p.id === memUser.parejaId);
      if (pareja) {
        estadoPareja = pareja.estado;
        const partnerId = memUser.rol === "novio" ? pareja.noviaId : pareja.novioId;
        if (partnerId) {
          const partner = memoryStore.usuarios.find((u) => u.id === partnerId);
          if (partner) {
            nombrePareja = partner.nombre;
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      usuario: {
        id: memUser?.id || auth.user.id,
        nombre: memUser?.nombre || auth.user.nombre,
        email: memUser?.email || auth.user.email,
        rol: memUser?.rol || auth.user.rol,
        parejaId: memUser?.parejaId || null,
        codigoVinculacion: memUser?.codigoVinculacion,
        estadoPareja,
        nombrePareja,
        avatarUrl: memUser?.avatarUrl || undefined,
      },
    });

  } catch (error: any) {
    console.error("[API Me Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al obtener perfil" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth.errorResponse) return auth.errorResponse;

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, error: "Datos de actualización inválidos." },
        { status: 400 }
      );
    }

    const { nombre, avatarUrl, currentPassword, newPassword } = body;

    const db = await connectDB();

    if (db) {
      const user = await Usuario.findById(auth.user.id);
      if (!user) {
        return NextResponse.json(
          { success: false, error: "Usuario no encontrado." },
          { status: 404 }
        );
      }

      // Validar y cambiar contraseña si se solicitó
      if (newPassword || currentPassword) {
        if (!currentPassword) {
          return NextResponse.json(
            { success: false, error: "Debes ingresar tu contraseña actual para cambiarla." },
            { status: 400 }
          );
        }
        if (!newPassword || typeof newPassword !== "string" || newPassword.length < 6) {
          return NextResponse.json(
            { success: false, error: "La nueva contraseña debe tener al menos 6 caracteres." },
            { status: 400 }
          );
        }
        const isMatch = await bcrypt.compare(String(currentPassword), user.passwordHash);
        if (!isMatch) {
          return NextResponse.json(
            { success: false, error: "La contraseña actual no es correcta." },
            { status: 400 }
          );
        }
        user.passwordHash = await bcrypt.hash(newPassword, 10);
      }

      // Validar y cambiar nombre
      if (nombre !== undefined) {
        if (typeof nombre !== "string" || nombre.trim().length < 2) {
          return NextResponse.json(
            { success: false, error: "El nombre debe tener al menos 2 caracteres." },
            { status: 400 }
          );
        }
        user.nombre = nombre.trim();
      }

      // Validar y cambiar avatarUrl
      if (avatarUrl !== undefined) {
        user.avatarUrl = avatarUrl;
      }

      await user.save();

      // Determinar nombre de pareja y estado
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

      // También mantener sincronizado memoryStore si el usuario existe allí
      const memUser = memoryStore.usuarios.find((u) => u.id === user._id.toString() || u.email === user.email);
      if (memUser) {
        memUser.nombre = user.nombre;
        if (avatarUrl !== undefined) memUser.avatarUrl = user.avatarUrl;
        if (newPassword) memUser.passwordHash = user.passwordHash;
      }

      return NextResponse.json({
        success: true,
        message: "Perfil actualizado correctamente.",
        usuario: {
          id: user._id.toString(),
          nombre: user.nombre,
          email: user.email,
          rol: user.rol,
          parejaId: user.parejaId ? user.parejaId.toString() : null,
          codigoVinculacion: user.codigoVinculacion,
          estadoPareja,
          nombrePareja,
          avatarUrl: user.avatarUrl || undefined,
          createdAt: user.createdAt,
        },
      });
    }

    // Fallback con memoria
    const memUser = memoryStore.usuarios.find(
      (u) => u.id === auth.user.id || u.email === auth.user.email
    );

    if (!memUser) {
      return NextResponse.json(
        { success: false, error: "Usuario no encontrado en memoria." },
        { status: 404 }
      );
    }

    if (newPassword || currentPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { success: false, error: "Debes ingresar tu contraseña actual para cambiarla." },
          { status: 400 }
        );
      }
      if (!newPassword || typeof newPassword !== "string" || newPassword.length < 6) {
        return NextResponse.json(
          { success: false, error: "La nueva contraseña debe tener al menos 6 caracteres." },
          { status: 400 }
        );
      }
      const isMatch = await bcrypt.compare(String(currentPassword), memUser.passwordHash);
      if (!isMatch) {
        return NextResponse.json(
          { success: false, error: "La contraseña actual no es correcta." },
          { status: 400 }
        );
      }
      memUser.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    if (nombre !== undefined) {
      if (typeof nombre !== "string" || nombre.trim().length < 2) {
        return NextResponse.json(
          { success: false, error: "El nombre debe tener al menos 2 caracteres." },
          { status: 400 }
        );
      }
      memUser.nombre = nombre.trim();
      // Actualizar nombrePareja en el registro de la pareja si existe
      if (memUser.parejaId) {
        const pareja = memoryStore.parejas.find((p) => p.id === memUser.parejaId);
        if (pareja) {
          const partnerId = memUser.rol === "novio" ? pareja.noviaId : pareja.novioId;
          const partner = memoryStore.usuarios.find((u) => u.id === partnerId);
          if (partner) {
            partner.nombrePareja = memUser.nombre;
          }
        }
      }
    }

    if (avatarUrl !== undefined) {
      memUser.avatarUrl = avatarUrl;
    }

    let estadoPareja = memUser.estadoPareja || "esperando_pareja";
    let nombrePareja = memUser.nombrePareja;

    return NextResponse.json({
      success: true,
      message: "Perfil actualizado correctamente.",
      usuario: {
        id: memUser.id,
        nombre: memUser.nombre,
        email: memUser.email,
        rol: memUser.rol,
        parejaId: memUser.parejaId || null,
        codigoVinculacion: memUser.codigoVinculacion,
        estadoPareja,
        nombrePareja,
        avatarUrl: memUser.avatarUrl,
      },
    });
  } catch (error: any) {
    console.error("[API Update Me Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al actualizar perfil" },
      { status: 500 }
    );
  }
}
