"use client";

import React from "react";
import { ICitaResponse } from "@/types";
import { format, isPast } from "date-fns";
import { es } from "date-fns/locale";
import {
  MapPin,
  Clock,
  Edit2,
  Trash2,
  ChevronRight,
  Sparkles,
  Users,
  Home,
  AlertCircle,
} from "lucide-react";

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
  const flaps = [
    "linear-gradient(120deg, #A5CAED, #FDEEF1)",
    "linear-gradient(120deg, #C2E2FB, #FAE7EA)",
    "linear-gradient(120deg, #BCE0FD, #EBF4FC)",
    "linear-gradient(120deg, #D4E8FA, #FCEEF1)",
  ];
  const flapGradient = flaps[index % flaps.length];

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

  const isPending =
    cita.estado === "pendiente" ||
    (!cita.estado && cita.propuestaCambio?.estado === "pendiente");
  const isAccepted = cita.estado === "aceptada" || cita.estado === "confirmada";
  const isRejected = cita.estado === "rechazada" || cita.estado === "cancelada";

  // Badges de propiedades
  const ambienteText =
    cita.ambiente === "exterior"
      ? "🌳 Exterior"
      : cita.ambiente === "mixto"
      ? "🌤️ Mixto"
      : "🏠 Interior";

  const personasCount = cita.asistencia?.cantidadPersonas || 2;
  const companiaText =
    personasCount === 2
      ? "👥 Solo nosotros"
      : `👥 ${personasCount} personas`;

  const tienePropuestaPendiente =
    cita.propuestaCambio && cita.propuestaCambio.estado === "pendiente";

  return (
    <div
      onClick={() => onSelect?.(cita)}
      className={`group relative bg-[#FCFAF5] rounded-[18px] overflow-hidden border transition-all duration-300 cursor-pointer flex flex-col ${
        isPending
          ? "border-sky-400 animate-letter-glow"
          : isRejected
          ? "border-sky-100/80 opacity-90 hover:opacity-100 shadow-card hover:shadow-card-hover hover:-translate-y-0.5"
          : "border-sky-200/70 shadow-card hover:shadow-card-hover hover:-translate-y-1"
      }`}
    >
      {/* Solapa del sobre pastel */}
      <div
        className="invite-flap w-full transition-transform duration-300 group-hover:scale-y-105 origin-top relative"
        style={{ background: flapGradient }}
      >
        {/* Sello de lacre decorativo centrado en la solapa */}
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 shadow-sm pointer-events-none">
          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-sky-400 to-sky-200 border border-white/60 flex items-center justify-center text-[10px] text-white font-bold shadow-xs">
            ♥
          </div>
        </div>

        {isPending && (
          <div className="absolute top-2 right-2 bg-sky-600 text-white font-sans text-[10.5px] font-bold px-2.5 py-0.5 rounded-full shadow flex items-center gap-1 animate-pulse">
            <Sparkles size={11} />
            <span>RESPONDE AQUÍ</span>
          </div>
        )}

        {tienePropuestaPendiente && !isPending && (
          <div className="absolute top-2 left-2 bg-blush-400 text-white font-sans text-[10.5px] font-bold px-2.5 py-0.5 rounded-full shadow flex items-center gap-1">
            <AlertCircle size={11} />
            <span>CAMBIO SUGERIDO</span>
          </div>
        )}
      </div>

      {/* Cuerpo de la invitación */}
      <div className="p-5 pt-6 flex-1 flex flex-col justify-between gap-3 bg-gradient-to-b from-white/90 to-[#FAF6EE]/90">
        <div className="space-y-2">
          {/* Badges superiores: Estado + Importancia */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span
                className={`inline-block font-sans text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                  isPending
                    ? "bg-sky-100 text-sky-800 border border-sky-300 font-semibold"
                    : isAccepted
                    ? "bg-[#EBF7EE] text-[#2F6D38] border border-[#BDE5C4]"
                    : "bg-gray-100 text-gray-600 border border-gray-200"
                }`}
              >
                {isPending
                  ? "💌 PENDIENTE DE RESPUESTA"
                  : isAccepted
                  ? "💖 ACEPTADA"
                  : "🤍 DECLINADA CON CARIÑO"}
              </span>

              {cita.importancia === "especial" && (
                <span className="bg-sky-50 text-sky-800 border border-sky-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  ✨ Especial
                </span>
              )}
            </div>

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
                    className="p-1.5 rounded-lg text-ink-soft hover:text-sky-800 hover:bg-sky-50 transition-colors"
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
                    className="p-1.5 rounded-lg text-ink-soft hover:text-blush-500 hover:bg-blush-50 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Título y Descripción con estética de carta */}
          <h3 className="font-serif text-[21px] font-bold text-ink leading-snug group-hover:text-sky-800 transition-colors">
            {cita.nombre}
          </h3>
          <p className="text-ink-soft text-[13.5px] leading-relaxed line-clamp-2 font-normal">
            {cita.descripcion}
          </p>
        </div>

        {/* Metadatos (Horario, Lugar, Compañía) */}
        <div className="pt-2 border-t border-sky-100 space-y-1.5 text-[12.5px] text-ink-soft">
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-sky-700 flex-shrink-0" />
            <span className="truncate font-semibold text-ink">{formattedDate}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-blush-400 flex-shrink-0" />
            <span className="truncate">{cita.lugar.direccion}</span>
          </div>
          <div className="flex items-center gap-2 pt-1 text-[11px] text-ink-soft font-mono flex-wrap">
            <span className="bg-sky-50 text-sky-900 border border-sky-200/60 px-2 py-0.5 rounded-md">
              {companiaText}
            </span>
            <span className="bg-sky-50 text-sky-900 border border-sky-200/60 px-2 py-0.5 rounded-md">
              {ambienteText}
            </span>
          </div>
        </div>

        {/* Temática e indicador de abrir carta */}
        <div className="pt-1 flex items-center justify-between border-t border-sky-100/60">
          <span className="inline-block font-sans text-[11px] font-semibold text-sky-800 bg-sky-100/70 px-2.5 py-0.5 rounded-full">
            {cita.tematica}
          </span>
          <span className="text-xs text-sky-800 font-bold inline-flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
            <span>Abrir carta</span>
            <ChevronRight size={13} />
          </span>
        </div>
      </div>
    </div>
  );
}
