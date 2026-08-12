"use client";

import React, { useState } from "react";
import { ICitaResponse } from "@/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { MapDisplay } from "@/components/maps/MapDisplay";
import {
  generateGoogleCalendarUrl,
  downloadIcsFile,
} from "@/lib/calendar";
import { Clock, MapPin, Sparkles, CalendarPlus, Download, CheckCircle2 } from "lucide-react";

interface CitaDetailViewProps {
  cita: ICitaResponse;
  onBack: () => void;
}

export function CitaDetailView({ cita, onBack }: CitaDetailViewProps) {
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Formato de fecha completo y elegante
  let formattedDate = "";
  try {
    const d = new Date(cita.horario);
    formattedDate = format(d, "EEEE d 'de' MMMM · h:mm a", { locale: es });
    // Capitalizar primera letra
    formattedDate =
      formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
  } catch {
    formattedDate = cita.horario;
  }

  const handleDownloadIcs = () => {
    downloadIcsFile(cita);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 4000);
  };

  const handleGoogleCalendar = () => {
    const url = generateGoogleCalendarUrl(cita);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const isCancelled = cita.estado === "cancelada";
  const isPending = cita.estado === "pendiente";

  return (
    <div className="space-y-6 animate-fade-up">
      {downloadSuccess && (
        <div className="p-3.5 bg-[#E4EFE2] border border-[#3E7A3D]/30 text-[#3E7A3D] rounded-2xl text-xs font-mono flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>
            Archivo <strong>.ics</strong> descargado. Ábrelo para agregarlo a Apple Calendar, Outlook o Google Calendar.
          </span>
        </div>
      )}

      {/* Grid de 2 columnas en Desktop y 1 columna en Móvil */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-7 items-start">
        {/* Columna Izquierda: Tarjeta de Invitación Detallada */}
        <div className="space-y-5">
          <div className="bg-card rounded-[6px_6px_22px_22px] overflow-hidden shadow-velada border border-line">
            {/* Solapa decorativa tipo sobre */}
            <div className="detail-flap w-full" />

            <div className="p-7 sm:p-9">
              {/* Badge de Estado */}
              <div className="mb-3">
                <span
                  className={`inline-block font-mono text-[11px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full ${
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
                    : "CONFIRMADA"}
                </span>
              </div>

              {/* Título y Descripción */}
              <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-ink mb-3 leading-tight">
                {cita.nombre}
              </h1>
              <p className="text-ink-soft text-[15px] leading-[1.65] mb-7">
                {cita.descripcion}
              </p>

              {/* Filas de Información */}
              <div className="space-y-4 border-t border-line/60 pt-5">
                {/* Horario */}
                <div className="flex items-start gap-3.5">
                  <div className="w-[34px] h-[34px] rounded-[9px] bg-paper flex items-center justify-center text-gold-deep flex-shrink-0">
                    <Clock size={18} />
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-soft font-mono">
                      Horario
                    </div>
                    <div className="text-[14.5px] font-medium text-ink mt-0.5">
                      {formattedDate}
                    </div>
                  </div>
                </div>

                {/* Lugar */}
                <div className="flex items-start gap-3.5 border-t border-line/60 pt-4">
                  <div className="w-[34px] h-[34px] rounded-[9px] bg-paper flex items-center justify-center text-rose flex-shrink-0">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-soft font-mono">
                      Lugar
                    </div>
                    <div className="text-[14.5px] font-medium text-ink mt-0.5">
                      {cita.lugar.direccion}
                    </div>
                  </div>
                </div>

                {/* Temática */}
                <div className="flex items-start gap-3.5 border-t border-line/60 pt-4">
                  <div className="w-[34px] h-[34px] rounded-[9px] bg-paper flex items-center justify-center text-gold flex-shrink-0">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-soft font-mono">
                      Temática
                    </div>
                    <div className="text-[14.5px] font-medium text-ink mt-0.5">
                      {cita.tematica}
                    </div>
                  </div>
                </div>
              </div>

              {/* Botones de Calendario (RF-21, RF-22, RF-23) */}
              <div className="flex flex-wrap gap-2.5 pt-7 mt-6 border-t border-line">
                <button
                  onClick={handleGoogleCalendar}
                  className="flex-1 min-w-[200px] inline-flex items-center justify-center gap-2 bg-gold hover:bg-gold-deep text-ink hover:text-white font-semibold text-sm py-3.5 px-4 rounded-xl shadow-sm hover:shadow-md transition-all active:translate-y-0 cursor-pointer"
                >
                  <CalendarPlus size={17} />
                  <span>Agregar a Google Calendar</span>
                </button>
                <button
                  onClick={handleDownloadIcs}
                  className="inline-flex items-center justify-center gap-2 bg-transparent hover:bg-ink text-ink hover:text-white font-semibold text-sm py-3.5 px-4 rounded-xl border-1.5 border-ink transition-all cursor-pointer"
                >
                  <Download size={16} />
                  <span>Descargar .ics</span>
                </button>
              </div>
            </div>
          </div>

          {/* Panel de Vestimenta Recomendada */}
          <div className="bg-paper rounded-[18px] p-5 sm:p-6 border border-line/60">
            <h3 className="font-serif text-[16px] font-semibold text-ink mb-1.5 flex items-center gap-2">
              <span>👗</span>
              <span>Vestimenta recomendada</span>
            </h3>
            <p className="text-[13.5px] text-ink-soft leading-[1.6]">
              {cita.vestimentaRecomendada}
            </p>
          </div>
        </div>

        {/* Columna Derecha: Mapa Interactivo Embebido */}
        <div className="space-y-2">
          <MapDisplay lugar={cita.lugar} nombre={cita.nombre} />
          <p className="font-mono text-[11px] text-ink-soft text-center pt-1">
            Mapa interactivo — Leaflet + OpenStreetMap
          </p>
        </div>
      </div>
    </div>
  );
}
