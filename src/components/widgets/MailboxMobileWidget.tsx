"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Sparkles, Mail, Wind, CheckCircle2, RotateCcw } from "lucide-react";
import { ModeloBuzon, ICitaResponse } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { MailboxWidgetScene, WidgetMailboxState } from "./three/MailboxWidgetScene";

interface MailboxMobileWidgetProps {
  pendingCitas?: ICitaResponse[];
  onOpenMailbox?: () => void;
  className?: string;
}

export function MailboxMobileWidget({
  pendingCitas = [],
  onOpenMailbox,
  className = "",
}: MailboxMobileWidgetProps) {
  const { user, pareja } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<MailboxWidgetScene | null>(null);

  const novioName =
    user?.rol === "novio" ? user?.nombre : user?.nombrePareja || pareja?.parejaNombre || "Novio";
  const noviaName =
    user?.rol === "novia" ? user?.nombre : user?.nombrePareja || pareja?.parejaNombre || "Novia";
  const coupleNames = `${novioName} & ${noviaName}`;

  const modeloBuzon = (pareja?.modeloBuzon || "clasico") as ModeloBuzon;

  // Estado automático o seleccionado manualmente para pruebas
  const determineInitialState = (): WidgetMailboxState => {
    if (pendingCitas.length > 0) return "arriving";
    return "emptied";
  };

  const [widgetState, setWidgetState] = useState<WidgetMailboxState>(determineInitialState);
  const [unreadCount, setUnreadCount] = useState(pendingCitas.length);

  // Inicializar escena Three.js
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new MailboxWidgetScene({
      container,
      modelo: modeloBuzon,
      coupleNames,
      initialState: widgetState,
      onLetterArrived: () => {
        setUnreadCount((prev) => Math.max(1, prev));
      },
    });

    sceneRef.current = scene;

    return () => {
      scene.dispose();
      sceneRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modeloBuzon]);

  // Cambiar estado en la escena
  const handleSwitchState = (newState: WidgetMailboxState) => {
    setWidgetState(newState);
    if (sceneRef.current) {
      sceneRef.current.setState(newState);
    }
  };

  return (
    <div
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#142333]/90 to-[#0e1724]/95 border border-sky-300/30 shadow-2xl backdrop-blur-md p-4 text-white select-none ${className}`}
    >
      {/* Cabecera del Widget */}
      <div className="flex items-center justify-between z-20 relative mb-1">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-sky-500/20 border border-sky-400/40 flex items-center justify-center">
            <Mail size={15} className="text-sky-300" />
          </div>
          <div>
            <h4 className="text-xs font-bold font-serif tracking-wide text-sky-100 leading-none">
              Buzón de Pareja
            </h4>
            <p className="text-[10px] text-sky-300/80 font-mono mt-0.5">{coupleNames}</p>
          </div>
        </div>

        {/* Badge Dinámico de Estado */}
        {widgetState === "arriving" && (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-400/50 text-[10px] font-bold text-rose-300 animate-pulse">
            <Sparkles size={11} />
            <span>¡Carta en camino!</span>
          </span>
        )}

        {widgetState === "emptied" && (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-[10px] font-bold text-emerald-300">
            <CheckCircle2 size={11} />
            <span>Al día</span>
          </span>
        )}

        {widgetState === "desert_tumbleweed" && (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/50 text-[10px] font-bold text-amber-300">
            <Wind size={11} />
            <span>Desierto solitario</span>
          </span>
        )}
      </div>

      {/* Contenedor del Lienzo 3D Three.js */}
      <div
        ref={containerRef}
        onClick={onOpenMailbox}
        title="Toca para abrir el buzón completo"
        className="relative w-full h-[185px] sm:h-[210px] cursor-pointer rounded-2xl overflow-hidden my-1 flex items-center justify-center active:scale-[0.98] transition-transform"
      >
        {/* Marca de agua sutil al fondo */}
        <div className="absolute inset-0 bg-radial from-sky-500/10 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* Pie del Widget: Selector interactivo de las 3 animaciones y botón de abrir */}
      <div className="flex items-center justify-between pt-1 border-t border-white/10 z-20 relative">
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-mono text-white/50 uppercase">Probar:</span>
          <button
            type="button"
            onClick={() => handleSwitchState("arriving")}
            className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
              widgetState === "arriving"
                ? "bg-rose-500 text-white shadow-xs"
                : "bg-white/10 text-white/70 hover:bg-white/20"
            }`}
          >
            💌 Llegada
          </button>

          <button
            type="button"
            onClick={() => handleSwitchState("emptied")}
            className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
              widgetState === "emptied"
                ? "bg-emerald-500 text-white shadow-xs"
                : "bg-white/10 text-white/70 hover:bg-white/20"
            }`}
          >
            ✨ Vaciado
          </button>

          <button
            type="button"
            onClick={() => handleSwitchState("desert_tumbleweed")}
            className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
              widgetState === "desert_tumbleweed"
                ? "bg-amber-500 text-white shadow-xs"
                : "bg-white/10 text-white/70 hover:bg-white/20"
            }`}
          >
            🌵 Desierto
          </button>
        </div>

        {onOpenMailbox && (
          <button
            type="button"
            onClick={onOpenMailbox}
            className="text-[10px] font-bold text-sky-300 hover:text-white underline underline-offset-2 flex items-center gap-1 cursor-pointer"
          >
            Abrir Buzón →
          </button>
        )}
      </div>
    </div>
  );
}
