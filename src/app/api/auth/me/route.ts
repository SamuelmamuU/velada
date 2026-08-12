import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Usuario } from "@/models/Usuario";
import { memoryStore } from "@/lib/store";

export async function GET(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth.errorResponse) return auth.errorResponse;

    const db = await connectDB();

    if (db) {
      try {
        const user = await Usuario.findById(auth.user.id);
        if (user) {
          return NextResponse.json({
            success: true,
            usuario: {
              id: user._id.toString(),
              nombre: user.nombre,
              email: user.email,
              rol: user.rol,
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

    return NextResponse.json({
      success: true,
      usuario: {
        id: memUser?.id || auth.user.id,
        nombre: memUser?.nombre || auth.user.nombre,
        email: memUser?.email || auth.user.email,
        rol: memUser?.rol || auth.user.rol,
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
