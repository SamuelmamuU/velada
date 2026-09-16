"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { ThemeConfig } from "@/lib/theme";
import { Heart, Sparkles, Settings, Palette } from "lucide-react";
import { EditProfileModal } from "@/components/auth/EditProfileModal";
import { ThemeSelectorModal } from "@/components/dashboard/ThemeSelectorModal";

interface CoupleAvatarHeaderProps {
  theme: ThemeConfig;
}

export function CoupleAvatarHeader({ theme }: CoupleAvatarHeaderProps) {
  const { user, pareja } = useAuth();
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [themeModalOpen, setThemeModalOpen] = useState(false);

  const isNovio = user?.rol === "novio";
  const myName = user?.nombre || (isNovio ? "Novio" : "Novia");
  const myAvatar = user?.avatarUrl;

  const partnerName =
    user?.nombrePareja ||
    pareja?.parejaNombre ||
    (isNovio ? "Novia" : "Novio");
  const partnerAvatar = pareja?.parejaAvatarUrl;

  const isConnected =
    pareja?.estado === "conectados" || user?.estadoPareja === "conectados";

  // Orden de avatares: Novio a la izquierda, Novia a la derecha para consistencia romántica
  const leftName = isNovio ? myName : partnerName;
  const leftAvatar = isNovio ? myAvatar : partnerAvatar;
  const leftInitial = leftName.charAt(0).toUpperCase() || "N";

  const rightName = isNovio ? partnerName : myName;
  const rightAvatar = isNovio ? partnerAvatar : myAvatar;
  const rightInitial = rightName.charAt(0).toUpperCase() || "D";

  return (
    <>
      <div className="w-full bg-white/80 backdrop-blur-md rounded-[24px] border border-slate-200/80 p-4 sm:p-5 shadow-xs mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Lado izquierdo: Círculos entrelazados con el corazón */}
        <div className="flex items-center gap-4 w-full sm:w-auto justify-center sm:justify-start">
          {/* Contenedor de círculos semi-entrelazados */}
          <div
            className="relative flex items-center cursor-pointer group"
            onClick={() => setProfileModalOpen(true)}
            title="Toca para editar tu foto o perfil"
          >
            {/* Círculo 1 (Izquierdo) */}
            <div className="relative w-13 h-13 sm:w-14 sm:h-14 rounded-full border-[3px] border-white shadow-md overflow-hidden bg-gradient-to-tr from-sky-400 to-indigo-500 flex items-center justify-center text-white font-serif font-bold text-lg transition-transform group-hover:scale-105 z-0">
              {leftAvatar ? (
                <img
                  src={leftAvatar}
                  alt={leftName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{leftInitial}</span>
              )}
            </div>

            {/* Círculo 2 (Derecho - semi entrelazado / superpuesto) */}
            <div className="relative w-13 h-13 sm:w-14 sm:h-14 -ml-4 rounded-full border-[3px] border-white shadow-md overflow-hidden bg-gradient-to-tr from-rose-400 to-pink-500 flex items-center justify-center text-white font-serif font-bold text-lg transition-transform group-hover:scale-105 z-10">
              {rightAvatar ? (
                <img
                  src={rightAvatar}
                  alt={rightName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{rightInitial}</span>
              )}
            </div>

            {/* Corazón en la unión superior de ambos círculos */}
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-20 w-7 h-7 rounded-full bg-white shadow-md border border-rose-100 flex items-center justify-center animate-bounce duration-1000">
              <Heart
                size={15}
                className="fill-rose-500 text-rose-500 drop-shadow-xs"
              />
            </div>
          </div>

          {/* Información de la pareja */}
          <div className="text-left">
            <div className="flex items-center gap-2">
              <h2 className="font-serif font-bold text-lg sm:text-xl text-ink leading-tight">
                {leftName} &amp; {rightName}
              </h2>
            </div>
            <p className="text-ink-soft text-xs mt-0.5 flex items-center gap-1.5 font-sans">
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? "bg-emerald-500 animate-pulse" : "bg-amber-400"
                }`}
              />
              <span>
                {isConnected
                  ? "Juntos en cada aventura"
                  : "Esperando vinculación"}
              </span>
            </p>
          </div>
        </div>

        {/* Lado derecho: Botones rápidos de personalización y perfil */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={() => setThemeModalOpen(true)}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-ink hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            title={`Personalizar el color del dashboard de ${partnerName}`}
          >
            <Palette size={14} className={theme.textAccent} />
            <span>Color para {partnerName}</span>
          </button>

          <button
            type="button"
            onClick={() => setProfileModalOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-ink hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            title="Mi perfil"
          >
            <Settings size={14} className="text-ink-soft" />
            <span className="hidden xs:inline">Mi Perfil</span>
          </button>
        </div>
      </div>

      <EditProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />

      <ThemeSelectorModal
        isOpen={themeModalOpen}
        onClose={() => setThemeModalOpen(false)}
      />
    </>
  );
}
