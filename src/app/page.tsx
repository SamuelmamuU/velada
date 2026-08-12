"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { AppHeader } from "@/components/layout/AppHeader";
import { Sparkles, Calendar, PlusCircle, Heart } from "lucide-react";

import { NovioDashboard } from "@/components/novio/NovioDashboard";
import { NoviaDashboard } from "@/components/novia/NoviaDashboard";

function DashboardContent() {
  const { user, switchDemoRole } = useAuth();
  const isNovio = user?.rol === "novio";

  if (isNovio) {
    return (
      <div>
        {/* Barra de control rápido de roles para prototipo */}
        <div className="sticky top-0 z-50 flex items-center justify-between gap-3 flex-wrap px-4 py-2 bg-[#2B2438]/95 backdrop-blur text-white text-xs font-mono border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-ivory/50 uppercase tracking-widest text-[11px]">
              Sesión activa ·
            </span>
            <span className="bg-gold/20 text-gold font-semibold px-2.5 py-0.5 rounded-full text-[11px]">
              Rol Novio (Editor)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-ivory/50 text-[11px] hidden sm:inline">Cambiar vista a:</span>
            <button
              onClick={() => switchDemoRole("novia")}
              className="px-3 py-1 rounded-full bg-white/10 hover:bg-gold hover:text-ink transition-colors font-sans text-xs font-medium"
            >
              Cambiar a Novia 💛
            </button>
          </div>
        </div>

        <NovioDashboard />
      </div>
    );
  }

  return (
    <div>
      {/* Barra de control rápido de roles */}
      <div className="sticky top-0 z-50 flex items-center justify-between gap-3 flex-wrap px-4 py-2 bg-[#2B2438]/95 backdrop-blur text-white text-xs font-mono border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-ivory/50 uppercase tracking-widest text-[11px]">
            Sesión activa ·
          </span>
          <span className="bg-rose-soft/20 text-rose font-semibold px-2.5 py-0.5 rounded-full text-[11px]">
            Rol Novia (Solo Lectura)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-ivory/50 text-[11px] hidden sm:inline">Cambiar vista a:</span>
          <button
            onClick={() => switchDemoRole("novio")}
            className="px-3 py-1 rounded-full bg-white/10 hover:bg-gold hover:text-ink transition-colors font-sans text-xs font-medium"
          >
            Cambiar a Novio 🎩
          </button>
        </div>
      </div>

      <NoviaDashboard />
    </div>
  );
}

export default function Home() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}
