"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { AppLogo } from "@/components/ui/AppLogo";
import { LogOut, ArrowLeft } from "lucide-react";
import { PairingStatusBadge } from "@/components/pareja/PairingStatusBadge";

interface AppHeaderProps {
  tag?: string;
  onBack?: () => void;
  backLabel?: string;
}

export function AppHeader({ tag, onBack, backLabel = "Volver" }: AppHeaderProps) {
  const { user, logout } = useAuth();

  const defaultTag =
    user?.rol === "novio"
      ? `PANEL DE ${(user?.nombre || "SAMUEL").toUpperCase()}`
      : `BUZÓN DE ${(user?.nombre || "DIANA").toUpperCase()}`;

  const displayTag = tag || defaultTag;
  const userInitial = user?.nombre?.charAt(0).toUpperCase() || (user?.rol === "novio" ? "S" : "D");

  return (
    <header className="flex items-center justify-between flex-wrap gap-4 mb-9">
      {/* Marca / Logo con NuestrasAventurasLG.png */}
      <div className="flex items-center gap-3">
        <AppLogo size="md" />
        <div>
          <div className="font-serif font-bold text-[22px] sm:text-[24px] text-ink leading-tight tracking-tight">
            Nuestras Aventuras
          </div>
          <div className="font-mono text-[10px] sm:text-[10.5px] text-sky-800 tracking-[0.12em] uppercase font-semibold">
            {displayTag}
          </div>
        </div>
      </div>

      {/* Acciones, Estado de Pareja QR y Chip de Usuario */}
      <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
        {onBack && (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium text-ink-soft bg-card/80 border border-line hover:bg-sky-50 hover:text-sky-700 hover:border-sky-300 transition-all shadow-sm"
          >
            <ArrowLeft size={15} />
            <span>{backLabel}</span>
          </button>
        )}

        <PairingStatusBadge />

        {user && (
          <div className="flex items-center gap-2 bg-card border border-line/80 py-1.5 pl-1.5 pr-3 rounded-full text-xs font-medium shadow-sm">
            <div className="w-[28px] h-[28px] rounded-full bg-sky-100 flex items-center justify-center font-serif font-bold text-sky-700 text-xs">
              {userInitial}
            </div>
            <span className="text-ink font-semibold">{user.nombre}</span>
          </div>
        )}

        <button
          onClick={() => logout()}
          title="Cerrar sesión"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium text-ink-soft bg-card/60 border border-line/80 hover:text-blush-500 hover:border-blush-200 hover:bg-blush-50 transition-all shadow-sm cursor-pointer"
        >
          <LogOut size={14} />
          <span className="hidden sm:inline">Salir</span>
        </button>
      </div>
    </header>
  );
}

