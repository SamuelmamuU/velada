"use client";

import React from "react";
import { ICitaResponse } from "@/types";
import { format, isPast } from "date-fns";
import { es } from "date-fns/locale";
import {
  Calendar,
  Clock,
  Sparkles,
  Heart,
  Mail,
  Camera,
  Edit2,
  Trash2,
  Check,
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
  const hasMemory = Boolean(cita.recuerdo?.fotoUrl);

  return (
    <div
      onClick={() => onSelect?.(cita)}
      className={`group relative bg-[#FCFAF5] rounded-[20px] overflow-hidden border transition-all duration-300 cursor-pointer select-none flex flex-col justify-between min-h-[220px] sm:min-h-[235px] p-6 shadow-card hover:shadow-card-hover hover:-translate-y-1 ${
        isPending
          ? "border-sky-400 animate-letter-glow ring-2 ring-sky-300/40"
          : isRejected
          ? "border-sky-200/50 opacity-80 hover:opacity-100"
          : "border-sky-200/80"
      }`}
      style={{
        backgroundImage:
          "radial-gradient(rgba(45, 85, 125, 0.04) 1px, transparent 0), linear-gradient(180deg, #FFFFFF 0%, #FAF6EE 100%)",
        backgroundSize: "16px 16px, 100% 100%",
      }}
    >
      {/* ========================================================================= */}
      {/* SOLAPA TRIANGULAR SUPERIOR DEL SOBRE CERRADO */}
      {/* ========================================================================= */}
      <div className="absolute top-0 left-0 right-0 h-[80px] pointer-events-none overflow-hidden">
        <svg
          viewBox="0 0 400 90"
          className="w-full h-full preserve-3d"
          preserveAspectRatio="none"
        >
          {/* Sombra de la solapa */}
          <polygon
            points="0,0 400,0 200,82"
            fill="rgba(35, 65, 95, 0.06)"
          />
          {/* Solapa superior en azul pastel apergaminado */}
          <polygon
            points="0,0 400,0 200,76"
            fill="#F2F7FD"
            stroke="#D3E5F7"
            strokeWidth="1.2"
          />
          {/* Pliegue interno suave */}
          <line
            x1="0"
            y1="0"
            x2="200"
            y2="76"
            stroke="#C0DBF5"
            strokeWidth="0.8"
            strokeDasharray="4 3"
          />
          <line
            x1="400"
            y1="0"
            x2="200"
            y2="76"
            stroke="#C0DBF5"
            strokeWidth="0.8"
            strokeDasharray="4 3"
          />
        </svg>

        {/* Sello de Lacre artesanal centrado en la punta de la solapa */}
        <div className="absolute top-[58px] left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-600 to-sky-400 border-2 border-white/80 shadow-md flex items-center justify-center text-white transition-transform duration-300 group-hover:scale-110">
            <Heart size={13} className="fill-white drop-shadow-xs" />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ESQUINA SUPERIOR DERECHA: TIMBRE POSTAL / SELLO DE ESTADO */}
      {/* ========================================================================= */}
      <div className="flex items-start justify-between z-10">
        {/* Lado izquierdo: Botones de gestión para Novio */}
        <div className="flex items-center gap-1">
          {isNovio && (
            <div
              className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity bg-white/80 backdrop-blur rounded-lg p-0.5 border border-sky-100"
              onClick={(e) => e.stopPropagation()}
            >
              {onEdit && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(cita);
                  }}
                  title="Editar cita"
                  className="p-1 rounded-md text-ink-soft hover:text-sky-800 hover:bg-sky-50 transition-colors"
                >
                  <Edit2 size={13} />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(cita);
                  }}
                  title="Eliminar cita"
                  className="p-1 rounded-md text-ink-soft hover:text-blush-500 hover:bg-blush-50 transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          )}

          {hasMemory && (
            <div
              title="Esta aventura tiene un recuerdo fotográfico"
              className="inline-flex items-center gap-1 bg-white/90 border border-sky-200 text-sky-800 px-2 py-0.5 rounded-full text-[10.5px] font-sans font-medium shadow-2xs"
            >
              <Camera size={11} className="text-sky-600" />
              <span>Con foto</span>
            </div>
          )}
        </div>

        {/* Timbre postal en esquina superior derecha */}
        <div className="flex flex-col items-end">
          <div
            className={`border border-dashed rounded px-2 py-1 text-[10px] font-mono uppercase tracking-wider flex items-center gap-1 shadow-2xs ${
              isPending
                ? "border-sky-400 bg-sky-50/90 text-sky-800 font-bold"
                : isAccepted
                ? "border-[#A4D4AB] bg-[#EDF7EF]/90 text-[#2B6634] font-semibold"
                : "border-gray-300 bg-gray-50/90 text-gray-500"
            }`}
          >
            {isPending ? (
              <>
                <Sparkles size={11} className="text-sky-600 animate-pulse" />
                <span>Por responder</span>
              </>
            ) : isAccepted ? (
              <>
                <Check size={11} className="text-[#2B6634]" />
                <span>Aceptada</span>
              </>
            ) : (
              <span>Declinada</span>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CUERPO DEL SOBRE CERRADO: ESTRICTAMENTE TÍTULO Y FECHA */}
      {/* ========================================================================= */}
      <div className="my-auto py-5 text-center flex flex-col items-center justify-center z-10">
        {/* Título de la Cita */}
        <h3 className="font-serif text-xl sm:text-2xl font-bold text-ink leading-snug group-hover:text-sky-800 transition-colors line-clamp-2 px-2 max-w-sm">
          {cita.nombre}
        </h3>

        {/* Fecha con icono limpio */}
        <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50/80 border border-sky-200/70 text-sky-900 text-xs font-medium font-sans">
          <Calendar size={13} className="text-sky-600 flex-shrink-0" />
          <span>{formattedDate}</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PARTE INFERIOR: INDICADOR SUTIL DE ABRIR CARTA */}
      {/* ========================================================================= */}
      <div className="pt-2 border-t border-sky-100/80 flex items-center justify-between text-xs text-sky-800/90 z-10">
        <span className="font-mono text-[10px] tracking-wider uppercase text-sky-600">
          Sobre No. {cita.id.slice(-4)}
        </span>

        <span className="inline-flex items-center gap-1 font-sans font-bold text-[11px] text-sky-800 group-hover:text-sky-950 group-hover:translate-x-0.5 transition-all">
          <Mail size={12} className="text-sky-600" />
          <span>Abrir carta</span>
        </span>
      </div>
    </div>
  );
}

