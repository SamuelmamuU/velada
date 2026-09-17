"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useState } from "react";
import { ICitaResponse, IRecuerdoIndependiente } from "@/types";
import { ThemeConfig } from "@/lib/theme";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Camera, Sparkles, Heart, Plus, MapPin, X, Trash2 } from "lucide-react";
import { AddPolaroidModal } from "@/components/dashboard/AddPolaroidModal";
import { triggerHaptic } from "@/lib/mobileNative";
import { useAuth } from "@/context/AuthContext";

interface PolaroidMemoriesGalleryProps {
  citas: ICitaResponse[];
  recuerdos?: IRecuerdoIndependiente[];
  onSelectMemory: (cita: ICitaResponse) => void;
  onSelectRecuerdo?: (recuerdo: IRecuerdoIndependiente) => void;
  onAddMemory?: () => void;
  onRecuerdoAdded?: (nuevo: IRecuerdoIndependiente) => void;
  onRecuerdoDeleted?: (id: string) => void;
  partnerName?: string;
  theme?: ThemeConfig;
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
  recuerdos = [],
  onSelectMemory,
  onSelectRecuerdo,
  onAddMemory,
  onRecuerdoAdded,
  onRecuerdoDeleted,
  partnerName,
  theme,
}: PolaroidMemoriesGalleryProps) {
  const { token } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedRecuerdo, setSelectedRecuerdo] =
    useState<IRecuerdoIndependiente | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filtrar citas que tienen recuerdo con foto asignada
  const citasConFoto = citas.filter((c) => Boolean(c.recuerdo?.fotoUrl));

  // Combinar todos los recuerdos para el total
  const totalFotos = citasConFoto.length + recuerdos.length;

  const handleDeleteRecuerdo = async (id: string) => {
    if (!token) return;
    setDeletingId(id);
    try {
      await fetch(`/api/recuerdos/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      triggerHaptic("medium");
      setSelectedRecuerdo(null);
      onRecuerdoDeleted?.(id);
      // Limpiar de localStorage también
      try {
        const local = JSON.parse(
          localStorage.getItem("velada_polaroids_libres") || "[]"
        );
        const filtered = local.filter((r: any) => r.id !== id);
        localStorage.setItem(
          "velada_polaroids_libres",
          JSON.stringify(filtered)
        );
      } catch {}
      try {
        window.dispatchEvent(new CustomEvent("velada_polaroids_updated"));
      } catch {}
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="mt-12 pt-10 border-t border-slate-200/80">
      {/* Cabecera de la sección álbum */}
      <div className="flex items-end justify-between flex-wrap gap-4 mb-6">
        <div>
          <div className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider mb-1 font-bold text-ink-soft">
            <Camera size={14} className={theme ? theme.textAccent : "text-sky-600"} />
            <span>Álbum de Nuestro Diario</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink tracking-tight">
            Nuestros Recuerdos Polaroid
          </h2>
          <p className="text-ink-soft text-xs sm:text-sm mt-0.5 max-w-xl">
            Momentos especiales capturados en nuestras aventuras juntos. Toca
            cualquier foto para revivir los detalles.
          </p>
          <p className="text-[11px] font-mono text-sky-700 font-semibold mt-1 flex items-center gap-1">
            <Sparkles size={12} className="text-amber-500" />
            <span>Las 6 fotos que suban aquí decoran el fondo de su diario de viajes.</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-mono text-ink-soft bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-2xs">
            <Heart size={13} className="text-rose-500 fill-rose-400" />
            <span>
              {totalFotos}{" "}
              {totalFotos === 1 ? "foto guardada" : "fotos guardadas"}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              if (onAddMemory) onAddMemory();
              else setShowAddModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-ink text-white hover:bg-ink/80 transition-colors shadow-xs cursor-pointer"
          >
            <Plus size={14} />
            <span>Subir Polaroid</span>
          </button>
        </div>
      </div>

      {/* Galería tipo muro / pinboard de polaroids */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6 pt-2">
        {/* 1. Polaroids de Citas */}
        {citasConFoto.map((cita, index) => {
          const rotationClass = ROTATIONS[index % ROTATIONS.length];
          const washiClass = WASHI_COLORS[index % WASHI_COLORS.length];
          const fotoUrl = cita.recuerdo?.fotoUrl || "";
          const pieDeFoto = cita.recuerdo?.pieDeFoto || cita.nombre;

          let fechaLegible = "";
          try {
            fechaLegible = format(new Date(cita.horario), "d 'de' MMMM, yyyy", {
              locale: es,
            });
          } catch {
            fechaLegible = cita.horario;
          }

          return (
            <div
              key={cita.id}
              onClick={() => onSelectMemory(cita)}
              className={`group relative bg-white p-3 sm:p-3.5 pb-6 sm:pb-7 rounded-sm shadow-md hover:shadow-xl transition-all duration-300 transform ${rotationClass} hover:scale-105 cursor-pointer border border-slate-200 flex flex-col justify-between`}
            >
              {/* Trozo de cinta adhesiva washi tape */}
              <div
                className={`absolute -top-3 left-1/2 -translate-x-1/2 w-14 h-4 ${washiClass} border shadow-2xs z-10`}
                style={{ clipPath: "polygon(0 0, 100% 0, 95% 100%, 5% 100%)" }}
              />

              {/* Contenedor de la foto */}
              <div className="relative aspect-square w-full rounded-xs overflow-hidden bg-slate-100 mb-3 border border-slate-200">
                <img
                  src={fotoUrl}
                  alt={pieDeFoto}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              {/* Pie de foto */}
              <div className="text-center px-1">
                <p className="font-handwriting text-base sm:text-lg text-ink font-bold leading-tight line-clamp-2">
                  {pieDeFoto}
                </p>
                <div className="flex items-center justify-center gap-1 mt-1.5 text-[10px] font-mono text-ink-soft uppercase tracking-wider">
                  <MapPin size={10} className="text-sky-600" />
                  <span className="truncate max-w-[110px]">
                    {cita.tematica || "Velada"}
                  </span>
                  <span>·</span>
                  <span>{fechaLegible}</span>
                </div>
              </div>
            </div>
          );
        })}

        {/* 2. Polaroids Independientes */}
        {recuerdos.map((recuerdo, index) => {
          const rotationClass =
            ROTATIONS[(index + citasConFoto.length) % ROTATIONS.length];
          const washiClass =
            WASHI_COLORS[(index + citasConFoto.length) % WASHI_COLORS.length];
          const fotoUrl = recuerdo.fotoUrl;
          const pieDeFoto = recuerdo.pieDeFoto || "Nuestro Momento";

          let fechaLegible = "";
          try {
            fechaLegible = format(
              new Date(recuerdo.fecha),
              "d 'de' MMMM, yyyy",
              { locale: es }
            );
          } catch {
            fechaLegible = recuerdo.fecha;
          }

          return (
            <div
              key={recuerdo.id}
              onClick={() => {
                if (onSelectRecuerdo) onSelectRecuerdo(recuerdo);
                else setSelectedRecuerdo(recuerdo);
              }}
              className={`group relative bg-white p-3 sm:p-3.5 pb-6 sm:pb-7 rounded-sm shadow-md hover:shadow-xl transition-all duration-300 transform ${rotationClass} hover:scale-105 cursor-pointer border border-slate-200 flex flex-col justify-between`}
            >
              <div
                className={`absolute -top-3 left-1/2 -translate-x-1/2 w-14 h-4 ${washiClass} border shadow-2xs z-10`}
                style={{ clipPath: "polygon(0 0, 100% 0, 95% 100%, 5% 100%)" }}
              />

              <div className="relative aspect-square w-full rounded-xs overflow-hidden bg-slate-100 mb-3 border border-slate-200">
                <img
                  src={fotoUrl}
                  alt={pieDeFoto}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              <div className="text-center px-1">
                <p className="font-handwriting text-base sm:text-lg text-ink font-bold leading-tight line-clamp-2">
                  {pieDeFoto}
                </p>
                <div className="flex items-center justify-center gap-1 mt-1.5 text-[10px] font-mono text-ink-soft uppercase tracking-wider">
                  <Sparkles size={10} className="text-rose-500" />
                  <span>Recuerdo</span>
                  <span>·</span>
                  <span>{fechaLegible}</span>
                </div>
              </div>
            </div>
          );
        })}

        {/* 3. Tarjeta botón para agregar polaroid */}
        <div
          onClick={() => {
            if (onAddMemory) onAddMemory();
            else setShowAddModal(true);
          }}
          className="group relative bg-slate-50/70 p-3 sm:p-3.5 pb-6 sm:pb-7 rounded-sm border-2 border-dashed border-slate-300 hover:border-sky-500 shadow-2xs hover:shadow-md transition-all duration-300 transform rotate-[1deg] hover:rotate-0 hover:scale-105 cursor-pointer flex flex-col items-center justify-center min-h-[220px] text-center"
        >
          <div className="w-12 h-12 rounded-full bg-white shadow-2xs border border-slate-200 flex items-center justify-center text-ink-soft mb-2 group-hover:bg-sky-600 group-hover:text-white transition-colors">
            <Plus size={22} />
          </div>
          <span className="font-handwriting text-lg text-ink font-bold">
            Agregar Recuerdo
          </span>
          <span className="text-[11px] text-ink-soft font-mono mt-0.5 px-2">
            Sube otra foto Polaroid a su diario de aventuras
          </span>
        </div>
      </div>

      {/* Modal para ver Polaroid Independiente en grande */}
      {selectedRecuerdo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/70 backdrop-blur-sm animate-fade-up">
          <div className="bg-white p-5 sm:p-6 pb-8 rounded-sm shadow-2xl max-w-xs w-full text-center border border-slate-200 relative transform rotate-[-1deg]">
            <button
              onClick={() => setSelectedRecuerdo(null)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-ink text-white hover:bg-ink/80 flex items-center justify-center shadow-md cursor-pointer"
            >
              <X size={16} />
            </button>

            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-4 bg-amber-200/90 border border-amber-300 shadow-2xs" />

            <div className="relative aspect-square w-full rounded-xs overflow-hidden bg-slate-100 mb-3 border border-slate-200 mt-2">
              <img
                src={selectedRecuerdo.fotoUrl}
                alt={selectedRecuerdo.pieDeFoto || "Recuerdo Polaroid"}
                className="w-full h-full object-cover"
              />
            </div>

            <p className="font-handwriting text-xl text-ink font-bold leading-tight">
              {selectedRecuerdo.pieDeFoto || "Nuestro Momento"}
            </p>
            <p className="text-[11px] font-mono text-ink-soft uppercase tracking-wider mt-1">
              {format(new Date(selectedRecuerdo.fecha), "d 'de' MMMM, yyyy", {
                locale: es,
              })}
            </p>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-center">
              <button
                type="button"
                onClick={() => handleDeleteRecuerdo(selectedRecuerdo.id)}
                disabled={deletingId === selectedRecuerdo.id}
                className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
              >
                <Trash2 size={13} />
                <span>Eliminar recuerdo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Agregar Polaroid */}
      <AddPolaroidModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={(nuevo) => {
          onRecuerdoAdded?.(nuevo);
        }}
      />
    </div>
  );
}
