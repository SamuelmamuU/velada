import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Usuario } from "@/models/Usuario";

export async function GET(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth.errorResponse) return auth.errorResponse;

    await connectDB();
    const user = await Usuario.findById(auth.user.id);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

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
  } catch (error: any) {
    console.error("[API Me Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al obtener perfil" },
      { status: 500 }
    );
  }
}
