"use client";

import React, { useState } from "react";
import { ICitaResponse } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { MapDisplay } from "@/components/maps/MapDisplay";
import { generateGoogleCalendarUrl, downloadIcsFile } from "@/lib/calendar";
import {
  Clock,
  MapPin,
  Sparkles,
  CalendarPlus,
  Download,
  CheckCircle2,
  Users,
  Home,
  Flame,
  CalendarClock,
  Loader2,
  AlertCircle,
  X,
} from "lucide-react";

interface CitaDetailViewProps {
  cita: ICitaResponse;
  onBack: () => void;
  onCitaUpdated?: (updatedCita: ICitaResponse) => void;
}

export function CitaDetailView({
  cita,
  onBack,
  onCitaUpdated,
}: CitaDetailViewProps) {
  const { user, token } = useAuth();
  const isNovio = user?.rol === "novio";

  const [currentCita, setCurrentCita] = useState<ICitaResponse>(cita);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Modal de propuesta de horario para la Novia
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [proposedDate, setProposedDate] = useState("");
  const [proposedTime, setProposedTime] = useState("20:00");
  const [proposedMotivo, setProposedMotivo] = useState("");
  const [submittingProposal, setSubmittingProposal] = useState(false);
  const [proposalError, setProposalError] = useState<string | null>(null);

  // Estado de acción de Novio sobre propuesta
  const [respondingProposal, setRespondingProposal] = useState(false);

  // Formato de fecha
  let formattedDate = "";
  try {
    const d = new Date(currentCita.horario);
    formattedDate = format(d, "EEEE d 'de' MMMM · h:mm a", { locale: es });
    formattedDate =
      formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
  } catch {
    formattedDate = currentCita.horario;
  }

  const handleDownloadIcs = () => {
    downloadIcsFile(currentCita);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 4000);
  };

  const handleGoogleCalendar = () => {
    const url = generateGoogleCalendarUrl(currentCita);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // Enviar propuesta de reprogramación (Novia)
  const handleSendProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposedDate || !proposedTime) {
      setProposalError("Selecciona la nueva fecha y hora sugerida.");
      return;
    }

    setSubmittingProposal(true);
    setProposalError(null);

    try {
      const combined = new Date(`${proposedDate}T${proposedTime}:00`);
      const res = await fetch(`/api/citas/${currentCita.id}/propuesta`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nuevoHorario: combined.toISOString(),
          motivo: proposedMotivo.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "No se pudo enviar la propuesta");
      }

      const updated = {
        ...currentCita,
        propuestaCambio: data.propuesta,
      };

      setCurrentCita(updated);
      onCitaUpdated?.(updated);
      setShowProposalModal(false);
      setFeedbackMsg("¡Propuesta enviada a tu novio con éxito! 💌");
      setTimeout(() => setFeedbackMsg(null), 5000);
    } catch (err: any) {
      setProposalError(err.message || "Error al enviar propuesta");
    } finally {
      setSubmittingProposal(false);
    }
  };

  // Responder a propuesta de cambio (Novio)
  const handleRespondProposal = async (accion: "aceptar" | "rechazar") => {
    if (!token) return;
    setRespondingProposal(true);
    try {
      const res = await fetch(`/api/citas/${currentCita.id}/propuesta`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ accion }),
      });

      const data = await res.json();
      if (data.success) {
        let updated: ICitaResponse;
        if (accion === "aceptar") {
          updated = {
            ...currentCita,
            horario: data.cita.horario,
            propuestaCambio: {
              ...currentCita.propuestaCambio!,
              estado: "aceptada",
            },
          };
          setFeedbackMsg("Horario actualizado con la propuesta de tu novia ✨");
        } else {
          updated = {
            ...currentCita,
            propuestaCambio: {
              ...currentCita.propuestaCambio!,
              estado: "rechazada",
            },
          };
          setFeedbackMsg("Propuesta declinada; se conserva el horario original.");
        }
        setCurrentCita(updated);
        onCitaUpdated?.(updated);
        setTimeout(() => setFeedbackMsg(null), 5000);
      }
    } catch {
      alert("Error al conectar con el servidor.");
    } finally {
      setRespondingProposal(false);
    }
  };

  const isCancelled = currentCita.estado === "cancelada";
  const isPending = currentCita.estado === "pendiente";

  // Formateo de acompañantes
  const personas = currentCita.asistencia?.cantidadPersonas || 2;
  const companiaTexto =
    personas === 2
      ? "Solo nosotros dos (en pareja) 💛"
      : `${personas} personas (${
          currentCita.asistencia?.tipoAcompanantes === "mayoria_desconocidos"
            ? "Mayoría desconocidos / Evento social"
            : "Mayoría conocidos / Amigos cercanos"
        })`;

  const ambienteTexto =
    currentCita.ambiente === "exterior"
      ? "Exterior (Outdoor) — Considera clima, abrigo o calzado"
      : currentCita.ambiente === "mixto"
      ? "Mixto (Interior y Exterior)"
      : "Interior (Indoor / Climatizado)";

  const importanciaTexto =
    currentCita.importancia === "especial"
      ? "✨ Muy Especial / Crucial"
      : currentCita.importancia === "alta"
      ? "🌟 Alta Prioridad"
      : currentCita.importancia === "media"
      ? "💫 Media"
      : "☕ Casual / Espontánea";

  const tienePropuestaPendiente =
    currentCita.propuestaCambio &&
    currentCita.propuestaCambio.estado === "pendiente";

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Notificaciones Flash */}
      {feedbackMsg && (
        <div className="p-4 bg-[#E4EFE2] border border-[#3E7A3D]/40 text-[#3E7A3D] rounded-2xl text-xs font-mono flex items-center gap-2.5 shadow-sm">
          <CheckCircle2 size={18} />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {downloadSuccess && (
        <div className="p-3.5 bg-[#E4EFE2] border border-[#3E7A3D]/30 text-[#3E7A3D] rounded-2xl text-xs font-mono flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>Archivo .ics descargado con éxito para tus calendarios.</span>
        </div>
      )}

      {/* BANNER DE PROPUESTA DE CAMBIO PENDIENTE */}
      {tienePropuestaPendiente && (
        <div className="bg-gradient-to-r from-rose-soft/70 to-paper border border-rose/40 rounded-2xl p-5 shadow-sm animate-fade-up">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose flex items-center justify-center text-white flex-shrink-0">
                <CalendarClock size={20} />
              </div>
              <div>
                <h4 className="font-serif font-semibold text-base text-ink">
                  {isNovio
                    ? "💛 ¡Tu novia ha propuesto un nuevo horario!"
                    : "💌 Tu propuesta de cambio fue enviada a tu novio"}
                </h4>
                <div className="text-xs text-ink-soft mt-1 space-y-0.5">
                  <div>
                    <span className="font-semibold text-ink">Nuevo horario propuesto:</span>{" "}
                    {format(
                      new Date(currentCita.propuestaCambio!.nuevoHorario),
                      "EEEE d 'de' MMMM · h:mm a",
                      { locale: es }
                    )}
                  </div>
                  {currentCita.propuestaCambio?.motivo && (
                    <div className="italic text-ink/80">
                      &ldquo;{currentCita.propuestaCambio.motivo}&rdquo;
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Acciones para el Novio */}
            {isNovio && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleRespondProposal("aceptar")}
                  disabled={respondingProposal}
                  className="bg-ink hover:bg-gold-deep text-white font-semibold text-xs py-2 px-3.5 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                >
                  {respondingProposal ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={14} className="text-gold" />
                  )}
                  <span>Aceptar sugerencia</span>
                </button>
                <button
                  onClick={() => handleRespondProposal("rechazar")}
                  disabled={respondingProposal}
                  className="bg-card hover:bg-paper border border-line text-ink-soft font-semibold text-xs py-2 px-3.5 rounded-xl transition-all"
                >
                  Mantener original
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Grid de 2 columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-7 items-start">
        {/* Columna Izquierda: Tarjeta de Invitación Detallada */}
        <div className="space-y-5">
          <div className="bg-card rounded-[6px_6px_22px_22px] overflow-hidden shadow-velada border border-line">
            {/* Solapa del sobre */}
            <div className="detail-flap w-full" />

            <div className="p-7 sm:p-9">
              {/* Badges de Estado y Prioridad */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
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

                <span className="bg-paper text-ink font-mono text-[11px] font-semibold px-3 py-1 rounded-full border border-line">
                  {importanciaTexto}
                </span>
              </div>

              {/* Título y Descripción */}
              <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-ink mb-3 leading-tight">
                {currentCita.nombre}
              </h1>
              <p className="text-ink-soft text-[15px] leading-[1.65] mb-7">
                {currentCita.descripcion}
              </p>

              {/* Filas de Información */}
              <div className="space-y-4 border-t border-line/60 pt-5">
                {/* Horario */}
                <div className="flex items-start justify-between gap-3 flex-wrap">
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
                      <div className="text-[11px] text-ink-soft font-mono mt-0.5">
                        {currentCita.esFlexible
                          ? "⏱️ Horario flexible (permite reprogramación)"
                          : "🔒 Horario reservado estricto"}
                      </div>
                    </div>
                  </div>

                  {/* Botón de proponer otro horario para la Novia */}
                  {!isNovio && currentCita.esFlexible && !tienePropuestaPendiente && (
                    <button
                      onClick={() => {
                        setProposedDate(format(new Date(currentCita.horario), "yyyy-MM-dd"));
                        setShowProposalModal(true);
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-gold-deep bg-gold/10 hover:bg-gold/20 px-3 py-1.5 rounded-xl border border-gold/30 transition-colors"
                    >
                      <CalendarClock size={14} />
                      <span>Proponer otro día u hora</span>
                    </button>
                  )}
                </div>

                {/* Compañía y Asistentes (Requerimiento nuevo) */}
                <div className="flex items-start gap-3.5 border-t border-line/60 pt-4">
                  <div className="w-[34px] h-[34px] rounded-[9px] bg-paper flex items-center justify-center text-ink flex-shrink-0">
                    <Users size={18} />
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-soft font-mono">
                      Compañía y Asistencia
                    </div>
                    <div className="text-[14.5px] font-medium text-ink mt-0.5">
                      {companiaTexto}
                    </div>
                    {currentCita.asistencia?.hayFamilia && (
                      <div className="inline-block mt-1 bg-rose-soft text-rose font-mono text-[10px] font-bold px-2 py-0.5 rounded-md">
                        👨‍👩‍👧 Ambiente familiar
                      </div>
                    )}
                  </div>
                </div>

                {/* Ambiente Interior / Exterior (Requerimiento nuevo) */}
                <div className="flex items-start gap-3.5 border-t border-line/60 pt-4">
                  <div className="w-[34px] h-[34px] rounded-[9px] bg-paper flex items-center justify-center text-gold-deep flex-shrink-0">
                    <Home size={18} />
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-soft font-mono">
                      Entorno y Ambiente
                    </div>
                    <div className="text-[14.5px] font-medium text-ink mt-0.5">
                      {ambienteTexto}
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
                      {currentCita.lugar.direccion}
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
                      {currentCita.tematica}
                    </div>
                  </div>
                </div>
              </div>

              {/* Botones de Calendario */}
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
              {currentCita.vestimentaRecomendada}
            </p>
          </div>
        </div>

        {/* Columna Derecha: Mapa Interactivo Embebido */}
        <div className="space-y-2">
          <MapDisplay lugar={currentCita.lugar} nombre={currentCita.nombre} />
          <p className="font-mono text-[11px] text-ink-soft text-center pt-1">
            Mapa interactivo — Leaflet + OpenStreetMap
          </p>
        </div>
      </div>

      {/* MODAL PARA QUE LA NOVIA SUGIERA OTRO DÍA / HORA */}
      {showProposalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/65 backdrop-blur-sm animate-fade-up">
          <div className="bg-card rounded-2xl p-6 sm:p-7 max-w-md w-full border border-line shadow-2xl">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-soft flex items-center justify-center text-rose">
                  <CalendarClock size={18} />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-semibold text-ink">
                    Proponer otro horario
                  </h3>
                  <p className="text-[11px] text-ink-soft">
                    Sugiérele a tu novio cuándo te quedaría mejor.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowProposalModal(false)}
                className="p-1 rounded-lg text-ink-soft hover:bg-paper"
              >
                <X size={18} />
              </button>
            </div>

            {proposalError && (
              <div className="mb-4 p-3 bg-rose-soft/60 border border-rose/30 text-xs text-ink rounded-xl flex items-center gap-2">
                <AlertCircle size={15} className="text-rose flex-shrink-0" />
                <span>{proposalError}</span>
              </div>
            )}

            <form onSubmit={handleSendProposal} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-ink-soft mb-1">
                    Nueva Fecha
                  </label>
                  <input
                    type="date"
                    required
                    value={proposedDate}
                    onChange={(e) => setProposedDate(e.target.value)}
                    className="w-full p-2.5 border border-line rounded-xl text-xs bg-ivory"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-ink-soft mb-1">
                    Nueva Hora
                  </label>
                  <input
                    type="time"
                    required
                    value={proposedTime}
                    onChange={(e) => setProposedTime(e.target.value)}
                    className="w-full p-2.5 border border-line rounded-xl text-xs bg-ivory"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-ink-soft mb-1">
                  Nota / Mensaje para tu novio (Opcional)
                </label>
                <textarea
                  rows={3}
                  value={proposedMotivo}
                  onChange={(e) => setProposedMotivo(e.target.value)}
                  placeholder="Ej. ¡Me encanta la idea! Pero salgo un poco más tarde del trabajo ese día..."
                  className="w-full p-2.5 border border-line rounded-xl text-xs bg-ivory resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={submittingProposal}
                  className="flex-1 bg-ink text-white font-semibold text-xs py-3 px-4 rounded-xl hover:bg-gold-deep transition-all flex items-center justify-center gap-2"
                >
                  {submittingProposal ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <span>Enviar propuesta 💌</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowProposalModal(false)}
                  className="px-4 py-3 border border-line text-xs font-medium rounded-xl hover:bg-paper"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
