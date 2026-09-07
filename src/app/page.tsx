"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { AppHeader } from "@/components/layout/AppHeader";
import { Sparkles, Calendar, PlusCircle, Heart } from "lucide-react";

import { NovioDashboard } from "@/components/novio/NovioDashboard";
import { NoviaDashboard } from "@/components/novia/NoviaDashboard";
import { TestRunnerModal } from "@/components/ui/TestRunnerModal";

function DashboardContent() {
  const { user, switchDemoRole } = useAuth();
  const isNovio = user?.rol === "novio";

  if (isNovio) {
    return (
      <div>
        {/* Barra de control rápido de roles para prototipo */}
        <div className="sticky top-0 z-50 flex items-center justify-between gap-3 flex-wrap px-4 py-2 bg-[#162738]/95 backdrop-blur text-white text-xs font-mono border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-white/60 uppercase tracking-widest text-[11px]">
              Nuestras Aventuras ·
            </span>
            <span className="bg-sky-400/25 text-sky-200 font-semibold px-2.5 py-0.5 rounded-full text-[11px] border border-sky-400/30">
              Samuel (Novio)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <TestRunnerModal />
            <span className="text-white/50 text-[11px] hidden sm:inline">Cambiar vista a:</span>
            <button
              onClick={() => switchDemoRole("novia")}
              className="px-3 py-1 rounded-full bg-white/10 hover:bg-sky-400 hover:text-slate-900 transition-colors font-sans text-xs font-medium cursor-pointer flex items-center gap-1.5"
            >
              <Heart size={12} className="text-blush-300" />
              <span>Ver como Diana</span>
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
      <div className="sticky top-0 z-50 flex items-center justify-between gap-3 flex-wrap px-4 py-2 bg-[#162738]/95 backdrop-blur text-white text-xs font-mono border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-white/60 uppercase tracking-widest text-[11px]">
            Nuestras Aventuras ·
          </span>
          <span className="bg-blush-400/25 text-blush-200 font-semibold px-2.5 py-0.5 rounded-full text-[11px] border border-blush-300/30">
            Diana (Buzón de cartas)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <TestRunnerModal />
          <span className="text-white/50 text-[11px] hidden sm:inline">Cambiar vista a:</span>
          <button
            onClick={() => switchDemoRole("novio")}
            className="px-3 py-1 rounded-full bg-white/10 hover:bg-sky-400 hover:text-slate-900 transition-colors font-sans text-xs font-medium cursor-pointer flex items-center gap-1.5"
          >
            <span>Ver como Samuel</span>
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
