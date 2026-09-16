import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireAuth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Recuerdo } from "@/models/Recuerdo";
import { memoryStore } from "@/lib/store";

interface RouteParams {
  params: {
    id: string;
  };
}

// DELETE /api/recuerdos/:id — Eliminar un recuerdo polaroid
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const auth = requireAuth(req);
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = params;
    const db = await connectDB();

    if (db && mongoose.Types.ObjectId.isValid(id)) {
      try {
        await Recuerdo.findByIdAndDelete(id);
        return NextResponse.json({
          success: true,
          message: "Recuerdo polaroid eliminado.",
        });
      } catch (dbErr) {
        console.warn("[MongoDB DELETE /recuerdos error, fallback]:", dbErr);
      }
    }

    if (memoryStore.recuerdos) {
      memoryStore.recuerdos = memoryStore.recuerdos.filter((r) => r.id !== id);
    }

    return NextResponse.json({
      success: true,
      message: "Recuerdo polaroid eliminado.",
    });
  } catch (error: any) {
    console.error("[DELETE /api/recuerdos Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al eliminar el recuerdo" },
      { status: 500 }
    );
  }
}
