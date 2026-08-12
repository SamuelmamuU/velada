"use client";

import React from "react";
import { ICitaResponse } from "@/types";
import { format, isPast } from "date-fns";
import { es } from "date-fns/locale";
import { MapPin, Clock, Edit2, Trash2, ChevronRight, Sparkles } from "lucide-react";

interface InviteCardProps {
  cita: ICitaResponse;
  index?: number;
  isNovio?: boolean;
  isNew?: boolean;
  onSelect?: (cita: ICitaResponse) => void;
  onEdit?: (cita: ICitaResponse) => void;
  onDelete?: (cita: ICitaResponse) => void;
}

export function InviteCard({
  cita,
  index = 0,
  isNovio = false,
  isNew = false,
  onSelect,
  onEdit,
  onDelete,
}: InviteCardProps) {
  // Degrades dinámicos de solapas
  const flaps = [
    "linear-gradient(120deg, var(--rose), var(--gold))",
    "linear-gradient(120deg, var(--gold), var(--rose))",
    "linear-gradient(120deg, var(--rose), #D6A6E0)",
    "linear-gradient(120deg, #D6A6E0, var(--gold))",
  ];
  const flapGradient = flaps[index % flaps.length];

  // Formato de fecha
  let formattedDate = "";
  let isDatePast = false;
  try {
    const d = new Date(cita.horario);
    formattedDate = format(d, "EEE dd MMM · h:mm a", { locale: es });
    formattedDate =
      formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
    isDatePast = isPast(d);
  } catch {
    formattedDate = cita.horario;
  }

  const isCancelled = cita.estado === "cancelada";
  const isPending = cita.estado === "pendiente";

  return (
    <div
      onClick={() => onSelect?.(cita)}
      className={`group relative bg-card rounded-[6px_6px_18px_18px] overflow-hidden border border-line shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col ${
        isCancelled ? "opacity-75 grayscale-[30%]" : ""
      } ${isNew ? "ring-2 ring-gold shadow-lg" : ""}`}
    >
      {/* Solapa del sobre */}
      <div
        className="invite-flap w-full transition-transform duration-300 group-hover:scale-y-105 origin-top relative"
        style={{ background: flapGradient }}
      >
        {isNew && (
          <div className="absolute top-2 right-2 bg-ink text-gold font-mono text-[10px] font-bold px-2 py-0.5 rounded-full shadow flex items-center gap-1 animate-pulse">
            <Sparkles size={11} />
            <span>NUEVA</span>
          </div>
        )}
      </div>

      {/* Cuerpo de la invitación */}
      <div className="p-5 flex-1 flex flex-col justify-between gap-3">
        <div className="space-y-2">
          {/* Badge de Estado */}
          <div className="flex items-center justify-between gap-2">
            <span
              className={`inline-block font-mono text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                isCancelled
                  ? "bg-rose-soft text-rose"
                  : isPending
                  ? "bg-[#F6EAD2] text-gold-deep"
                  : "bg-[#E4EFE2] text-[#3E7A3D]"
              }`}
            >
              {isCancelled
                ? "CANCELADA"
                : isPending
                ? "PENDIENTE"
                : isDatePast
                ? "REALIZADA"
                : "CONFIRMADA"}
            </span>

            {isNovio && (
              <div
                className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                {onEdit && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(cita);
                    }}
                    title="Editar cita"
                    className="p-1.5 rounded-lg text-ink-soft hover:text-ink hover:bg-paper transition-colors"
                  >
                    <Edit2 size={14} />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(cita);
                    }}
                    title="Eliminar cita"
                    className="p-1.5 rounded-lg text-ink-soft hover:text-rose hover:bg-rose-soft/30 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Título y Descripción */}
          <h3 className="font-serif text-[20px] font-semibold text-ink leading-snug group-hover:text-gold-deep transition-colors">
            {cita.nombre}
          </h3>
          <p className="text-ink-soft text-[13.5px] leading-relaxed line-clamp-2">
            {cita.descripcion}
          </p>
        </div>

        {/* Metadatos (Horario y Lugar) */}
        <div className="pt-2 border-t border-line/60 space-y-1.5 text-[12.5px] text-ink-soft">
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-gold-deep flex-shrink-0" />
            <span className="truncate">{formattedDate}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-rose flex-shrink-0" />
            <span className="truncate">{cita.lugar.direccion}</span>
          </div>
        </div>

        {/* Temática e indicador de ver detalle */}
        <div className="pt-1 flex items-center justify-between">
          <span className="inline-block font-sans text-[11px] font-semibold text-rose bg-rose-soft px-2.5 py-0.5 rounded-full">
            Temática: {cita.tematica}
          </span>
          <span className="text-xs text-gold-deep font-medium inline-flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
            Ver detalle <ChevronRight size={13} />
          </span>
        </div>
      </div>
    </div>
  );
}
