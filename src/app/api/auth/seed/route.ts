import { NextResponse } from "next/server";
import { seedDatabase } from "@/lib/seed";

export async function POST() {
  try {
    const result = await seedDatabase();
    return NextResponse.json({
      success: true,
      message: "Base de datos inicializada con usuarios predeterminados",
      ...result,
    });
  } catch (error: any) {
    console.error("[API Seed Error]:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Error al inicializar usuarios en base de datos",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Permitir GET para facilitar inicialización rápida desde navegador si es necesario
  return POST();
}
