"use client";

import React from "react";
import Image from "next/image";
import { ICitaResponse } from "@/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Camera, Sparkles, Heart, Plus, MapPin } from "lucide-react";

interface PolaroidMemoriesGalleryProps {
  citas: ICitaResponse[];
  onSelectMemory: (cita: ICitaResponse) => void;
  onAddMemory?: () => void;
  partnerName?: string;
}

const ROTATIONS = [
  "rotate-[-3deg] hover:rotate-0",
  "rotate-[2.5deg] hover:rotate-0",
  "rotate-[-2deg] hover:rotate-0",
  "rotate-[3deg] hover:rotate-0",
  "rotate-[-1.5deg] hover:rotate-0",
  "rotate-[2deg] hover:rotate-0",
];

const WASHI_COLORS = [
  "bg-amber-100/90 border-amber-300/60",
  "bg-sky-100/90 border-sky-300/60",
  "bg-rose-100/90 border-rose-300/60",
  "bg-emerald-100/90 border-emerald-300/60",
  "bg-purple-100/90 border-purple-300/60",
  "bg-amber-100/90 border-amber-300/60",
];

export function PolaroidMemoriesGallery({
  citas,
  onSelectMemory,
  onAddMemory,
  partnerName,
}: PolaroidMemoriesGalleryProps) {
  // Filtrar citas que tienen recuerdo con foto asignada
  const citasConFoto = citas.filter((c) => Boolean(c.recuerdo?.fotoUrl));

  if (citasConFoto.length === 0) {
    return null;
  }

  return (
    <div className="mt-12 pt-10 border-t border-sky-100/80">
      {/* Cabecera de la sección álbum */}
      <div className="flex items-end justify-between flex-wrap gap-4 mb-6">
        <div>
          <div className="flex items-center gap-1.5 text-sky-800 font-mono text-[11px] uppercase tracking-wider mb-1 font-bold">
            <Camera size={14} className="text-sky-600" />
            <span>Álbum de Nuestro Diario</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink tracking-tight">
            Nuestros Recuerdos Polaroid
          </h2>
          <p className="text-ink-soft text-xs sm:text-sm mt-0.5 max-w-xl">
            Momentos especiales capturados en nuestras aventuras juntos. Toca cualquier foto para revivir la carta y los detalles.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-sky-800 bg-sky-50 px-3 py-1.5 rounded-full border border-sky-200">
          <Heart size={13} className="text-blush-500 fill-blush-400" />
          <span>{citasConFoto.length} {citasConFoto.length === 1 ? "foto guardada" : "fotos guardadas"}</span>
        </div>
      </div>

      {/* Galería tipo muro / pinboard de polaroids */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6 pt-2">
        {citasConFoto.map((cita, index) => {
          const rotationClass = ROTATIONS[index % ROTATIONS.length];
          const washiClass = WASHI_COLORS[index % WASHI_COLORS.length];
          const fotoUrl = cita.recuerdo?.fotoUrl || "";
          const pieDeFoto = cita.recuerdo?.pieDeFoto || cita.nombre;

          let fechaLegible = "";
          try {
            fechaLegible = format(new Date(cita.horario), "d 'de' MMMM, yyyy", { locale: es });
          } catch {
            fechaLegible = cita.horario;
          }

          return (
            <div
              key={cita.id}
              onClick={() => onSelectMemory(cita)}
              className={`group relative bg-white p-3 sm:p-3.5 pb-6 sm:pb-7 rounded-sm shadow-md hover:shadow-xl transition-all duration-300 transform ${rotationClass} hover:scale-105 cursor-pointer border border-sky-100/90 flex flex-col justify-between`}
            >
              {/* Trozo de cinta adhesiva washi tape en la parte superior */}
              <div
                className={`absolute -top-3 left-1/2 -translate-x-1/2 w-14 h-4 ${washiClass} border shadow-2xs z-10`}
                style={{
                  clipPath: "polygon(0 0, 100% 0, 95% 100%, 5% 100%)",
                }}
              />

              {/* Contenedor de la foto */}
              <div className="relative aspect-square w-full rounded-xs overflow-hidden bg-sky-950/5 mb-3 border border-sky-900/10">
                <Image
                  src={fotoUrl}
                  alt={pieDeFoto}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-sky-900/5 group-hover:bg-transparent transition-colors" />
              </div>

              {/* Pie de foto manuscrito con estética de rotulador / pluma */}
              <div className="text-center px-1">
                <p className="font-handwriting text-base sm:text-lg text-sky-950 font-bold leading-tight line-clamp-2">
                  {pieDeFoto}
                </p>
                <div className="flex items-center justify-center gap-1 mt-1.5 text-[10px] font-mono text-ink-soft uppercase tracking-wider">
                  <MapPin size={10} className="text-sky-600" />
                  <span className="truncate max-w-[120px]">{cita.tematica || "Aventura"}</span>
                  <span>·</span>
                  <span>{fechaLegible}</span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Polaroid vacía opcional para invitar a agregar recuerdo si hay citas pasadas sin foto */}
        {onAddMemory && (
          <div
            onClick={onAddMemory}
            className="group relative bg-sky-50/60 p-3 sm:p-3.5 pb-6 sm:pb-7 rounded-sm border-2 border-dashed border-sky-300/80 hover:border-sky-500 shadow-xs hover:shadow-md transition-all duration-300 transform rotate-[1deg] hover:rotate-0 hover:scale-105 cursor-pointer flex flex-col items-center justify-center min-h-[220px] text-center"
          >
            <div className="w-12 h-12 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 mb-2 group-hover:bg-sky-600 group-hover:text-white transition-colors">
              <Plus size={22} />
            </div>
            <span className="font-handwriting text-lg text-sky-950 font-bold">
              Agregar Recuerdo
            </span>
            <span className="text-[11px] text-ink-soft font-mono mt-0.5 px-2">
              Sube otra foto polaroid a tus citas pasadas
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
