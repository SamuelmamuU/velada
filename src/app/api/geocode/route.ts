import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth.errorResponse) return auth.errorResponse;

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim();

    if (!query || query.length < 2) {
      return NextResponse.json(
        { success: false, error: "Término de búsqueda demasiado corto" },
        { status: 400 }
      );
    }

    // Usar Nominatim OpenStreetMap (100% gratuito) con User-Agent requerido por la política de OSM
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      query
    )}&limit=5&addressdetails=1`;

    const res = await fetch(nominatimUrl, {
      headers: {
        "User-Agent": "Velada-App/1.0 (https://velada.app)",
        "Accept-Language": "es,en;q=0.8",
      },
    });

    if (!res.ok) {
      throw new Error(`Nominatim respondió con código ${res.status}`);
    }

    const data = await res.json();

    const results = (data || []).map((item: any) => ({
      display_name: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      type: item.type,
    }));

    return NextResponse.json({
      success: true,
      query,
      results,
    });
  } catch (error: any) {
    console.error("[Geocode API Error]:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Error al geocodificar la dirección",
        results: [],
      },
      { status: 500 }
    );
  }
}
