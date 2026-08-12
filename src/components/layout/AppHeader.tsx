"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { Seal } from "@/components/ui/Seal";
import { LogOut, ArrowLeft } from "lucide-react";

interface AppHeaderProps {
  tag?: string;
  onBack?: () => void;
  backLabel?: string;
}

export function AppHeader({ tag, onBack, backLabel = "Volver" }: AppHeaderProps) {
  const { user, logout } = useAuth();

  const defaultTag =
    user?.rol === "novio" ? "PANEL DEL NOVIO" : "MIS CITAS";

  const displayTag = tag || defaultTag;
  const userInitial = user?.nombre?.charAt(0).toUpperCase() || (user?.rol === "novio" ? "N" : "N");

  return (
    <header className="flex items-center justify-between flex-wrap gap-4 mb-9">
      {/* Marca / Logo */}
      <div className="flex items-center gap-3.5">
        <Seal size="md" />
        <div>
          <div className="font-serif font-semibold text-[22px] text-ink leading-tight">
            Velada
          </div>
          <div className="font-mono text-[11px] text-ink-soft tracking-[0.06em] uppercase">
            {displayTag}
          </div>
        </div>
      </div>

      {/* Acciones y Chip de Usuario */}
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-ink-soft bg-transparent border border-line hover:bg-paper/80 transition-colors"
          >
            <ArrowLeft size={16} />
            <span>{backLabel}</span>
          </button>
        )}

        {user && (
          <div className="flex items-center gap-2.5 bg-card border border-line py-1.5 pl-1.5 pr-3.5 rounded-full text-[13px] font-medium shadow-sm">
            <div className="w-[30px] h-[30px] rounded-full bg-rose-soft flex items-center justify-center font-serif font-semibold text-rose text-[13px]">
              {userInitial}
            </div>
            <span className="text-ink">{user.nombre}</span>
          </div>
        )}

        <button
          onClick={() => logout()}
          title="Cerrar sesión"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium text-ink-soft bg-transparent border border-line hover:text-rose hover:border-rose-soft hover:bg-rose-soft/20 transition-all"
        >
          <LogOut size={15} />
          <span className="hidden sm:inline">Salir</span>
        </button>
      </div>
    </header>
  );
}
